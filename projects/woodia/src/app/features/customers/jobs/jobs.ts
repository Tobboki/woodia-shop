import {Component, effect, OnInit, signal} from '@angular/core';
import {IJob, TJobStatus} from '@woodia-types/job.types';
import {JobService} from '@woodia-core/services/job.service';
import {ActivatedRoute} from '@angular/router';
import {ZardSegmentedComponent} from '@shared-components/segmented';
import {NgIcon} from '@ng-icons/core';
import {TranslocoDirective, TranslocoService} from '@jsverse/transloco';
import {ZardButtonComponent} from '@shared-components/button';
import {
  ZardCarouselComponent,
  ZardCarouselContentComponent,
  ZardCarouselItemComponent
} from '@shared-components/carousel';
import {JobsListView} from '@woodia-features/customers/jobs/jobs-list.view/jobs-list.view';
import {JobsGridView} from '@woodia-features/customers/jobs/jobs-grid.view/jobs-grid.view';
import {toast} from 'ngx-sonner';

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
    JobsGridView
  ],
  templateUrl: './jobs.html',
  styleUrl: './jobs.scss',
})
export class Jobs implements OnInit {
  constructor(
    private jobService: JobService,
    private translocoService: TranslocoService,
    private route: ActivatedRoute,
  ) {
    effect(() => {
      const status = this.currentStatus(); // subscribes to signal
      this.pageNumber = 1;
      this.jobs.set([]);
      this.hasMoreJobs.set(true);
      this.loadJobs();
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

  statusOptions: TJobStatusFilter[] = ['all', 'pending', 'inProgress', 'completed', 'canceled']

  onDisplayModeChange(value: any) {
    this.displayMode.set(value);
  }

  jobs = signal<IJob[]>([])
  hasMoreJobs = signal<boolean>(true);
  isLoadingJobs = signal<boolean>(false);
  isLoadingMoreJobs = signal<boolean>(true);
  currentStatus = signal<TJobStatusFilter>('all');

  // Pagination
  pageNumber = 1;
  pageSize = 10;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      // optionally set status from route param
      // this.currentStatus.set(params.get('status') ?? 'all');

      // Reset pagination and reload jobs
      this.pageNumber = 1;
      this.jobs.set([]);
      this.hasMoreJobs.set(true);

      this.loadJobs();
    });
  }

  loadJobs(): void {
    // If already loading or no more jobs, stop
    if (this.isLoadingJobs() || !this.hasMoreJobs()) return;

    // First load or load more
    const isFirstLoad = this.pageNumber === 1;

    if (isFirstLoad) {
      this.isLoadingJobs.set(true);
    } else {
      this.isLoadingMoreJobs.set(true);
    }

    this.jobService.getMyJobs({
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      searchValue: this.currentStatus(),
    }).subscribe({
      next: data => {
        const current = this.jobs();
        this.jobs.set([...current, ...data.items]);

        // Are there more jobs to load?
        this.hasMoreJobs.set(data.items.length >= this.pageSize);

        // Clear loading flags
        this.isLoadingJobs.set(false);
        this.isLoadingMoreJobs.set(false);

        // Increment page for next "Load More"
        this.pageNumber++;
      },
      error: err => {
        this.isLoadingJobs.set(false);
        this.isLoadingMoreJobs.set(false);
        toast.error(err.message, { duration: 3000, position: "bottom-center" });
        console.error(err);
      }
    });
  }

  loadMoreJobs(): void {
    this.loadJobs();
  }
}
