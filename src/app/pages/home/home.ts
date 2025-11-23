import { Component, OnInit } from '@angular/core';
import { AuthService } from '@shared/services/auth';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {


  user: any;
  userName: string | undefined;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    if (this.user) {
      this.userName = this.user.firstName;
    }
  }

}
