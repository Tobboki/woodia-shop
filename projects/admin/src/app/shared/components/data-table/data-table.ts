
import {
  Component,
  Input,
} from '@angular/core';
import { ITableHeader, TTableDensity } from '@admin-types/data-table.types';
import { ZardTableImports } from '@shared-components/table/table.imports';
@Component({
  selector: 'app-data-table',
  imports: [
    ZardTableImports
],
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss',
})
export class DataTable {
  // Input
  @Input() headers: ITableHeader[] = []
  @Input() items: any[] = []
  @Input() density: TTableDensity = 'default'
}
