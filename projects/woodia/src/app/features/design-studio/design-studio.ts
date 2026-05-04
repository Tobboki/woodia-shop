import { Component, OnInit, signal, inject, computed, effect, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { CommonModule, NgOptimizedImage } from '@angular/common';

import { ProductService } from '@woodia-core/services/product.service';
import { JobService } from '@woodia-core/services/job.service';
import { CategoryService } from '@woodia-core/services/category.service';

import { DesignConfigurator } from '@shared-components/custom/design-configurator/design-configurator';
import type { Product, ProductModelConfig } from '@shared-types/product';

import { NgIcon } from '@ng-icons/core';
import { ZardButtonComponent } from '@shared-components/button';
import { ZardFormModule } from '@shared-components/form/form.module';

import { toast } from 'ngx-sonner';
import { ThemeService } from '@woodia-core/services/theme.service';
import { TranslocoDirective } from '@jsverse/transloco';
import { LanguageService } from '@woodia-core/services/language.service';
import { ZardSkeletonComponent } from '@shared-components/skeleton';
import { ZardDialogService } from '@shared-components/dialog/dialog.service';
import { LoginPromptDialog } from '@woodia-shared/components/login-prompt-dialog/login-prompt-dialog';
import { AuthService } from '@woodia-core/services/auth.service';

import { isImage } from '@woodia-shared/utils/helpers';
import { ZardCarouselImports } from '@shared-components/carousel';
import { ZardInputDirective } from '@shared-components/input/input.directive';

@Component({
  selector: 'woodia-design-studio',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    NgIcon,
    ZardFormModule,
    ZardButtonComponent,
    DesignConfigurator,
    TranslocoDirective,
    ZardSkeletonComponent,
    ZardCarouselImports,
    ZardInputDirective,
    NgOptimizedImage
  ],

  templateUrl: './design-studio.html',
  styleUrl: './design-studio.scss',
})
export class DesignStudio implements OnInit {
  isImage = isImage;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private jobService = inject(JobService);
  private fb = inject(FormBuilder);
  private themeManager = inject(ThemeService);
  protected langService = inject(LanguageService);
  private authService = inject(AuthService);
  private dialogService = inject(ZardDialogService);

  configuratorRef = viewChild(DesignConfigurator);
  configError = computed(() => this.configuratorRef()?.store?.configError() ?? false);

  constructor() {
    effect(() => {
      // Trigger when lang changes
      this.langService.lang();
      if (this.step() === 2 && this.savedModelConfig) {
        this.form.get('jobTitle')?.setValue(this.generateJobTitle());
      }
    });
  }

  // Product state
  product = signal<Product | null>(null);
  productLoading = signal(true);
  productError = signal(false);

  // UI state
  step = signal<1 | 2>(1);
  submitting = signal(false);

  // Reactive Form
  form!: FormGroup;

  savedModelConfig: ProductModelConfig | null = null;

  imageErrors = signal<boolean[]>([]);

  private get storageKey(): string {
    const idStr = this.route.snapshot.paramMap.get('id');
    return `woodia-configurator-save-${idStr ?? 'unknown'}`;
  }

  ngOnInit(): void {
    this.initForm();

    const idStr = this.route.snapshot.paramMap.get('id');
    const saved = sessionStorage.getItem(this.storageKey);
    if (saved) {
      try {
        this.savedModelConfig = JSON.parse(saved);
      } catch (e) {
        sessionStorage.removeItem(this.storageKey);
      }
    }

    const idStr2 = idStr;
    const id = idStr2 != null ? parseInt(idStr2, 10) : NaN;

    if (Number.isNaN(id)) {
      this.productLoading.set(false);
      this.productError.set(true);
      return;
    }

    this.productService.getById(id).subscribe({
      next: (product) => {
        console.log(product)

        if (this.savedModelConfig) {
          product.modelConfig = this.savedModelConfig.modelConfig;
        }

        this.product.set(product);
        this.imageErrors.set(new Array(product.images?.length ?? 0).fill(false));
        this.productLoading.set(false);
      },
      error: () => {
        this.productError.set(true);
        this.productLoading.set(false);
      },
    });
  }

