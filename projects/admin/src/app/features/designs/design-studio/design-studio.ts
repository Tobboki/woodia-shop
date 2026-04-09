import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators
} from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { CommonModule } from '@angular/common';

import { ZardButtonComponent } from '@shared-components/button';
import { ZardSelectComponent } from '@shared-components/select/select.component';
import { ZardSelectItemComponent } from '@shared-components/select/select-item.component';
import { ZardInputDirective } from '@shared-components/input/input.directive';
import { DesignConfigurator } from '@shared-components/custom/design-configurator/design-configurator';

import { ICategory } from '@admin-types/category.types';
import { DESIGN_CATEGORIES, ProductCategory, ProductModelConfig } from '@shared-types/product';

import { CategoryService } from '@admin-core/services/category.service';
import { DesignService } from '@admin-core/services/design.service';

import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-design-studio',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    NgIcon,
    ZardButtonComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardInputDirective,
    DesignConfigurator
  ],
  templateUrl: './design-studio.html',
  styleUrl: './design-studio.scss'
})
export class DesignStudio implements OnInit {
  constructor(
    private router: Router,
    private categoryService: CategoryService,
    private designService: DesignService,
    private fb: FormBuilder
  ) {}

  @ViewChild(DesignConfigurator) configuratorRef!: DesignConfigurator;

  // UI State
  step = signal<1 | 2>(1);
  loading = signal(false);

  // Step 1
  modelCategories = DESIGN_CATEGORIES;
  selectedModelType = signal<ProductCategory>('Bookcase');

  // Reactive Form
  form!: FormGroup;

  // Data
  categories = signal<ICategory[]>([]);
  savedModelConfig: ProductModelConfig | null = null;

  ngOnInit() {
    this.form = this.fb.group({
      productLine: ['', Validators.required],
      descriptionEn: [''],
      descriptionAr: [''],
      categoryId: ['', Validators.required],
      images: this.fb.array([])
    });

    this.categoryService.getAllCategories().subscribe({
      next: (res) => this.categories.set(res.items || []),
      error: (err) => console.error('Failed to load categories', err)
    });
  }

  // ===== Form Helpers =====
  get imagesArray(): FormArray {
    return this.form.get('images') as FormArray;
  }

  addImage() {
    this.imagesArray.push(
      this.fb.group({
        url: [''],
        imagePlace: ['']
      })
    );
  }

  removeImage(index: number) {
    this.imagesArray.removeAt(index);
  }

  // ===== Step Logic =====
  onModelTypeChange(val: string | string[]) {
    const v = Array.isArray(val) ? val[0] : val;
    this.selectedModelType.set(v as ProductCategory);
  }

  nextStep() {
    if (this.configuratorRef) {
      this.savedModelConfig = this.configuratorRef.getModelConfig();
    }
    this.step.set(2);
  }

  prevStep() {
    this.step.set(1);
  }

  // ===== Submit =====
  saveDesign() {
    if (this.form.invalid || !this.savedModelConfig) {
      toast.error('all input required', { duration: 2000 });
      return;
    }

    this.loading.set(true);

    const value = this.form.value;

    const dto = {
      productLine: value.productLine,
      descriptionEn: value.descriptionEn,
      descriptionAr: value.descriptionAr,
      categoryId: parseInt(value.categoryId),
      productImage: value.images.filter(
        (img: any) => img.url && img.imagePlace
      ),
      modelConfig: this.savedModelConfig.modelConfig
    };

    this.designService.createDesign(dto as any).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/designs']);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      }
    });
  }
}
