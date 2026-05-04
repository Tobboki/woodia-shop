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
  selector: 'woodia-shoerack-controls',
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
                  [class.border-primary]="store.shoeRackColor() === c.value"
                  [class.scale-120]="store.shoeRackColor() === c.value"
                  [style.background-color]="c.value" 
                  (click)="store.onShoeRackColorChange(c.value)" 
                  [title]="c.name"></button>
              }
            </div>
            <div class="hidden max-md:block w-full min-w-0">
              <z-carousel zControls="none" [zOptions]="{ align: 'start', containScroll: 'trimSnaps' }">
                <z-carousel-content>
                  @for (c of store.FURNITURE_COLORS; track c.name) {
                    <z-carousel-item class="!basis-auto !min-w-0 !shrink-0 !grow-0 p-2">
                      <button type="button" class="size-8 rounded-full border-3 border-border transition-transform shadow-sm"
                        [class.border-primary]="store.shoeRackColor() === c.value"
                        [class.scale-120]="store.shoeRackColor() === c.value"
                        [style.background-color]="c.value" 
                        (click)="store.onShoeRackColorChange(c.value)" 
                        [title]="c.name"></button>
                    </z-carousel-item>
                  }
                </z-carousel-content>
              </z-carousel>
            </div>
          </z-form-field>
        </div>

        <div [class.hidden]="!['width', 'height', 'depth'].includes(store.activeControlTab())"
            class="md:block space-y-4">
            <h5 class="font-label text-foreground/60 hidden md:block">{{ t('sharedLib.designConfigurator.controls.dimensions') }} ({{ t('sharedLib.designConfigurator.cm') }})</h5>
          
          <div [class.hidden]="store.activeControlTab() !== 'width'" class="md:block">
            <z-form-field>
              <label class="font-label" z-form-label>{{ t('sharedLib.designConfigurator.controls.width') }} ({{ store.shoeRackWidthCm() }} {{ t('sharedLib.designConfigurator.cm') }})</label>
              <z-form-control>
                <z-slider [zMin]="80" [zMax]="400" [zDefault]="store.shoeRackWidthCm()" [zValue]="store.shoeRackWidthCm()"
                  [zStep]="1" (zSlideIndexChange)="store.onShoeRackWidthChange($event)"></z-slider>
              </z-form-control>
            </z-form-field>
          </div>
          
          <div [class.hidden]="store.activeControlTab() !== 'depth'" class="md:block">
            <z-form-field>
              <label class="font-label" z-form-label>{{ t('sharedLib.designConfigurator.controls.depth') }} ({{ store.shoeRackDepthCm() }} {{ t('sharedLib.designConfigurator.cm') }})</label>
              <z-form-control>
                <z-slider [zMin]="20" [zMax]="40" [zDefault]="store.shoeRackDepthCm()" [zValue]="store.shoeRackDepthCm()"
                  [zStep]="1" (zSlideIndexChange)="store.onShoeRackDepthChange($event)"></z-slider>
              </z-form-control>
            </z-form-field>
          </div>
          
          <div [class.hidden]="store.activeControlTab() !== 'height'" class="md:block">
            <z-form-field>
              <label class="font-label" z-form-label>{{ t('sharedLib.designConfigurator.controls.defaultColumnHeight') }} ({{ store.shoeRackDefaultHeightCm() }} {{ t('sharedLib.designConfigurator.cm') }})</label>
              <z-form-control>
                <z-slider [zMin]="20" [zMax]="200" [zDefault]="store.shoeRackDefaultHeightCm()"
                  [zValue]="store.shoeRackDefaultHeightCm()" [zStep]="1"
                  (zSlideIndexChange)="store.onShoeRackDefaultHeightChange($event)"></z-slider>
              </z-form-control>
              <p class="font-caption text-foreground/50 mt-1">{{ t('sharedLib.designConfigurator.controls.defaultColumnHeightHint') }}</p>
            </z-form-field>
          </div>
        </div>

        <z-form-field class="md:block">
          <z-form-control class="flex items-center">
            <z-checkbox [ngModel]="store.shoeRackWithBack()" (ngModelChange)="store.onShoeRackBackPanelToggle($event)"
              zShape="circle" zSize="lg">{{ t('sharedLib.designConfigurator.controls.backPanel') }}</z-checkbox>
          </z-form-control>
        </z-form-field>
      </div>
    }

    @if (store.activeMainTab() === 'columns') {
      <woodia-column-config-panel
        [columnIndices]="store.shoeColumnIndices()"
        [selectedIndex]="store.selectedShoeColumnIndex()"
        [config]="store.selectedShoeColumnConfig()"
        (selectColumn)="store.onShoeColumnSelect($event)"
        (hugeCellChange)="store.onShoeColumnHugeCellChange($event)"
        (hugeCellDoorChange)="store.onShoeColumnHugeCellDoorChange($event)"
        (doorsChange)="store.onShoeColumnDoorsChange($event)"
        (drawersChange)="store.onShoeColumnDrawersChange($event)">
        
        @let cfg = store.selectedShoeColumnConfig();
        @if (cfg) {
          <z-form-field>
            <label class="font-label" z-form-label>{{ t('sharedLib.designConfigurator.controls.columnHeight') }} ({{ cfg.heightCm }} {{ t('sharedLib.designConfigurator.cm') }})</label>
            <z-form-control>
              <z-slider [zMin]="20" [zMax]="200" [zDefault]="cfg.heightCm" [zValue]="cfg.heightCm" [zStep]="1"
                (zSlideIndexChange)="store.onShoeColumnHeightChange($event)"></z-slider>
            </z-form-control>
            <p class="font-caption text-foreground/50 mt-1">{{ t('sharedLib.designConfigurator.controls.columnHeightHint') }}</p>
          </z-form-field>
        }
      </woodia-column-config-panel>
    }
    </div>
  `
})
export class ShoerackControls {
  store = inject(ConfiguratorStore)
}
