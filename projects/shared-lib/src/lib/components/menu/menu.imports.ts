import { ZardContextMenuDirective } from '../menu/context-menu.directive';
import { ZardMenuContentDirective } from '../menu/menu-content.directive';
import { ZardMenuItemDirective } from '../menu/menu-item.directive';
import { ZardMenuLabelComponent } from '../menu/menu-label.component';
import { ZardMenuShortcutComponent } from '../menu/menu-shortcut.component';
import { ZardMenuDirective } from '../menu/menu.directive';

export const ZardMenuImports = [
  ZardContextMenuDirective,
  ZardMenuContentDirective,
  ZardMenuItemDirective,
  ZardMenuDirective,
  ZardMenuLabelComponent,
  ZardMenuShortcutComponent,
] as const;
