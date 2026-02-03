import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header as CustomerHeader } from '../../components/header/header';

@Component({
  selector: 'woodia-main-layout',
  imports: [
    RouterOutlet,
    CustomerHeader,
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {

}
