import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { AuthService } from 'src/app/core/auth/services/auth-service';
import { getDefaultRedirectUrl } from 'src/app/core/auth/utils/auth-utils';
import { UserRole } from 'src/app/core/enum/auth-roles.enum';

@Component({
  selector: 'app-unauthorized',
  imports: [MatIconModule],
  templateUrl: './unauthorized.html',
  styleUrls: ['./unauthorized.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Unauthorized {
  private readonly _router = inject(Router);
  private readonly _authService = inject(AuthService);
  private readonly _destroyRef = inject(DestroyRef);

  goBack(): void {
    this._navigateBasedOnUserRole();
  }

  goToHome(): void {
    this._navigateBasedOnUserRole();
  }

  logout(): void {
    this._authService
      .logout$()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe();
  }

  private _navigateBasedOnUserRole(): void {
    this._authService
      .getUserRole$()
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        tap((userRole: UserRole | null) => {
          if (userRole && userRole !== UserRole.UNAUTHENTICATED) {
            this._router.navigate([getDefaultRedirectUrl(userRole)]);
          } else {
            this._router.navigate(['/login']);
          }
        })
      )
      .subscribe();
  }
}
