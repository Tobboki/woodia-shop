import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ConfiguratorStore } from '../configurator.store'
import { ZardFormModule } from '../../../form/form.module'
import { ZardSliderComponent } from '@shared-components/slider/slider.component'
import { ZardCheckboxComponent } from '../../../checkbox/checkbox.component'
import { ColumnConfigPanel } from './column-config-panel'
import { ZardCarouselImports } from '../../../carousel'
import { TranslocoDirective } from '@jsverse/transloco'

@Component({
  selector: 'woodia-bedside-controls',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardFormModule,
    ZardSliderComponent,
    ZardCheckboxComponent,
    ColumnConfigPanel,
    TranslocoDirective,
    ZardCarouselImports,
  ],
  template: `
    <div *transloco="let t">
      @if (store.activeMainTab() === 'model') {
        <div class="space-y-6">
          <div [class.hidden]="store.activeControlTab() !== 'color'" class="md:block space-y-3">
            <z-form-field>
              <label class="font-label hidden md:block" z-form-label>{{ t('sharedLib.designConfigurator.controls.color') }}</label>
            <div class="flex max-md:hidden flex-wrap gap-2 pt-1">
              @for (c of store.FURNITURE_COLORS; track c.name) {
                <button type="button" class="size-8 rounded-full border-3 border-border transition-transform shadow-sm"
                  [class.border-primary]="store.bedsideColor() === c.value"
                  [class.scale-120]="store.bedsideColor() === c.value"
                  [style.background-color]="c.value" 
                  (click)="store.onBedsideColorChange(c.value)" 
                  [title]="c.name"></button>
              }
            </div>
            <div class="hidden max-md:block w-full min-w-0">
              <z-carousel zControls="none" [zOptions]="{ align: 'start', containScroll: 'trimSnaps' }">
                <z-carousel-content>
                  @for (c of store.FURNITURE_COLORS; track c.name) {
                    <z-carousel-item class="!basis-auto !min-w-0 !shrink-0 !grow-0 p-2">
                      <button type="button" class="size-8 rounded-full border-3 border-border transition-transform shadow-sm"
                        [class.border-primary]="store.bedsideColor() === c.value"
                        [class.scale-120]="store.bedsideColor() === c.value"
                        [style.background-color]="c.value" 
                        (click)="store.onBedsideColorChange(c.value)" 
                        [title]="c.name"></button>
                    </z-carousel-item>
                  }
                </z-carousel-content>
              </z-carousel>
            </div>
          </z-form-field>
        </div>
        <div [class.hidden]="!['width','height','depth','density'].includes(store.activeControlTab())"
          class="md:block space-y-4">
          <h5 class="font-label text-foreground/60 hidden md:block">{{ t('sharedLib.designConfigurator.controls.dimensionsAndDensity') }}</h5>
          
          <div [class.hidden]="store.activeControlTab() !== 'width'" class="md:block">
            <z-form-field>
              <label class="font-label" z-form-label>{{ t('sharedLib.designConfigurator.controls.width') }} ({{ store.bedsideWidthCm() }} {{ t('sharedLib.designConfigurator.cm') }})</label>
              <z-form-control>
                <z-slider [zMin]="30" [zMax]="90" [zDefault]="store.bedsideWidthCm()" [zValue]="store.bedsideWidthCm()" [zStep]="1"
                  (zSlideIndexChange)="store.onBedsideWidthChange($event)"></z-slider>
              </z-form-control>
            </z-form-field>
          </div>
          
          <div [class.hidden]="store.activeControlTab() !== 'height'" class="md:block">
            <z-form-field>
              <label class="font-label" z-form-label>{{ t('sharedLib.designConfigurator.controls.height') }} ({{ store.bedsideHeightCm() }} {{ t('sharedLib.designConfigurator.cm') }})</label>
              <z-form-control>
                <z-slider [zMin]="30" [zMax]="90" [zDefault]="store.bedsideHeightCm()" [zValue]="store.bedsideHeightCm()"
                  [zStep]="1" (zSlideIndexChange)="store.onBedsideHeightChange($event)"></z-slider>
              </z-form-control>
            </z-form-field>
          </div>
          
          <div [class.hidden]="store.activeControlTab() !== 'depth'" class="md:block">
            <z-form-field>
              <label class="font-label" z-form-label>{{ t('sharedLib.designConfigurator.controls.depth') }} ({{ store.bedsideDepthCm() }} {{ t('sharedLib.designConfigurator.cm') }})</label>
              <z-form-control>
                <z-slider [zMin]="25" [zMax]="50" [zDefault]="store.bedsideDepthCm()" [zValue]="store.bedsideDepthCm()" [zStep]="1"
                  (zSlideIndexChange)="store.onBedsideDepthChange($event)"></z-slider>
              </z-form-control>
            </z-form-field>
          </div>
          
          <div [class.hidden]="store.activeControlTab() !== 'density'" class="md:block">
            <z-form-field>
              <label class="font-label" z-form-label>{{ t('sharedLib.designConfigurator.controls.shelfDensity') }} ({{ store.bedsideDensity() }}%)</label>
              <z-form-control>
                <z-slider [zMin]="0" [zMax]="100" [zDefault]="store.bedsideDensity()" [zValue]="store.bedsideDensity()" [zStep]="5"
                  (zSlideIndexChange)="store.onBedsideDensityChange($event)"></z-slider>
              </z-form-control>
              <p class="font-caption text-foreground/50 mt-1">{{ t('sharedLib.designConfigurator.controls.bedsideDensityHint') }}</p>
            </z-form-field>
          </div>
        </div>
        <z-form-field class="md:block">
          <z-form-control class="flex items-center">
            <z-checkbox [ngModel]="store.bedsideWithBack()" (ngModelChange)="store.onBedsideBackPanelToggle($event)" zShape="circle"
              zSize="lg">{{ t('sharedLib.designConfigurator.controls.backPanel') }}</z-checkbox>
          </z-form-control>
        </z-form-field>
      </div>
    }

    @if (store.activeMainTab() === 'columns') {
      <woodia-column-config-panel
        [columnIndices]="store.bedsideColumnIndices()"
        [selectedIndex]="store.selectedBedsideColumnIndex()"
        [config]="store.selectedBedsideColumnConfig()"
        [hugeCellLabel]="'sharedLib.designConfigurator.controls.openCubbyLabel'"
        [hugeCellDescription]="'sharedLib.designConfigurator.controls.openCubbyDescription'"
        (selectColumn)="store.onBedsideColumnSelect($event)"
        (hugeCellChange)="store.onBedsideColumnHugeCellChange($event)"
        (hugeCellDoorChange)="store.onBedsideColumnHugeCellDoorChange($event)"
        (doorsChange)="store.onBedsideColumnDoorsChange($event)"
        (drawersChange)="store.onBedsideColumnDrawersChange($event)">
      </woodia-column-config-panel>
    }
    </div>
  `
})
export class BedsideControls {
  store = inject(ConfiguratorStore)
}
