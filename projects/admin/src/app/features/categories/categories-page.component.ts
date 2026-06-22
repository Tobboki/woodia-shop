import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

import { CrudServerDataTableComponent, CuFormSidebarComponent } from '@admin-shared/components';
import { PagedRequest, PagedResponse, TableHeader } from '@admin-types/data-table.types';
import { CategoryService } from '@admin-core/services/category.service';
import { UploadService } from '@admin-core/services/upload.service';
import { ZardInputDirective } from '@shared-components/input/input.directive';
import { ZardSelectComponent } from '@shared-components/select/select.component';
import { ZardSelectItemComponent } from '@shared-components/select/select-item.component';
import { ZardDialogService } from '@shared-components/dialog/dialog.service';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-categories-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    CrudServerDataTableComponent,
    CuFormSidebarComponent,
    ZardInputDirective,
    ZardSelectComponent,
    ZardSelectItemComponent,
    NgIcon,
  ],
  templateUrl: './categories-page.component.html',
})
export default class CategoriesPageComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private uploadService = inject(UploadService);
  private dialogService = inject(ZardDialogService);
  private fb = inject(FormBuilder);
  private translocoService = inject(TranslocoService);

  pagedResponse = signal<PagedResponse<any> | null>(null);
  items = signal<any[]>([]);
  loading = signal(false);
  lastQuery: PagedRequest = { pageNumber: 1, pageSize: 10 };

  sidebarOpen = signal(false);
  sidebarMode = signal<'add' | 'update'>('add');
  submitting = signal(false);
  editingId = signal<number | null>(null);
  isUploadingImage = signal(false);
  parentCategories = signal<any[]>([]);
  selectedParentId = signal<string>('');

  categoryForm: FormGroup = this.fb.group({
    nameEn: ['', Validators.required],
    nameAr: ['', Validators.required],
    slugEn: ['', Validators.required],
    slugAr: ['', Validators.required],
    imageThumbnail: ['', Validators.required],
  });

  // Use 'categoryId' to match the API response — the table emits item[key] for actions
  headers: TableHeader[] = [
    { key: 'categoryId', title: 'ID', sortable: true },
    { key: 'nameEn', title: 'Name (EN)', sortable: true },
    { key: 'nameAr', title: 'Name (AR)', sortable: true },
    { key: 'createdAt', title: 'Created At', sortable: true, align: 'end' },
  ];

  ngOnInit(): void {
    this.loadParents();
  }

  loadParents(): void {
    this.categoryService.getParentCategories().subscribe({
      next: parents => this.parentCategories.set(parents),
      error: err => console.error('Failed to load parent categories', err),
    });
  }

  loadCategories(req: PagedRequest): void {
    this.lastQuery = req;
    this.loading.set(true);

    this.categoryService.getPagedCategories(req).subscribe({
      next: (res: any) => {
        // Normalize: add an `id` alias so the table's edit/delete buttons work.
        // The table component emits item.id — our API returns categoryId.
        const normalized = (res.items ?? []).map((item: any) => ({
          ...item,
          id: item.categoryId ?? item.id,
        }));

        this.pagedResponse.set({
          items: normalized,
          pageNumber: res.pageNumber,
          totalPages: res.totalPages,
          hasPreviousPage: res.hasPreviousPage,
          hasNextPage: res.hasNextPage,
        });
        this.items.set(normalized);
        this.loading.set(false);
      },
      error: err => {
        console.error('Failed to load categories', err);
        this.loading.set(false);
      },
    });
  }

  onAddClicked(): void {
    this.sidebarMode.set('add');
    this.editingId.set(null);
    this.selectedParentId.set('');
    this.categoryForm.reset({ nameEn: '', nameAr: '', slugEn: '', slugAr: '', imageThumbnail: '' });
    this.sidebarOpen.set(true);
  }

  onEditClicked(id: any): void {
    const numericId = Number(id);
    if (!numericId) return;

    this.sidebarMode.set('update');
    this.editingId.set(numericId);
    this.sidebarOpen.set(true);

    this.categoryService.getCategory(numericId).subscribe({
      next: (cat: any) => {
        this.categoryForm.patchValue({
          nameEn: cat.nameEn ?? '',
          nameAr: cat.nameAr ?? '',
          slugEn: cat.slugEn ?? '',
          slugAr: cat.slugAr ?? '',
          imageThumbnail: cat.imageThumbnail ?? '',
        });
        // parentCategory.id can be null — must be string for z-select
        const parentId = cat.parentCategory?.id != null ? String(cat.parentCategory.id) : '';
        this.selectedParentId.set(parentId);
      },
      error: err => console.error('Failed to load category', err),
    });
  }

  onDeleteClicked(id: any): void {
    const numericId = Number(id);
    if (!numericId) return;

    const dialogRef = this.dialogService.create({
      zTitle: this.translocoService.translate('crud.deleteConfirmTitle'),
      zContent: this.translocoService.translate('crud.deleteConfirmMessage'),
      zWidth: '400px',
    });

    dialogRef.afterClosed().subscribe(result => {
      // Only skip on explicit cancel — undefined/void means confirmed
      if (result === 'cancel' || result === false) return;

      this.categoryService.deleteCategory(numericId).subscribe({
        next: () => this.loadCategories(this.lastQuery),
        error: err => console.error('Delete failed', err),
      });
    });
  }

  onSubmitForm(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const raw = this.categoryForm.value;
    const parentId = this.selectedParentId() !== '' ? Number(this.selectedParentId()) : null;

    // Build payload matching exactly what the POST /api/admin/Category endpoint expects.
    // The API response shows: slugAr, slugEn, nameAr, nameEn, imageThumbnail, parentId
    const payload: Record<string, any> = {
      nameEn: raw.nameEn?.trim() ?? '',
      nameAr: raw.nameAr?.trim() ?? '',
      slugEn: raw.slugEn?.trim() ?? '',
      slugAr: raw.slugAr?.trim() ?? '',
      imageThumbnail: raw.imageThumbnail?.trim() ?? '',
      parentId,
    };

    // Add id field for update requests
    if (this.sidebarMode() === 'update' && this.editingId()) {
      payload['id'] = this.editingId();
    }

    console.log('[Categories] submitting payload:', JSON.stringify(payload, null, 2));

    const request$ = this.sidebarMode() === 'add'
      ? this.categoryService.createCategory(payload)
      : this.categoryService.updateCategory(this.editingId()!, payload);

    request$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.sidebarOpen.set(false);
        this.editingId.set(null);
        this.loadCategories(this.lastQuery);
        this.loadParents();
      },
      error: err => {
        console.error('Save failed', err);
        // Log the full error body so we can see what the API rejected
        if (err.error) {
          console.error('API error body:', JSON.stringify(err.error, null, 2));
        }
        this.submitting.set(false);
      },
    });
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
    this.editingId.set(null);
  }

  onResetForm(): void {
    if (this.sidebarMode() === 'update') {
      this.onEditClicked(this.editingId());
    } else {
      this.selectedParentId.set('');
      this.categoryForm.reset({ nameEn: '', nameAr: '', slugEn: '', slugAr: '', imageThumbnail: '' });
    }
  }

  onParentSelected(value: string | string[]): void {
    // z-select emits the raw zValue — coerce to string, empty string means "no parent"
    const v = Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
    this.selectedParentId.set(String(v));
  }

  autoSlug(lang: 'en' | 'ar'): void {
    const nameControl = lang === 'en' ? 'nameEn' : 'nameAr';
    const slugControl = lang === 'en' ? 'slugEn' : 'slugAr';
    const value: string = this.categoryForm.get(nameControl)?.value ?? '';
    const slug = value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u0600-\u06FF-]/g, '')
      .replace(/--+/g, '-');
    this.categoryForm.get(slugControl)?.setValue(slug, { emitEvent: false });
  }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.isUploadingImage.set(true);
    this.uploadService.uploadFile(file).subscribe({
      next: (urls: string[]) => {
        this.categoryForm.get('imageThumbnail')?.setValue(urls[0]);
        this.isUploadingImage.set(false);
      },
      error: () => {
        this.isUploadingImage.set(false);
        console.error('Image upload failed');
      },
    });
  }
}