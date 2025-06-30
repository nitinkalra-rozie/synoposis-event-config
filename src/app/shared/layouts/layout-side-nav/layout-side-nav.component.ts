import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { combineLatest } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthFacade } from 'src/app/core/auth/facades/auth-facade';
import { UserRole } from 'src/app/core/enum/auth-roles.enum';
import { NAVIGATION_MENU } from 'src/app/legacy-admin/@data-providers/sidebar-menu.data-provider';

@Component({
  selector: 'app-layout-side-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './layout-side-nav.component.html',
  styleUrl: './layout-side-nav.component.scss',
  imports: [RouterLinkActive, RouterLink, MatTooltipModule, MatIconModule],
})
export class LayoutSideNavComponent implements OnInit {
  protected readonly _menuItems = inject(NAVIGATION_MENU);

  protected readonly isAdminUser = signal<boolean>(false);
  protected readonly userRole = signal<UserRole | null>(null);
  protected readonly isLoading = signal<boolean>(true);

  protected readonly filteredMenuItems = computed(() => {
    const role = this.userRole();
    if (!role) return [];
    return this._menuItems.filter((item) => role && item.roles.includes(role));
  });

  private readonly _destroyRef = inject(DestroyRef);
  private readonly _authFacade = inject(AuthFacade);

  ngOnInit(): void {
    this.loadUserPermissions();
  }

  private loadUserPermissions(): void {
    combineLatest([
      this._authFacade.getUserRole$(),
      this._authFacade.isUserAdmin$(),
    ])
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        tap(([userRole, isAdmin]) => {
          this.userRole.set(userRole);
          this.isAdminUser.set(isAdmin);
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }
}
