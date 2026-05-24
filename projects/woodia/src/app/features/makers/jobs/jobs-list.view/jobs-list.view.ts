import { Component, Input } from '@angular/core';
import { IJob } from '@woodia-types/job.types';
import { CommonModule, DatePipe } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import { NgIcon } from '@ng-icons/core';
import { ZardButtonComponent } from '@shared-components/button';
import { ZardBadgeComponent } from '@shared-components/badge/badge.component';
import { getTextDir } from '@woodia-shared/utils/helpers';
import { Router } from '@angular/router';

@Component({
  selector: 'woodia-maker-jobs-list',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    NgIcon,
    ZardButtonComponent,
    ZardBadgeComponent,
  ],
  providers: [DatePipe],
  templateUrl: './jobs-list.view.html',
})
export class MakerJobsListView {
  @Input() jobs: IJob[] = [];

  constructor(
    private router: Router,
    private datePipe: DatePipe,
  ) { }

  navigateToDetails(jobId: number) {
    this.router.navigate(['/makers/jobs', jobId]);
  }

  isNew(createdAt: string): boolean {
    if (!createdAt) return false;
    return Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000;
  }

  getPostedTime(createdAt: string): string {
    if (!createdAt) return '';
    const diffMs = Date.now() - new Date(createdAt).getTime();
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return this.datePipe.transform(createdAt, 'mediumDate') ?? '';
  }

  protected readonly getTextDir = getTextDir;
}