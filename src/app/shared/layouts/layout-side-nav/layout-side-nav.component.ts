import {
  inject as angularInject,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { UserRole } from 'src/app/core/enum/auth-roles.enum';
import { NAVIGATION_MENU } from 'src/app/legacy-admin/@data-providers/sidebar-menu.data-provider';
import { AuthService } from 'src/app/legacy-admin/services/auth.service';

interface DecodedToken {
  [key: string]: any;
  username?: string;
}

const ADMIN_EMAIL_DOMAIN = '@rozie.ai';

@Component({
  selector: 'app-layout-side-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './layout-side-nav.component.html',
  styleUrl: './layout-side-nav.component.scss',
  imports: [RouterLinkActive, RouterLink, MatTooltipModule, MatIconModule],
})
export class LayoutSideNavComponent implements OnInit {
  protected readonly _authService = inject(AuthService);
  protected readonly _menuItems = angularInject(NAVIGATION_MENU);

  protected readonly isAdminUser = signal<boolean>(false);
  protected readonly userRole = signal<UserRole | null>(null);

  protected readonly filteredMenuItems = computed(() => {
    const role = this.userRole();
    if (!role) return [];
    return this._menuItems.filter((item) => role && item.roles.includes(role));
  });

  ngOnInit(): void {
    this.userRole.set(this._authService.getUserRole());
    const token = localStorage.getItem('accessToken');
    this._checkIsAdminUser(token);
  }

  private _checkIsAdminUser(token: string | null): DecodedToken | null {
    if (!token) return null;

    try {
      const decoded: DecodedToken = jwtDecode(token);
      const normalizedEmail = decoded?.username?.toLowerCase().trim();
      this.isAdminUser.set(
        normalizedEmail?.endsWith(ADMIN_EMAIL_DOMAIN) ?? false
      );
      return decoded;
    } catch (error) {
      console.error('Invalid token:', error);
      this.isAdminUser.set(false);
      return null;
    }
  }
}
