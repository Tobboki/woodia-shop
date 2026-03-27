import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { ZardButtonComponent } from '@shared-components/button/button.component';

@Component({
  selector: 'woodia-error-page',
  imports: [
    ZardButtonComponent,
    TranslocoDirective,
    RouterLink,
  ],
  templateUrl: './error-page.html',
  styleUrl: './error-page.scss',
})
export class ErrorPage {

}
