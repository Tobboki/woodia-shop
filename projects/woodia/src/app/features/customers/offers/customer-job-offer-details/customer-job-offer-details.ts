import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerOfferService } from '@woodia-core/services/customer-offer.service';
import { JobService } from '@woodia-core/services/job.service';
import { IJob } from '@woodia-types/job.types';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { NgIcon } from '@ng-icons/core';
import { ZardButtonComponent } from '@shared-components/button';
import { ZardSkeletonComponent } from '@shared-components/skeleton';
import { ZardDialogService } from '@shared-components/dialog/dialog.service';
import { toast } from 'ngx-sonner';
import { TCustomerOfferStatus, ICustomerOffer } from '@woodia-types/offer.types';

@Component({
  selector: 'woodia-customer-job-offer-details',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    NgIcon,
    ZardButtonComponent,
    ZardSkeletonComponent,
  ],
  templateUrl: './customer-job-offer-details.html',
  styleUrl: './customer-job-offer-details.scss',
})
export class CustomerJobOfferDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private customerOfferService = inject(CustomerOfferService);
  private jobService = inject(JobService);
  private translocoService = inject(TranslocoService);
  private dialogService = inject(ZardDialogService);

  jobId = signal<number | null>(null);
  offerId = signal<number | null>(null);
  offer = signal<ICustomerOffer | null>(null);
  job = signal<IJob | null>(null);

  isLoading = signal(true);
  isError = signal(false);
  isAccepting = signal(false);
  isRejecting = signal(false);

  canAct = computed(() =>
    this.offer()?.status === 'Pending' && this.job()?.jobStatus === 'InProgress'
  );


  submittedDateTime = computed(() => {
    const o = this.offer();
    if (!o?.createdAt) return null;
    const d = new Date(o.createdAt);
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  });

  deliveryTarget = computed(() => {
    const o = this.offer();
    if (!o?.createdAt || !o?.deliveryDay) return null;
    const d = new Date(o.createdAt);
    d.setDate(d.getDate() + o.deliveryDay);
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  });

  getCarpenterInitials = computed(() => {
    const name = this.offer()?.carpenterName;
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  });

  goToMakerProfile() {
    const carpenterId = this.offer()?.carpenterId;
    if (!carpenterId) return;
    this.router.navigate(['/customers/makers/profile', carpenterId]);
  }

  ngOnInit(): void {
    const jobIdStr = this.route.snapshot.paramMap.get('id');
    const offerIdStr = this.route.snapshot.paramMap.get('offerId');
    const jobId = jobIdStr ? parseInt(jobIdStr, 10) : NaN;
    const offerId = offerIdStr ? parseInt(offerIdStr, 10) : NaN;

    if (isNaN(jobId) || isNaN(offerId)) {
      this.isError.set(true);
      this.isLoading.set(false);
      return;
    }

    this.jobId.set(jobId);
    this.offerId.set(offerId);
    this.loadData(jobId, offerId);
  }

  loadData(jobId: number, offerId: number): void {
    this.isLoading.set(true);
    this.isError.set(false);

    // Load offer + job in parallel
    let offerLoaded = false;
    let jobLoaded = false;
    const checkDone = () => {
      if (offerLoaded && jobLoaded) this.isLoading.set(false);
    };

    this.customerOfferService.getOfferDetails(jobId, offerId).subscribe({
      next: (offer) => {
        this.offer.set(offer);
        offerLoaded = true;
        checkDone();

        console.log('can Act', this.canAct())
        console.log('offer', this.offer())
        console.log('offer status', this.offer()?.status)
        console.log('job', this.job())
        console.log('job status', this.job()?.jobStatus)

        console.log('offer.carpenterId', offer.carpenterId);
      },
      error: () => {
        this.isError.set(true);
        this.isLoading.set(false);
        toast.error(this.translocoService.translate('features.customers.jobOfferDetails.errors.loadFailed'));
      }
    });

    this.jobService.getById(jobId).subscribe({
      next: (job) => {
        this.job.set(job);
        jobLoaded = true;
        checkDone();
      },
      error: () => {
        // Don't block UI if job fails
        jobLoaded = true;
        checkDone();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/customers/jobs', this.jobId(), 'offers']);
  }

  goToJob(): void {
    this.router.navigate(['/customers/jobs', this.jobId()]);
  }

  getStatusColor(status: TCustomerOfferStatus): string {
    switch (status) {
      case 'Pending': return '!bg-amber-50 !text-amber-600 dark:!bg-amber-950/30 dark:!text-amber-400 !border-amber-200 dark:!border-amber-800/40';
      case 'Accepted': return '!bg-emerald-50 !text-emerald-600 dark:!bg-emerald-950/30 dark:!text-emerald-400 !border-emerald-200 dark:!border-emerald-800/40';
      case 'Rejected': return '!bg-red-50 !text-red-600 dark:!bg-red-950/30 dark:!text-red-400 !border-red-200 dark:!border-red-800/40';
      default: return '!bg-gray-50 !text-gray-500 !border-gray-200';
    }
  }

  getStatusDotColor(status: TCustomerOfferStatus): string {
    switch (status) {
      case 'Pending': return 'bg-amber-400';
      case 'Accepted': return 'bg-emerald-500';
      case 'Rejected': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  }
}