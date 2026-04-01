import { Component, OnInit, signal, ViewChild, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideArrowRight, lucideSave, lucidePlus, lucideTrash2, lucideLayers } from '@ng-icons/lucide';
import { ZardButtonComponent } from '@shared-components/button';
import { ZardSelectComponent } from '@shared-components/select/select.component';
import { ZardSelectItemComponent } from '@shared-components/select/select-item.component';
import { ZardInputDirective } from '@shared-components/input/input.directive';
import { DesignConfigurator } from '@shared-components/custom/design-configurator/design-configurator';
import { AdminDesignService, ICategory } from '../../../core/services/admin-design.service';
import { DESIGN_CATEGORIES, ProductCategory, ProductModelConfig } from '@shared-types/product';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-design-studio',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    NgIcon,
    ZardButtonComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardInputDirective,
    DesignConfigurator
  ],
  providers: [
    provideIcons({ lucideArrowLeft, lucideArrowRight, lucideSave, lucidePlus, lucideTrash2, lucideLayers })
  ],
  templateUrl: './design-studio.html',
  styleUrl: './design-studio.scss'
})
export class DesignStudio implements OnInit {
  private router = inject(Router);
  private designService = inject(AdminDesignService);

  @ViewChild(DesignConfigurator) configuratorRef!: DesignConfigurator;

  // Wizard state
  step = signal<1 | 2>(1);
  loading = signal(false);

  // Step 1
  modelCategories = DESIGN_CATEGORIES;
  selectedModelType = signal<ProductCategory>('Bookcase');

  // Step 2 Form
  productLine = signal('');
  descriptionEn = signal('');
  descriptionAr = signal('');
  categoryId = signal<string>('');
  images = signal<{ url: string; imagePlace: string }[]>([]);
  
  // Data
  categories = signal<ICategory[]>([]);
  savedModelConfig: ProductModelConfig | null = null;

  ngOnInit() {
    this.designService.getCategories().subscribe({
      next: (res) => {
        this.categories.set(res.items || []);
      },
      error: (err) => console.error('Failed to load categories', err)
    });
  }

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

  addImage() {
    this.images.update(imgs => [...imgs, { url: '', imagePlace: '' }]);
  }

  removeImage(index: number) {
    this.images.update(imgs => imgs.filter((_, i) => i !== index));
  }

  saveDesign() {
    if (!this.productLine() || !this.categoryId() || !this.savedModelConfig) {
      alert('Please fill all required fields');
      return;
    }

    this.loading.set(true);

    const dto = {
      productLine: this.productLine(),
      descriptionEn: this.descriptionEn(),
      descriptionAr: this.descriptionAr(),
      categoryId: parseInt(this.categoryId()),
      productImage: this.images().filter(img => img.url && img.imagePlace),
      modelConfig: this.savedModelConfig.modelConfig
    };

    this.designService.createDesign(dto as any).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/designs']);
      },
      error: (err) => {
        console.error(err);
        alert('Failed to save design');
        this.loading.set(false);
      }
    });
  }
}
