import { Component } from '@angular/core';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-plain',
  imports: [
    RouterOutlet,
  ],
  templateUrl: './plain.layout.html',
  styleUrl: './plain.layout.scss',
})
export class PlainLayout {

}
