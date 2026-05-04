import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { ZardButtonComponent } from '@shared-components/button';
import { ZardTooltipImports } from '@shared-components/tooltip';
import { CrudServerDataTableComponent } from '@admin-shared/components/crud-server-data-table/crud-server-data-table.component';
import { DesignService } from '@admin-core/services/design.service';
import { TableHeader, PagedResponse, PagedRequest } from '@admin-types/data-table.types';
import { TranslocoDirective } from '@jsverse/transloco';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-designs',
  standalone: true,
  imports: [CommonModule, CrudServerDataTableComponent, TranslocoDirective, NgIcon, ZardButtonComponent, ZardTooltipImports],
  templateUrl: './designs.html',
  styleUrl: './designs.scss',
})
export class Designs {
  private designService = inject(DesignService);
  private router = inject(Router);

  headers: TableHeader[] = [
    { key: 'id', title: 'ID', sortable: true },
    { key: 'productLine', title: 'Design Line', sortable: true },
    { key: 'category', title: 'Category' },
    { key: 'productStatus', title: 'Status' },
    { key: 'imageThumbnail', title: 'Thumbnail', type: 'image' }
  ];

  items = signal<any[]>([]);
  pagedResponse = signal<PagedResponse<any> | null>(null);
  loading = signal(false);

  onQueryParamsChanged(req: PagedRequest) {
    this.loading.set(true);
    this.designService.getDesigns(req).subscribe({
      next: (res) => {
        this.items.set(res.items || []);
        this.pagedResponse.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load products', err);
        this.loading.set(false);
      }
    });
  }

  onDelete(id: string) {
    if (confirm('Are you sure you want to delete this design?')) {
      this.designService.deleteDesign(parseInt(id)).subscribe({
        next: () => {
          this.onQueryParamsChanged({
            pageNumber: this.pagedResponse()?.pageNumber || 1,
            pageSize: 10
          });
        }
      });
    }
  }

  onAddClicked() {
    this.router.navigate(['/designs/design-studio']);
  }

  onEditClicked(id: string) {
    this.router.navigate(['/designs/design-studio', id]);
  }

  onStatusChange(item: any) {
    const newStatus = item.productStatus === 'Published' ? 'Draft' : 'Published';
    this.designService.updateDesignStatus(item.id, newStatus).subscribe({
      next: () => {
        toast.success(`Design status updated to ${newStatus}`);
        this.onQueryParamsChanged({
          pageNumber: this.pagedResponse()?.pageNumber || 1,
          pageSize: 10
        });
      },
      error: (err) => {
        console.error('Failed to update status', err);
        toast.error('Failed to update status');
      }
    });
  }
}
