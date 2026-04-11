import { ZardDropdownMenuItemComponent } from 'projects/shared-lib/src/lib/components/dropdown/dropdown-item.component';
import { ZardDropdownMenuContentComponent } from 'projects/shared-lib/src/lib/components/dropdown/dropdown-menu-content.component';
import { ZardDropdownDirective } from 'projects/shared-lib/src/lib/components/dropdown/dropdown-trigger.directive';
import { ZardDropdownMenuComponent } from 'projects/shared-lib/src/lib/components/dropdown/dropdown.component';
import { ZardMenuLabelComponent } from 'projects/shared-lib/src/lib/components/menu/menu-label.component';

export const ZardDropdownImports = [
  ZardDropdownMenuComponent,
  ZardDropdownMenuItemComponent,
  ZardMenuLabelComponent,
  ZardDropdownMenuContentComponent,
  ZardDropdownDirective,
] as const;
