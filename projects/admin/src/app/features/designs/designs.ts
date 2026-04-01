import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ZardButtonComponent } from '@shared-components/button';
import { NgIcon } from '@ng-icons/core';
import { DataTable } from '@admin-shared/components/data-table/data-table';

@Component({
  selector: 'app-designs',
  imports: [RouterLink, ZardButtonComponent, NgIcon, DataTable],
  templateUrl: './designs.html',
  styleUrl: './designs.scss',
})
export class Designs {
  // Placeholder table data
  headers = [
    { key: 'id', title: 'ID' },
    { key: 'name', title: 'Design Line' },
    { key: 'category', title: 'Category' }
  ]

  items = []
}
