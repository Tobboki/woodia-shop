import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerOfferService } from '@woodia-core/services/customer-offer.service';
import { JobService } from '@woodia-core/services/job.service';
import { IJob } from '@woodia-types/job.types';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { NgIcon } from '@ng-icons/core';
import { ZardButtonComponent } from '@shared-components/button';
import { ZardSkeletonComponent } from '@shared-components/skeleton';
import { ZardBadgeComponent } from '@shared-components/badge/badge.component';
import { toast } from 'ngx-sonner';
import { ICustomerOffer, TCustomerOfferStatus } from '@woodia-types/offer.types';
import { getTextDir } from '@woodia-shared/utils/helpers';

@Component({
  selector: 'woodia-customer-job-offers',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    NgIcon,
    ZardButtonComponent,
    ZardSkeletonComponent,
    ZardBadgeComponent,
  ],
  templateUrl: './customer-job-offers.html',
  styleUrl: './customer-job-offers.scss',
})
export class CustomerJobOffers implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private customerOfferService = inject(CustomerOfferService);
  private jobService = inject(JobService);
  private offerService = inject(CustomerOfferService);
  protected translocoService = inject(TranslocoService);

  protected readonly getTextDir = getTextDir;

  jobId = signal<number | null>(null);
  job = signal<IJob | null>(null);
  offers = signal<ICustomerOffer[]>([]);

  isLoadingJob = signal(true);
  isLoadingOffers = signal(true);
  isError = signal(false);
  hasNextPage = signal(false);
  isLoadingMore = signal(false);

  pageNumber = 1;
  pageSize = 10;

  ngOnInit(): void {
    const idStr = this.route.snapshot.paramMap.get('id');
    const id = idStr ? parseInt(idStr, 10) : NaN;

    if (isNaN(id)) {
      this.isError.set(true);
      this.isLoadingJob.set(false);
      this.isLoadingOffers.set(false);
      return;
    }

    this.jobId.set(id);
    this.loadJob(id);
    this.loadOffers(id);
  }

  private loadJob(id: number): void {
    this.jobService.getById(id).subscribe({
      next: (job) => {
        this.job.set(job);
        this.isLoadingJob.set(false);
      },
      error: () => this.isLoadingJob.set(false)
    });
  }

  loadOffers(id?: number): void {
    const jobId = id ?? this.jobId();
    if (!jobId) return;

    const isFirst = this.pageNumber === 1;
    if (isFirst) this.isLoadingOffers.set(true);
    else this.isLoadingMore.set(true);

    this.customerOfferService.getJobOffers(jobId, {
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
    }).subscribe({
      next: (data) => {
        const items = data.items ?? [];
        if (isFirst) this.offers.set(items);
        else this.offers.update(list => [...list, ...items]);

        this.hasNextPage.set(data.hasNextPage);
        this.isLoadingOffers.set(false);
        this.isLoadingMore.set(false);
        this.pageNumber++;
      },
      error: () => {
        this.isLoadingOffers.set(false);
        this.isLoadingMore.set(false);
        this.isError.set(true);
        toast.error(this.translocoService.translate('features.customers.jobOffers.errors.loadFailed'));
      }
    });
  }

  loadMore(): void {
    this.loadOffers();
  }

  navigateToOfferDetails(offer: ICustomerOffer): void {
    this.router.navigate(['/customers/jobs', this.jobId(), 'offers', offer.id]);
  }

  navigateToMakerProfile(offer: ICustomerOffer): void {
    this.router.navigate(['/customers/makers/profile', offer.carpenterId]);
  }

  startNegotiation(offer: ICustomerOffer): void {
    this.customerOfferService.negotiateOffer(offer.id).subscribe({
      next: (res) => {
        toast.success(this.translocoService.translate('features.customers.jobOffers.success.negotiationStarted'));
        this.router.navigate(['/customers/messages', res.id]);
      },
      error: () => {
        toast.error(this.translocoService.translate('features.customers.jobOffers.errors.negotiationFailed'));
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/customers/jobs', this.jobId()]);
  }

  goToJobs(): void {
    this.router.navigate(['/customers/jobs']);
  }

  getPostedTime(dateStr: string): string {
    if (!dateStr) return '';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  getStatusColor(status: TCustomerOfferStatus): string {
    switch (status) {
      case 'Pending': return '!bg-amber-50 !text-amber-600 dark:!bg-amber-950/30 dark:!text-amber-400 !border-amber-200 dark:!border-amber-800/40';
      case 'Accepted': return '!bg-emerald-50 !text-emerald-600 dark:!bg-emerald-950/30 dark:!text-emerald-400 !border-emerald-200 dark:!border-emerald-800/40';
      case 'Rejected': return '!bg-red-50 !text-red-600 dark:!bg-red-950/30 dark:!text-red-400 !border-red-200 dark:!border-red-800/40';
      default: return '!bg-gray-50 !text-gray-500 dark:!bg-gray-800/30 dark:!text-gray-400 !border-gray-200 dark:!border-gray-700/40';
    }
  }

  getAccentColor(status: TCustomerOfferStatus): string {
    switch (status) {
      case 'Pending': return 'bg-amber-400';
      case 'Accepted': return 'bg-emerald-500';
      case 'Rejected': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  }

  getCarpenterInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }
}