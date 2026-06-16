import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { NgIcon } from '@ng-icons/core';
import { ZardButtonComponent } from '@shared-components/button';
import { ZardSkeletonComponent } from '@shared-components/skeleton';
import { ZardDialogService } from '@shared-components/dialog/dialog.service';
import { MakerPortfolioService, IPortfolioItem } from '@woodia-core/services/maker-portfolio.service';
import { AddPortfolioItemDialog } from './add-portofolio-item-dialog';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'woodia-maker-portfolio',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    NgIcon,
    ZardButtonComponent,
    ZardSkeletonComponent,
  ],
  templateUrl: './maker-portfolio.html',
  styleUrl: './maker-portfolio.scss',
})
export class MakerPortfolio implements OnInit {
  private portfolioService = inject(MakerPortfolioService);
  private dialogService = inject(ZardDialogService);
  private translocoService = inject(TranslocoService);
  private router = inject(Router);

  items = signal<IPortfolioItem[]>([]);
  isLoading = signal(true);
  isError = signal(false);
  deletingId = signal<number | null>(null);

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.isLoading.set(true);
    this.isError.set(false);

    this.portfolioService.getPortfolioItems().subscribe({
      next: (items) => {
        this.items.set(items ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isError.set(true);
        this.isLoading.set(false);
        toast.error(this.translocoService.translate('features.makers.portfolio.errors.loadFailed'));
      }
    });
  }

  openAddDialog(): void {
    const dialogRef = this.dialogService.create({
      zTitle: this.translocoService.translate('features.makers.portfolio.dialog.addTitle'),
      zContent: AddPortfolioItemDialog,
      zWidth: '520px',
      zHideFooter: true,
    });

    dialogRef.afterClosed().subscribe((newItem: IPortfolioItem | null) => {
      if (newItem) {
        this.items.update(list => [newItem, ...list]);
        toast.success(this.translocoService.translate('features.makers.portfolio.messages.added'));
      }
    });
  }

  deleteItem(item: IPortfolioItem, event: Event): void {
    event.stopPropagation();

    const confirmed = confirm(
      this.translocoService.translate('features.makers.portfolio.confirmDelete')
    );
    if (!confirmed) return;

    this.deletingId.set(item.id);

    this.portfolioService.deletePortfolioItem(item.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.items.update(list => list.filter(i => i.id !== item.id));
        toast.success(this.translocoService.translate('features.makers.portfolio.messages.deleted'));
      },
      error: () => {
        this.deletingId.set(null);
        toast.error(this.translocoService.translate('features.makers.portfolio.errors.deleteFailed'));
      }
    });
  }

  navigateToDetails(item: IPortfolioItem): void {
    this.router.navigate(['/makers/portfolio', item.id]);
  }
}