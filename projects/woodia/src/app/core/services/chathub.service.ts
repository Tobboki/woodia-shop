import { Injectable, OnDestroy, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

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
      this.messageReceivedSubject.next(message);
    });

    this.connection.onreconnecting(() => {
      this.connectionStateSubject.next('connecting');
    });

    this.connection.onreconnected(() => {
      this.connectionStateSubject.next('connected');
    });

    this.connection.onclose(() => {
      this.connectionStateSubject.next('disconnected');
    });

    try {
      this.connectionStateSubject.next('connecting');
      await this.connection.start();

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

  async joinRoom(roomId: number): Promise<void> {
    await this.ensureConnected();

    await this.connection!.invoke('JoinGroup', roomId);

  }

  async sendMessage(request: SendMessageRequest): Promise<void> {
    await this.ensureConnected();

    if (
      !this.connection ||
      this.connection.state !== signalR.HubConnectionState.Connected
    ) {
      throw new Error('Unable to connect to chat');
    }

    try {
      await this.connection!.invoke('SendMessage', request);
      console.log('Sent successfully');
    } catch (err) {
      console.error('SendMessage failed', err);
      throw err;
    }
  }

  async stopConnection(): Promise<void> {
    if (!this.connection) return;
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
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    return this.http.get<PaginatedList<ChatRoomListResponse>>(
      `${this.apiBaseUrl}/Chat`,
      { params, ...this.withConnectionId() }
    );
  }

  getMessages(
    roomId: number,
    pageNumber = 1,
    pageSize = 20
  ): Observable<PaginatedList<MessageResponse>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    return this.http.get<PaginatedList<MessageResponse>>(
      `${this.apiBaseUrl}/Chat/${roomId}`,
      { params, ...this.withConnectionId() }
    );
  }

  ngOnDestroy(): void {
    this.stopConnection();
  }
}