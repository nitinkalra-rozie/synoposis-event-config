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

  goBack(): void {
    this._router.navigate(['/login']);
  }

  goToAdmin(): void {
    this._router.navigate(['']);
  }
}
