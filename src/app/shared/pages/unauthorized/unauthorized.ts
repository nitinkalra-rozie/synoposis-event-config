import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  imports: [MatIconModule],
  templateUrl: './unauthorized.html',
  styleUrls: ['./unauthorized.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Unauthorized {
  private _router = inject(Router);
  private _location = inject(Location);

  goBack(): void {
    this._location.back();
  }

  goToAdmin(): void {
    this._router.navigate(['/av-workspace']);
  }
}
