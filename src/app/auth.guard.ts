import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.authService.checkSession().then(() => {
        if (this.authService.isAuthenticated()) { 
          resolve(true);
        } else {
          this.router.navigate(['/']);
          resolve(false);
        }
      }).catch(() => {
        this.router.navigate(['/']);
        resolve(false);
      });
    });
  }
}