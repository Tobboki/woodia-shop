import { Component, OnInit, ViewChild, computed, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { ZardButtonComponent } from '@shared-components/button';
import { ZardSelectComponent } from '@shared-components/select/select.component';
import { ZardSelectItemComponent } from '@shared-components/select/select-item.component';
import { ZardInputDirective } from '@shared-components/input/input.directive';
import { DesignConfigurator } from '@shared-components/custom/design-configurator/design-configurator';
import { TranslocoDirective } from '@jsverse/transloco';
import { ImageDropzoneComponent } from '@admin-shared/components/image-dropzone/image-dropzone.component';

import { ICategory } from '@admin-types/category.types';
import { DESIGN_CATEGORIES, ProductCategory, ProductModelConfig, DEFAULT_MODEL_CONFIGS, Product } from '@shared-types/product';
import { TProductLine } from '@admin-types/design.types';

import { CategoryService } from '@admin-core/services/category.service';
import { DesignService } from '@admin-core/services/design.service';
import { LanguageService } from '@admin-core/services/language.service';
import { UploadService } from '@admin-core/services/upload.service';
import { TranslationService } from '@admin-core/services/translation.service';
import { LayoutService } from '@admin-core/services/layout.service';

import { toast } from 'ngx-sonner';

interface ImageSlot {
  place: string;
  url: string | null;
  uploading: boolean;
  required: boolean;
}

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
    DesignConfigurator,
    TranslocoDirective,
    ImageDropzoneComponent
  ],
  templateUrl: './design-studio.html',
  styleUrl: './design-studio.scss'
})
export class DesignStudio implements OnInit {
  constructor(
    private router: Router,
    private categoryService: CategoryService,
    private designService: DesignService,
    private uploadService: UploadService,
    private translationService: TranslationService,
    public layoutService: LayoutService,
    private fb: FormBuilder
  ) {}

  protected langService = inject(LanguageService);

  @ViewChild(DesignConfigurator) configuratorRef!: DesignConfigurator;

  // UI State
  step = signal<1 | 2>(1);
  loading = signal(false);
  translating = signal(false);

  // Step 1
  modelCategories = DESIGN_CATEGORIES;
  selectedModelType = signal<ProductCategory>('Bookcase');
  productLines: TProductLine[] = ['OriginalClassic', 'OriginalModern', 'Edge', 'Tone'];

  dummyProduct = computed(() => {
    const type = this.selectedModelType();
    return {
      id: 0,
      category: type,
      images: [],
      modelConfig: DEFAULT_MODEL_CONFIGS[type]
    } as Product;
  });

  // Reactive Form
  form!: FormGroup;

  // Data
  categories = signal<ICategory[]>([]);
  childCategories = computed(() => {
    const all = this.categories();
    
    // 1. Try to find all leaf categories (categories with a parent)
    const leafNodes = all.filter(c => c.parentId !== null);
    if (leafNodes.length > 0) return leafNodes;

    // 2. Fallback: If the main list only has parents, extract their children
    return all.flatMap(parent => parent.childCatogries || []);
  });

  savedModelConfig: ProductModelConfig | null = null;

  // Image Slots
  imageSlots = signal<ImageSlot[]>([
    { place: 'thumbnailImage', url: null, uploading: false, required: true },
    { place: 'hoverImage', url: null, uploading: false, required: true },
    { place: 'detail1', url: null, uploading: false, required: false },
    { place: 'detail2', url: null, uploading: false, required: false },
    { place: 'detail3', url: null, uploading: false, required: false },
    { place: 'detail4', url: null, uploading: false, required: false },
    { place: 'detail5', url: null, uploading: false, required: false },
    { place: 'detail6', url: null, uploading: false, required: false },
    { place: 'detail7', url: null, uploading: false, required: false },
    { place: 'detail8', url: null, uploading: false, required: false },
  ]);

  ngOnInit() {
    this.form = this.fb.group({
      productLine: ['', Validators.required],
      descriptionEn: [''],
      descriptionAr: [''],
      categoryId: ['', Validators.required],
    });

    // Auto-translate Arabic description when user stops typing
    this.form.get('descriptionAr')?.valueChanges.pipe(
      debounceTime(1500),
      distinctUntilChanged()
    ).subscribe(() => {
      this.translateDescription();
    });

    this.categoryService.getAllCategories().subscribe({
      next: (res) => {
        console.log('Loaded categories:', res.items);
        this.categories.set(res.items || []);
      },
      error: (err) => console.error('Failed to load categories', err)
    });
  }

  translateDescription() {
    const descAr = this.form.get('descriptionAr')?.value;
    if (!descAr) return;

    this.translating.set(true);
    this.translationService.translate(descAr).subscribe({
      next: (res: any) => {
        console.log('Translation response:', res);
        let translatedText = '';
        if (typeof res === 'string') {
          translatedText = res;
        } else if (res && typeof res === 'object') {
          const raw = res.translated || res.text || res.translatedText || res.result || '';
          // If multiple options are provided (comma separated), take the first one
          translatedText = raw.split(',')[0].trim();
        }
        
        if (translatedText) {
          this.form.patchValue({ descriptionEn: translatedText });
        }
        this.translating.set(false);
      },
      error: (err) => {
        console.error('Translation failed', err);
        toast.error('Translation failed');
        this.translating.set(false);
      }
    });
  }

  onImageDrop(file: File, index: number) {
    const slots = [...this.imageSlots()];
    slots[index].uploading = true;
    this.imageSlots.set(slots);

    this.uploadService.uploadFile(file).subscribe({
      next: (urls) => {
        const updatedSlots = [...this.imageSlots()];
        updatedSlots[index].url = urls[0];
        updatedSlots[index].uploading = false;
        this.imageSlots.set(updatedSlots);
      },
      error: (err) => {
        console.error('Upload failed', err);
        toast.error('Image upload failed');
        const updatedSlots = [...this.imageSlots()];
        updatedSlots[index].uploading = false;
        this.imageSlots.set(updatedSlots);
      }
    });
  }

  removeImage(index: number) {
    const slots = [...this.imageSlots()];
    slots[index].url = null;
    this.imageSlots.set(slots);
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
    const slots = this.imageSlots();
    const missingRequired = slots.some(s => s.required && !s.url);

    if (this.form.invalid || !this.savedModelConfig || missingRequired) {
      toast.error('All required inputs and images must be provided', { duration: 2000 });
      return;
    }

    this.loading.set(true);

    const value = this.form.value;

    const configToSave = { ...this.savedModelConfig.modelConfig, modelType: this.selectedModelType() };

    const dto = {
      productLine: value.productLine,
      descriptionEn: value.descriptionEn,
      descriptionAr: value.descriptionAr,
      categoryId: parseInt(value.categoryId),
      productImage: slots.filter(s => s.url).map(s => ({ imagePlace: s.place, url: s.url })),
      modelConfig: configToSave
    };

    this.designService.createDesign(dto as any).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/designs']);
        toast.success('Design created successfully');
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
        toast.error('Failed to create design');
      }
    });
  }
}
