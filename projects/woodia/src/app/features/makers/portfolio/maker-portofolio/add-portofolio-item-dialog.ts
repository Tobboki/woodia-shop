import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { NgIcon } from '@ng-icons/core';
import { ZardButtonComponent } from '@shared-components/button';
import { ZardInputDirective } from '@shared-components/input/input.directive';
import { ZardFormModule } from '@shared-components/form/form.module';
import { ZardDialogRef } from '@shared-components/dialog/dialog-ref';
import { MakerPortfolioService, IAddPortfolioItemPayload } from '@woodia-core/services/maker-portfolio.service';
import { UploadService } from '@woodia-core/services/upload.service';
import { ImageDropzoneComponent } from '@shared-components/custom/image-dropzone/image-dropzone.component';
import { toast } from 'ngx-sonner';

interface IImageSlot {
  uploadedUrl: string | null; // server URL — passed to [imageUrl] only after upload done
  uploading: boolean;
  error: string | null;
}

const MAX_IMAGES = 6;

@Component({
  selector: 'woodia-add-portfolio-item-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslocoDirective,
    NgIcon,
    ZardButtonComponent,
    ZardInputDirective,
    ZardFormModule,
    ImageDropzoneComponent,
  ],
  template: `
    <div *transloco="let t; read: 'features.makers.portfolio.dialog'" class="flex flex-col gap-5 p-1">

      <!-- Images grid -->
      <div>
        <label class="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
          {{ t('images') }}
          <span class="normal-case font-normal text-muted-foreground/60 ml-1">
            ({{ uploadedCount() }}/{{ maxImages }})
          </span>
        </label>

        <div class="grid grid-cols-3 gap-3">
          @for (slot of slots(); track $index) {
          <div class="aspect-square">
            <app-image-dropzone
              [imageUrl]="slot.uploadedUrl"
              [uploading]="slot.uploading"
              [hasError]="!!slot.error"
              [placeholder]="t('addPhoto')"
              (fileDropped)="onFileDropped($event, $index)"
              (remove)="removeSlot($index)" />
          </div>
          }

          <!-- Add more slot (if under max) -->
          @if (slots().length < maxImages) {
          <div class="aspect-square">
            <app-image-dropzone
              [imageUrl]="null"
              [placeholder]="t('addPhoto')"
              (fileDropped)="addNewSlot($event)" />
          </div>
          }
        </div>

        <!-- Per-slot errors -->
        @for (slot of slots(); track $index) {
          @if (slot.error) {
          <p class="text-xs text-destructive mt-1">{{ slot.error }}</p>
          }
        }
      </div>

      <!-- Title -->
      <z-form-field>
        <label z-form-label class="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {{ t('title') }}
        </label>
        <z-form-control>
          <input z-input type="text"
            [ngModel]="title()" (ngModelChange)="title.set($event)"
            [placeholder]="t('titlePlaceholder')"
            maxlength="80" />
        </z-form-control>
      </z-form-field>

      <!-- Description -->
      <z-form-field>
        <label z-form-label class="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {{ t('description') }}
        </label>
        <z-form-control>
          <textarea z-input zType="textarea"
            [ngModel]="description()" (ngModelChange)="description.set($event)"
            [placeholder]="t('descriptionPlaceholder')"
            rows="3"></textarea>
        </z-form-control>
      </z-form-field>

      <!-- Footer -->
      <div class="flex items-center justify-end gap-3 pt-2 border-t border-border/50">
        <z-button zType="outline" (click)="cancel()">
          {{ t('cancel') }}
        </z-button>
        <z-button zType="default"
          [zDisabled]="!isFormValid()"
          [zLoading]="isSaving()"
          (click)="save()">
          <ng-icon name="lucidePlus" class="mr-1.5 size-4" />
          {{ t('save') }}
        </z-button>
      </div>
    </div>
  `,
})
export class AddPortfolioItemDialog {
  private dialogRef = inject(ZardDialogRef);
  private portfolioService = inject(MakerPortfolioService);
  private uploadService = inject(UploadService);
  private translocoService = inject(TranslocoService);

  title = signal('');
  description = signal('');
  isSaving = signal(false);

  readonly maxImages = MAX_IMAGES;

  // Start with one empty slot
  slots = signal<IImageSlot[]>([]);

  uploadedCount = computed(() =>
    this.slots().filter(s => !!s.uploadedUrl).length
  );

  isAnyUploading = computed(() =>
    this.slots().some(s => s.uploading)
  );

  isFormValid = computed(() =>
    this.title().trim().length > 0 &&
    this.description().trim().length > 0 &&
    this.uploadedCount() > 0 &&
    !this.isAnyUploading()
  );

  // Called when user drops/selects a file in an EXISTING slot
  onFileDropped(file: File, index: number): void {
    this.uploadToSlot(file, index);
  }

  // Called when user drops/selects a file in the "add more" slot
  addNewSlot(file: File): void {
    const newIndex = this.slots().length;
    this.slots.update(list => [...list, {
      uploadedUrl: null,
      uploading: false,
      error: null,
    }]);
    this.uploadToSlot(file, newIndex);
  }

  removeSlot(index: number): void {
    this.slots.update(list => list.filter((_, i) => i !== index));
  }

  private uploadToSlot(file: File, index: number): void {
    if (file.size > 10 * 1024 * 1024) {
      this.updateSlot(index, {
        error: this.translocoService.translate('features.makers.portfolio.dialog.errors.fileTooLarge')
      });
      return;
    }

    // Set uploading immediately — imageUrl stays null so NgOptimizedImage
    // never receives a base64 string; the dropzone shows its spinner instead
    this.updateSlot(index, { uploading: true, error: null, uploadedUrl: null });

    this.uploadService.uploadFile(file).subscribe({
      next: (urls: string[]) => {
        // Only after upload completes do we pass the real https:// URL to [imageUrl]
        this.updateSlot(index, { uploadedUrl: urls[0], uploading: false });
      },
      error: () => {
        this.updateSlot(index, {
          uploading: false,
          uploadedUrl: null,
          error: this.translocoService.translate('features.makers.portfolio.dialog.errors.uploadFailed'),
        });
      }
    });
  }

  private updateSlot(index: number, patch: Partial<IImageSlot>): void {
    this.slots.update(list =>
      list.map((slot, i) => i === index ? { ...slot, ...patch } : slot)
    );
  }

  save(): void {
    if (!this.isFormValid()) return;
    this.isSaving.set(true);

    const payload: IAddPortfolioItemPayload = {
      title: this.title().trim(),
      description: this.description().trim(),
      portfolioImageUrls: this.slots()
        .map(s => s.uploadedUrl!)
        .filter(Boolean),
    };

    this.portfolioService.addPortfolioItem(payload).subscribe({
      next: (item) => {
        this.isSaving.set(false);
        this.dialogRef.close(item);
      },
      error: () => {
        this.isSaving.set(false);
        toast.error(
          this.translocoService.translate('features.makers.portfolio.dialog.errors.saveFailed')
        );
      }
    });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}