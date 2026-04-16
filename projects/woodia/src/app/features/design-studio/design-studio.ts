import { Component, OnInit, signal, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { CommonModule } from '@angular/common';

import { ProductService } from '@woodia-core/services/product.service';
import { JobService } from '@woodia-core/services/job.service';
import { CategoryService } from '@woodia-core/services/category.service';

import { DesignConfigurator } from '@shared-components/custom/design-configurator/design-configurator';
import type { Product, ProductCategory, ProductModelConfig } from '@shared-types/product';

import { NgIcon } from '@ng-icons/core';
import { ZardButtonComponent } from '@shared-components/button';
import { ZardFormModule } from '@shared-components/form/form.module';

import { toast } from 'ngx-sonner';

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
  ],
  templateUrl: './design-studio.html',
  styleUrl: './design-studio.scss',
})
export class DesignStudio implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private jobService = inject(JobService);
  private categoryService = inject(CategoryService);
  private fb = inject(FormBuilder);

  @ViewChild(DesignConfigurator) configuratorRef!: DesignConfigurator;

  // Product state
  product = signal<Product | null>(null);
  modelType = signal<ProductCategory>('Desk');
  productLoading = signal(true);
  productError = signal(false);

  // UI state
  step = signal<1 | 2>(1);
  submitting = signal(false);

  // Reactive Form
  form!: FormGroup;

  savedModelConfig: ProductModelConfig | null = null;

  imageErrors = signal<boolean[]>([]);

  ngOnInit(): void {
    this.initForm();

    const idStr = this.route.snapshot.paramMap.get('id');
    const id = idStr != null ? parseInt(idStr, 10) : NaN;

    if (Number.isNaN(id)) {
      this.productLoading.set(false);
      this.productError.set(true);
      return;
    }

    this.productService.getById(id).subscribe({
      next: (product) => {
        this.product.set(product);
        this.modelType.set(this.inferModelType(product.modelConfig));
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
      jobTitle: ['', Validators.required],
      jobDescription: [''],
      expectedBudget: [null, Validators.required],
      deliveryDay: [7, Validators.required],
    });
  }

  private inferModelType(config: any): ProductCategory {
    if (!config) return 'Desk';
    if ('rowConfigs' in config) return 'Bookcase';
    if ('legroomPosition' in config) return 'Desk';
    if ('style' in config && 'columnConfigs' in config) return 'TvStand';
    if ('density' in config && 'columnConfigs' in config) return 'BedsideTable';
    if ('columnConfigs' in config) return 'ShoeRack';
    return 'Desk';
  }

  onImageError(index: number): void {
    const errors = [...this.imageErrors()];
    errors[index] = true;
    this.imageErrors.set(errors);
  }

  get images(): string[] {
    return this.product()?.images ?? [];
  }

  nextStep(): void {
    if (this.configuratorRef) {
      this.savedModelConfig = this.configuratorRef.getModelConfig();
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
      toast.error('Please fill all required fields');
      return;
    }

    this.submitting.set(true);

    const value = this.form.value;

    const dto = {
      modelConfig: this.savedModelConfig.modelConfig,
      description: value.jobDescription,
      productId: p?.id ?? 0,
      deliveryDay: value.deliveryDay,
      title: value.jobTitle,
      expectedBudget: value.expectedBudget,
      categoryId: parseInt(catId, 10)
    };

    this.jobService.create(dto).subscribe({
      next: () => {
        this.submitting.set(false);
        toast.success('Job successfully created', {
          duration: 3000,
          position: 'bottom-center',
        });
        this.router.navigate(['/customers/designs/all']);
      },
      error: (err: any) => {
        console.error(err);
        toast.error("Failed to post job. Please try again.", {
          duration: 3000,
          position: 'bottom-center',
        });
        this.submitting.set(false);
      }
    });
  }

  onDeliveryDayChange(val: string | string[]) {
    const v = Array.isArray(val) ? val[0] : val;
    this.form.get('deliveryDay')?.setValue(parseInt(v, 10) || 7);
  }
}
