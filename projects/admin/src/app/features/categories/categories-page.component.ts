import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

import { CrudServerDataTableComponent, CuFormSidebarComponent } from '@admin-shared/components';
import { PagedRequest, PagedResponse, TableHeader } from '@admin-types/data-table.types';
import { CategoryService } from '@admin-core/services/category.service';
import { ZardInputDirective } from '@shared-components/input/input.directive';
import { ZardSelectComponent } from '@shared-components/select/select.component';
import { ZardSelectItemComponent } from '@shared-components/select/select-item.component';

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
    ZardSelectItemComponent
  ],
  templateUrl: './categories-page.component.html'
})
export default class CategoriesPageComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private fb = inject(FormBuilder);
  private translocoService = inject(TranslocoService);

  // Table State
  pagedResponse = signal<PagedResponse<any> | null>(null);
  items = signal<any[]>([]);
  loading = signal<boolean>(false);
  lastQuery: PagedRequest = { pageNumber: 1, pageSize: 10 };

  // Sidebar & Form State
  sidebarOpen = signal<boolean>(false);
  sidebarMode = signal<'add' | 'update'>('add');
  submitting = signal<boolean>(false);
  editingId = signal<number | null>(null);
  
  categoryForm: FormGroup;
  parentCategories = signal<any[]>([]);

  headers: TableHeader[] = [
    { key: 'id', title: 'ID', sortable: true },
    { key: 'nameEn', title: 'Name (EN)', sortable: true },
    { key: 'nameAr', title: 'Name (AR)', sortable: true },
    { key: 'createdAt', title: 'Created At', sortable: true, align: 'end' }
  ];

  constructor() {
    this.categoryForm = this.fb.group({
      nameEn: ['', [Validators.required]],
      nameAr: ['', [Validators.required]],
      parentId: [null]
    });
  }

  ngOnInit() {
    this.loadParents();
  }

  loadParents() {
    this.categoryService.getParentCategories().subscribe(parents => {
      this.parentCategories.set(parents);
    });
  }

  loadCategories(req: PagedRequest) {
    this.lastQuery = req;
    this.loading.set(true);
    
    this.categoryService.getPagedCategories(req).subscribe({
      next: (res: any) => {
        this.pagedResponse.set({
          items: res.items,
          pageNumber: res.pageNumber,
          totalPages: res.totalPages,
          hasPreviousPage: res.hasPreviousPage,
          hasNextPage: res.hasNextPage
        });
        this.items.set(res.items);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Failed to load categories', err);
        this.loading.set(false);
      }
    });
  }

  onAddClicked() {
    this.sidebarMode.set('add');
    this.editingId.set(null);
    this.categoryForm.reset();
    this.sidebarOpen.set(true);
  }

  onEditClicked(id: any) {
    const category = this.items().find(i => i.id === id);
    if (!category) return;

    this.sidebarMode.set('update');
    this.editingId.set(id);
    this.categoryForm.patchValue({
      nameEn: category.nameEn,
      nameAr: category.nameAr,
      parentId: category.parentId ? category.parentId.toString() : ''
    });
    this.sidebarOpen.set(true);
  }

  onDeleteClicked(id: any) {
    if (confirm('Are you sure you want to delete this category?')) {
      this.categoryService.deleteCategory(id).subscribe(() => {
        this.loadCategories(this.lastQuery);
      });
    }
  }

  onSubmitForm() {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const data = { ...this.categoryForm.value };
    
    // Convert empty string to null for parentId
    if (data.parentId === '') {
      data.parentId = null;
    }

    const request = this.sidebarMode() === 'add' 
      ? this.categoryService.createCategory(data)
      : this.categoryService.updateCategory(this.editingId()!, { ...data, id: this.editingId() });

    request.subscribe({
      next: () => {
        this.submitting.set(false);
        this.closeSidebar();
        this.loadCategories(this.lastQuery);
        if (this.sidebarMode() === 'add') this.loadParents(); // Refresh parents list
      },
      error: (err) => {
        console.error('Save failed', err);
        this.submitting.set(false);
      }
    });
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
    this.editingId.set(null);
  }

  onResetForm() {
    this.categoryForm.reset();
  }
}
