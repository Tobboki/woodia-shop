import { ZardContextMenuDirective } from 'src/app/shared/components/menu/context-menu.directive';
import { ZardMenuContentDirective } from 'src/app/shared/components/menu/menu-content.directive';
import { ZardMenuItemDirective } from 'src/app/shared/components/menu/menu-item.directive';
import { ZardMenuLabelComponent } from 'src/app/shared/components/menu/menu-label.component';
import { ZardMenuShortcutComponent } from 'src/app/shared/components/menu/menu-shortcut.component';
import { ZardMenuDirective } from 'src/app/shared/components/menu/menu.directive';

export const ZardMenuImports = [
  ZardContextMenuDirective,
  ZardMenuContentDirective,
  ZardMenuItemDirective,
  ZardMenuDirective,
  ZardMenuLabelComponent,
  ZardMenuShortcutComponent,
] as const;
