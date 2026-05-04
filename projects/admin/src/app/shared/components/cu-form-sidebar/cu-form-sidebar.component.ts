import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon } from '@ng-icons/core';

import { ZardButtonComponent } from '@shared-components/button';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-cu-form-sidebar',
  standalone: true,
  imports: [CommonModule, NgIcon, ZardButtonComponent, TranslocoDirective],
  templateUrl: './cu-form-sidebar.component.html',
})
export class CuFormSidebarComponent {
  @Input() isOpen = false;
  @Input() mode: 'add' | 'update' = 'add';
  @Input() modelName = 'item';
  @Input() title?: string;
  @Input() submitText?: string;
  @Input() isLoading = false;
  @Input() disableSubmit = true;
  @Input() disableReset = true;

  @Output() closeSidebar = new EventEmitter<void>();
  @Output() submitForm = new EventEmitter<void>();
  @Output() resetForm = new EventEmitter<void>();

  onClose() {
    this.closeSidebar.emit();
  }

  onSubmit() {
    this.submitForm.emit();
  }

  onReset() {
    this.resetForm.emit();
  }
}
