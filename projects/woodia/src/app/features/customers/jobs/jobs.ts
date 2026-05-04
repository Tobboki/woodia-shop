import { Component, effect, OnInit, OnDestroy, signal, untracked } from '@angular/core';
import { IJob, TJobStatus } from '@woodia-types/job.types';
import { JobService } from '@woodia-core/services/job.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ZardSegmentedComponent } from '@shared-components/segmented';
import { NgIcon } from '@ng-icons/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ZardButtonComponent } from '@shared-components/button';
import {
  ZardCarouselComponent,
  ZardCarouselContentComponent,
  ZardCarouselItemComponent
} from '@shared-components/carousel';
import { JobsListView } from '@woodia-features/customers/jobs/jobs-list.view/jobs-list.view';
import { JobsGridView } from '@woodia-features/customers/jobs/jobs-grid.view/jobs-grid.view';
import { ZardSkeletonComponent } from '@shared-components/skeleton';
import { toast } from 'ngx-sonner';
import { FormsModule } from '@angular/forms';

type TDisplayMode = 'list' | 'grid'
type TJobStatusFilter = TJobStatus | 'all';

@Component({
  selector: 'woodia-jobs',
  imports: [
    ZardSegmentedComponent,
    TranslocoDirective,
    ZardButtonComponent,
    NgIcon,
    ZardCarouselComponent,
    ZardCarouselContentComponent,
    ZardCarouselItemComponent,
    JobsListView,
    JobsGridView,
    ZardSkeletonComponent,
    FormsModule
  ],
  templateUrl: './jobs.html',
  styleUrl: './jobs.scss',
})
export class Jobs implements OnInit {
  constructor(
    private jobService: JobService,
    private translocoService: TranslocoService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    effect(() => {
      const status = this.currentStatus();
      const mode = this.displayMode();

      untracked(() => {
        // Sync URL
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            status: status === 'all' ? null : status,
            view: mode === 'list' ? null : mode
          },
          queryParamsHandling: 'merge',
          replaceUrl: true
        });

        // If status changed, reset pagination and reload
        // We can check if status specifically changed by storing it or just always reset when effect runs
        // Since mode also triggers this effect, we might want to distinguish.
        // Actually, if only mode changed, we don't necessarily need to reload jobs from API,
        // but the current implementation of loadJobs uses this.jobs signal which we reset.
        // Let's only reset/reload if status changed.
      });
    });

    effect(() => {
      const status = this.currentStatus();
      untracked(() => {
        this.pageNumber = 1;
        this.jobs.set([]);
        this.hasMoreJobs.set(true);
        this.loadJobs();
      });
    });
  }

  zardCarouselOptions = {
    loop: true,
    align: 'start' as const,
  };

  displayMode = signal<TDisplayMode>('list')

  get displayModeOptions() {
    return [
      {
        label: this.translocoService.translate('features.customers.jobs.displayModeOptions.list'),
        icon: 'lucideList',
        value: 'list'
      },
      {
        label: this.translocoService.translate('features.customers.jobs.displayModeOptions.grid'),
        icon: 'lucideGrid',
        value: 'grid'
      },
    ];
  }

  statusOptions: TJobStatusFilter[] = ['all', 'Pending', 'InProgress', 'Completed', 'Canceled']

  onDisplayModeChange(value: any) {
    this.displayMode.set(value);
  }

  jobs = signal<IJob[]>([])
  hasMoreJobs = signal<boolean>(true);
  isLoadingJobs = signal<boolean>(false);
  isLoadingMoreJobs = signal<boolean>(false);
  currentStatus = signal<TJobStatusFilter>('all');

  // Pagination
  pageNumber = 1;
  pageSize = 10;

  ngOnInit() {
    console.log('Jobs Component Initialized');
    this.route.queryParamMap.subscribe(params => {
      const status = params.get('status') as TJobStatusFilter;
      const mode = params.get('view') as TDisplayMode;

      untracked(() => {
        if (status && this.statusOptions.includes(status)) {
          if (this.currentStatus() !== status) {
            this.currentStatus.set(status);
          }
        } else if (!status && this.currentStatus() !== 'all') {
          this.currentStatus.set('all');
        }

        if (mode && (mode === 'list' || mode === 'grid')) {
          if (this.displayMode() !== mode) {
            this.displayMode.set(mode);
          }
        } else if (!mode && this.displayMode() !== 'list') {
          this.displayMode.set('list');
        }
      });
    });
  }
  loadJobs(): void {
    // If no more jobs, stop
    if (!this.hasMoreJobs()) return;

    // If already loading more (pagination), stop to prevent duplicate pages
    if (this.isLoadingMoreJobs()) return;

    // First load or load more
    const isFirstLoad = this.pageNumber === 1;

    if (isFirstLoad) {
      this.isLoadingJobs.set(true);
    } else {
      this.isLoadingMoreJobs.set(true);
    }

    const requestedStatus = this.currentStatus();

    this.jobService.getMyJobs({
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      searchValue: requestedStatus === 'all' ? '' : requestedStatus,
    }).subscribe({
      next: data => {
        // Discard results if the status has changed since we started this request
        if (requestedStatus !== this.currentStatus()) return;


        if (data && Array.isArray(data.items)) {
          const current = this.jobs();
          const normalizedItems = data.items.map((job: any) => {
            let rawStatus = (job.status || job.jobStatus || 'Pending').toString();
            let status: TJobStatus;

            // Normalize common variations to PascalCase
            const s = rawStatus.toLowerCase().replace(/[\s-]/g, '');
            if (s === 'open') status = 'Pending';
            else if (s === 'inprogress') status = 'InProgress';
            else if (s === 'completed') status = 'Completed';
            else if (s === 'canceled' || s === 'cancelled') status = 'Canceled';
            else if (s === 'pending') status = 'Pending';
            else status = rawStatus as TJobStatus;

            return {
              ...job,
              status: status
            };
          });
          this.jobs.set([...current, ...normalizedItems]);

          // Are there more jobs to load?
          this.hasMoreJobs.set(data.items.length >= this.pageSize);
        } else {
          console.warn('Jobs API returned unexpected data format:', data);
          this.hasMoreJobs.set(false);
        }

        // Clear loading flags
        this.isLoadingJobs.set(false);
        this.isLoadingMoreJobs.set(false);

        // Increment page for next "Load More"
        this.pageNumber++;
      },
      error: err => {
        if (requestedStatus !== this.currentStatus()) return;

        this.isLoadingJobs.set(false);
        this.isLoadingMoreJobs.set(false);
        toast.error(this.translocoService.translate('features.customers.jobs.errors.loadFailed'), { duration: 3000, position: "bottom-center" });
        console.error(err);
      }
    });
  }

  loadMoreJobs(): void {
    this.loadJobs();
  }
}
