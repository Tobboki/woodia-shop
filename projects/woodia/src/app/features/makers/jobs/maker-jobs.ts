import { Component, effect, OnInit, signal, untracked } from '@angular/core';
import { skip } from 'rxjs';
import { IJob } from '@woodia-types/job.types';
import { MakerJobsService } from '@woodia-core/services/maker.jobs.service';
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
import { ZardSkeletonComponent } from '@shared-components/skeleton';
import { toast } from 'ngx-sonner';
import { FormsModule } from '@angular/forms';
import { MakerJobsListView } from '@woodia-features/makers/jobs/jobs-list.view/jobs-list.view';
import { MakerJobsGridView } from '@woodia-features/makers/jobs/jobs-grid.view/jobs-grid.view';

type TDisplayMode = 'list' | 'grid';
type TJobCategoryFilter = string;

@Component({
  selector: 'woodia-maker-jobs',
  imports: [
    ZardSegmentedComponent,
    TranslocoDirective,
    ZardButtonComponent,
    NgIcon,
    ZardCarouselComponent,
    ZardCarouselContentComponent,
    ZardCarouselItemComponent,
    MakerJobsListView,
    MakerJobsGridView,
    ZardSkeletonComponent,
    FormsModule
  ],
  templateUrl: './maker-jobs.html',
})
export class MakerJobs implements OnInit {
  constructor(
    private makerJobsService: MakerJobsService,
    private translocoService: TranslocoService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    // Sync URL params on display mode or category change
    effect(() => {
      const category = this.currentCategory();
      const mode = this.displayMode();

      untracked(() => {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            category: category === 'all' ? null : category,
            view: mode === 'list' ? null : mode
          },
          queryParamsHandling: 'merge',
          replaceUrl: true
        });
      });
    });

    // Reload jobs when category changes
    effect(() => {
      const category = this.currentCategory();
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

  displayMode = signal<TDisplayMode>('list');

  get displayModeOptions() {
    return [
      {
        label: this.translocoService.translate('features.makers.jobs.displayModeOptions.list'),
        icon: 'lucideList',
        value: 'list'
      },
      {
        label: this.translocoService.translate('features.makers.jobs.displayModeOptions.grid'),
        icon: 'lucideGrid',
        value: 'grid'
      },
    ];
  }

  // Category filter options — extend based on your actual API categories
  categoryOptions: TJobCategoryFilter[] = ['all', 'TV Stand', 'Bookcase', 'Desk', 'Beside Table', 'Shoe Rack'];

  onDisplayModeChange(value: TDisplayMode) {
    this.displayMode.set(value);
  }

  jobs = signal<IJob[]>([]);
  hasMoreJobs = signal<boolean>(true);
  isLoadingJobs = signal<boolean>(false);
  isLoadingMoreJobs = signal<boolean>(false);
  currentCategory = signal<TJobCategoryFilter>('all');

  // Pagination
  pageNumber = 1;
  pageSize = 10;

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      const category = params.get('category') as TJobCategoryFilter;
      const mode = params.get('view') as TDisplayMode;

      untracked(() => {
        if (category && this.categoryOptions.includes(category)) {
          if (this.currentCategory() !== category) {
            this.currentCategory.set(category);
          }
        } else if (!category && this.currentCategory() !== 'all') {
          this.currentCategory.set('all');
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

    this.translocoService.langChanges$.pipe(skip(1)).subscribe(() => {
      this.refreshJobs();
    });
  }

  private refreshJobs(): void {
    this.pageNumber = 1;
    this.jobs.set([]);
    this.hasMoreJobs.set(true);
    this.loadJobs();
  }

  loadJobs(): void {
    if (!this.hasMoreJobs()) return;
    if (this.isLoadingMoreJobs()) return;

    const isFirstLoad = this.pageNumber === 1;

    if (isFirstLoad) {
      this.isLoadingJobs.set(true);
    } else {
      this.isLoadingMoreJobs.set(true);
    }

    const requestedCategory = this.currentCategory();

    this.makerJobsService.getAvailableJobs({
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      searchValue: requestedCategory === 'all' ? undefined : requestedCategory,
    }).subscribe({
      next: (data: { items: string | any[]; }) => {
        if (requestedCategory !== this.currentCategory()) return;

        if (data && Array.isArray(data.items)) {
          const current = this.jobs();
          this.jobs.set([...current, ...data.items]);
          this.hasMoreJobs.set(data.items.length >= this.pageSize);
        } else {
          this.hasMoreJobs.set(false);
        }

        this.isLoadingJobs.set(false);
        this.isLoadingMoreJobs.set(false);
        this.pageNumber++;
      },
      error: () => {
        if (requestedCategory !== this.currentCategory()) return;

        this.isLoadingJobs.set(false);
        this.isLoadingMoreJobs.set(false);
        toast.error(
          this.translocoService.translate('features.makers.jobs.errors.loadFailed'),
          { duration: 3000, position: 'bottom-center' }
        );
      }
    });
  }

  loadMoreJobs(): void {
    this.loadJobs();
  }
}