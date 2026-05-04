import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CrudServerDataTableComponent, CuFormSidebarComponent } from '@admin-shared/components';
import { PagedRequest, PagedResponse, TableHeader } from '@admin-types/data-table.types';

// Mock User interface
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [CommonModule, CrudServerDataTableComponent, CuFormSidebarComponent],
  template: `
    <div class="p-6 h-full flex flex-col">
      <app-crud-server-data-table
        modelName="User"
        [headers]="headers"
        [items]="items()"
        [pagedResponse]="pagedResponse()"
        [loading]="loading()"
        [allowedOperations]="{ add: true, update: true, delete: true, readSingle: true }"
        (addClicked)="onAddClicked()"
        (editClicked)="onEditClicked($event)"
        (deleteClicked)="onDeleteClicked($event)"
        (viewClicked)="onViewClicked($event)"
        (queryParamsChanged)="loadUsers($event)">
        
        <!-- Example of providing custom content via projected slots -->
        <ng-container slot="customActions">
          <!-- Custom action buttons would go here -->
        </ng-container>

      </app-crud-server-data-table>

      <!-- Sidebar Form for Add/Edit -->
      <app-cu-form-sidebar
        [isOpen]="sidebarOpen()"
        [mode]="sidebarMode()"
        modelName="User"
        [isLoading]="submitting()"
        [disableSubmit]="false"
        [disableReset]="false"
        (closeSidebar)="closeSidebar()"
        (submitForm)="onSubmitForm()"
        (resetForm)="onResetForm()">
        
        <div class="space-y-4">
          <!-- Form fields go here -->
          <p class="text-sm text-muted-foreground">Form fields for {{ sidebarMode() }} User would be here.</p>
        </div>
      </app-cu-form-sidebar>
    </div>
  `
})
export class UsersPageComponent {
  // Signals for Table State
  pagedResponse = signal<PagedResponse<User> | null>(null);
  items = signal<User[]>([]);
  loading = signal<boolean>(false);

  // Signals for Sidebar State
  sidebarOpen = signal<boolean>(false);
  sidebarMode = signal<'add' | 'update'>('add');
  submitting = signal<boolean>(false);
  editingId = signal<string | null>(null);

  headers: TableHeader[] = [
    { key: 'id', title: 'ID', sortable: true },
    { key: 'name', title: 'Name', sortable: true },
    { key: 'email', title: 'Email', sortable: true },
    { key: 'role', title: 'Role', sortable: true, align: 'center' }
  ];

  loadUsers(req: PagedRequest) {
    this.loading.set(true);
    
    // Simulate API call
    setTimeout(() => {
      // Mock Data
      const mockData: User[] = Array.from({ length: req.pageSize }).map((_, i) => {
        const idNum = (req.pageNumber - 1) * req.pageSize + i + 1;
        return {
          id: idNum.toString(),
          name: `User ${idNum}`,
          email: `user${idNum}@example.com`,
          role: idNum % 3 === 0 ? 'Admin' : 'User'
        };
      });

      const mockResponse: PagedResponse<User> = {
        items: mockData,
        pageNumber: req.pageNumber,
        totalPages: 5,
        hasPreviousPage: req.pageNumber > 1,
        hasNextPage: req.pageNumber < 5
      };

      this.pagedResponse.set(mockResponse);
      this.items.set(mockResponse.items);
      this.loading.set(false);
    }, 600);
  }

  // Action Handlers
  onAddClicked() {
    this.sidebarMode.set('add');
    this.editingId.set(null);
    this.sidebarOpen.set(true);
  }

  onEditClicked(id: string) {
    this.sidebarMode.set('update');
    this.editingId.set(id);
    this.sidebarOpen.set(true);
  }

  onDeleteClicked(id: string) {
    console.log('Delete User:', id);
    // Open confirmation dialog here
  }

  onViewClicked(id: string) {
    console.log('View User:', id);
    // Navigate to details page or open view sidebar
  }

  // Sidebar Handlers
  closeSidebar() {
    this.sidebarOpen.set(false);
    this.editingId.set(null);
  }

  onSubmitForm() {
    this.submitting.set(true);
    // Simulate save
    setTimeout(() => {
      this.submitting.set(false);
      this.closeSidebar();
      // Reload current page or navigate
    }, 1000);
  }

  onResetForm() {
    console.log('Reset form called');
  }
}
