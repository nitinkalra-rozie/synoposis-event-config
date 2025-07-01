import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { combineLatest, tap } from 'rxjs';
import { AuthFacade } from 'src/app/core/auth/facades/auth-facade';

import { UserRole } from 'src/app/core/enum/auth-roles.enum';
import { NAVIGATION_MENU } from 'src/app/legacy-admin/@data-providers/sidebar-menu.data-provider';

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss'],
  imports: [RouterModule, MatTooltipModule, MatIconModule],
})
export class SideNavComponent implements OnInit {
  public readonly userRole = signal<UserRole | null>(null);
  public readonly isAdminUser = signal(false);
  public readonly visibleMenuItems = computed(() => {
    const role = this.userRole();
    if (!role) return [];
    return this._menuItems.filter((item) => item.roles.includes(role));
  });

  private readonly _authFacade = inject(AuthFacade);
  private readonly _menuItems = inject(NAVIGATION_MENU);
  private readonly _destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.loadNavigationPermissions();
  }

  private loadNavigationPermissions(): void {
    combineLatest([
      this._authFacade.getUserRole$(),
      this._authFacade.isUserAdmin$(),
    ])
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        tap(([userRole, isAdmin]) => {
          this.userRole.set(userRole);
          this.isAdminUser.set(isAdmin);
        })
      )
      .subscribe();
  }
}
