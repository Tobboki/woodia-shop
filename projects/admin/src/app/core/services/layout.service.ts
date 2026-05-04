import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  sidebarCollapsed = signal(false);

  constructor() {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null) {
      this.sidebarCollapsed.set(saved === 'true');
    }
  }

  toggleSidebar() {
    this.sidebarCollapsed.update(c => {
      const next = !c;
      localStorage.setItem('sidebarCollapsed', next.toString());
      return next;
    });
  }

  setCollapsed(val: boolean) {
    this.sidebarCollapsed.set(val);
    localStorage.setItem('sidebarCollapsed', val.toString());
  }
}
