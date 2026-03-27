import { ITableHeader } from '@admin-types/data-table.types';
import { Component, computed, ContentChild, Input, signal, TemplateRef } from '@angular/core';

@Component({
  selector: 'app-server-data-table',
  imports: [],
  templateUrl: './server-data-table.html',
  styleUrl: './server-data-table.scss',
})
export class ServerDataTable {
  // Inputs
  @Input() modelName!: string
  @Input() headers: ITableHeader[] = []
  @Input() density: 'default' | 'compact' | 'comfortable' = 'default'

  // ng Templates
  @ContentChild('readRow') readRow!: TemplateRef<any>
  @ContentChild('addForm') addForm!: TemplateRef<any>
  @ContentChild('updateForm') updateForm!: TemplateRef<any>
  @ContentChild('customActions') customActions!: TemplateRef<any>

  // state signals
  loading = signal(false)
  data = signal<any[]>([])
  dataLength = signal(0)

  page = signal(1)
  limit = signal(10)

  showAdd = true

  searchQuery = signal('')

  order = signal({
    sortBy: 'id',
    direction: 'desc'
  })

  hasActions = computed(() => {
    return !!this.updateForm || !!this.customActions
  })
}
