import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from '@shared/components/footer/footer';
import { Header } from '@shared/components/header/header';

@Component({
  selector: 'woodia-main-layout',
  imports: [
    RouterOutlet,
    Header,
    Footer,
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {

}
