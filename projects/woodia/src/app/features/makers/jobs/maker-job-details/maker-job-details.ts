import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MakerJobsService } from '@woodia-core/services/maker.jobs.service';
import { getTextDir } from '@woodia-shared/utils/helpers';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { NgIcon } from '@ng-icons/core';
import { ZardButtonComponent } from '@shared-components/button';
import { DesignConfigurator } from '@shared-components/custom/design-configurator/design-configurator';
import { ZardSkeletonComponent } from '@shared-components/skeleton';
import { ZardBadgeComponent } from '@shared-components/badge/badge.component';
import { toast } from 'ngx-sonner';
import { skip } from 'rxjs';

export interface IMakerJobDetail {
  id: number;
  title: string;
  description: string;
  deliveryDay: number;
  expectedBudget: number;
  categoryName: string;
  createdAt: string;
  modelConfig: any;
  jobClientBriefDto: {
    firstName: string;
    lastName: string;
    photoUrl: string;
    governorateName: string;
  };
}

@Component({
  selector: 'woodia-maker-job-details',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    NgIcon,
    ZardButtonComponent,
    DesignConfigurator,
    ZardSkeletonComponent,
    ZardBadgeComponent,
  ],
  templateUrl: './maker-job-details.html',
})
export class MakerJobDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private makerJobsService = inject(MakerJobsService);
  private translocoService = inject(TranslocoService);

  protected readonly getTextDir = getTextDir;

  job = signal<IMakerJobDetail | null>(null);
  isLoading = signal(true);
  isError = signal(false);
  modelError = signal(false);

  configuratorProduct = computed(() => {
    const j = this.job();
    if (!j?.modelConfig) return null;
    return {
      id: j.id,
      category: j.modelConfig.modelType,
      modelConfig: j.modelConfig,
      images: [],
    } as any;
  });

  clientInitials = computed(() => {
    const c = this.job()?.jobClientBriefDto;
    if (!c) return '';
    return `${c.firstName?.[0] ?? ''}${c.lastName?.[0] ?? ''}`.toUpperCase();
  });

  ngOnInit(): void {
    this.loadJob();
    this.translocoService.langChanges$.pipe(skip(1)).subscribe(() => this.loadJob());
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

    this.makerJobsService.getJobById(id).subscribe({
      next: (job: any) => {
        try {
          const config = typeof job.modelConfig === 'string' ? JSON.parse(job.modelConfig) : job.modelConfig;
          job.modelConfig = config;
          this.modelError.set(!config?.modelType);
        } catch {
          this.modelError.set(true);
        }
        this.job.set(job);
        this.isLoading.set(false);
      },
      error: () => {
        this.isError.set(true);
        this.isLoading.set(false);
        toast.error(this.translocoService.translate('features.makers.jobDetails.errors.loadFailed'));
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/makers/jobs']);
  }

  navigateToSubmitOffer(): void {
    const id = this.job()?.id;
    if (id) this.router.navigate(['/makers/jobs', id, 'submit-offer']);
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
    return new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  getFlatSpecifications(config: any): { label: string; value: string }[] {
    if (!config) return [];
    const skipKeys = ['rowConfigs', 'columnConfigs', 'modelType', 'color', 'topStorage', 'bottomStorage'];
    return Object.keys(config)
      .filter(k => !skipKeys.includes(k) && typeof config[k] !== 'object' && config[k] !== null)
      .map(k => ({ label: this.translateConfigKey(k), value: this.formatConfigValue(k, config[k]) }));
  }

  getNestedSpecifications(config: any): { section: string; specs: { label: string; value: string }[] }[] {
    if (!config) return [];
    const sections: { section: string; specs: { label: string; value: string }[] }[] = [];
    const nestedKeys = ['rowConfigs', 'columnConfigs', 'topStorage', 'bottomStorage'];

    nestedKeys.forEach(key => {
      if (!config[key]) return;
      const specs: { label: string; value: string }[] = [];
      const value = config[key];

      if (Array.isArray(value)) {
        value.forEach((item, i) => {
          Object.keys(item).forEach(subKey => {
            specs.push({ label: `${this.translateConfigKey(subKey)} (${i + 1})`, value: this.formatConfigValue(subKey, item[subKey]) });
          });
        });
      } else if (typeof value === 'object') {
        Object.keys(value).forEach(subKey => {
          specs.push({ label: this.translateConfigKey(subKey), value: this.formatConfigValue(subKey, value[subKey]) });
        });
      }

      if (specs.length > 0) sections.push({ section: this.translateConfigKey(key), specs });
    });

    return sections;
  }

  private translateConfigKey(key: string): string {
    const directKey = `sharedLib.designConfigurator.controls.${key}`;
    const translated = this.translocoService.translate(directKey);
    if (translated !== directKey) return translated;

    const mappings: Record<string, string> = {
      rowConfigs: 'sharedLib.designConfigurator.controls.mainTabs.rowsConfig',
      columnConfigs: 'sharedLib.designConfigurator.controls.mainTabs.colsConfig',
      widthCm: 'sharedLib.designConfigurator.controls.width',
      heightCm: 'sharedLib.designConfigurator.controls.height',
      depthCm: 'sharedLib.designConfigurator.controls.depth',
    };

    if (mappings[key]) {
      const t = this.translocoService.translate(mappings[key]);
      if (t !== mappings[key]) return t;
    }

    return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
  }

  private formatConfigValue(key: string, value: any): string {
    if (typeof value === 'boolean') {
      return value
        ? this.translocoService.translate('features.customers.jobs.details.labels.yes')
        : this.translocoService.translate('features.customers.jobs.details.labels.no');
    }
    if (typeof value === 'number' && /height|width|depth|cm/i.test(key)) {
      return `${value} ${this.translocoService.translate('sharedLib.designConfigurator.cm')}`;
    }
    return value?.toString() ?? '';
  }

  inferModelType(config: any): string {
    return config?.modelType ?? 'Desk';
  }
}