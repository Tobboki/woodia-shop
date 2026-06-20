import {
  Component, OnInit, OnDestroy, signal, inject, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { NgIcon } from '@ng-icons/core';
import { ZardButtonComponent } from '@shared-components/button';
import { ChathubService } from '@woodia-core/services/chathub.service';
import { AuthService } from '@woodia-core/services/auth.service';
import { ChatsList } from '../chats-list/chats-list';
import { Chat } from '../chat/chat';
import { ChatRoomListResponse } from '@woodia-shared/types/chat.types';

@Component({
  selector: 'woodia-chat-shell',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    NgIcon,
    ChatsList,
    Chat
  ],
  templateUrl: './chat-shell.html',
})
export class ChatShell implements OnInit, OnDestroy {
  private chatHub = inject(ChathubService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  selectedRoom = signal<ChatRoomListResponse | null>(null);
  connectionState$ = this.chatHub.connectionState$;

  // On mobile, toggle between list and room view
  showRoom = signal(false);

  async ngOnInit(): Promise<void> {
    const token = this.authService.getToken();
    if (token) {
      await this.chatHub.startConnection(token);
    }

    // Support deep-linking via query param ?roomId=X
    this.route.queryParamMap.subscribe(params => {
      const roomId = params.get('roomId');
      if (roomId) {
        const id = parseInt(roomId, 10);
        // Minimal room object to open directly
        this.selectedRoom.set({ roomId: id } as ChatRoomListResponse);
        this.showRoom.set(true);
      }
    });
  }

  onRoomSelected(room: ChatRoomListResponse): void {
    this.selectedRoom.set(room);
    this.showRoom.set(true);
    // Update URL without navigation
    this.router.navigate([], {
      queryParams: { roomId: room.roomId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  backToList(): void {
    this.showRoom.set(false);
    this.selectedRoom.set(null);
    this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }

  async ngOnDestroy(): Promise<void> {
    await this.chatHub.stopConnection();
  }
}