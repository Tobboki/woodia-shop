import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { NgIcon } from '@ng-icons/core';
import { ZardButtonComponent } from '@shared-components/button';
import { ZardSkeletonComponent } from '@shared-components/skeleton';
import { ZardInputDirective } from '@shared-components/input/input.directive';
import { ZardFormModule } from '@shared-components/form/form.module';
import { ImageDropzoneComponent } from '@shared-components/custom/image-dropzone/image-dropzone.component';
import { UploadService } from '@woodia-core/services/upload.service';
import { MakerPortfolioService, IPortfolioItem } from '@woodia-core/services/maker-portfolio.service';
import { toast } from 'ngx-sonner';
import { getTextDir } from '@woodia-shared/utils/helpers';

interface IImageEditSlot {
  url: string | null;       // existing or newly uploaded server URL
  uploading: boolean;
  error: string | null;
}

@Component({
  selector: 'woodia-maker-portfolio-item-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslocoDirective,
    NgIcon,
    ZardButtonComponent,
    ZardSkeletonComponent,
    ZardInputDirective,
    ZardFormModule,
    ImageDropzoneComponent,
  ],
  templateUrl: './maker-portfolio-item-details.html',
  styleUrl: './maker-portfolio-item-details.scss',
})
export class MakerPortfolioItemDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private portfolioService = inject(MakerPortfolioService);
  private uploadService = inject(UploadService);
  private translocoService = inject(TranslocoService);
  protected getTextDir = getTextDir

  readonly MAX_IMAGES = 6;

  item = signal<IPortfolioItem | null>(null);
  isLoading = signal(true);
  isError = signal(false);
  isSaving = signal(false);
  isDeleting = signal(false);

  // Draft fields (signals so computed() tracks them)
  draftTitle = signal('');
  draftDescription = signal('');
  imageSlots = signal<IImageEditSlot[]>([]);

  // Lightbox
  selectedIndex = signal(0);
  lightboxOpen = signal(false);

  isDirty = computed(() => {
    const orig = this.item();
    if (!orig) return false;
    const titChanged = this.draftTitle() !== orig.title;
    const descChanged = this.draftDescription() !== orig.description;
    const origUrls = JSON.stringify(orig.portfolioImageUrls ?? []);
    const draftUrls = JSON.stringify(this.imageSlots().map(s => s.url).filter(Boolean));
    return titChanged || descChanged || origUrls !== draftUrls;
  });

  isAnyUploading = computed(() => this.imageSlots().some(s => s.uploading));

  canSave = computed(() =>
    this.isDirty() &&
    !this.isAnyUploading() &&
    this.draftTitle().trim().length > 0 &&
    this.draftDescription().trim().length > 0 &&
    this.imageSlots().some(s => !!s.url)
  );

  ngOnInit(): void {
    const idStr = this.route.snapshot.paramMap.get('itemId');
    const id = idStr ? parseInt(idStr, 10) : NaN;

    if (isNaN(id)) {
      this.isError.set(true);
      this.isLoading.set(false);
      return;
    }

    this.portfolioService.getPortfolioItems().subscribe({
      next: (items) => {
        const found = items.find(i => i.id === id) ?? null;
        if (!found) {
          this.isError.set(true);
        } else {
          this.item.set(found);
          this.initDraft(found);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  private initDraft(item: IPortfolioItem): void {
    this.draftTitle.set(item.title ?? '');
    this.draftDescription.set(item.description ?? '');
    this.imageSlots.set(
      (item.portfolioImageUrls ?? []).map(url => ({ url, uploading: false, error: null }))
    );
  }

  // ── Image slot handlers ──

  onSlotFileDropped(file: File, index: number): void {
    this.uploadToSlot(file, index);
  }

  addNewImageSlot(file: File): void {
    const newIndex = this.imageSlots().length;
    this.imageSlots.update(list => [...list, { url: null, uploading: false, error: null }]);
    this.uploadToSlot(file, newIndex);
  }

  removeImageSlot(index: number): void {
    this.imageSlots.update(list => list.filter((_, i) => i !== index));
    if (this.selectedIndex() >= this.imageSlots().length) {
      this.selectedIndex.set(Math.max(0, this.imageSlots().length - 1));
    }
  }

  private uploadToSlot(file: File, index: number): void {
    if (file.size > 10 * 1024 * 1024) {
      this.updateSlot(index, {
        error: this.translocoService.translate('features.makers.portfolio.dialog.errors.fileTooLarge')
      });
      return;
    }

    this.updateSlot(index, { uploading: true, error: null, url: null });

    this.uploadService.uploadFile(file).subscribe({
      next: (urls: string[]) => this.updateSlot(index, { url: urls[0], uploading: false }),
      error: () => this.updateSlot(index, {
        uploading: false,
        url: null,
        error: this.translocoService.translate('features.makers.portfolio.dialog.errors.uploadFailed'),
      })
    });
  }

  private updateSlot(index: number, patch: Partial<IImageEditSlot>): void {
    this.imageSlots.update(list =>
      list.map((s, i) => i === index ? { ...s, ...patch } : s)
    );
  }

  // ── Actions ──

  discardChanges(): void {
    const orig = this.item();
    if (orig) this.initDraft(orig);
  }

  saveChanges(): void {
    if (!this.canSave()) return;
    const orig = this.item();
    if (!orig) return;

    this.isSaving.set(true);

    const payload = {
      title: this.draftTitle().trim(),
      description: this.draftDescription().trim(),
      portfolioImageUrls: this.imageSlots().map(s => s.url!).filter(Boolean),
    };

    this.portfolioService.updatePortfolioItem(orig.id, payload).subscribe({
      next: (updated) => {
        this.isSaving.set(false);

        // PUT may return 204 No Content (null/undefined body). If we get a
        // real response object back, use it; otherwise build the updated
        // item locally from the payload we just sent so the UI stays correct.
        const merged: IPortfolioItem = (updated && updated.id)
          ? updated
          : { ...orig, ...payload };

        this.item.set(merged);
        this.initDraft(merged);
        toast.success(this.translocoService.translate('features.makers.portfolio.messages.saved'));
      },
      error: () => {
        this.isSaving.set(false);
        toast.error(this.translocoService.translate('features.makers.portfolio.errors.saveFailed'));
      }
    });
  }

  deleteItem(): void {
    const item = this.item();
    if (!item) return;

    const confirmed = confirm(
      this.translocoService.translate('features.makers.portfolio.confirmDelete')
    );
    if (!confirmed) return;

    this.isDeleting.set(true);
    this.portfolioService.deletePortfolioItem(item.id).subscribe({
      next: () => {
        toast.success(this.translocoService.translate('features.makers.portfolio.messages.deleted'));
        this.router.navigate(['/makers/portfolio']);
      },
      error: () => {
        this.isDeleting.set(false);
        toast.error(this.translocoService.translate('features.makers.portfolio.errors.deleteFailed'));
      }
    });
  }

  // ── Lightbox ──
  openLightbox(index: number): void {
    this.selectedIndex.set(index);
    this.lightboxOpen.set(true);
  }

  nextImage(total: number): void {
    this.selectedIndex.update(i => (i + 1) % total);
  }

  prevImage(total: number): void {
    this.selectedIndex.update(i => (i - 1 + total) % total);
  }

  goBack(): void {
    this.router.navigate(['/makers/portfolio']);
  }
}