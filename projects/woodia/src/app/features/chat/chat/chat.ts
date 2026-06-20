import {
  Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges,
  signal, inject, computed, ViewChild, ElementRef, effect, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { NgIcon } from '@ng-icons/core';
import { ZardButtonComponent } from '@shared-components/button';
import { ZardInputDirective } from '@shared-components/input/input.directive';
import { ChathubService } from '@woodia-core/services/chathub.service';
import { UploadService } from '@woodia-core/services/upload.service';
import {
  MessageResponse, SendMessageRequest, AttachmentRequest,
  FileType, MessageType, MessageAttachmentResponse
} from '@woodia-shared/types/chat.types';
import { AuthService } from '@woodia-core/services/auth.service';
import { toast } from 'ngx-sonner';
import { VoiceRecorder } from './voice-recorder/voice-recorder';
import { AudioMessage } from './audio-message/audio-message';
import { AttachmentStaging, IStagedAttachment } from './attachment-staging/attachment-staging';

const MAX_ATTACHMENTS = 10;
const MAX_FILE_SIZE = 25 * 1024 * 1024;

@Component({
  selector: 'woodia-chat',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TranslocoDirective, NgIcon,
    ZardButtonComponent, ZardInputDirective,
    VoiceRecorder, AudioMessage, AttachmentStaging,
  ],
  templateUrl: './chat.html',
})
export class Chat implements OnInit, OnChanges, OnDestroy {
  @Input() roomId!: number;
  @Input() roomName = '';
  @Input() jobTitle = '';

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private chatHub = inject(ChathubService);
  private uploadService = inject(UploadService);
  private authService = inject(AuthService);
  private translocoService = inject(TranslocoService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  readonly FileType = FileType;

  messages = signal<MessageResponse[]>([]);
  messageText = signal('');
  isLoading = signal(false);
  isSending = signal(false);
  hasMore = signal(false);
  isLoadingMore = signal(false);
  stagedAttachments = signal<IStagedAttachment[]>([]);
  isRecorderOpen = signal(false);
  lightboxUrl = signal<string | null>(null);
  lightboxType = signal<'image' | 'video' | null>(null);

  private scrollTrigger = signal(0);
  private currentRoomId: number | null = null;

  currentUserId = computed(() => this.authService.getCurrentUser()?.id ?? null);
  isAnyAttachmentUploading = computed(() => this.stagedAttachments().some(a => a.uploading));

  canSend = computed(() => {
    const hasText = this.messageText().trim().length > 0;
    const staged = this.stagedAttachments();
    const hasAttachments = staged.length > 0;
    const allUploaded = hasAttachments && staged.every(a => !!a.uploadedUrl && !a.uploading);
    return !this.isSending() && ((hasText && !hasAttachments) || allUploaded);
  });

  constructor() {
    // Scroll effect — zoneless safe, runs after each CD pass that changes scrollTrigger
    effect(() => {
      this.scrollTrigger();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const el = this.scrollContainer?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
      }));
    });
  }

  ngOnInit(): void {
    this.chatHub.messageReceived$
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        const anyMsg = message as any;
        const incomingRoomId = anyMsg.roomId ?? anyMsg.RoomId ?? anyMsg.chatRoomId ?? anyMsg.ChatRoomId ?? this.roomId;
        // Use == not === — roomId can be string from SignalR JSON deserialization
        // eslint-disable-next-line eqeqeq
        if (incomingRoomId != this.roomId) return;

        // Deduplicate vs optimistic message (same id = already shown)
        if (this.messages().some(m => m.id === message.id)) return;

        this.messages.update(list => [...list, this.normalizeMessage(message)]);

        // ── CRITICAL for zoneless ──
        // SignalR callbacks run outside Angular's scheduler. In a zoneless app
        // there is no Zone.js to intercept the callback and schedule CD.
        // above is flushed to the DOM immediately.
        this.scrollTrigger.update(n => n + 1);
        this.cdr.detectChanges();
      });

    if (this.roomId) this.initRoom(this.roomId);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['roomId']) {
      const prev = changes['roomId'].previousValue;
      const curr = changes['roomId'].currentValue;
      // Always reinit — even same roomId can arrive when the shell
      // null→value cycles the component to force a fresh load
      if (curr) this.initRoom(curr);
    }
  }

  private async initRoom(roomId: number): Promise<void> {
    this.currentRoomId = roomId;
    this.messages.set([]);
    this.pageNumber = 1;
    this.clearStagedAttachments();
    this.messageText.set('');

    try {
      await this.chatHub.joinRoom(roomId);
    } catch (err) {
      console.error('[Chat] joinRoom failed', err);
    }
    this.loadMessages();
  }

  private pageNumber = 1;
  private readonly pageSize = 20;

  loadMessages(): void {
    if (!this.roomId) return;
    this.isLoading.set(true);

    this.chatHub.getMessages(this.roomId, this.pageNumber, this.pageSize).subscribe({
      next: res => {
        this.messages.set(this.normalizeMessages(res.items ?? []).reverse());
        this.hasMore.set(res.hasPreviousPage ?? false);
        this.isLoading.set(false);
        this.pageNumber++;
        this.scrollTrigger.update(n => n + 1);
      },
      error: () => this.isLoading.set(false),
    });
  }

  loadMoreMessages(): void {
    if (!this.roomId || this.isLoadingMore()) return;
    this.isLoadingMore.set(true);
    const container = this.scrollContainer?.nativeElement;
    const prevScrollHeight = container?.scrollHeight ?? 0;

    this.chatHub.getMessages(this.roomId, this.pageNumber, this.pageSize).subscribe({
      next: res => {
        const older = this.normalizeMessages(res.items ?? []).reverse();
        this.messages.update(list => [...older, ...list]);
        this.hasMore.set(res.hasPreviousPage ?? false);
        this.isLoadingMore.set(false);
        this.pageNumber++;
        requestAnimationFrame(() => {
          if (container) container.scrollTop = container.scrollHeight - prevScrollHeight;
        });
      },
      error: () => this.isLoadingMore.set(false),
    });
  }

  async sendMessage(): Promise<void> {
    if (!this.canSend()) return;

    const text = this.messageText().trim();
    const staged = this.stagedAttachments();
    this.isSending.set(true);

    const request: SendMessageRequest = {
      roomId: this.roomId,
      content: text || null,
      attachments: staged.map(a => ({ fileUrl: a.uploadedUrl!, fileType: a.fileType })),
    };

    try {
      await this.chatHub.sendMessage(request);

      const optimisticAttachments: MessageAttachmentResponse[] = staged.map((a, i) => ({
        id: Date.now() + i,
        fileUrl: a.uploadedUrl!,
        fileType: a.fileType,
      }));

      this.messages.update(list => [...list, {
        id: Date.now(),
        roomId: this.roomId,
        senderId: this.currentUserId(),
        content: text,
        sentAt: new Date().toISOString(),
        isRead: false,
        messageType: optimisticAttachments.length
          ? this.fileTypeToMessageType(optimisticAttachments[0].fileType)
          : 'Text',
        attachments: optimisticAttachments,
      }]);

      this.messageText.set('');
      this.clearStagedAttachments();
      this.scrollTrigger.update(n => n + 1);
    } catch (err) {
      toast.error(this.translocoService.translate('features.chat.errors.sendFailed'));
      console.error(err);
    } finally {
      this.isSending.set(false);
    }
  }

  private fileTypeToMessageType(fileType: FileType): MessageType {
    const map: Record<FileType, MessageType> = {
      [FileType.Text]: 'Text', [FileType.Image]: 'Image',
      [FileType.Video]: 'Video', [FileType.File]: 'File',
      [FileType.Audio]: 'Audio', [FileType.System]: 'Text',
    };
    return map[fileType] ?? 'Text';
  }

  onFilesSelected(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    if (!files.length) return;
    const remainingSlots = MAX_ATTACHMENTS - this.stagedAttachments().length;
    if (remainingSlots <= 0) {
      toast.error(this.translocoService.translate('features.chat.errors.tooManyAttachments'));
      return;
    }
    files.slice(0, remainingSlots).forEach(file => this.stageFile(file));
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  private stageFile(file: File): void {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(this.translocoService.translate('features.chat.errors.fileTooLarge'));
      return;
    }
    const staged: IStagedAttachment = {
      localId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file, previewUrl: URL.createObjectURL(file),
      fileType: this.inferFileType(file),
      uploadedUrl: null, uploading: true, error: null,
    };
    this.stagedAttachments.update(list => [...list, staged]);
    this.uploadStagedFile(staged);
  }

  private inferFileType(file: File): FileType {
    if (file.type.startsWith('image/')) return FileType.Image;
    if (file.type.startsWith('video/')) return FileType.Video;
    if (file.type.startsWith('audio/')) return FileType.Audio;
    return FileType.File;
  }

  private uploadStagedFile(staged: IStagedAttachment): void {
    this.uploadService.uploadFile(staged.file).subscribe({
      next: (urls: string[]) =>
        this.updateStagedAttachment(staged.localId, { uploadedUrl: urls[0], uploading: false }),
      error: () =>
        this.updateStagedAttachment(staged.localId, {
          uploading: false,
          error: this.translocoService.translate('features.chat.errors.uploadFailed'),
        }),
    });
  }

  private updateStagedAttachment(localId: string, patch: Partial<IStagedAttachment>): void {
    this.stagedAttachments.update(list =>
      list.map(a => a.localId === localId ? { ...a, ...patch } : a)
    );
  }

  removeStagedAttachment(localId: string): void {
    const att = this.stagedAttachments().find(a => a.localId === localId);
    if (att) URL.revokeObjectURL(att.previewUrl);
    this.stagedAttachments.update(list => list.filter(a => a.localId !== localId));
  }

  private clearStagedAttachments(): void {
    this.stagedAttachments().forEach(a => URL.revokeObjectURL(a.previewUrl));
    this.stagedAttachments.set([]);
  }

  openRecorder(): void { this.isRecorderOpen.set(true); }

  async onVoiceRecorded(event: { blob: Blob; durationSec: number }): Promise<void> {
    this.isRecorderOpen.set(false);
    const file = new File([event.blob], `voice-${Date.now()}.webm`, { type: event.blob.type || 'audio/webm' });
    const staged: IStagedAttachment = {
      localId: `${Date.now()}-voice`, file,
      previewUrl: URL.createObjectURL(file),
      fileType: FileType.Audio,
      uploadedUrl: null, uploading: true, error: null,
    };
    this.stagedAttachments.update(list => [...list, staged]);
    this.uploadStagedFile(staged);
  }

  onVoiceCancelled(): void { this.isRecorderOpen.set(false); }

  openLightbox(url: string, type: 'image' | 'video'): void {
    this.lightboxUrl.set(url); this.lightboxType.set(type);
  }
  closeLightbox(): void {
    this.lightboxUrl.set(null); this.lightboxType.set(null);
  }

  private normalizeMessage(m: MessageResponse): MessageResponse {
    const attachments = m.attachments ?? [];
    const messageType: MessageType = attachments.length > 0
      ? this.fileTypeToMessageType(attachments[0].fileType)
      : (m.messageType === 'System' ? 'System' : m.messageType ?? 'Text');
    return { ...m, attachments, messageType };
  }

  private normalizeMessages(items: MessageResponse[]): MessageResponse[] {
    return items.map(m => this.normalizeMessage(m));
  }

  getImageAttachments(message: MessageResponse): MessageAttachmentResponse[] {
    return message.attachments.filter(a => a.fileType === FileType.Image);
  }

  getAttachmentType(att: MessageAttachmentResponse): 'Image' | 'Video' | 'Audio' | 'File' {
    switch (att.fileType) {
      case FileType.Image: return 'Image';
      case FileType.Video: return 'Video';
      case FileType.Audio: return 'Audio';
      default: return 'File';
    }
  }

  onEnterKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  isOwnMessage(m: MessageResponse): boolean { return m.senderId === this.currentUserId(); }
  isSystemMessage(m: MessageResponse): boolean { return m.messageType === 'System'; }

  formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  shouldShowDateSeparator(messages: MessageResponse[], index: number): boolean {
    if (index === 0) return true;
    return new Date(messages[index].sentAt).toDateString() !==
      new Date(messages[index - 1].sentAt).toDateString();
  }

  getFileName(url: string): string { return url.split('/').pop() ?? 'file'; }

  ngOnDestroy(): void {
    this.clearStagedAttachments();
    this.destroy$.next();
    this.destroy$.complete();
  }
}