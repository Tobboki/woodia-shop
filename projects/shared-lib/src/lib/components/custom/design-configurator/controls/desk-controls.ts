import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ConfiguratorStore } from '../configurator.store'
import { ZardFormModule } from '../../../form/form.module'
import { ZardSliderComponent } from '@shared-components/slider/slider.component'
import { ColumnConfigPanel } from './column-config-panel'
import { ZardCarouselImports } from '../../../carousel'
import { TranslocoDirective } from '@jsverse/transloco'

@Component({
  selector: 'woodia-desk-controls',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardFormModule,
    ZardSliderComponent,
    ColumnConfigPanel,
    TranslocoDirective,
    ZardCarouselImports,
  ],
  template: `
    <div *transloco="let t">
      @if (store.activeMainTab() === 'model') {
        <div class="space-y-6">
          <div [class.hidden]="store.activeControlTab() !== 'color'" class="md:block space-y-3">
            <h5 class="font-label text-foreground/60 hidden md:block">{{ t('sharedLib.designConfigurator.controls.color') }}</h5>
            <z-form-field>
              <label class="font-label md:hidden" z-form-label>{{ t('sharedLib.designConfigurator.controls.color') }}</label>
            <div class="flex max-md:hidden flex-wrap gap-2 pt-1">
              @for (c of store.FURNITURE_COLORS; track c.name) {
                <button type="button" class="size-8 rounded-full border-3 border-border transition-transform shadow-sm"
                  [class.border-primary]="store.deskColor() === c.value" 
                  [class.scale-120]="store.deskColor() === c.value" 
                  [style.background-color]="c.value"
                  (click)="store.onDeskColorInputChange(c.value)" 
                  [title]="c.name"></button>
              }
            </div>
            <div class="hidden max-md:block w-full min-w-0">
              <z-carousel zControls="none" [zOptions]="{ align: 'start', containScroll: 'trimSnaps' }">
                <z-carousel-content>
                  @for (c of store.FURNITURE_COLORS; track c.name) {
                    <z-carousel-item class="!basis-auto !min-w-0 !shrink-0 !grow-0 p-2">
                      <button type="button" class="size-8 rounded-full border-3 border-border transition-transform shadow-sm"
                        [class.border-primary]="store.deskColor() === c.value" 
                        [class.scale-120]="store.deskColor() === c.value" 
                        [style.background-color]="c.value"
                        (click)="store.onDeskColorInputChange(c.value)" 
                        [title]="c.name"></button>
                    </z-carousel-item>
                  }
                </z-carousel-content>
              </z-carousel>
            </div>
          </z-form-field>
        </div>

        <div [class.hidden]="!['width', 'height', 'depth', 'overhang'].includes(store.activeControlTab())"
          class="md:block space-y-4">
          <h5 class="font-label text-foreground/60 hidden md:block">{{ t('sharedLib.designConfigurator.controls.dimensions') }} ({{ t('sharedLib.designConfigurator.cm') }})</h5>
          
          <div [class.hidden]="store.activeControlTab() !== 'width'" class="md:block">
            <z-form-field>
              <label class="font-label" z-form-label>{{ t('sharedLib.designConfigurator.controls.width') }} ({{ store.deskWidthCm() }} {{ t('sharedLib.designConfigurator.cm') }})</label>
              <z-form-control>
                <z-slider [zMin]="100" [zMax]="500" [zDefault]="store.deskWidthCm()" [zValue]="store.deskWidthCm()" [zStep]="1"
                  (zSlideIndexChange)="store.onDeskWidthChange($event)"></z-slider>
              </z-form-control>
            </z-form-field>
          </div>
          
          <div [class.hidden]="store.activeControlTab() !== 'height'" class="md:block">
            <z-form-field>
              <label class="font-label" z-form-label>{{ t('sharedLib.designConfigurator.controls.height') }} ({{ store.deskHeightCm() }} {{ t('sharedLib.designConfigurator.cm') }})</label>
              <z-form-control>
                <z-slider [zMin]="60" [zMax]="90" [zDefault]="store.deskHeightCm()" [zValue]="store.deskHeightCm()" [zStep]="1"
                  (zSlideIndexChange)="store.onDeskHeightChange($event)"></z-slider>
              </z-form-control>
            </z-form-field>
          </div>
          
          <div [class.hidden]="store.activeControlTab() !== 'depth'" class="md:block">
            <z-form-field>
              <label class="font-label" z-form-label>{{ t('sharedLib.designConfigurator.controls.depth') }} ({{ store.deskDepthCm() }} {{ t('sharedLib.designConfigurator.cm') }})</label>
              <z-form-control>
                <z-slider [zMin]="50" [zMax]="70" [zDefault]="store.deskDepthCm()" [zValue]="store.deskDepthCm()" [zStep]="1"
                  (zSlideIndexChange)="store.onDeskDepthChange($event)"></z-slider>
              </z-form-control>
            </z-form-field>
          </div>
          
          <div [class.hidden]="store.activeControlTab() !== 'overhang'" class="md:block">
            <z-form-field>
              <label class="font-label" z-form-label>{{ t('sharedLib.designConfigurator.controls.overhang') }} ({{ store.deskTopOverhangCm() }} {{ t('sharedLib.designConfigurator.cm') }})</label>
              <z-form-control>
                <z-slider [zMin]="0" [zMax]="10" [zDefault]="store.deskTopOverhangCm()" [zValue]="store.deskTopOverhangCm()"
                  [zStep]="1" (zSlideIndexChange)="store.onDeskTopOverhangChange($event)"></z-slider>
              </z-form-control>
              <p class="font-caption text-foreground/50 mt-1">{{ t('sharedLib.designConfigurator.controls.overhangHint') }}</p>
            </z-form-field>
          </div>
        </div>

        <div [class.hidden]="store.activeControlTab() !== 'legroom'" class="md:block space-y-4">
          <z-form-field>
            <label class="font-label" z-form-label>{{ t('sharedLib.designConfigurator.controls.legroomPosition') }}</label>
            <z-form-control>
              <z-slider [zMin]="0" [zMax]="store.columnCount()" [zDefault]="store.legroomPosition()" [zValue]="store.legroomPosition()"
                [zStep]="1" (zSlideIndexChange)="store.onLegroomPositionChange($event)"></z-slider>
            </z-form-control>
            <p class="font-caption text-foreground/50 mt-1">{{ t('sharedLib.designConfigurator.controls.legroomPositionHint', {max: store.columnCount()}) }}</p>
          </z-form-field>
        </div>
      </div>
    }

      @if (store.activeMainTab() === 'columns') {
        <woodia-column-config-panel
          [columnIndices]="store.deskColumnIndices()"
          [selectedIndex]="store.selectedColumnIndex()"
          [config]="store.selectedDeskColumnConfig()"
          (selectColumn)="store.onDeskColumnSelect($event)"
          (hugeCellChange)="store.onDeskColumnHugeCellChange($event)"
          (hugeCellDoorChange)="store.onDeskColumnHugeCellDoorChange($event)"
          (doorsChange)="store.onDeskColumnDoorsChange($event)"
          (drawersChange)="store.onDeskColumnDrawersChange($event)">
          
          @let cfg = store.selectedDeskColumnConfig();
          @if (cfg && !cfg.hugeCell) {
            <z-form-field>
              <label class="font-label" z-form-label>{{ t('sharedLib.designConfigurator.controls.shelfDensity') }} ({{ cfg.density }}%)</label>
              <z-form-control>
                <z-slider [zMin]="0" [zMax]="100" [zDefault]="cfg.density" [zValue]="cfg.density" [zStep]="10"
                  (zSlideIndexChange)="store.onDeskColumnDensityChange($event)"></z-slider>
              </z-form-control>
              <p class="font-caption text-foreground/50 mt-1">{{ t('sharedLib.designConfigurator.controls.deskDensityHint') }}</p>
            </z-form-field>
          }
        </woodia-column-config-panel>
      }
    </div>
  `
})
export class DeskControls {
  store = inject(ConfiguratorStore)
}
