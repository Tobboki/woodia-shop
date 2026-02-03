import { Component, OnInit } from '@angular/core';
import { AuthService } from '@shared/services/auth';
import { HeroSection } from './sections/hero-section/hero-section';

@Component({
  selector: 'app-home',
  imports: [
    HeroSection,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {


  user: any;
  userName: string | undefined;

  // constructor(private authService: AuthService) {}

  // ngOnInit(): void {
  // }

}
