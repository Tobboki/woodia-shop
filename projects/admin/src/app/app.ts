import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from '@admin-core/services/theme.service';
import { LanguageService } from '@admin-core/services/language.service';
import { ZardToastComponent } from '@shared-components/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    ZardToastComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {

  constructor(
    private themeService: ThemeService,
    private langService: LanguageService
  ) { }

  ngOnInit() {
    this.themeService.init()
    this.langService.init()
  }

}
