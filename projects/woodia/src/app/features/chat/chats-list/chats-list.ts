import {
  Component, OnInit, OnDestroy, Output, EventEmitter,
  signal, inject, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { TranslocoDirective } from '@jsverse/transloco';
import { NgIcon } from '@ng-icons/core';
import { ZardSkeletonComponent } from '@shared-components/skeleton';
import { ZardInputDirective } from '@shared-components/input/input.directive';
import { ChathubService } from '@woodia-core/services/chathub.service';
import { ChatRoomListResponse } from '@woodia-types/chat.types';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'woodia-chats-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslocoDirective,
    NgIcon,
    ZardSkeletonComponent,
    ZardInputDirective,
  ],
  templateUrl: './chats-list.html',
})
export class ChatsList implements OnInit, OnDestroy {
  @Output() roomSelected = new EventEmitter<ChatRoomListResponse>();

  private chatHub = inject(ChathubService);
  private destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);

  rooms = signal<ChatRoomListResponse[]>([]);
  isLoading = signal(true);
  connectionFailed = signal(false);
  searchQuery = signal('');
  selectedRoomId = signal<number | null>(null);

  filteredRooms = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.rooms();

    return this.rooms().filter(r =>
      r.name?.toLowerCase().includes(q) ||
      r.jobTitle?.toLowerCase().includes(q) ||
      r.lastMessageContent?.toLowerCase().includes(q)
    );
  });

  totalUnread = computed(() =>
    this.rooms().reduce((sum, r) => sum + (r.unreadMessageCount ?? 0), 0)
  );

  ngOnInit(): void {
    // Always load the rooms list via REST immediately — this does NOT
    // depend on SignalR being connected, so the list shows up right away
    // even in degraded mode.
    this.loadRooms();

    // Kick off (or join) the SignalR connection. This is fire-and-forget:
    // the rooms list above already works without it. The socket only adds
    // live "new message" updates on top.
    this.chatHub.ensureConnected();

    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const roomId = Number(params.get('roomId'));

        if (!Number.isNaN(roomId)) {
          this.selectedRoomId.set(roomId);

          // Clear unread count for the selected room
          this.rooms.update(list =>
            list.map(r =>
              r.roomId === roomId
                ? { ...r, unreadMessageCount: 0 }
                : r
            )
          );

          // Emit once the room exists
          const room = this.rooms().find(r => r.roomId === roomId);
          if (room) {
            this.roomSelected.emit(room);
          }
        }
      });

    // Reflect connection state in the UI (e.g. show a banner if it fails)
    this.chatHub.connectionState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        if (state === 'connected') {
          this.connectionFailed.set(false);
        } else if (state === 'disconnected') {
          this.connectionFailed.set(true);
        }
      });

    // Live update rooms list when a new message arrives over the socket
    this.chatHub.messageReceived$
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        const anyMsg = message as any;
        const incomingRoomId = anyMsg.roomId ?? anyMsg.RoomId ?? anyMsg.chatRoomId ?? anyMsg.ChatRoomId;
        
        // Use loose equality in case types don't match (number vs string)
        // eslint-disable-next-line eqeqeq
        const exists = incomingRoomId != null && this.rooms().some(r => r.roomId == incomingRoomId);

        if (exists) {
          this.rooms.update(list =>
            list.map(r =>
              // eslint-disable-next-line eqeqeq
              r.roomId == incomingRoomId
                ? {
                  ...r,
                  lastMessageContent: message.content,
                  lastMessageDate: message.sentAt,
                  // eslint-disable-next-line eqeqeq
                  unreadMessageCount: this.selectedRoomId() == incomingRoomId
                    ? r.unreadMessageCount
                    : (r.unreadMessageCount ?? 0) + 1,
                }
                : r
            )
          );
        } else {
          // A message arrived for a room not yet in our list (e.g. a brand
          // new conversation) — refresh the list from the server.
          this.loadRooms();
        }
      });
  }

  retryConnection(): void {
    this.connectionFailed.set(false);
    this.chatHub.retryConnection();
  }

  loadRooms(): void {
    this.isLoading.set(true);

    this.chatHub.getAllRooms().subscribe({
      next: res => {
        this.rooms.set(res.items ?? []);
        this.isLoading.set(false);

        console.log('Rooms loaded:', res);
      },
      error: err => {
        console.error('[ChatsList] Failed to load rooms', err);
        this.isLoading.set(false);
      }
    });
  }

  selectRoom(room: ChatRoomListResponse): void {
    this.selectedRoomId.set(room.roomId);

    this.rooms.update(list =>
      list.map(r => r.roomId === room.roomId ? { ...r, unreadMessageCount: 0 } : r)
    );

    this.roomSelected.emit(room);
  }

  getInitials(name: string): string {
    return name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '?';
  }

  getRelativeTime(dateStr: string): string {
    if (!dateStr) return '';

    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;

    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}