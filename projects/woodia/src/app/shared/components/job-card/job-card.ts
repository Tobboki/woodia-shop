import {Component, Input} from '@angular/core';
import {IJob, TJobStatus} from '@woodia-types/job.types';
import {TranslocoDirective} from '@jsverse/transloco';
import {LanguageService} from '@woodia-core/services/language.service';
import {DatePipe} from '@angular/common';
import { getTextDir } from '@woodia-shared/utils/helpers';
import {ZardBadgeComponent} from '@shared-components/badge/badge.component';
import {NgIcon} from '@ng-icons/core';
import {ZardButtonComponent} from '@shared-components/button';
import {ZardDropdownImports} from '@shared-components/dropdown';
import {ZardMenuImports} from '@shared-components/menu';
@Component({
  selector: 'woodia-job-card',
  imports: [
    TranslocoDirective,
    DatePipe,
    ZardBadgeComponent,
    NgIcon,
    ZardButtonComponent,
    ZardMenuImports,
  ],
  templateUrl: './job-card.html',
  styleUrl: './job-card.scss',
})
export class JobCard {
  @Input() job: IJob = {} as IJob;

  constructor(
    public langService: LanguageService
  ) {}

  protected readonly getTextDir = getTextDir;

  getStatusColor(status: TJobStatus) {
    switch (status) {
      case "canceled":
        return '!bg-destructive';

      case "completed":
        return '!bg-success';

      case "pending":
        return '!bg-foreground';

      case "inProgress":
        return '!bg-primary';

      default:
        return '!bg-foreground';
    }

  }
}
