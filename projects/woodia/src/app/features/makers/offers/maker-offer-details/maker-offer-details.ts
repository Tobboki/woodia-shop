import { Component, OnInit, signal, inject, computed, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MakerOfferService } from '@woodia-core/services/maker.offer.service';
import { MakerJobsService } from '@woodia-core/services/maker.jobs.service';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { NgIcon } from '@ng-icons/core';
import { ZardButtonComponent } from '@shared-components/button';
import { ZardSkeletonComponent } from '@shared-components/skeleton';

import { toast } from 'ngx-sonner';
import { IOffer, TOfferStatus } from '@woodia-types/offer.types';
import { IMakerJobDetail } from '@woodia-types/job.types';
import { getTextDir, localizeDimensionTitle } from '@woodia-shared/utils/helpers';

@Component({
  selector: 'woodia-maker-offer-details',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    NgIcon,
    ZardButtonComponent,
    ZardSkeletonComponent,
  ],
  templateUrl: './maker-offer-details.html',
})
export class MakerOfferDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private makerOfferService = inject(MakerOfferService);
  private makerJobsService = inject(MakerJobsService);
  protected translocoService = inject(TranslocoService);

  protected readonly getTextDir = getTextDir;
  protected readonly localizeDimensionTitle = localizeDimensionTitle;

  @ViewChild('timelineContent', { static: true })
  timelineContent!: TemplateRef<any>;

  offer = signal<IOffer | null>(null);
  job = signal<IMakerJobDetail | null>(null);
  isLoading = signal(true);
  isError = signal(false);
  isWithdrawing = signal(false);

  canWithdraw = computed(() => this.offer()?.status === 'Pending');

  deliveryTarget = computed(() => {
    const o = this.offer();
    if (!o?.createdAt || !o?.deliveryDay) return null;
    const dateStr = o.createdAt.includes('T') ? o.createdAt : o.createdAt.replace(' ', 'T');
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    d.setDate(d.getDate() + o.deliveryDay);
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  });

  submittedDateTime = computed(() => {
    const o = this.offer();
    if (!o?.createdAt) return null;
    const dateStr = o.createdAt.includes('T') ? o.createdAt : o.createdAt.replace(' ', 'T');
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  });

  submittedDateShort = computed(() => {
    const o = this.offer();
    if (!o?.createdAt) return '';
    const dateStr = o.createdAt.includes('T') ? o.createdAt : o.createdAt.replace(' ', 'T');
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  });

  ngOnInit(): void {
    this.loadOffer();
  }

  loadOffer(): void {
    const idStr = this.route.snapshot.paramMap.get('id');
    const id = idStr ? parseInt(idStr, 10) : NaN;

    if (isNaN(id)) {
      this.isError.set(true);
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.isError.set(false);

    this.makerOfferService.getOfferDetails(id).subscribe({
      next: (offer) => {
        this.offer.set(offer);
        this.loadRelatedJob(offer);
      },
      error: () => {
        // Fallback: try loading via getMyOffers list (since the list works)
        this.makerOfferService.getMyOffers({ pageNumber: 1, pageSize: 100 }).subscribe({
          next: (res) => {
            const offer = res.items?.find(o => o.id === id);
            if (offer) {
              this.offer.set(offer);
              this.loadRelatedJob(offer);
            } else {
              this.isError.set(true);
              this.isLoading.set(false);
              toast.error(this.translocoService.translate('features.makers.offerDetails.errors.loadFailed'));
            }
          },
          error: () => {
            this.isError.set(true);
            this.isLoading.set(false);
            toast.error(this.translocoService.translate('features.makers.offerDetails.errors.loadFailed'));
          }
        });
      }
    });
  }

  private loadRelatedJob(offer: IOffer): void {
    if (offer.jobSummary) {
      const job = { ...offer.jobSummary };
      try {
        const config = typeof job.modelConfig === 'string'
          ? JSON.parse(job.modelConfig) : job.modelConfig;
        job.modelConfig = config;
      } catch { /* ignore */ }
      this.job.set(job as any);
      this.isLoading.set(false);
    } else if (offer.jobId) {
      this.makerJobsService.getJobById(offer.jobId).subscribe({
        next: (job: any) => {
          try {
            const config = typeof job.modelConfig === 'string'
              ? JSON.parse(job.modelConfig) : job.modelConfig;
            job.modelConfig = config;
          } catch { /* ignore */ }
          this.job.set(job);
          this.isLoading.set(false);
        },
        error: () => {
          // Job load failing shouldn't block showing the offer
          this.isLoading.set(false);
        }
      });
    } else {
      this.isLoading.set(false);
    }
  }

  withdrawOffer(): void {
    const offer = this.offer();
    if (!offer) return;

    this.isWithdrawing.set(true);
    this.makerOfferService.withdrawOffer(offer.id).subscribe({
      next: () => {
        this.isWithdrawing.set(false);
        this.offer.update(o => o ? { ...o, status: 'Withdrawn' as TOfferStatus } : o);
        toast.success(this.translocoService.translate('features.makers.offerDetails.messages.withdrawn'));
      },
      error: () => {
        this.isWithdrawing.set(false);
        toast.error(this.translocoService.translate('features.makers.offerDetails.errors.withdrawFailed'));
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/makers/offers']);
  }

  navigateToJob(): void {
    const offer = this.offer();
    const jobId = offer?.jobId || offer?.jobSummary?.id;
    if (jobId) this.router.navigate(['/makers/jobs', jobId]);
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

  getStatusDotColor(status: TOfferStatus): string {
    switch (status) {
      case 'Pending': return 'bg-amber-400';
      case 'Accepted': return 'bg-emerald-500';
      case 'Rejected': return 'bg-red-500';
      case 'Withdrawn': return 'bg-gray-400';
      default: return 'bg-blue-500';
    }
  }

  getFlatSpecs(config: any): { label: string; value: string }[] {
    if (!config) return [];
    const specs: { label: string; value: string }[] = [];

    // Combine widthCm, heightCm, and depthCm into a single Dimensions spec
    const dims: string[] = [];
    if (config.widthCm) dims.push(`${config.widthCm}`);
    if (config.heightCm) dims.push(`${config.heightCm}`);
    if (config.depthCm) dims.push(`${config.depthCm}`);
    if (dims.length > 0) {
      specs.push({
        label: 'Dimensions',
        value: dims.join(' × ') + ' cm'
      });
    }

    const map: Record<string, string> = {
      style: 'Style',
      density: 'Density',
      withBack: 'Back Panel',
      color: 'Color',
    };

    Object.keys(map)
      .filter(k => config[k] !== undefined && config[k] !== null)
      .forEach(k => {
        specs.push({
          label: map[k],
          value: this.formatSpec(k, config[k]),
        });
      });

    return specs;
  }

  private formatSpec(key: string, value: any): string {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number' && /height|width|depth/i.test(key)) return `${value} cm`;
    return value?.toString() ?? '';
  }
}