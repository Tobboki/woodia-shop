import { Component, effect, inject, OnInit, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MakerOfferService } from '@woodia-core/services/maker.offer.service';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { NgIcon } from '@ng-icons/core';
import { ZardButtonComponent } from '@shared-components/button';
import { ZardSkeletonComponent } from '@shared-components/skeleton';
import { ZardBadgeComponent } from '@shared-components/badge/badge.component';
import {
  ZardCarouselComponent,
  ZardCarouselContentComponent,
  ZardCarouselItemComponent
} from '@shared-components/carousel';
import { ZardDialogService } from '@shared-components/dialog/dialog.service';
import { toast } from 'ngx-sonner';
import { skip } from 'rxjs';
import { IOffer, TOfferStatus } from '@woodia-shared/types/offer.types';
import { getPostedDate, localizeDimensionTitle } from '@woodia-shared/utils/helpers';

type TOfferStatusFilter = TOfferStatus | 'all';

@Component({
  selector: 'woodia-maker-offers',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    NgIcon,
    ZardButtonComponent,
    ZardSkeletonComponent,
    ZardBadgeComponent,
    ZardCarouselComponent,
    ZardCarouselContentComponent,
    ZardCarouselItemComponent,
  ],
  templateUrl: './maker-offers.html',
})
export class MakerOffers implements OnInit {
  constructor(
    private makerOfferService: MakerOfferService,
    private router: Router,
    private route: ActivatedRoute,
    private dialogService: ZardDialogService,
  ) {
    effect(() => {
      const status = this.currentStatus();
      untracked(() => {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { status: status === 'all' ? null : status },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      });
    });

    effect(() => {
      const status = this.currentStatus();
      untracked(() => {
        this.pageNumber = 1;
        this.offers.set([]);
        this.hasMore.set(true);
        this.loadOffers();
      });
    });
  }

  zardCarouselOptions = { loop: true, align: 'start' as const };


  protected readonly localizeDimensionTitle = localizeDimensionTitle
  protected translocoService = inject(TranslocoService)
  protected getPostedDate = getPostedDate

  statusOptions: TOfferStatusFilter[] = ['all', 'Pending', 'Accepted', 'Rejected', 'Withdrawn'];
  currentStatus = signal<TOfferStatusFilter>('all');

  offers = signal<IOffer[]>([]);
  hasMore = signal(true);
  isLoading = signal(false);
  isLoadingMore = signal(false);
  withdrawingId = signal<number | null>(null);

  pageNumber = 1;
  pageSize = 10;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const status = params.get('status') as TOfferStatusFilter;
      untracked(() => {
        if (status && this.statusOptions.includes(status)) {
          if (this.currentStatus() !== status) this.currentStatus.set(status);
        } else if (!status && this.currentStatus() !== 'all') {
          this.currentStatus.set('all');
        }
      });
    });

    this.translocoService.langChanges$.pipe(skip(1)).subscribe(() => this.refresh());
  }

  private refresh(): void {
    this.pageNumber = 1;
    this.offers.set([]);
    this.hasMore.set(true);
    this.loadOffers();
  }

  loadOffers(): void {
    if (!this.hasMore()) return;
    if (this.isLoadingMore()) return;

    const isFirst = this.pageNumber === 1;
    if (isFirst) this.isLoading.set(true);
    else this.isLoadingMore.set(true);

    const requestedStatus = this.currentStatus();

    this.makerOfferService.getMyOffers({
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
    }).subscribe({
      next: data => {
        if (requestedStatus !== this.currentStatus()) return;

        let items = data.items ?? [];

        // Filter client-side by status if not 'all'
        if (requestedStatus !== 'all') {
          items = items.filter(o => o.status === requestedStatus);
        }

        this.offers.set([...this.offers(), ...items]);
        this.hasMore.set((data.items ?? []).length >= this.pageSize);
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
        this.pageNumber++;
      },
      error: () => {
        if (requestedStatus !== this.currentStatus()) return;
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
        toast.error(this.translocoService.translate('features.makers.offers.errors.loadFailed'));
      }
    });
  }

  loadMore(): void {
    this.loadOffers();
  }

  withdrawOffer(offer: IOffer): void {
    this.withdrawingId.set(offer.id);
    this.makerOfferService.withdrawOffer(offer.id).subscribe({
      next: () => {
        this.withdrawingId.set(null);
        // Update status in-place
        this.offers.update(list =>
          list.map(o => o.id === offer.id ? { ...o, status: 'Withdrawn' as TOfferStatus } : o)
        );
        toast.success(this.translocoService.translate('features.makers.offers.messages.withdrawn'));
      },
      error: () => {
        this.withdrawingId.set(null);
        toast.error(this.translocoService.translate('features.makers.offers.errors.withdrawFailed'));
      }
    });
  }

  navigateToDetails(offer: IOffer): void {
    if (offer.id) this.router.navigate(['/makers/offers', offer.id]);
  }

  canWithdraw(offer: IOffer): boolean {
    return offer.status === 'Pending';
  }

  getStatusColor(status: TOfferStatus): string {
    switch (status) {
      case 'Pending': return '!bg-amber-50 !text-amber-600 dark:!bg-amber-950/30 dark:!text-amber-400 !border-amber-200 dark:!border-amber-800/40';
      case 'Accepted': return '!bg-emerald-50 !text-emerald-600 dark:!bg-emerald-950/30 dark:!text-emerald-400 !border-emerald-200 dark:!border-emerald-800/40';
      case 'Rejected': return '!bg-red-50 !text-red-600 dark:!bg-red-950/30 dark:!text-red-400 !border-red-200 dark:!border-red-800/40';
      case 'Withdrawn': return '!bg-gray-50 !text-gray-500 dark:!bg-gray-800/30 dark:!text-gray-400 !border-gray-200 dark:!border-gray-700/40';
      default: return '!bg-blue-50 !text-blue-600 dark:!bg-blue-950/30 dark:!text-blue-400 !border-blue-200 dark:!border-blue-800/40';
    }
  }

  getAccentColor(status: TOfferStatus): string {
    switch (status) {
      case 'Pending': return 'bg-amber-400';
      case 'Accepted': return 'bg-emerald-500';
      case 'Rejected': return 'bg-red-500';
      case 'Withdrawn': return 'bg-gray-400';
      default: return 'bg-primary';
    }
  }
}