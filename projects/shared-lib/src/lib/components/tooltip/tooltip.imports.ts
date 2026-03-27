import { OverlayModule } from '@angular/cdk/overlay';

import { ZardTooltipComponent, ZardTooltipDirective } from 'projects/shared-lib/src/lib/components/tooltip/tooltip';

export const ZardTooltipImports = [ZardTooltipComponent, ZardTooltipDirective, OverlayModule] as const;
