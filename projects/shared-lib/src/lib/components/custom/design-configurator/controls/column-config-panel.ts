import { Component, EventEmitter, Input, Output } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ZardButtonComponent } from '../../../button/button.component'
import { ZardCheckboxComponent } from '../../../checkbox/checkbox.component'
import { ZardSelectComponent } from '../../../select/select.component'
import { ZardSelectItemComponent } from '../../../select/select-item.component'
import { ZardFormModule } from '../../../form/form.module'
import { TranslocoDirective } from '@jsverse/transloco'

@Component({
  selector: 'woodia-column-config-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardButtonComponent,
    ZardCheckboxComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardFormModule,
    TranslocoDirective
  ],
  template: `
    <div class="space-y-5" *transloco="let t">
      @if (columnIndices.length > 0) {
        <div>
          <h5 class="font-label text-foreground/60 mb-3">{{ t('sharedLib.designConfigurator.controls.selectColumn') }}</h5>
          <div class="flex flex-wrap gap-2">
            @for (idx of columnIndices; track idx) {
              <z-button 
                [zType]="selectedIndex === idx ? 'default' : 'outline'" 
                class="rounded-full"
                (click)="onSelect(idx)">
                @if (selectedIndex === idx) {
                  {{ t('sharedLib.designConfigurator.controls.column') }} {{ idx + 1 }}
                } @else {
                  {{ idx + 1 }}
                }
              </z-button>
            }
          </div>
        </div>

        @if (config) {
          <div class="space-y-4 pt-2 border-t border-border">
            <h5 class="font-label text-foreground/60">{{ t('sharedLib.designConfigurator.controls.column') }} {{ selectedIndex + 1 }} {{ t('sharedLib.designConfigurator.controls.columnSettings') }}</h5>

            <!-- Model-specific controls (e.g. Desk density, ShoeRack height) -->
            <ng-content></ng-content>

            <z-form-field>
              <z-form-control class="flex items-center">
                <z-checkbox 
                  [ngModel]="config.hugeCell" 
                  (ngModelChange)="hugeCellChange.emit($event)" 
                  zShape="circle" 
                  zSize="lg">{{ t(hugeCellLabel) }}</z-checkbox>
              </z-form-control>
              <p class="font-caption text-foreground/50 mt-1">{{ t(hugeCellDescription) }}</p>
            </z-form-field>

            @if (!config.hugeCell) {
              <z-form-field>
                <label class="font-label" z-form-label>{{ t('sharedLib.designConfigurator.controls.Compartments.doors') }}</label>
                <z-form-control>
                  <z-select 
                    [zPlaceholder]="'Doors'" 
                    [zValue]="config.doors" 
                    (zSelectionChange)="doorsChange.emit($event)">
                    <z-select-item zValue="none">{{ t('sharedLib.designConfigurator.controls.Compartments.none') }}</z-select-item>
                    <z-select-item zValue="some">{{ t('sharedLib.designConfigurator.controls.Compartments.some') }}</z-select-item>
                    <z-select-item zValue="all">{{ t('sharedLib.designConfigurator.controls.Compartments.max') }}</z-select-item>
                  </z-select>
                </z-form-control>
                <p class="font-caption text-foreground/50 mt-1">{{ t('sharedLib.designConfigurator.controls.maxDoorsHint') }}</p>
              </z-form-field>

              <z-form-field>
                <label class="font-label" z-form-label>{{ t('sharedLib.designConfigurator.controls.Compartments.drawers') }}</label>
                <z-form-control>
                  <z-select 
                    [zPlaceholder]="'Drawers'" 
                    [zValue]="config.drawers" 
                    (zSelectionChange)="drawersChange.emit($event)">
                    <z-select-item zValue="none">{{ t('sharedLib.designConfigurator.controls.Compartments.none') }}</z-select-item>
                    <z-select-item zValue="some">{{ t('sharedLib.designConfigurator.controls.Compartments.some') }}</z-select-item>
                    <z-select-item zValue="all">{{ t('sharedLib.designConfigurator.controls.Compartments.max') }}</z-select-item>
                  </z-select>
                </z-form-control>
              </z-form-field>
            }

            @if (config.hugeCell) {
              <z-form-field>
                <z-form-control class="flex items-center">
                  <z-checkbox 
                    [ngModel]="config.hugeCellDoor" 
                    (ngModelChange)="hugeCellDoorChange.emit($event)" 
                    zShape="circle" 
                    zSize="lg">{{ t('sharedLib.designConfigurator.controls.hugeCellDoor') }}</z-checkbox>
                </z-form-control>
                <p class="font-caption text-foreground/50 mt-1">{{ t('sharedLib.designConfigurator.controls.hugeCellDoorHint') }}</p>
              </z-form-field>
            }
          </div>
        }
      } @else {
        <p class="font-caption text-foreground/50 text-sm">{{ emptyMessage ? t(emptyMessage) : t('sharedLib.designConfigurator.controls.noColumnsAvailable') }}</p>
      }
    </div>
  `
})
export class ColumnConfigPanel {
  @Input() columnIndices: number[] = []
  @Input() selectedIndex: number = 0
  @Input() config: any = null
  
  @Input() hugeCellLabel = 'sharedLib.designConfigurator.controls.hugeCellLabel'
  @Input() hugeCellDescription = 'sharedLib.designConfigurator.controls.hugeCellDescription'
  @Input() emptyMessage = 'sharedLib.designConfigurator.controls.noColumnsAvailable'

  @Output() selectColumn = new EventEmitter<number>()
  @Output() hugeCellChange = new EventEmitter<boolean>()
  @Output() hugeCellDoorChange = new EventEmitter<boolean>()
  @Output() doorsChange = new EventEmitter<string | string[]>()
  @Output() drawersChange = new EventEmitter<string | string[]>()

  onSelect(idx: number) {
    this.selectColumn.emit(idx)
  }
}
