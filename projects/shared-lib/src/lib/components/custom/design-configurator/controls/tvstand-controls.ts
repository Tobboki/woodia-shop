import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ConfiguratorStore } from '../configurator.store'
import { ZardFormModule } from '../../../form/form.module'
import { ZardSliderComponent } from '@shared-components/slider/slider.component'
import { ZardCarouselImports } from '../../../carousel'
import { ZardCheckboxComponent } from '../../../checkbox/checkbox.component'
import { ColumnConfigPanel } from './column-config-panel'
import { NgIcon } from '@ng-icons/core'
import { TranslocoDirective } from '@jsverse/transloco'

@Component({
  selector: 'woodia-tvstand-controls',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardFormModule,
    ZardSliderComponent,
    ZardCarouselImports,
    ZardCheckboxComponent,
    ColumnConfigPanel,
    NgIcon,
    TranslocoDirective
  ],
  template: `
    <div *transloco="let t">
      @if (store.activeMainTab() === 'model') {
        <div class="space-y-6">
          <div [class.hidden]="store.activeControlTab() !== 'color'" class="md:block space-y-3">
            <z-form-field>
              <label class="font-label" z-form-label>{{ t('sharedLib.designConfigurator.controls.color') }}</label>
            <div class="flex max-md:hidden flex-wrap gap-2 pt-1">
              @for (c of store.FURNITURE_COLORS; track c.name) {
                <button type="button" class="size-8 rounded-full border-3 border-border transition-transform shadow-sm"
                  [class.border-primary]="store.tvStandColor() === c.value"
                  [class.scale-120]="store.tvStandColor() === c.value"
                  [style.background-color]="c.value"
                  (click)="store.onTvStandColorChange(c.value)"
                  [title]="c.name"></button>
              }
            </div>
            <div class="hidden max-md:block w-full min-w-0">
              <z-carousel zControls="none" [zOptions]="{ align: 'start', containScroll: 'trimSnaps' }">
                <z-carousel-content>
                  @for (c of store.FURNITURE_COLORS; track c.name) {
                    <z-carousel-item class="!basis-auto !min-w-0 !shrink-0 !grow-0 p-2">
                      <button type="button" class="size-8 rounded-full border-3 border-border transition-transform shadow-sm"
                        [class.border-primary]="store.tvStandColor() === c.value"
                        [class.scale-120]="store.tvStandColor() === c.value"
                        [style.background-color]="c.value"
                        (click)="store.onTvStandColorChange(c.value)"
                        [title]="c.name"></button>
                    </z-carousel-item>
                  }
                </z-carousel-content>
              </z-carousel>
            </div>
          </z-form-field>
        </div>

        <div [class.hidden]="!['width', 'height', 'depth'].includes(store.activeControlTab())" class="md:block space-y-4">
            <h5 class="font-label text-foreground/60 hidden md:block">{{ t('sharedLib.designConfigurator.controls.dimensions') }} ({{ t('sharedLib.designConfigurator.cm') }})</h5>

            <div [class.hidden]="store.activeControlTab() !== 'width'" class="md:block">
              <z-form-field>
                <label class="font-label" z-form-label>{{ t('sharedLib.designConfigurator.controls.width') }} ({{ store.tvStandWidthCm() }} {{ t('sharedLib.designConfigurator.cm') }})</label>
              <z-form-control>
                <z-slider [zMin]="60" [zMax]="400" [zDefault]="store.tvStandWidthCm()" [zValue]="store.tvStandWidthCm()" [zStep]="1"
                  (zSlideIndexChange)="store.onTvStandWidthChange($event)"></z-slider>
              </z-form-control>
            </z-form-field>
          </div>

            <div [class.hidden]="store.activeControlTab() !== 'height'" class="md:block">
              <z-form-field>
                <label class="font-label" z-form-label>{{ t('sharedLib.designConfigurator.controls.height') }} ({{ store.tvStandHeightCm() }} {{ t('sharedLib.designConfigurator.cm') }})</label>
              <z-form-control>
                <z-slider [zMin]="30" [zMax]="120" [zDefault]="store.tvStandHeightCm()" [zValue]="store.tvStandHeightCm()"
                  [zStep]="1" (zSlideIndexChange)="store.onTvStandHeightChange($event)"></z-slider>
              </z-form-control>
            </z-form-field>
          </div>

            <div [class.hidden]="store.activeControlTab() !== 'depth'" class="md:block">
              <z-form-field>
                <label class="font-label" z-form-label>{{ t('sharedLib.designConfigurator.controls.depth') }} ({{ store.tvStandDepthCm() }} {{ t('sharedLib.designConfigurator.cm') }})</label>
              <z-form-control>
                <z-slider [zMin]="30" [zMax]="60" [zDefault]="store.tvStandDepthCm()" [zValue]="store.tvStandDepthCm()" [zStep]="1"
                  (zSlideIndexChange)="store.onTvStandDepthChange($event)"></z-slider>
              </z-form-control>
            </z-form-field>
          </div>
        </div>

          <div [class.hidden]="store.activeControlTab() !== 'style'" class="md:block space-y-3">
            <h5 class="font-label text-foreground/60 hidden md:block">{{ t('sharedLib.designConfigurator.controls.styles.label') }}</h5>
          <z-carousel zControls="none" [zSelectedIndex]="store.styleCarouselIndex()" [zOptions]="{ align: 'start', containScroll: 'trimSnaps' }" class="-ms-4">
            <z-carousel-content>
              @for (style of store.TV_STAND_STYLES; track style) {
                <z-carousel-item class="!basis-auto !min-w-0 !shrink-0 !grow-0">
                  <button type="button"
                    class="flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 p-2.5 transition-colors min-h-[72px] w-full"
                    [class.border-border]="store.tvStandStyle() !== style" [class.bg-muted]="store.tvStandStyle() !== style"
                    [class.border-primary]="store.tvStandStyle() === style" [class.bg-primary]="store.tvStandStyle() === style"
                    (click)="store.onTvStandStyleChange(style)">
                      <ng-icon name="lucideBlocks" class="size-6" />
                      <span class="font-label text-xs capitalize">{{ t(('sharedLib.designConfigurator.controls.styles.' + style)) }}</span>
                  </button>
                </z-carousel-item>
              }
            </z-carousel-content>
          </z-carousel>
        </div>

          <z-form-field class="md:block">
            <z-form-control class="flex items-center">
              <z-checkbox [ngModel]="store.tvStandWithBack()" (ngModelChange)="store.onTvStandBackPanelToggle($event)" zShape="circle"
                zSize="lg">{{ t('sharedLib.designConfigurator.controls.backPanel') }}</z-checkbox>
          </z-form-control>
        </z-form-field>

          <div [class.hidden]="store.activeControlTab() !== 'legs'" class="md:block">
            <z-form-field>
              <z-form-control class="flex items-center">
                <z-checkbox [ngModel]="store.tvStandWithLegs()" (ngModelChange)="store.onTvStandWithLegsChange($event)"
                  zShape="circle" zSize="lg">{{ t('sharedLib.designConfigurator.controls.legs') }}</z-checkbox>
              </z-form-control>
              <p class="font-caption text-foreground/50 mt-1">{{ t('sharedLib.designConfigurator.controls.legsHint') }}</p>
          </z-form-field>
        </div>
      </div>
    }

      @if (store.activeMainTab() === 'columns') {
        <woodia-column-config-panel
          [columnIndices]="store.tvColumnIndices()"
          [selectedIndex]="store.selectedTvColumnIndex()"
          [config]="store.selectedTvColumnConfig()"
          (selectColumn)="store.onTvColumnSelect($event)"
          (hugeCellChange)="store.onTvColumnHugeCellChange($event)"
          (hugeCellDoorChange)="store.onTvColumnHugeCellDoorChange($event)"
          (doorsChange)="store.onTvColumnDoorsChange($event)"
          (drawersChange)="store.onTvColumnDrawersChange($event)">
        </woodia-column-config-panel>
      }
    </div>
  `
})
export class TvstandControls {
  store = inject(ConfiguratorStore)
}
