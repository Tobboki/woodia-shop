import { Component, inject, Input } from '@angular/core';
import { IJob } from '@woodia-types/job.types';
import { CommonModule, DatePipe } from '@angular/common';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { NgIcon } from '@ng-icons/core';
import { ZardButtonComponent } from '@shared-components/button';
import { ZardBadgeComponent } from '@shared-components/badge/badge.component';
import { getPostedTime, getTextDir, localizeDimensionTitle } from '@woodia-shared/utils/helpers';
import { Router } from '@angular/router';

@Component({
  selector: 'woodia-maker-jobs-grid',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    NgIcon,
    ZardButtonComponent,
    ZardBadgeComponent,
  ],
  providers: [DatePipe],
  templateUrl: './jobs-grid.view.html',
})
export class MakerJobsGridView {
  @Input() jobs: IJob[] = [];

  constructor(
    private router: Router,
    private datePipe: DatePipe,
  ) { }

  protected translocoService = inject(TranslocoService)
  protected localizeDimensionTitle = localizeDimensionTitle
  protected getPostedTime = getPostedTime;

  navigateToDetails(jobId: number) {
    this.router.navigate(['/makers/jobs', jobId]);
  }

  isNew(createdAt: string): boolean {
    if (!createdAt) return false;
    return Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000;
  }

  protected readonly getTextDir = getTextDir;
}