import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MakerJobsService } from '@woodia-core/services/maker.jobs.service';
import { MakerOfferService, ISubmitOfferPayload } from '@woodia-core/services/maker.offer.service';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { NgIcon } from '@ng-icons/core';
import { ZardButtonComponent } from '@shared-components/button';
import { ZardSkeletonComponent } from '@shared-components/skeleton';
import { ZardInputDirective } from '@shared-components/input/input.directive';
import { ZardInputGroupComponent } from '@shared-components/input-group/input-group.component';
import { ZardFormModule } from '@shared-components/form/form.module';
import { LanguageService } from '@woodia-core/services/language.service';
import { FormsModule } from '@angular/forms';
import { toast } from 'ngx-sonner';
import { IMakerJobDetail } from '../../jobs/maker-job-details/maker-job-details';

@Component({
  selector: 'woodia-maker-submit-offer',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    NgIcon,
    ZardButtonComponent,
    ZardSkeletonComponent,
    ZardInputDirective,
    ZardInputGroupComponent,
    ZardFormModule,
    FormsModule,
  ],
  templateUrl: './maker-submit-offer.html',
})
export class MakerSubmitOffer implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private makerJobsService = inject(MakerJobsService);
  private makerOfferService = inject(MakerOfferService);
  private translocoService = inject(TranslocoService);
  protected langService = inject(LanguageService);

  job = signal<IMakerJobDetail | null>(null);
  isLoadingJob = signal(true);
  isError = signal(false);
  isSubmitting = signal(false);

  offerPrice = signal<number | null>(null);
  offerDays = signal<number | null>(null);
  offerMessage = signal<string>('');

  offerFormValid = computed(() =>
    !!this.offerPrice() && this.offerPrice()! > 0 &&
    !!this.offerDays() && this.offerDays()! > 0 &&
    this.offerMessage().trim().length >= 10
  );

  ngOnInit(): void {
    this.loadJob();
  }

  loadJob(): void {
    const idStr = this.route.snapshot.paramMap.get('id');
    const id = idStr ? parseInt(idStr, 10) : NaN;

    if (isNaN(id)) {
      this.isError.set(true);
      this.isLoadingJob.set(false);
      return;
    }

    this.isLoadingJob.set(true);
    this.isError.set(false);

    this.makerJobsService.getJobById(id).subscribe({
      next: (job: any) => {
        try {
          const config = typeof job.modelConfig === 'string' ? JSON.parse(job.modelConfig) : job.modelConfig;
          job.modelConfig = config;
        } catch { /* preview only, ignore parse errors */ }
        this.job.set(job);
        this.isLoadingJob.set(false);
      },
      error: () => {
        this.isError.set(true);
        this.isLoadingJob.set(false);
        toast.error(this.translocoService.translate('features.makers.submitOffer.errors.loadFailed'));
      }
    });
  }

  submitOffer(): void {
    const job = this.job();
    if (!job || !this.offerFormValid()) return;

    this.isSubmitting.set(true);

    const payload: ISubmitOfferPayload = {
      price: this.offerPrice()!,
      deliveryDay: this.offerDays()!,
      description: this.offerMessage(),
    };

    this.makerOfferService.submitOffer(job.id, payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        toast.success(this.translocoService.translate('features.makers.submitOffer.messages.success'));
        this.router.navigate(['/makers/jobs', job.id]);
      },
      error: () => {
        this.isSubmitting.set(false);
        toast.error(this.translocoService.translate('features.makers.submitOffer.errors.submitFailed'));
      }
    });
  }

  goToJobs(): void {
    this.router.navigate(['/makers/jobs']);
  }

  goToJobDetails(): void {
    const id = this.job()?.id ?? this.route.snapshot.paramMap.get('id');
    this.router.navigate(['/makers/jobs', id]);
  }
}