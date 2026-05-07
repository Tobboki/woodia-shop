import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

import { AiDesignService } from '@woodia-core/services/ai-design.service';
import { ZardButtonComponent } from '@shared-components/button/button.component';
import { ZardDialogRef } from '@shared-components/dialog/dialog-ref';
import { ProductService } from '@woodia-core/services/product.service';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'woodia-ai-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon, ZardButtonComponent, TranslocoDirective],
  template: `
    <div *transloco="let t; read: 'features.aiWizard'" class="relative overflow-hidden bg-background dark:bg-zinc-950 rounded-xl min-h-[400px] md:min-h-[500px] flex flex-col items-center justify-center p-4 md:p-8 transition-all duration-500 shadow-2xl border border-border/50">
      <!-- Background Effects -->
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-primary/15 rounded-full blur-[100px] pointer-events-none animate-pulse duration-[10s]"></div>
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/15 rounded-full blur-[100px] pointer-events-none animate-pulse duration-[8s] delay-1000"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,hsl(var(--background))_100%)] pointer-events-none opacity-50"></div>

      <div class="z-10 w-full max-w-2xl mx-auto flex flex-col h-full justify-center">

        <!-- Step 1: Product Selection -->
        @if (step() === 1) {
          <div class="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500 w-full">
            <div class="text-center space-y-2">
              <h3 class="text-xl md:text-3xl font-bold">{{ t('step1.title') }}</h3>
              <p class="text-foreground/60">{{ t('step1.subtitle') }}</p>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              @for (p of products; track p.id) {
                <div class="group relative cursor-pointer rounded-2xl border-2 transition-all duration-300 hover:scale-105 overflow-hidden"
                     [class.border-primary]="selectedProduct() === p.id"
                     [class.border-border]="selectedProduct() !== p.id"
                     (click)="selectProduct(p.id)">
                  <div class="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div class="p-3 md:p-6 flex flex-col items-center justify-center gap-2 md:gap-4 text-center h-full">
                    <div class="p-3 md:p-4 rounded-full bg-foreground/5 text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex items-center justify-center">
                      <ng-icon [name]="p.icon" size="1em" class="text-[24px] md:text-[32px]"></ng-icon>
                    </div>
                    <span class="font-semibold text-sm md:text-base">{{ t('products.' + p.id) }}</span>
                  </div>
                </div>
              }
            </div>

            <div class="flex justify-center pt-4 md:pt-8">
              <button z-button zSize="lg" class="rounded-full px-12" [zDisabled]="!selectedProduct()" (click)="nextStep()">
                {{ t('step1.continue') }}
              </button>
            </div>
          </div>
        }

        <!-- Step 2: Questionnaire -->
        @if (step() === 2) {
          <div class="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 w-full max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div class="text-center space-y-2 pb-4 pt-4 bg-background/98 backdrop-blur-md z-20 rounded-lg  mb-6 px-6">
              <h3 class="text-xl md:text-2xl font-bold">{{ t('step2.title') }}</h3>
              @if (selectedProduct(); as productId) {
                <p class="text-foreground/60 text-sm md:text-base">
                  {{ t('step2.subtitle', { product: t('products.' + productId) }) }}
                </p>
              }
            </div>

            <div class="space-y-6 px-6 pb-6">
              <!-- Common Questions -->
              <div class="space-y-2">
                <label class="font-medium">{{ t('step2.freeSpace') }}</label>
                <input type="number" [(ngModel)]="answers.free_space_cm" class="w-full p-3 rounded-xl border border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" [placeholder]="t('step2.freeSpacePlaceholder')">
              </div>

              <div class="space-y-2">
                <label class="font-medium">{{ t('step2.roomType') }}</label>
                <div class="flex flex-wrap gap-2 justify-center">
                  @for (rm of aiService.ROOM_TYPES; track rm) {
                    <button (click)="answers.room_type = rm"
                      class="px-4 py-2 rounded-full border transition-colors text-sm font-medium capitalize"
                      [class.bg-primary]="answers.room_type === rm" [class.text-primary-foreground]="answers.room_type === rm"
                      [class.border-primary]="answers.room_type === rm" [class.border-border]="answers.room_type !== rm">
                      {{ t('options.' + rm) }}
                    </button>
                  }
                </div>
              </div>

              <div class="space-y-2">
                <label class="font-medium">{{ t('step2.roomStyle') }}</label>
                <div class="flex flex-wrap gap-2 justify-center">
                  @for (s of aiService.ROOM_STYLES; track s) {
                    <button (click)="answers.room_style = s"
                      class="px-4 py-2 rounded-full border transition-colors text-sm font-medium capitalize"
                      [class.bg-primary]="answers.room_style === s" [class.text-primary-foreground]="answers.room_style === s"
                      [class.border-primary]="answers.room_style === s" [class.border-border]="answers.room_style !== s">
                      {{ t('options.' + s) }}
                    </button>
                  }
                </div>
              </div>

              <div class="space-y-2">
                <label class="font-medium">{{ t('step2.wallColor') }}</label>
                <div class="flex flex-wrap gap-2 justify-center">
                  @for (c of aiService.WALL_COLORS; track c) {
                    <button (click)="answers.wall_color = c"
                      class="px-4 py-2 rounded-full border transition-colors text-sm font-medium capitalize"
                      [class.bg-primary]="answers.wall_color === c" [class.text-primary-foreground]="answers.wall_color === c"
                      [class.border-primary]="answers.wall_color === c" [class.border-border]="answers.wall_color !== c">
                      {{ t('options.' + c) }}
                    </button>
                  }
                </div>
              </div>

              <div class="space-y-2 pb-2 border-t border-border pt-4">
                <label class="font-medium flex items-center gap-2"><ng-icon name="lucidePackage" class="text-primary"></ng-icon> {{ t('common.storage') }}</label>
                <label class="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-foreground/5 transition-colors">
                  <input type="checkbox" [(ngModel)]="answers.needs_storage" class="w-5 h-5 rounded text-primary focus:ring-primary border-border">
                  <span class="font-medium text-sm md:text-base">{{ t('step2.needsStorage') }}</span>
                </label>
              </div>

              <!-- Product Specific Questions -->
              @if (selectedProduct() === 'Bookcase') {
                <div class="space-y-2 pb-2 border-t border-border pt-4 mt-2">
                  <label class="font-medium text-primary flex items-center gap-2"><ng-icon name="lucideSettings2"></ng-icon> {{ t('step2.bookcaseSpecifics') }}</label>
                  <p class="text-xs text-foreground/60">{{ t('step2.fillAllFields') }}</p>
                </div>
              }

              @if (selectedProduct() === 'Desk') {
                 <div class="space-y-2 pb-2 border-t border-border pt-4 mt-2">
                  <label class="font-medium text-primary flex items-center gap-2"><ng-icon name="lucideSettings2"></ng-icon> {{ t('step2.deskSpecifics') }}</label>
                  <label class="block font-medium mt-3 mb-2">{{ t('step2.primaryUsageDesk') }}</label>
                  <div class="flex flex-wrap gap-2 justify-center">
                    @for (u of aiService.DESK_USAGES; track u) {
                      <button (click)="answers.primary_usage = u"
                        class="px-4 py-2 rounded-full border transition-colors text-sm font-medium capitalize"
                        [class.bg-primary]="answers.primary_usage === u" [class.text-primary-foreground]="answers.primary_usage === u"
                        [class.border-primary]="answers.primary_usage === u" [class.border-border]="answers.primary_usage !== u">
                        {{ t('options.' + u) }}
                      </button>
                    }
                  </div>
                 </div>
              }

              @if (selectedProduct() === 'TvStand') {
                <div class="space-y-2 pb-2 border-t border-border pt-4 mt-2">
                  <label class="font-medium text-primary flex items-center gap-2"><ng-icon name="lucideSettings2"></ng-icon> {{ t('step2.tvStandSpecifics') }}</label>
                  <label class="block font-medium mt-3 mb-2">{{ t('step2.tvSize') }}</label>
                  <div class="flex flex-wrap gap-2 justify-center">
                    @for (s of aiService.TV_SIZES; track s) {
                      <button (click)="answers.tv_size_inches = s"
                        class="px-4 py-2 rounded-full border transition-colors text-sm font-medium"
                        [class.bg-primary]="answers.tv_size_inches === s" [class.text-primary-foreground]="answers.tv_size_inches === s"
                        [class.border-primary]="answers.tv_size_inches === s" [class.border-border]="answers.tv_size_inches !== s">
                        {{ s }}"
                      </button>
                    }
                  </div>
                </div>
              }

              @if (selectedProduct() === 'ShoeRack') {
                <div class="space-y-2 pb-2 border-t border-border pt-4 mt-2">
                  <label class="font-medium text-primary flex items-center gap-2"><ng-icon name="lucideSettings2"></ng-icon> {{ t('step2.shoeRackSpecifics') }}</label>
                  <label class="block font-medium mt-3 mb-2">{{ t('step2.shoeCount') }}</label>
                  <div class="flex flex-wrap gap-2 mb-4">
                    @for (c of aiService.SHOE_COUNTS; track c) {
                      <button (click)="answers.shoe_count_pairs = c"
                        class="px-4 py-2 rounded-full border transition-colors text-sm font-medium"
                        [class.bg-primary]="answers.shoe_count_pairs === c" [class.text-primary-foreground]="answers.shoe_count_pairs === c"
                        [class.border-primary]="answers.shoe_count_pairs === c" [class.border-border]="answers.shoe_count_pairs !== c">
                        {{ c }}
                      </button>
                    }
                  </div>
                  <label class="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-foreground/5 transition-colors">
                    <input type="checkbox" [(ngModel)]="answers.mixed_footwear_heights" class="w-5 h-5 rounded text-primary focus:ring-primary border-border">
                    <span class="font-medium">{{ t('step2.mixedHeights') }}</span>
                  </label>
                </div>
              }

              @if (selectedProduct() === 'BedsideTable') {
                <div class="space-y-2 pb-2 border-t border-border pt-4 mt-2">
                  <label class="font-medium text-primary flex items-center gap-2"><ng-icon name="lucideSettings2"></ng-icon> {{ t('step2.bedsideSpecifics') }}</label>
                  <label class="block font-medium mt-3 mb-2">{{ t('step2.primaryUsage') }}</label>
                  <div class="flex flex-wrap gap-2">
                    @for (u of aiService.BEDSIDE_USAGES; track u) {
                      <button (click)="answers.primary_usage = u"
                        class="px-4 py-2 rounded-full border transition-colors text-sm font-medium capitalize"
                        [class.bg-primary]="answers.primary_usage === u" [class.text-primary-foreground]="answers.primary_usage === u"
                        [class.border-primary]="answers.primary_usage === u" [class.border-border]="answers.primary_usage !== u">
                        {{ t('options.' + u) }}
                      </button>
                    }
                  </div>
                </div>
              }

            </div>
          </div>
          
          <div class="flex flex-col sm:flex-row justify-between items-center w-full pt-6 border-t border-border mt-6 gap-4">
            <button class="order-2 sm:order-1 flex items-center justify-center gap-2 text-foreground/70 hover:text-foreground transition-colors font-medium px-4 py-2 w-full sm:w-auto" (click)="prevStep()">
              <ng-icon name="lucideArrowLeft" class="rtl:-scale-x-100"></ng-icon>
              {{ t('back') }}
            </button>
            <button z-button zSize="lg" class="order-1 sm:order-2 rounded-full px-8 shadow-lg shadow-primary/20 w-full sm:w-auto" 
                    [zDisabled]="!isFormValid()" 
                    (click)="generateDesign()">
              <span class="flex items-center justify-center gap-2">
                <ng-icon name="lucideWand2"></ng-icon> {{ t('step2.generateDesign') }}
              </span>
            </button>
          </div>
        }

        <!-- Loading State -->
        @if (loading()) {
          <div class="flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500 py-12">
            <div class="relative w-32 h-32">
              <div class="absolute inset-0 rounded-full border-4 border-primary/20"></div>
              <div class="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              <div class="absolute inset-0 flex items-center justify-center text-primary">
                <ng-icon name="lucideCpu" size="40" class="animate-pulse"></ng-icon>
              </div>
            </div>
            <div class="text-center space-y-2">
              <h3 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">{{ t('loading.thinking') }}</h3>
              <p class="text-foreground/60 animate-pulse">{{ t('loading.analyzing') }}</p>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: hsl(var(--border));
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: hsl(var(--primary) / 0.5);
    }
  `]
})
export class AiWizardComponent {
  aiService = inject(AiDesignService);
  dialogRef = inject(ZardDialogRef, { optional: true });
  router = inject(Router);
  productService = inject(ProductService);
  translocoService = inject(TranslocoService);

