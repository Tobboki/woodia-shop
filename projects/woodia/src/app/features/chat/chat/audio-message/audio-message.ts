import {
  Component, Input, OnDestroy, OnInit, ViewChild, ElementRef,
  signal, AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'woodia-audio-message',
  standalone: true,
  imports: [CommonModule, NgIcon],
  templateUrl: './audio-message.html',
  styleUrl: './audio-message.scss',
})
export class AudioMessage implements AfterViewInit, OnDestroy {
  @Input() fileUrl!: string;
  @Input() isOwnMessage = false;

  @ViewChild('waveformEl', { static: true }) waveformEl!: ElementRef<HTMLDivElement>;

  isPlaying = signal(false);
  isLoading = signal(true);
  currentTime = signal(0);
  duration = signal(0);

  private wavesurfer: any;

  async ngAfterViewInit(): Promise<void> {
    const { default: WaveSurfer } = await import('wavesurfer.js');

    this.wavesurfer = WaveSurfer.create({
      container: this.waveformEl.nativeElement,
      url: this.fileUrl,
      waveColor: this.isOwnMessage
        ? 'rgba(255,255,255,0.4)'
        : 'rgb(var(--muted-foreground-rgb), 0.4)',
      progressColor: this.isOwnMessage
        ? 'rgba(255,255,255,0.95)'
        : 'rgb(var(--primary-rgb))',
      height: 48,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      cursorWidth: 0,
    });

    this.wavesurfer.on('ready', () => {
      this.duration.set(this.wavesurfer.getDuration());
      this.isLoading.set(false);
    });

    this.wavesurfer.on('audioprocess', () => {
      this.currentTime.set(this.wavesurfer.getCurrentTime());
    });

    this.wavesurfer.on('finish', () => {
      this.isPlaying.set(false);
      this.currentTime.set(0);
    });
  }

  togglePlay(): void {
    if (!this.wavesurfer) return;
    this.wavesurfer.playPause();
    this.isPlaying.set(this.wavesurfer.isPlaying());
  }

  formatTime(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  ngOnDestroy(): void {
    this.wavesurfer?.destroy();
  }
}