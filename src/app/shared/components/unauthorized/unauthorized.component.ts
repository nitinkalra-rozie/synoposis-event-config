import { Location, NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  imports: [NgOptimizedImage, MatIconModule],
  templateUrl: './unauthorized.component.html',
  styleUrls: ['./unauthorized.component.scss'],
})
export class UnauthorizedComponent {
  private _router = inject(Router);
  private _location = inject(Location);

  goBack(): void {
    this._location.back();
  }

  goToAdmin(): void {
    this._router.navigate(['/admin']);
  }
}