  step = signal<number>(1);
  loading = signal<boolean>(false);
  selectedProduct = signal<string | null>(null);

  products = [
    { id: 'Bookcase', name: 'Bookcase', icon: 'lucideLibrary' },
    { id: 'Desk', name: 'Desk', icon: 'lucideMonitor' },
    { id: 'TvStand', name: 'TV Stand', icon: 'lucideTv' },
    { id: 'ShoeRack', name: 'Shoe Rack', icon: 'lucideFootprints' },
    { id: 'BedsideTable', name: 'Bedside Table', icon: 'lucideBedDouble' },
  ];

  answers: any = {};

  selectProduct(id: string) {
    this.selectedProduct.set(id);
    this.answers = {}; // reset
  }

  nextStep() {
    if (this.step() === 1 && !this.selectedProduct()) return;
    this.step.update(s => s + 1);
  }

  prevStep() {
    this.step.update(s => s - 1);
  }

  close() {
    this.dialogRef?.close();
  }

  isFormValid(): boolean {
    const a = this.answers;
    if (!a.free_space_cm || !a.room_type || !a.room_style || !a.wall_color) return false;

    const p = this.selectedProduct();
    if (p === 'TvStand' && !a.tv_size_inches) return false;
    if (p === 'ShoeRack' && !a.shoe_count_pairs) return false;
    if (p === 'Desk' && !a.primary_usage) return false;
    if (p === 'BedsideTable' && !a.primary_usage) return false;

    return true;
  }

