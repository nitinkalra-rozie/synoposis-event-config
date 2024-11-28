import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    // This is a temporary implementation of checking if the user is authenticated. Check TODO below
    if (this.authService.getAccessToken()) {
      return true;
    } else {
      this.router.navigate(['/']);
      return false;
    }
  }

  // TODO: @later - Implement a proper login flow to use cognito or any auth provider and check session
  // canActivate(): Promise<boolean> {
  //   return new Promise<boolean>((resolve) => {
  //     this.authService
  //       .checkSession()
  //       .then(() => {
  //         if (this.authService.isAuthenticated()) {
  //           resolve(true);
  //         } else {
  //           this.router.navigate(['/']);
  //           resolve(false);
  //         }
  //       })
  //       .catch(() => {
  //         this.router.navigate(['/']);
  //         resolve(false);
  //       });
  //   });
  // }
}
