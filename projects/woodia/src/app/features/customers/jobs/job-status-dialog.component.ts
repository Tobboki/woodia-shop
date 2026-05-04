import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZardDialogRef } from '@shared-components/dialog/dialog-ref';
import { Z_MODAL_DATA } from '@shared-components/dialog/dialog.service';
import { ZardSelectComponent, ZardSelectItemComponent } from '@shared-components/select';
import { ZardButtonComponent } from '@shared-components/button';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { TJobStatus } from '@woodia-types/job.types';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'woodia-job-status-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardButtonComponent,
    TranslocoDirective,
  ],
  template: `
    <div class="space-y-6 py-2" *transloco="let t; read: 'features.customers.jobs'">
      <div class="space-y-2">
        <label class="text-sm font-medium text-foreground">
          {{ t('selectNewStatus') }}
        </label>
        <z-select [(ngModel)]="selectedStatus" class="w-full" [zPlaceholder]="t('selectAnOption')">
          <z-select-item [zValue]="currentStatus">{{ t('jobStatus.' + currentStatus) }}</z-select-item>
          
          @if (currentStatus === 'Pending') {
            <z-select-item zValue="InProgress">{{ t('jobStatus.InProgress') }}</z-select-item>
            <z-select-item zValue="Canceled">{{ t('jobStatus.Canceled') }}</z-select-item>
          } @else if (currentStatus === 'InProgress') {
            <z-select-item zValue="Completed">{{ t('jobStatus.Completed') }}</z-select-item>
          }
        </z-select>
        <p class="text-xs text-muted-foreground mt-2">
          {{ t('statusChangeHint') }}
        </p>
      </div>

      <div class="flex justify-end gap-3 pt-4 border-t border-border">
        <button z-button zType="outline" (click)="cancel()">
          {{ t('cancel') }}
        </button>
        <button z-button (click)="confirm()" [zDisabled]="selectedStatus === currentStatus">
          {{ t('confirm') }}
        </button>
      </div>
    </div>
  `
})
export class JobStatusDialogComponent {
  private dialogRef = inject(ZardDialogRef);
  private data = inject(Z_MODAL_DATA);

  currentStatus: TJobStatus = this.data.status;
  selectedStatus: TJobStatus = this.data.status;

  confirm() {
    this.dialogRef.close(this.selectedStatus);
  }

  cancel() {
    this.dialogRef.close();
  }
}
