import {
  Component, OnDestroy, Output, EventEmitter, ViewChild, ElementRef,
  signal, AfterViewInit, ChangeDetectorRef, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import { NgIcon } from '@ng-icons/core';

/**
 * Inline voice recorder shown in the chat input bar.
 * Records via MediaRecorder, renders a live waveform via wavesurfer.js
 * RecordPlugin, and emits the final Blob on confirm.
 */
@Component({
  selector: 'woodia-voice-recorder',
  standalone: true,
  imports: [CommonModule, TranslocoDirective, NgIcon],
  templateUrl: './voice-recorder.html',
})
export class VoiceRecorder implements AfterViewInit, OnDestroy {
  @Output() recorded = new EventEmitter<{ blob: Blob; durationSec: number }>();
  @Output() cancelled = new EventEmitter<void>();

  // static: false — #waveformEl lives inside @else, so it only exists after
  // the first change-detection pass renders the non-error branch.
  @ViewChild('waveformEl', { static: false }) waveformEl?: ElementRef<HTMLDivElement>;

  isRecording = signal(false);
  isPaused = signal(false);
  elapsedSec = signal(0);
  hasError = signal(false);
  isReady = signal(false);

  private cdr = inject(ChangeDetectorRef);
  private wavesurfer: any;
  private recordPlugin: any;
  private timerInterval: any;

  ngAfterViewInit(): void {
    // Defer one tick so Angular finishes rendering the @else branch and
    // populates the @ViewChild before we try to access nativeElement.
    setTimeout(() => this.initRecorder(), 0);
  }

  private async initRecorder(): Promise<void> {
    if (!this.waveformEl?.nativeElement) {
      console.error('[VoiceRecorder] waveformEl not found in DOM');
      this.hasError.set(true);
      return;
    }

    try {
      const [{ default: WaveSurfer }, { default: RecordPlugin }] = await Promise.all([
        import('wavesurfer.js'),
        import('wavesurfer.js/dist/plugins/record.js'),
      ]);

      this.wavesurfer = WaveSurfer.create({
        container: this.waveformEl.nativeElement,
        waveColor: 'rgb(var(--muted-foreground-rgb), 0.4)',
        progressColor: 'rgb(var(--primary-rgb))',
        height: 36,
        barWidth: 2,
        barGap: 2,
        barRadius: 2,
        cursorWidth: 0,
        interact: false,
      });

      this.recordPlugin = this.wavesurfer.registerPlugin(
        RecordPlugin.create({ scrollingWaveform: true, renderRecordedAudio: false })
      );

      this.isReady.set(true);
      this.startRecording();
    } catch (err) {
      console.error('[VoiceRecorder] Failed to init recorder', err);
      this.hasError.set(true);
    }
  }

  private async startRecording(): Promise<void> {
    try {
      await this.recordPlugin.startRecording();
      this.isRecording.set(true);
      this.elapsedSec.set(0);
      this.timerInterval = setInterval(() => {
        this.elapsedSec.update(s => s + 1);
      }, 1000);
    } catch (err) {
      console.error('[VoiceRecorder] Microphone access denied or unavailable', err);
      this.hasError.set(true);
    }
  }

  togglePause(): void {
    if (!this.recordPlugin) return;
    if (this.isPaused()) {
      this.recordPlugin.resumeRecording();
      this.isPaused.set(false);
      this.timerInterval = setInterval(() => this.elapsedSec.update(s => s + 1), 1000);
    } else {
      this.recordPlugin.pauseRecording();
      this.isPaused.set(true);
      clearInterval(this.timerInterval);
    }
  }

  async confirmRecording(): Promise<void> {
    if (!this.recordPlugin) return;
    const blob: Blob = await new Promise(resolve => {
      this.recordPlugin.once('record-end', (blob: Blob) => resolve(blob));
      this.recordPlugin.stopRecording();
    });
    clearInterval(this.timerInterval);
    this.isRecording.set(false);
    this.recorded.emit({ blob, durationSec: this.elapsedSec() });
    this.cleanup();
  }

  cancel(): void {
    clearInterval(this.timerInterval);
    try { this.recordPlugin?.stopRecording(); } catch { /* ignore */ }
    this.cancelled.emit();
    this.cleanup();
  }

  formatDuration(totalSec: number): string {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  private cleanup(): void {
    clearInterval(this.timerInterval);
    this.wavesurfer?.destroy();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }
}