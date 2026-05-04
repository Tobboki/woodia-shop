import { Component, Input } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { IJob, TJobStatus } from '@woodia-types/job.types';
import { CommonModule, DatePipe } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import { NgIcon } from '@ng-icons/core';
import { ZardButtonComponent } from '@shared-components/button';
import { LanguageService } from '@woodia-core/services/language.service';
import { getTextDir } from '@woodia-shared/utils/helpers';
import { Router } from '@angular/router';
import { ZardTooltipDirective } from '@shared-components/tooltip';
import { ZardDialogService } from '@shared-components/dialog/dialog.service';
import { JobService } from '@woodia-core/services/job.service';
import { toast } from 'ngx-sonner';
import { TranslocoService } from '@jsverse/transloco';
import { FormsModule } from '@angular/forms';
import { ZardBadgeComponent } from '@shared-components/badge/badge.component';
import { JobStatusDialogComponent } from '../job-status-dialog.component';
import { ZardDividerComponent } from "shared-lib/components/divider/divider.component";

@Component({
  selector: 'woodia-jobs-list',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    NgIcon,
    ZardButtonComponent,
    FormsModule,
    ZardBadgeComponent,
    ZardTooltipDirective,
  ],
  templateUrl: './jobs-list.view.html',
  styleUrl: './jobs-list.view.scss',
})
export class JobsListView {
  constructor(
    public langService: LanguageService,
    private router: Router,
    private jobService: JobService,
    private dialogService: ZardDialogService,
    private translocoService: TranslocoService
  ) { }

  handleStatusChange(job: IJob) {
    const dialogRef = this.dialogService.create({
      zTitle: this.translocoService.translate('features.customers.jobs.confirmStatusChangeTitle'),
      zContent: JobStatusDialogComponent,
      zData: { status: job.status },
      zWidth: '400px',
      zHideFooter: true // We use the component's footer
    });

    dialogRef.afterClosed().subscribe((newStatus) => {
      if (newStatus && newStatus !== job.status) {
        this.updateStatus(job, newStatus);
      }
    });
  }

  private updateStatus(job: IJob, newStatus: TJobStatus) {
    let obs$;
    switch (newStatus) {
      case 'InProgress':
        obs$ = this.jobService.markAsInProgress(job.id);
        break;
      case 'Completed':
        obs$ = this.jobService.markAsComplete(job.id);
        break;
      case 'Canceled':
        obs$ = this.jobService.markAsCanceled(job.id);
        break;
      default:
        return;
    }

    obs$.subscribe({
      next: () => {
        job.status = newStatus;
        toast.success(this.translocoService.translate('features.customers.jobs.statusUpdatedSuccess'));
      },
      error: (err: HttpErrorResponse) => {
        console.error('Failed to update status', err);

        let errorMsg = 'features.customers.jobs.statusUpdateFailed';
        if (err.error?.errors?.[0] === 'Job.CannotCancel') {
          errorMsg = 'features.customers.jobs.errors.cannotCancel';
        } else if (err.error?.errors?.[0] === 'Job.CannotStart') {
          errorMsg = 'features.customers.jobs.errors.cannotStart';
        }

        toast.error(this.translocoService.translate(errorMsg));
      }
    });
  }

  navigateToDetails(jobId: number) {
    this.router.navigate(['/customers/jobs', jobId]);
  }

  navigateToModel(event: Event, productId: number) {
    event.stopPropagation();
    if (productId) {
      this.router.navigate(['/designs/model', productId]);
    }
  }

  protected readonly getTextDir = getTextDir;

  @Input() jobs: IJob[] = [];

  getStatusColor(status: TJobStatus) {
    switch (status) {
      case "Canceled":
        return '!bg-desructive !text-red-600 dark:!bg-red-950/30 dark:!text-red-400 border-red-100 dark:border-red-900/30';
      case "Completed":
        return '!bg-success !text-green-600 dark:!bg-green-950/30 dark:!text-green-400 border-green-100 dark:border-green-900/30';
      case "Pending":
        return '!bg-orange-50 !text-orange-600 dark:!bg-orange-950/30 dark:!text-orange-400 border-orange-100 dark:border-orange-900/30';
      case "InProgress":
        return '!bg-blue-50 !text-blue-600 dark:!bg-blue-950/30 dark:!text-blue-400 border-blue-100 dark:border-blue-900/30';
      default:
        return '!bg-gray-50 !text-gray-600 dark:!bg-gray-800/30 dark:!text-gray-400 border-gray-100 dark:border-gray-700/30';
    }
  }

  getAccentColor(status: TJobStatus) {
    switch (status) {
      case "Canceled":
        return 'bg-red-500';
      case "Completed":
        return 'bg-green-500';
      case "Pending":
        return 'bg-orange-500';
      case "InProgress":
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  }
}