  private initForm() {
    this.form = this.fb.group({
      jobTitle: [{ value: '', disabled: true }, Validators.required],
      jobDescription: [''],
      expectedBudget: [null, Validators.required],
      deliveryDay: [7, [Validators.required, Validators.min(1)]],
    });
  }

  get dimensionString(): string {
    const config = this.savedModelConfig?.modelConfig as any;
    if (!config) return '';
    const w = config.widthCm || 0;
    const h = config.heightCm || config.depthCm || 0;
    const d = config.depthCm || 0;
    const unit = this.langService.translate('sharedLib.designConfigurator.cm');

    const widthLbl = this.langService.translate('sharedLib.designConfigurator.controls.width');
    const heightLbl = this.langService.translate('sharedLib.designConfigurator.controls.height');
    const depthLbl = this.langService.translate('sharedLib.designConfigurator.controls.depth');

    return `${widthLbl}: ${w}${unit} x ${heightLbl}: ${h}${unit} x ${depthLbl}: ${d}${unit}`;
  }

  private generateJobTitle(): string {
    const categoryKey = this.savedModelConfig?.category || 'Design';
    const translatedCategory = this.langService.translate('features.designStudio.categories.' + categoryKey);
    const config = this.savedModelConfig?.modelConfig as any;
    const w = config?.widthCm || 0;
    const h = config?.heightCm || config?.depthCm || 0;
    const d = config?.depthCm || 0;
    const unit = this.langService.translate('sharedLib.designConfigurator.cm');

    return `${translatedCategory} - ${w}x${h}x${d} ${unit}`;
  }
  onImageError(index: number): void {
    const errors = [...this.imageErrors()];
    errors[index] = true;
    this.imageErrors.set(errors);
  }

  get images(): string[] {
    return this.product()?.images ?? [];
  }

  getImageSrc(src?: string): string {
    return isImage(src) ? src! : (this.themeManager.mode() === 'dark' ? '/images/placeholders/product-placeholder-dark.webp' : '/images/placeholders/product-placeholder.webp');
  }


  activeIndex = signal(0);

  activeImage = computed(() => this.images[this.activeIndex()]);

  setActive(index: number) {
    this.activeIndex.set(index);
  }

  scrollToConfigurator() {
    document.querySelector('woodia-design-configurator')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  nextStep(): void {
    if (!this.authService.isAuthenticated()) {
      this.dialogService.create({
        zTitle: this.langService.translate('app.dialogs.loginPrompt.title'),
        zContent: LoginPromptDialog,
        zWidth: '400px',
        zHideFooter: true
      });
      return;
    }

    const configurator = this.configuratorRef();
    if (configurator) {
      this.savedModelConfig = configurator.getModelConfig();
      sessionStorage.setItem(this.storageKey, JSON.stringify(this.savedModelConfig));

      const p = this.product();
      if (p && this.savedModelConfig) {
        this.product.set({
          ...p,
          modelConfig: this.savedModelConfig.modelConfig
        });
      }

      this.form.patchValue({
        jobTitle: this.generateJobTitle()
      });
    }
    this.step.set(2);
  }

  prevStep(): void {
    this.step.set(1);
  }

  submitJob(): void {
    const p = this.product();
    const catId = (p as any)?.category?.id;

    if (this.form.invalid || !this.savedModelConfig || !catId) {
      toast.error(this.langService.translate('features.designStudio.errors.fillRequiredFields'));
      return;
    }

    this.submitting.set(true);

    const value = this.form.value;

    const dto = {
      modelConfig: this.savedModelConfig.modelConfig,
      description: value.jobDescription,
      productId: p?.id ?? 0,
      deliveryDay: value.deliveryDay,
      title: this.form.getRawValue().jobTitle,
      expectedBudget: value.expectedBudget,
      categoryId: parseInt(catId, 10)
    };

    this.jobService.create(dto).subscribe({
      next: () => {
        this.submitting.set(false);
        sessionStorage.removeItem(this.storageKey);
        toast.success(this.langService.translate('features.designStudio.messages.jobCreated'), {
          duration: 3000,
          position: 'bottom-center',
        });
        this.router.navigate(['/designs/all']);
      },
      error: (err: any) => {
        console.error(err);
        toast.error(this.langService.translate('features.designStudio.errors.jobPostFailed'), {
          duration: 3000,
          position: 'bottom-center',
        });
        this.submitting.set(false);
      }
    });
  }


}
