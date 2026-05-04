import {Component, inject} from '@angular/core'
import {CommonModule} from '@angular/common'
import {FormsModule} from '@angular/forms'
import {ConfiguratorStore} from '../configurator.store'
import {ZardFormModule} from '../../../form/form.module'
import {ZardSliderComponent} from '@shared-components/slider/slider.component'
import {ZardCarouselImports} from '../../../carousel'
import {ZardButtonComponent} from '../../../button/button.component'
import {ZardCheckboxComponent} from '../../../checkbox/checkbox.component'
import {ZardSelectComponent} from '../../../select/select.component'
import {ZardSelectItemComponent} from '../../../select/select-item.component'
import {NgIcon} from '@ng-icons/core'
import {TranslocoDirective} from '@jsverse/transloco';

@Component({
  selector: 'woodia-bookcase-controls',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardFormModule,
    ZardSliderComponent,
    ZardCarouselImports,
    ZardButtonComponent,
    ZardCheckboxComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    NgIcon,
    TranslocoDirective
  ],
  template: `
    <div *transloco="let t">
      @if (store.activeMainTab() === 'model') {
        <div>
          <div [class.hidden]="store.activeControlTab() !== 'color'" class="md:block space-y-3">
            <z-form-field>
              <label class="font-label text-foreground/60 hidden md:block" z-form-label>
                {{ t('sharedLib.designConfigurator.controls.color') }}
              </label>

              <!-- Colors -->
              <div class="flex max-md:hidden flex-wrap gap-2 pt-1">
                @for (c of store.FURNITURE_COLORS; track c.name) {
                  <button type="button" class="size-8 rounded-full border-3 border-border transition-transform shadow-sm"
                          [class.border-primary]="store.bookcaseColor() === c.value"
                          [class.scale-120]="store.bookcaseColor() === c.value"
                          [style.background-color]="c.value"
                          (click)="store.onBookcaseColorInputChange(c.value)"
                          [title]="c.name"></button>
                }
              </div>
              <div class="hidden max-md:block w-full min-w-0">
                <z-carousel zControls="none" [zOptions]="{ align: 'start', containScroll: 'trimSnaps' }">
                  <z-carousel-content>
                    @for (c of store.FURNITURE_COLORS; track c.name) {
                      <z-carousel-item class="!basis-auto !min-w-0 !shrink-0 !grow-0 p-2">
                        <button
                          type="button"
                          class="size-8 rounded-full border-3 border-border transition-transform shadow-sm"
                          [class.border-primary]="store.bookcaseColor() === c.value"
                          [class.scale-120]="store.bookcaseColor() === c.value"
                          [style.background-color]="c.value"
                          (click)="store.onBookcaseColorInputChange(c.value)"
                          [title]="c.name">
                        </button>
                      </z-carousel-item>
                    }
                  </z-carousel-content>
                </z-carousel>
              </div>
            </z-form-field>
          </div>

          <div [class.hidden]="!['width', 'height', 'depth'].includes(store.activeControlTab())"
               class="hidden md:block space-y-4">
            <h5 class="font-label text-foreground/60 hidden md:block">
              {{ t('sharedLib.designConfigurator.controls.dimensions') }}
            </h5>

            <div [class.hidden]="store.activeControlTab() !== 'width'" class="hidden md:block">
              <z-form-field>
                <label class="font-label" z-form-label>{{ t('sharedLib.designConfigurator.controls.width') }} ({{ store.bookcaseWidthCm() }} {{ t('sharedLib.designConfigurator.cm') }})</label>
                <z-form-control>
                  <z-slider [zMin]="30" [zMax]="450" [zDefault]="store.bookcaseWidthCm()"
                            [zValue]="store.bookcaseWidthCm()"
                            [zStep]="1" (zSlideIndexChange)="store.onBookcaseWidthChange($event)"></z-slider>
                </z-form-control>
              </z-form-field>
            </div>

            <div [class.hidden]="store.activeControlTab() !== 'height'" class="md:block">
              <z-form-field>
                <label class="font-label" z-form-label>{{ t('sharedLib.designConfigurator.controls.height') }} ({{ store.bookcaseHeightCm() }} {{ t('sharedLib.designConfigurator.cm') }})</label>
                <z-form-control>
                  <z-slider [zMin]="38" [zMax]="200" [zDefault]="store.bookcaseHeightCm()"
                            [zValue]="store.bookcaseHeightCm()"
                            [zStep]="1" (zSlideIndexChange)="store.onBookcaseHeightChange($event)"></z-slider>
                </z-form-control>
              </z-form-field>
            </div>

            <div [class.hidden]="store.activeControlTab() !== 'depth'" class="md:block">
              <z-form-field>
                <label class="font-label" z-form-label>{{ t('sharedLib.designConfigurator.controls.depth') }} ({{ store.bookcaseDepthCm() }} {{ t('sharedLib.designConfigurator.cm') }})</label>
                <z-form-control>
                  <z-slider [zMin]="20" [zMax]="45" [zDefault]="store.bookcaseDepthCm()"
                            [zValue]="store.bookcaseDepthCm()"
                            [zStep]="1" (zSlideIndexChange)="store.onBookcaseDepthChange($event)"></z-slider>
                </z-form-control>
              </z-form-field>
            </div>
          </div>

          <div [class.hidden]="store.activeControlTab() !== 'style'" class="md:block md:my-4">
            <h5 class="font-label text-foreground/60 hidden md:block">
              {{ t('sharedLib.designConfigurator.controls.styles.label') }}
            </h5>
            <z-carousel zControls="none" [zSelectedIndex]="store.styleCarouselIndex()"
                        [zOptions]="{ align: 'start', containScroll: 'trimSnaps' }" class="-ms-4">
              <z-carousel-content>
                @for (style of store.styleOptions; track style) {
                  <z-carousel-item class="!basis-auto !min-w-0 !shrink-0 !grow-0">
                    <button type="button"
                            class="flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-border p-2.5 transition-colors min-h-[72px] w-full"
                            [class.border-border]="store.bookcaseStyle() !== style"
                            [class.bg-muted]="store.bookcaseStyle() !== style"
                            [class.border-primary]="store.bookcaseStyle() === style"
                            [class.bg-primary]="store.bookcaseStyle() === style"
                            (click)="store.onBookcaseStyleChange(style)">
                      <ng-icon name="lucideBlocks" class="size-6"
                               [class.text-primary]="store.bookcaseStyle() === style"/>
                      <span class="font-label text-xs capitalize">{{ t(('sharedLib.designConfigurator.controls.styles.' + style)) }}</span>
                    </button>
                  </z-carousel-item>
                }
              </z-carousel-content>
            </z-carousel>
          </div>

          <div [class.hidden]="store.activeControlTab() !== 'density'" class="md:block space-y-4">
            <z-form-field>
              <label class="font-label" z-form-label>{{ t('sharedLib.designConfigurator.controls.rowDensity') }} ({{ store.bookcaseDensity() }}%)</label>
              <z-form-control>
                <z-slider [zMin]="0" [zMax]="100" [zDefault]="store.bookcaseDensity()"
                          [zValue]="store.bookcaseDensity()" [zStep]="1"
                          (zSlideIndexChange)="store.onBookcaseDensityChange($event)"></z-slider>
              </z-form-control>
            </z-form-field>
          </div>

          <div [class.hidden]="store.activeControlTab() !== 'storage'" class="md:block space-y-4">
            <h5 class="font-label text-foreground/60 hidden md:block">
              {{ t('sharedLib.designConfigurator.controls.storageOptions.label') }}
            </h5>
            <div class="space-y-2">
              <z-form-field>
                <z-form-control>
                  <z-form-label> {{ t('sharedLib.designConfigurator.controls.storageOptions.topStorage') }}  </z-form-label>
                  <z-select [zPlaceholder]="'Top storage'" [zValue]="store.bookcaseTopStorageValue()"
                            (zSelectionChange)="store.onBookcaseTopStorageChange($event)">
                    <z-select-item zValue="none">{{ t('sharedLib.designConfigurator.controls.storageOptions.none') }}</z-select-item>
                    <z-select-item zValue="sm">{{ t('sharedLib.designConfigurator.controls.storageOptions.small') }}</z-select-item>
                    <z-select-item zValue="md">{{ t('sharedLib.designConfigurator.controls.storageOptions.medium') }}</z-select-item>
                    <z-select-item zValue="lg">{{ t('sharedLib.designConfigurator.controls.storageOptions.large') }}</z-select-item>
                  </z-select>
                </z-form-control>
              </z-form-field>
            </div>
            <div class="space-y-2">
              <z-form-field>
                <z-form-label> {{ t('sharedLib.designConfigurator.controls.storageOptions.bottomStorage') }} </z-form-label>
                <z-form-control>
                  <z-select [zPlaceholder]="'Bottom storage'" [zValue]="store.bookcaseBottomStorageValue()"
                            (zSelectionChange)="store.onBookcaseBottomStorageChange($event)">
                    <z-select-item zValue="none">{{ t('sharedLib.designConfigurator.controls.storageOptions.none') }}</z-select-item>
                    <z-select-item zValue="sm">{{ t('sharedLib.designConfigurator.controls.storageOptions.small') }}</z-select-item>
                    <z-select-item zValue="md">{{ t('sharedLib.designConfigurator.controls.storageOptions.medium') }}</z-select-item>
                    <z-select-item zValue="lg">{{ t('sharedLib.designConfigurator.controls.storageOptions.large') }}</z-select-item>
                  </z-select>
                </z-form-control>
              </z-form-field>
            </div>
            <z-form-field>
              <z-form-control class="flex items-center">
                <z-checkbox
                  [ngModel]="store.withBack()"
                  (ngModelChange)="store.onBookcaseBackPanelToggle($event)"
                  zShape="circle"
                  zSize="lg"
                >
                  {{ t('sharedLib.designConfigurator.controls.backPanel') }}
                </z-checkbox>
              </z-form-control>
            </z-form-field>
          </div>
        </div>
      }

      @if (store.activeMainTab() === 'rows') {
        <div class="space-y-5">
          @if (store.rowCount() > 0) {
            <div>
              <div class="flex flex-wrap gap-2">
                @for (idx of store.bookcaseRowIndices(); track idx) {
                  <z-button [zType]="store.selectedRowIndex() === idx ? 'default' : 'outline'" class="rounded-full"
                            (click)="store.onBookcaseRowSelect(idx + '')">
                    @if (store.selectedRowIndex() === idx) {
                      {{ t('sharedLib.designConfigurator.controls.row') }} {{ idx + 1 }}
                    } @else {
                      {{ idx + 1 }}
                    }
                  </z-button>
                }
              </div>
            </div>

            @let rowCfg = store.selectedRowConfig();
            @if (rowCfg) {
              <div class="space-y-4 pt-2 border-t border-border">
                <z-form-field>
                  <label class="font-label" z-form-label>{{ t('sharedLib.designConfigurator.controls.rowHeight') }}</label>
                  <z-form-control>
                    <z-select [zPlaceholder]="'Height'" [zValue]="rowCfg.height"
                              (zSelectionChange)="store.onBookcaseRowHeightChange($event)">
                      <z-select-item zValue="sm">
                        {{ t('sharedLib.designConfigurator.controls.heightOptions.small') }}
                      </z-select-item>
                      <z-select-item zValue="md">
                        {{ t('sharedLib.designConfigurator.controls.heightOptions.medium') }}
                      </z-select-item>
                      <z-select-item zValue="lg">
                        {{ t('sharedLib.designConfigurator.controls.heightOptions.large') }}
                      </z-select-item>
                    </z-select>
                  </z-form-control>
                </z-form-field>

                <z-form-field>
                  <label class="font-label" z-form-label>
                    {{ t('sharedLib.designConfigurator.controls.Compartments.doors') }}
                  </label>
                  <z-form-control>
                    <z-select [zPlaceholder]="'Doors'" [zValue]="rowCfg.doors"
                              (zSelectionChange)="store.onBookcaseRowDoorsChange($event)">
                      <z-select-item zValue="none">
                        {{ t('sharedLib.designConfigurator.controls.Compartments.none') }}
                      </z-select-item>
                      <z-select-item zValue="some">
                        {{ t('sharedLib.designConfigurator.controls.Compartments.some') }}
                      </z-select-item>
                      <z-select-item zValue="all">
                        {{ t('sharedLib.designConfigurator.controls.Compartments.max') }}
                      </z-select-item>
                    </z-select>
                  </z-form-control>
                </z-form-field>

                <z-form-field>
                  <label class="font-label" z-form-label>
                    {{ t('sharedLib.designConfigurator.controls.Compartments.drawers') }}
                  </label>
                  <z-form-control>
                    <z-select [zPlaceholder]="'Drawers'" [zValue]="rowCfg.drawers"
                              (zSelectionChange)="store.onBookcaseRowDrawersChange($event)">
                      <z-select-item zValue="none">
                        {{ t('sharedLib.designConfigurator.controls.Compartments.none') }}
                      </z-select-item>
                      <z-select-item zValue="some">
                        {{ t('sharedLib.designConfigurator.controls.Compartments.some') }}
                      </z-select-item>
                      <z-select-item zValue="all">
                        {{ t('sharedLib.designConfigurator.controls.Compartments.max') }}
                      </z-select-item>
                    </z-select>
                  </z-form-control>
                </z-form-field>
              </div>
            }
          } @else {
            <p class="font-caption text-foreground/50 text-sm">{{ t('sharedLib.designConfigurator.controls.noRowsAvailable') }}</p>
          }
        </div>
      }
    </div>
  `
})
export class BookcaseControls {
  store = inject(ConfiguratorStore)
}
