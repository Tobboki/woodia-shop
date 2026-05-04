import { Component, OnInit, ViewChild, computed, signal, inject } from '@angular/core';
// Forced recompile to pick up ICategory changes
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
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
import { ZardSkeletonComponent } from '@shared-components/skeleton';
import { ImageDropzoneComponent } from '@admin-shared/components/image-dropzone/image-dropzone.component';

import { ICategory } from '@admin-types/category.types';
import { DESIGN_CATEGORIES, ProductCategory, ProductModelConfig, DEFAULT_MODEL_CONFIGS, Product } from '@shared-types/product';
import { TProductLine, ICreateDesignDto, TImagePlace } from '@admin-types/design.types';

import { CategoryService } from '@admin-core/services/category.service';
import { DesignService } from '@admin-core/services/design.service';
import { LanguageService } from '@admin-core/services/language.service';
import { UploadService } from '@admin-core/services/upload.service';
import { TranslationService } from '@admin-core/services/translation.service';
import { LayoutService } from '@admin-core/services/layout.service';

import { toast } from 'ngx-sonner';

interface ImageSlot {
  id?: number; // Added for existing images
  place: TImagePlace;
  labelKey?: string;
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
    ZardSkeletonComponent,
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
    private fb: FormBuilder,
    private route: ActivatedRoute
  ) {}

  protected langService = inject(LanguageService);

  @ViewChild(DesignConfigurator) configuratorRef!: DesignConfigurator;

  // UI State
  step = signal<1 | 2>(1);
  loading = signal(false);
  dataLoading = signal(false);
  translating = signal(false);
  editId = signal<number | null>(null);
  isEditMode = computed(() => this.editId() !== null);
  updateModelConfig = signal(true); // Toggle to update model config
  productStatus = signal<string | null>(null);
  showRawConfig = signal(false);
  rawConfigText = signal('');

  // Step 1
  modelCategories = DESIGN_CATEGORIES;
  selectedModelType = signal<ProductCategory>('Bookcase');
  productLines: TProductLine[] = ['OriginalClassic', 'OriginalModern', 'Edge', 'Tone'];

  dummyProduct = computed(() => {
    const type = this.selectedModelType();
    const saved = this.savedModelConfig();

    return {
      id: this.editId() || 0,
      category: type,
      images: [],
      modelConfig: (saved && saved.category === type) ? saved.modelConfig : DEFAULT_MODEL_CONFIGS[type]
    } as Product;
  });

  // Reactive Form
  form!: FormGroup;

  // Data
  categories = signal<ICategory[]>([]);
  childCategories = computed(() => {
    return this.categories();
  });

  savedModelConfig = signal<ProductModelConfig | null>(null);

  // Image Slots
  imageSlots = signal<ImageSlot[]>([
    { place: 'Thumbnail', labelKey: 'thumbnailLabel', url: null, uploading: false, required: true },
    { place: 'Hover', labelKey: 'hoverLabel', url: null, uploading: false, required: true },
    { place: 'Gallery', labelKey: 'detailLarge', url: null, uploading: false, required: false },
    { place: 'Gallery', labelKey: 'detailSmall', url: null, uploading: false, required: false },
    { place: 'Gallery', labelKey: 'detailSmall', url: null, uploading: false, required: false },
    { place: 'Gallery', labelKey: 'detailSmall', url: null, uploading: false, required: false },
    { place: 'Gallery', labelKey: 'detailSmall', url: null, uploading: false, required: false },
    { place: 'Gallery', labelKey: 'detailSmall', url: null, uploading: false, required: false },
    { place: 'Gallery', labelKey: 'detailSmall', url: null, uploading: false, required: false },
    { place: 'Gallery', labelKey: 'detailSmall', url: null, uploading: false, required: false },
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

    this.categoryService.getChildrenCategories().subscribe({
      next: (res) => {
        this.categories.set(res || []);
      },
      error: (err) => console.error('Failed to load child categories', err)
    });

    // Check for Edit Mode
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.editId.set(parseInt(id));
      this.loadDesign(parseInt(id));
    }
  }

  private loadDesign(id: number) {
    this.dataLoading.set(true);
    this.designService.getDesign(id).subscribe({
      next: (res) => {
        console.log('Loaded Design Raw:', res);
        
        // Map productLine back to enum
        let line: string = '';
        if (res.productLineEn === 'Original Modern') line = 'OriginalModern';
        else if (res.productLineEn === 'Original Classic') line = 'OriginalClassic';
        else if (res.productLineEn === 'Edge') line = 'Edge';
        else if (res.productLineEn === 'Tone') line = 'Tone';
        else line = res.productLine || '';

        this.form.patchValue({
          productLine: line,
          descriptionEn: res.descriptionEn,
          descriptionAr: res.descriptionAr,
          categoryId: res.categoryProductResponses?.id?.toString() || res.categoryId?.toString()
        });

        // Detect Category robustly
        let category = res.category || res.modelConfig?.modelType;
        if (!category && res.categoryProductResponses) {
          const name = res.categoryProductResponses.nameEn;
          if (name === 'Bookcases' || name === 'Bookcase') category = 'Bookcase';
          else if (name === 'TV Stands' || name === 'TvStand' || name === 'TV Stand') category = 'TvStand';
          else if (name === 'Desks' || name === 'Desk') category = 'Desk';
          else if (name === 'Shoe Racks' || name === 'ShoeRack') category = 'ShoeRack';
          else if (name === 'Bedside Tables' || name === 'BedsideTable') category = 'BedsideTable';
        }

        this.selectedModelType.set(category as ProductCategory);
        this.savedModelConfig.set({ category, modelConfig: res.modelConfig } as any);
        this.rawConfigText.set(JSON.stringify(res.modelConfig, null, 2));
        this.productStatus.set(res.productStatus);

        // Map existing images to slots
        const slots = [...this.imageSlots()];
        
        // Reset slots urls
        slots.forEach(s => { s.url = null; s.id = undefined; });

        const images = res.productImageResponses || res.images || [];
        if (Array.isArray(images)) {
          // Helper to get image place either from field or from displayOrder
          const getPlace = (img: any) => {
            if (img.imagePlace) return img.imagePlace;
            if (img.displayOrder === 1) return 'Thumbnail';
            if (img.displayOrder === 2) return 'Hover';
            return 'Gallery';
          };

          const thumbnail = images.find((img: any) => getPlace(img) === 'Thumbnail');
          const hover = images.find((img: any) => getPlace(img) === 'Hover');
          const gallery = images.filter((img: any) => getPlace(img) === 'Gallery');

          if (thumbnail) {
            slots[0].url = thumbnail.url;
            slots[0].id = thumbnail.id;
          }
          if (hover) {
            slots[1].url = hover.url;
            slots[1].id = hover.id;
          }
          
          let galleryIdx = 2;
          gallery.forEach((img: any) => {
            if (galleryIdx < slots.length) {
              slots[galleryIdx].url = img.url;
              slots[galleryIdx].id = img.id;
              galleryIdx++;
            }
          });
        }
        
        this.imageSlots.set(slots);
        this.dataLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load design', err);
        toast.error('Failed to load design data');
        this.dataLoading.set(false);
      }
    });
  }

  translateDescription() {
    const descAr = this.form.get('descriptionAr')?.value;
    if (!descAr) return;

    this.translating.set(true);
    this.translationService.translate(descAr).subscribe({
      next: (res: any) => {
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
    if (!file) return;

    const slots = [...this.imageSlots()];
    slots[index].uploading = true;
    this.imageSlots.set(slots);

    this.uploadService.uploadFile(file).subscribe({
      next: (res: string[]) => {
        const updatedSlots = [...this.imageSlots()];
        updatedSlots[index].url = res[0]; // uploadFile returns string[]
        updatedSlots[index].uploading = false;
        this.imageSlots.set(updatedSlots);
      },
      error: (err: any) => {
        console.error('Upload failed', err);
        const updatedSlots = [...this.imageSlots()];
        updatedSlots[index].uploading = false;
        this.imageSlots.set(updatedSlots);
        toast.error('Image upload failed');
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
      const config = this.configuratorRef.getModelConfig();
      if (config) {
        this.savedModelConfig.set(config);
        this.rawConfigText.set(JSON.stringify(config.modelConfig, null, 2));
      }
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
      console.warn('Validation Failed:', {
        formInvalid: this.form.invalid,
        missingModelConfig: !this.savedModelConfig,
        missingRequiredImages: missingRequired
      });
      toast.error('All required inputs and images must be provided', { duration: 2000 });
      return;
    }

    this.loading.set(true);

    const value = this.form.value;
    const saved = this.savedModelConfig();
    
    let configToSave = null;
    if (this.updateModelConfig() && saved) {
      try {
        // Use raw JSON if it exists and is different/provided, otherwise use saved config
        const parsedRaw = this.rawConfigText() ? JSON.parse(this.rawConfigText()) : null;
        configToSave = parsedRaw || { ...saved.modelConfig, modelType: this.selectedModelType() };
        
        // Ensure modelType is present
        if (configToSave && !configToSave.modelType) {
          configToSave.modelType = this.selectedModelType();
        }
      } catch (e) {
        toast.error('Invalid JSON in manual configuration update');
        this.loading.set(false);
        return;
      }
    }

    const dto: any = {
      productLine: value.productLine,
      descriptionEn: value.descriptionEn,
      descriptionAr: value.descriptionAr,
      categoryId: parseInt(value.categoryId),
      productImage: slots
        .filter(s => s.url)
        .map(s => ({ 
          id: s.id, // Important for updates
          imagePlace: s.place, 
          url: s.url as string 
        })),
    };

    if (configToSave) {
      dto.modelConfig = configToSave;
    }

    console.log('Final DTO:', dto);

    const request = this.isEditMode()
      ? this.designService.updateDesign(this.editId()!, dto)
      : this.designService.createDesign(dto);

    request.subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/designs']);
        toast.success(this.isEditMode() ? 'Design updated successfully' : 'Design created successfully');
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
        toast.error(this.isEditMode() ? 'Failed to update design' : 'Failed to create design');
      }
    });
  }
}
