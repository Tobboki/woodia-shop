import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ZardButtonComponent } from '@shared/components/button/button.component';

@Component({
  selector: 'woodia-error-page',
  imports: [
    ZardButtonComponent
  ],
  templateUrl: './error-page.html',
  styleUrl: './error-page.scss',
})
export class ErrorPage {
  constructor(
    private router: Router
  ) {}

  goToHomepage() {
    this.router.navigate(['/'])
  }
}
