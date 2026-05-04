import { Component, EventEmitter, Input, Output, signal, computed, effect, OnChanges, SimpleChanges, OnInit, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';

import { ZardTableImports } from '@shared-components/table/table.imports';
import { ZardButtonComponent } from '@shared-components/button';
import { ZardSelectComponent } from '@shared-components/select/select.component';
import { ZardSelectItemComponent } from '@shared-components/select/select-item.component';
import { ZardInputDirective } from '@shared-components/input/input.directive';
import { ZardTooltipImports } from '@shared-components/tooltip';
import { ZardSkeletonComponent } from '@shared-components/skeleton/skeleton.component';

import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import {
  TableHeader,
  PagingConfig,
  QueryOptions,
  Operations,
  PagedRequest,
  PagedResponse
} from '../../types/data-table.types';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-crud-server-data-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIcon,
    ZardTableImports,
    ZardButtonComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardInputDirective,
    ZardTooltipImports,
    ZardSkeletonComponent,
    TranslocoDirective,
  ],
  templateUrl: './crud-server-data-table.component.html',
})
export class CrudServerDataTableComponent implements OnChanges, OnInit {
  @Input({ required: true }) modelName!: string;
  @Input({ required: true }) headers!: TableHeader[];
  @Input({ required: true }) items!: any[];
  @Input() pagedResponse: PagedResponse<any> | null = null;
  @Input() pagingConfig: Partial<PagingConfig> = { pageSize: 10, pageSizes: [10, 25, 50] };
  @Input() queryOptions: Partial<QueryOptions> = { paging: true, search: true, sort: true };
  @Input() allowedOperations: Partial<Operations> = { readSingle: false, add: false, update: false, delete: false };
  @Input() hasSingle = false;
  @Input() loading = false;
  @Input() density: 'default' | 'compact' | 'comfortable' = 'default';
  
  @ContentChild('customActions') customActionsTemplate?: TemplateRef<any>;

  @Output() addClicked = new EventEmitter<void>();
  @Output() editClicked = new EventEmitter<string>();
  @Output() deleteClicked = new EventEmitter<string>();
  @Output() viewClicked = new EventEmitter<string>();
  @Output() queryParamsChanged = new EventEmitter<PagedRequest>();

  currentPage = 1;
  pageSize = 10;
  searchValue = '';
  sortBy = '';
  sortDirection: 'asc' | 'desc' | undefined = undefined;

  private searchSubject = new Subject<string>();

  // Derived state
  totalPages = 1;
  totalItems = 0;
  hasPreviousPage = false;
  hasNextPage = false;

  get fullPagingConfig(): PagingConfig {
    return { pageSize: 10, pageSizes: [10, 25, 50], ...this.pagingConfig };
  }

  get fullQueryOptions(): QueryOptions {
    return { paging: true, search: true, sort: true, ...this.queryOptions };
  }

  get fullAllowedOperations(): Operations {
    return { readSingle: false, add: false, update: false, delete: false, ...this.allowedOperations };
  }

  get showActions(): boolean {
    const ops = this.fullAllowedOperations;
    return ops.readSingle || ops.update || ops.delete || this.hasSingle;
  }

  constructor(private translocoService: TranslocoService) {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(value => {
      this.searchValue = value;
      this.currentPage = 1;
      this.emitQuery();
    });
  }

  ngOnInit(): void {
    this.emitQuery();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pagedResponse'] && this.pagedResponse) {
      this.totalPages = this.pagedResponse.totalPages || 1;
      this.hasPreviousPage = this.pagedResponse.hasPreviousPage;
      this.hasNextPage = this.pagedResponse.hasNextPage;
      
      // Calculate totalItems. If we are on the last page, we can be exact.
      if (!this.hasNextPage) {
        this.totalItems = (this.currentPage - 1) * this.pageSize + (this.items?.length || 0);
      } else {
        // Estimate based on totalPages
        this.totalItems = this.totalPages * this.pageSize;
      }
    }
    if (changes['pagingConfig'] && this.pagingConfig) {
      if (!this.pageSize && this.fullPagingConfig.pageSize) {
        this.pageSize = this.fullPagingConfig.pageSize;
      }
    }
  }

  onSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  onPageSizeChange(size: string | string[]) {
    const newSize = parseInt(Array.isArray(size) ? size[0] : size, 10);
    if (!isNaN(newSize) && newSize !== this.pageSize) {
      this.pageSize = newSize;
      this.currentPage = 1;
      this.emitQuery();
    }
  }

  onSort(header: TableHeader) {
    if (!this.fullQueryOptions.sort || header.sortable === false) return;

    if (this.sortBy === header.key) {
      if (this.sortDirection === 'asc') {
        this.sortDirection = 'desc';
      } else if (this.sortDirection === 'desc') {
        this.sortBy = '';
        this.sortDirection = undefined;
      } else {
        this.sortDirection = 'asc';
      }
    } else {
      this.sortBy = header.key;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
    this.emitQuery();
  }

  nextPage() {
    if (this.hasNextPage) {
      this.currentPage++;
      this.emitQuery();
    }
  }

  prevPage() {
    if (this.hasPreviousPage) {
      this.currentPage--;
      this.emitQuery();
    }
  }

  private emitQuery() {
    const req: PagedRequest = {
      pageNumber: this.currentPage,
      pageSize: this.pageSize,
    };
    if (this.searchValue) {
      req.searchValue = this.searchValue;
    }
    // Note: sorting fields would normally go here if PagedRequest supported them,
    // but the API contract only shows pageNumber, pageSize, searchValue.
    // If we need them, we would pass them in req.
    this.queryParamsChanged.emit(req);
  }

  get showingStart(): number {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingEnd(): number {
    if (this.totalItems === 0) return 0;
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }
}