  generateDesign() {
    this.loading.set(true);
    const pType = this.selectedProduct()!;

    const finalAnswers = { ...this.answers };

    // Handle general storage question -> map to specific AI parameters
    if (finalAnswers.needs_storage) {
      if (Math.random() > 0.5) {
        finalAnswers.needs_top_storage = true;
        finalAnswers.needs_bottom_storage = false;
      } else {
        finalAnswers.needs_top_storage = false;
        finalAnswers.needs_bottom_storage = true;
      }
    } else {
      finalAnswers.needs_top_storage = false;
      finalAnswers.needs_bottom_storage = false;
    }
    delete finalAnswers.needs_storage;

    this.aiService.predict(pType, finalAnswers).subscribe({
      next: (config) => {
        this.loading.set(false);
        this.redirectToConfigurator(pType, config);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
        toast.error(this.translocoService.translate('features.aiWizard.messages.error'));
      }
    });
  }

  private redirectToConfigurator(productType: string, generatedConfig: any) {
    const storageKey = `woodia-configurator-save-ai`;
    const saveState = {
      category: productType,
      modelConfig: generatedConfig
    };

    sessionStorage.setItem(storageKey, JSON.stringify(saveState));

    this.close();
    toast.success(this.translocoService.translate('features.aiWizard.messages.success'));
    this.router.navigate(['/designs/model', 'ai']);
  }
}
