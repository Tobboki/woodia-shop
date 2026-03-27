import { ContentComponent } from 'projects/shared-lib/src/lib/components/layout/content.component';
import { FooterComponent } from 'projects/shared-lib/src/lib/components/layout/footer.component';
import { HeaderComponent } from 'projects/shared-lib/src/lib/components/layout/header.component';
import { LayoutComponent } from 'projects/shared-lib/src/lib/components/layout/layout.component';
import {
  SidebarComponent,
  SidebarGroupComponent,
  SidebarGroupLabelComponent,
} from 'projects/shared-lib/src/lib/components/layout/sidebar.component';

export const LayoutImports = [
  LayoutComponent,
  HeaderComponent,
  FooterComponent,
  ContentComponent,
  SidebarComponent,
  SidebarGroupComponent,
  SidebarGroupLabelComponent,
] as const;
