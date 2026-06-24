import { Injectable, OnDestroy, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable, Subject, firstValueFrom, timeout, filter, race, throwError } from 'rxjs';

import {
  ChatRoomListResponse,
  MessageResponse,
  SendMessageRequest,
  PaginatedList,
} from '../../shared/types/chat.types';
import { environment } from '@woodia-environments/environment';
import { AuthService } from './auth.service';

export type TConnectionState = 'disconnected' | 'connecting' | 'connected';

@Injectable({
  providedIn: 'root',
})
export class ChathubService implements OnDestroy {
  private readonly apiBaseUrl = environment.apiUrl + '/api';
  private readonly hubBaseUrl = environment.apiUrl;
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  // =========================
  // SignalR
  // =========================

  private connection: signalR.HubConnection | null = null;
  private lastToken: string | null = null;
  private connectingPromise: Promise<void> | null = null;

  /** Rooms this client has successfully joined — re-joined automatically on reconnect. */
  private joinedRooms = new Set<number>();

  /** Monotonic counter for request IDs — makes log lines uniquely traceable. */
  private reqCounter = 0;
  private nextReqId(): string {
    return `#${++this.reqCounter}`;
  }

  private messageReceivedSubject = new Subject<MessageResponse>();
  readonly messageReceived$ = this.messageReceivedSubject.asObservable();

  private connectionStateSubject = new BehaviorSubject<TConnectionState>('disconnected');
  readonly connectionState$ = this.connectionStateSubject.asObservable();

  get connectionState(): TConnectionState {
    return this.connectionStateSubject.value;
  }

  get connectionId(): string | null {
    return this.connection?.connectionId ?? null;
  }

  private withConnectionId() {
    const id = this.connectionId;
    return id ? { headers: { 'X-Connection-Id': id } } : {};
  }

  /**
   * Ensures a SignalR connection is established, starting one if needed.
   * Safe to call from multiple components — concurrent calls share the
   * same connection attempt. Reads the auth token automatically.
   */
  async ensureConnected(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    if (this.connectingPromise) {
      return this.connectingPromise;
    }

    const token = this.authService.getToken?.() ?? null;
    if (!token) {
      console.warn('[ChathubService] No auth token available — cannot start chat connection');
      return;
    }

    this.connectingPromise = this.startConnection(token).finally(() => {
      this.connectingPromise = null;
    });

    return this.connectingPromise;
  }

