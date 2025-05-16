import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';

import { UserRole } from 'src/app/core/enum/auth-roles.enum';
import { NAVIGATION_MENU } from 'src/app/legacy-admin/@data-providers/sidebar-menu.data-provider';
import { AuthService } from 'src/app/legacy-admin/services/auth.service';

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
    return this._menuItems.filter((item) => item.roles.includes(role));
  });

  private readonly _authService = inject(AuthService);
  private readonly _menuItems = inject(NAVIGATION_MENU);

  ngOnInit(): void {
    const token = localStorage.getItem('accessToken');
    this.userRole.set(this._authService.getUserRole());
    this.isAdminUser.set(this._authService.isUserAdmin());
  }
}
