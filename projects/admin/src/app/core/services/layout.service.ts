import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  sidebarCollapsed = signal(false);

  toggleSidebar() {
    this.sidebarCollapsed.update(c => !c);
  }

  setCollapsed(val: boolean) {
    this.sidebarCollapsed.set(val);
  }
}