  async startConnection(token: string): Promise<void> {
    if (
      this.connection &&
      this.connection.state !== signalR.HubConnectionState.Disconnected
    ) {
      return;
    }

    this.lastToken = token;

    if (this.connection) {
      this.connection.off('ReceiveMessage');
      this.connection = null;
    }

    this.connection = new signalR.HubConnectionBuilder()
      .configureLogging(signalR.LogLevel.Warning)
      .withUrl(`${this.hubBaseUrl}/chat`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    this.connection.on('ReceiveMessage', (message: MessageResponse) => {
      const anyMsg = message as any;
      const roomId = anyMsg.roomId ?? anyMsg.RoomId ?? anyMsg.chatRoomId ?? anyMsg.ChatRoomId ?? '?';
      console.log(`[ChathubService] ReceiveMessage — roomId=${roomId} msgId=${message.id} senderId=${message.senderId}`);
      this.messageReceivedSubject.next(message);
    });

    this.connection.onreconnecting((err) => {
      console.warn('[ChathubService] Reconnecting…', err);
      this.connectionStateSubject.next('connecting');
    });

    // ─── KEY FIX ────────────────────────────────────────────────────────────
    // When SignalR auto-reconnects, the server creates a brand-new connection
    // and all SignalR group memberships are lost. We must re-join every room
    // the client was in, otherwise that chat goes silent until the user
    // manually triggers a rejoin (e.g. by sending a message).
    this.connection.onreconnected(async (connectionId) => {
      console.log(`[ChathubService] Reconnected (connId=${connectionId}). Re-joining ${this.joinedRooms.size} room(s): [${[...this.joinedRooms].join(', ')}]`);
      this.connectionStateSubject.next('connected');

      for (const roomId of this.joinedRooms) {
        const reqId = this.nextReqId();
        try {
          console.log(`[ChathubService] ${reqId} rejoinRoom(roomId=${roomId}) — start`);
          await this.connection!.invoke('JoinGroup', roomId);
          console.log(`[ChathubService] ${reqId} rejoinRoom(roomId=${roomId}) — success`);
        } catch (err) {
          console.error(`[ChathubService] ${reqId} rejoinRoom(roomId=${roomId}) — error`, err);
        }
      }
    });

    this.connection.onclose((err) => {
      if (err) {
        console.error('[ChathubService] Connection closed with error:', err);
      } else {
        console.log('[ChathubService] Connection closed cleanly.');
      }
      this.connectionStateSubject.next('disconnected');
    });

    try {
      this.connectionStateSubject.next('connecting');
      await this.connection.start();
      console.log(`[ChathubService] Connected (connId=${this.connection.connectionId})`);
      this.connectionStateSubject.next('connected');
    } catch (error) {
      this.connectionStateSubject.next('disconnected');
      console.error('[ChathubService] SignalR connection failed:', error);
      // Do NOT re-throw — REST endpoints (getAllRooms/getMessages) still work
      // without a live socket, so callers should stay functional in degraded mode.
    }
  }

  async retryConnection(): Promise<void> {
    if (this.connectingPromise) {
      await this.connectingPromise;
      return;
    }
    if (this.lastToken) {
      await this.startConnection(this.lastToken);
    } else {
      await this.ensureConnected();
    }
  }

  /**
   * Waits until the SignalR connection reaches the 'connected' state.
   * - Returns immediately if already connected.
   * - Fails fast if the state transitions to 'disconnected' (e.g. connection attempt failed).
   * - Times out after `timeoutMs` milliseconds if neither state is reached.
   */
  private waitUntilConnected(timeoutMs = 15_000): Promise<void> {
    if (this.connectionState === 'connected') return Promise.resolve();

    const connected$ = this.connectionState$.pipe(
      filter(state => state === 'connected')
    );

    const disconnected$ = this.connectionState$.pipe(
      filter(state => state === 'disconnected'),
      // Map to an error so race() propagates it
      // (using mergeMap to throw inside the stream)
      filter(() => { throw new Error('[ChathubService] Connection attempt failed — state is disconnected'); })
    );

    return firstValueFrom(
      race(connected$, disconnected$).pipe(
        timeout({
          each: timeoutMs,
          with: () => throwError(() =>
            new Error(`[ChathubService] Timed out waiting for SignalR connection after ${timeoutMs}ms`)
          ),
        })
      )
    ).then(() => undefined);
  }

  /**
   * Invokes a SignalR hub method, retrying up to `maxAttempts` times with
   * exponential backoff if the connection drops in the narrow window between
   * the readiness check and the actual send.
   */
  private async invokeWithRetry(
    method: string,
    arg: unknown,
    reqId: string,
    maxAttempts = 3
  ): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await this.ensureConnected();
      await this.waitUntilConnected();
      try {
        await this.connection!.invoke(method, arg);
        return; // success
      } catch (err: any) {
        const isNotConnected = err?.message?.includes("not in the 'Connected' State");
        if (isNotConnected && attempt < maxAttempts) {
          const delay = 300 * attempt;
          console.warn(`[ChathubService] ${reqId} invoke '${method}' attempt ${attempt}/${maxAttempts} failed (not connected) — retrying in ${delay}ms`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        throw err;
      }
    }
  }

  async joinRoom(roomId: number): Promise<void> {
    const reqId = this.nextReqId();
    console.log(`[ChathubService] ${reqId} joinRoom(roomId=${roomId}) — start`);

    try {
      await this.invokeWithRetry('JoinGroup', roomId, reqId);
      this.joinedRooms.add(roomId);
      console.log(`[ChathubService] ${reqId} joinRoom(roomId=${roomId}) — success (tracking ${this.joinedRooms.size} room(s))`);
    } catch (err) {
      console.error(`[ChathubService] ${reqId} joinRoom(roomId=${roomId}) — error`, err);
      throw err;
    }
  }

  async sendMessage(request: SendMessageRequest): Promise<void> {
    const reqId = this.nextReqId();
    const preview = request.content?.slice(0, 40) ?? '';
    const attachCount = request.attachments?.length ?? 0;
    console.log(`[ChathubService] ${reqId} sendMessage(roomId=${request.roomId}, content="${preview}${preview.length < (request.content?.length ?? 0) ? '…' : ''}", attachments=${attachCount}) — start`);

    try {
      await this.invokeWithRetry('SendMessage', request, reqId);
      console.log(`[ChathubService] ${reqId} sendMessage(roomId=${request.roomId}) — success`);
    } catch (err) {
      console.error(`[ChathubService] ${reqId} sendMessage(roomId=${request.roomId}) — error`, err);
      throw err;
    }
  }

  async stopConnection(): Promise<void> {
    if (!this.connection) return;
    this.joinedRooms.clear();
    await this.connection.stop();
    this.connection = null;
    this.connectionStateSubject.next('disconnected');
  }

  // =========================
  // REST API
  // =========================
  // Note: responses are the PaginatedList directly — no ApiResponse<T> wrapper.

  getAllRooms(
    pageNumber = 1,
    pageSize = 10
  ): Observable<PaginatedList<ChatRoomListResponse>> {
    const reqId = this.nextReqId();
    console.log(`[ChathubService] ${reqId} getAllRooms(page=${pageNumber}, size=${pageSize}) — start`);

    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    const obs = this.http.get<PaginatedList<ChatRoomListResponse>>(
      `${this.apiBaseUrl}/Chat`,
      { params, ...this.withConnectionId() }
    );

    // Wrap in a new observable that logs the outcome
    return new Observable(observer => {
      obs.subscribe({
        next: res => {
          console.log(`[ChathubService] ${reqId} getAllRooms(page=${pageNumber}) — success (${res.items?.length ?? 0} rooms, hasNext=${res.hasNextPage})`);
          observer.next(res);
        },
        error: err => {
          console.error(`[ChathubService] ${reqId} getAllRooms(page=${pageNumber}) — error`, err);
          observer.error(err);
        },
        complete: () => observer.complete(),
      });
    });
  }

  getMessages(
    roomId: number,
    pageNumber = 1,
    pageSize = 20
  ): Observable<PaginatedList<MessageResponse>> {
    const reqId = this.nextReqId();
    console.log(`[ChathubService] ${reqId} getMessages(roomId=${roomId}, page=${pageNumber}, size=${pageSize}) — start`);

    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    const obs = this.http.get<PaginatedList<MessageResponse>>(
      `${this.apiBaseUrl}/Chat/${roomId}`,
      { params, ...this.withConnectionId() }
    );

    return new Observable(observer => {
      obs.subscribe({
        next: res => {
          console.log(`[ChathubService] ${reqId} getMessages(roomId=${roomId}, page=${pageNumber}) — success (${res.items?.length ?? 0} msgs, hasNext=${res.hasNextPage})`);
          observer.next(res);
        },
        error: err => {
          console.error(`[ChathubService] ${reqId} getMessages(roomId=${roomId}, page=${pageNumber}) — error`, err);
          observer.error(err);
        },
        complete: () => observer.complete(),
      });
    });
  }

  ngOnDestroy(): void {
    this.stopConnection();
  }
}