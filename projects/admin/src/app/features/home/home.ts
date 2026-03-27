import { Component } from '@angular/core';
import { DataTable } from "../../shared/components/data-table/data-table";

@Component({
  selector: 'app-home',
  imports: [ DataTable],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  headers = [
    { key: 'id', title: 'ID' },
    { key: 'name', title: 'Name' },
    { key: 'email', title: 'Email' }
  ]

  items = [
    { id: 1, name: 'A' },
    { id: 3, name: 'C' }
  ]
}
