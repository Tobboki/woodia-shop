import { Component, OnInit, signal, inject, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { JobService } from '@woodia-core/services/job.service';
import { IJob, TJobStatus } from '@woodia-types/job.types';
import { getTextDir } from '@woodia-shared/utils/helpers';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { NgIcon } from '@ng-icons/core';
import { ZardButtonComponent } from '@shared-components/button';
import { DesignConfigurator } from '@shared-components/custom/design-configurator/design-configurator';
import { ZardSkeletonComponent } from '@shared-components/skeleton';
import { LanguageService } from '@woodia-core/services/language.service';
import { toast } from 'ngx-sonner';
import { FormsModule } from '@angular/forms';
import { ZardInputDirective } from '@shared-components/input/input.directive';
import { ZardFormModule } from '@shared-components/form/form.module';
import { ZardBadgeComponent } from "shared-lib/components/badge/badge.component";
import { ZardTooltipDirective } from '@shared-components/tooltip';
import { ZardDialogService } from '@shared-components/dialog/dialog.service';
import { JobStatusDialogComponent } from '../job-status-dialog.component';
import { HttpErrorResponse } from '@angular/common/http';


@Component({
  selector: 'woodia-job-details',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    NgIcon,
    ZardButtonComponent,
    DesignConfigurator,
    ZardSkeletonComponent,
    FormsModule,
    ZardInputDirective,
    ZardFormModule,
    ZardBadgeComponent,
    ZardTooltipDirective,
  ],
  templateUrl: './job-details.html',
  styleUrl: './job-details.scss',
})
export class JobDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private jobService = inject(JobService);
  protected langService = inject(LanguageService);
  private translocoService = inject(TranslocoService);
  private router = inject(Router);
  private dialogService = inject(ZardDialogService);
  protected readonly getTextDir = getTextDir;


  job = signal<IJob | null>(null);
  isLoading = signal(true);
  isError = signal(false);
  isSaving = signal(false);

  // Error states for sections
  modelError = signal<boolean>(false);
  detailsError = computed(() => {
    return !this.draftDescription() || !this.draftBudget();
  });

  // Draft states
  draftDescription = signal<string | null>(null);
  draftBudget = signal<number | null>(null);
  draftDelivery = signal<string | null>(null);
  draftModelConfig = signal<any>(null);

  @ViewChild(DesignConfigurator) configurator!: DesignConfigurator;

  isDirty = computed(() => {
    const currentJob = this.job();
    if (!currentJob) return false;

    const descChanged = this.draftDescription() !== currentJob.description;
    const budgetChanged = this.draftBudget() !== currentJob.expectedBudget;
    const deliveryChanged = Number(this.draftDelivery()) !== currentJob.deliveryDay;
    const modelChanged = JSON.stringify(this.draftModelConfig()) !== JSON.stringify(currentJob.modelConfig);

    return descChanged || budgetChanged || deliveryChanged || modelChanged;
  });

  // Prepare product for DesignConfigurator
  configuratorProduct = computed(() => {
    const j = this.job();
    if (!j || !j.modelConfig) return null;

    // Use draft config if available, otherwise original
    const config = this.draftModelConfig() || j.modelConfig;

    return {
      id: j.productId,
      category: this.inferModelType(config),
      modelConfig: config,
      images: j.images || []
    } as any;
  });

  protected inferModelType(config: any): any {
    if (!config) return 'Desk';
    return config.modelType || 'Desk';
  }

  ngOnInit(): void {
    this.loadJob();
  }

  loadJob(): void {
    const idStr = this.route.snapshot.paramMap.get('id');
    const id = idStr ? parseInt(idStr, 10) : NaN;

    if (isNaN(id)) {
      this.isError.set(true);
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.isError.set(false);

    this.jobService.getById(id).subscribe({
      next: (job: any) => {

        // Normalize status
        if (job) {
          let rawStatus = (job.status || job.jobStatus || 'Pending').toString();
          let status: TJobStatus;
          const s = rawStatus.toLowerCase().replace(/[\s-]/g, '');
          if (s === 'open') status = 'Pending';
          else if (s === 'inprogress') status = 'InProgress';
          else if (s === 'completed') status = 'Completed';
          else if (s === 'canceled' || s === 'cancelled') status = 'Canceled';
          else if (s === 'pending') status = 'Pending';
          else status = rawStatus as TJobStatus;
          job.status = status;
        }
        this.job.set(job);

        // Initialize draft states
        this.draftDescription.set(job.description);
        this.draftBudget.set(job.expectedBudget);
        this.draftDelivery.set(job.deliveryDay?.toString() || null);

        try {
          const config = typeof job.modelConfig === 'string' ? JSON.parse(job.modelConfig) : job.modelConfig;
          this.draftModelConfig.set(JSON.parse(JSON.stringify(config)));
          this.modelError.set(!config || !config.modelType);
        } catch (e) {
          console.error('Invalid modelConfig', e);
          this.modelError.set(true);
        }

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isError.set(true);
        this.isLoading.set(false);
        toast.error(this.translocoService.translate('features.customers.jobs.details.errors.loadFailed'));
      }
    });
  }

  onPause() {
    toast.info(this.translocoService.translate('features.customers.jobs.details.messages.pauseSuccess'));
  }

  navigateToModel() {
    const j = this.job();
    if (j?.productId) {
      this.router.navigate(['/designs/model', j.productId]);
    }
  }



  onCancel() {
    const currentJob = this.job();
    if (currentJob) {
      this.draftDescription.set(currentJob.description);
      this.draftBudget.set(currentJob.expectedBudget);
      this.draftDelivery.set(currentJob.deliveryDay?.toString() || null);
      this.draftModelConfig.set(JSON.parse(JSON.stringify(currentJob.modelConfig)));
    }
  }

  onSave() {
    const currentJob = this.job();
    if (!currentJob) return;

    this.isSaving.set(true);

    const payload: any = {
      description: this.draftDescription(),
      expectedBudget: this.draftBudget(),
      deliveryDay: Number(this.draftDelivery()) || 0,
      modelConfig: this.draftModelConfig(),
    };

    this.jobService.update(currentJob.id, payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        toast.success(this.translocoService.translate('features.customers.jobs.details.messages.saveSuccess') || 'Changes saved successfully');

        // Update local state
        const updatedJob = { ...currentJob, ...payload };
        this.job.set(updatedJob);
      },
      error: (err) => {
        this.isSaving.set(false);
        console.error('Failed to save job changes', err);
        toast.error(this.translocoService.translate('features.customers.jobs.details.errors.saveFailed') || 'Failed to save changes');
      }
    });
  }

  handleStatusChange(job: IJob) {
    const dialogRef = this.dialogService.create({
      zTitle: this.translocoService.translate('features.customers.jobs.confirmStatusChangeTitle'),
      zContent: JobStatusDialogComponent,
      zData: { status: job.status },
      zWidth: '400px',
      zHideFooter: true
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
        const updatedJob = { ...job, status: newStatus };
        this.job.set(updatedJob);
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

  onConfigChange() {
    if (this.configurator) {
      const result = this.configurator.getModelConfig() as any;
      if (result && result.modelConfig && result.modelConfig.modelType) {
        this.draftModelConfig.set(result.modelConfig);
        this.modelError.set(false);
      } else {
        this.modelError.set(true);
      }
    }
  }

  getFlatSpecifications(config: any): { label: string, value: any }[] {
    if (!config) return [];
    const specs: { label: string, value: any }[] = [];

    const skipKeys = ['rowConfigs', 'columnConfigs', 'modelType', 'color', 'style', 'density', 'withBack', 'topStorage', 'bottomStorage'];

    Object.keys(config).forEach(key => {
      if (!skipKeys.includes(key) && typeof config[key] !== 'object') {
        specs.push({
          label: this.translateConfigKey(key),
          value: this.formatConfigValue(key, config[key])
        });
      }
    });

    return specs;
  }

  getNestedSpecifications(config: any): { section: string, specs: { label: string, value: any }[] }[] {
    if (!config) return [];
    const sections: { section: string, specs: { label: string, value: any }[] }[] = [];

    const nestedKeys = ['rowConfigs', 'columnConfigs', 'topStorage', 'bottomStorage'];

    nestedKeys.forEach(key => {
      if (config[key]) {
        const specs: { label: string, value: any }[] = [];
        const value = config[key];

        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            Object.keys(item).forEach(subKey => {
              specs.push({
                label: `${this.translateConfigKey(subKey)} (${index + 1})`,
                value: this.formatConfigValue(subKey, item[subKey])
              });
            });
          });
        } else if (typeof value === 'object') {
          Object.keys(value).forEach(subKey => {
            specs.push({
              label: this.translateConfigKey(subKey),
              value: this.formatConfigValue(subKey, value[subKey])
            });
          });
        }

        if (specs.length > 0) {
          sections.push({
            section: this.translateConfigKey(key),
            specs
          });
        }
      }
    });

    return sections;
  }

  private translateConfigKey(key: string): string {
    // Try to find a direct match first
    const directKey = `sharedLib.designConfigurator.controls.${key}`;
    let translated = this.translocoService.translate(directKey);

    if (translated !== directKey) return translated;

    // Try mapping camelCase to more descriptive keys if needed
    const mappings: Record<string, string> = {
      'rowConfigs': 'sharedLib.designConfigurator.controls.mainTabs.rowsConfig',
      'columnConfigs': 'sharedLib.designConfigurator.controls.mainTabs.colsConfig',
      'widthCm': 'sharedLib.designConfigurator.controls.width',
      'heightCm': 'sharedLib.designConfigurator.controls.height',
      'depthCm': 'sharedLib.designConfigurator.controls.depth',
    };

    if (mappings[key]) {
      translated = this.translocoService.translate(mappings[key]);
      if (translated !== mappings[key]) return translated;
    }

    // Fallback: Humanize camelCase
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
  }

  private formatConfigValue(key: string, value: any): string {
    if (typeof value === 'boolean') {
      return value
        ? this.translocoService.translate('features.customers.jobs.details.labels.yes')
        : this.translocoService.translate('features.customers.jobs.details.labels.no');
    }

    if (typeof value === 'number') {
      // Add 'cm' if the key contains 'height', 'width', 'depth' or ends with 'cm'
      const isDimension = /height|width|depth|cm/i.test(key);
      if (isDimension) {
        return `${value} ${this.translocoService.translate('sharedLib.designConfigurator.cm')}`;
      }
    }

    return value?.toString() || '';
  }

}
