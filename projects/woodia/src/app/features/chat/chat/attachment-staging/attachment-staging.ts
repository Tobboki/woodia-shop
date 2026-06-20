import {
  Component, Input, Output, EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { NgIcon } from '@ng-icons/core';
import { FileType } from '@woodia-shared/types/chat.types';

export interface IStagedAttachment {
  localId: string;
  file: File;
  previewUrl: string;
  fileType: FileType;
  uploadedUrl: string | null;
  uploading: boolean;
  error: string | null;
}

/**
 * Renders the horizontal strip of staged attachments above the input bar,
 * each with a thumbnail/icon, upload progress and remove button.
 * A single shared caption input below the strip maps to message `content`.
 */
@Component({
  selector: 'woodia-attachment-staging',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoDirective, NgIcon],
  templateUrl: './attachment-staging.html',
})
export class AttachmentStaging {
  @Input() attachments: IStagedAttachment[] = [];
  /** The shared caption — bind to the parent's messageText signal value */
  @Input() caption = '';
  @Output() remove = new EventEmitter<string>();
  @Output() captionChange = new EventEmitter<string>();
  @Output() send = new EventEmitter<void>();

  readonly FileType = FileType;

  getIconForType(fileType: FileType): string {
    switch (fileType) {
      case FileType.Image: return 'lucideImage';
      case FileType.Video: return 'lucideVideo';
      case FileType.Audio: return 'lucideMic';
      default: return 'lucideFile';
    }
  }
}