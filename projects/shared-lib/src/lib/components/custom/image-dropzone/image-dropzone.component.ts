import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-image-dropzone',
  standalone: true,
  imports: [CommonModule, NgIcon, NgOptimizedImage],
  template: `
    <div
      class="relative w-full h-full min-h-[140px] rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden group"
      [ngClass]="{
        'border-primary bg-primary/10 scale-[1.01]': isDragOver,
        'border-border bg-muted/40 hover:bg-muted/60 hover:border-muted-foreground/30': !isDragOver,
        'border-destructive bg-destructive/5': hasError,
        'opacity-50 pointer-events-none': disabled || uploading
      }"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
      (click)="fileInput.click()"
    >
      <input
        #fileInput
        type="file"
        class="hidden"
        accept="image/*"
        (change)="onFileSelected($event)"
        [disabled]="disabled || uploading"
      />

      @if (imageUrl) {
        <div class="absolute inset-0 bg-muted animate-pulse" *ngIf="uploading"></div>
        <img [ngSrc]="imageUrl" alt="Preview" fill class="object-cover transition-transform duration-500 group-hover:scale-110" />
        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
          <button type="button" class="bg-destructive text-destructive-foreground p-2 rounded-full hover:scale-110 transition-transform shadow-lg">
            <ng-icon name="lucideTrash2" class="size-6" (click)="$event.stopPropagation(); remove.emit()" />
          </button>
        </div>
      } @else if (uploading) {
        <div class="flex flex-col items-center text-primary">
          <ng-icon name="lucideLoader2" class="size-10 animate-spin mb-3" />
          <span class="text-xs font-bold tracking-wider uppercase">{{ placeholder }}...</span>
        </div>
      } @else {
        <div class="flex flex-col items-center text-muted-foreground p-6 text-center transition-transform group-hover:-translate-y-1">
          <div class="size-12 rounded-full bg-background border border-border flex items-center justify-center mb-3 shadow-sm group-hover:border-primary/50 group-hover:text-primary transition-colors">
            <ng-icon name="lucideImagePlus" class="size-6 opacity-80" />
          </div>
          <span class="text-xs font-semibold">{{ placeholder }}</span>
          <p class="text-[10px] opacity-60 mt-1">PNG, JPG up to 5MB</p>
        </div>
      }
    </div>
  `
})
export class ImageDropzoneComponent {
  @Input() imageUrl: string | null = null;
  @Input() placeholder = 'Drop image or click';
  @Input() disabled = false;
  @Input() uploading = false;
  @Input() hasError = false;

  @Output() fileDropped = new EventEmitter<File>();
  @Output() remove = new EventEmitter<void>();

  isDragOver = false;

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.disabled && !this.uploading) {
      this.isDragOver = true;
    }
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    if (this.disabled || this.uploading) return;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        this.fileDropped.emit(file);
      }
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type.startsWith('image/')) {
        this.fileDropped.emit(file);
      }
      input.value = ''; // Reset
    }
  }
}
