import {
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
import { AuthService } from 'src/app/legacy-admin/services/auth.service';
import { UserRole } from 'src/app/legacy-admin/shared/enums';

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
  protected readonly isAdminUser = signal<boolean>(false);
  protected readonly visibleTabs = computed(() => {
    const role = this.userRole();

    switch (role) {
      case UserRole.SUPERADMIN:
        return [
          'admin',
          'insights-editor',
          'content-editor',
          'agenda',
          'analytics',
        ];
      case UserRole.ADMIN:
        return ['admin'];
      case UserRole.EVENTORGANIZER:
        return ['agenda', 'analytics'];
      case UserRole.EDITOR:
        return ['insights-editor', 'content-editor'];
      default:
        return [];
    }
  });

  protected userRole = signal<UserRole | null>(null);

  ngOnInit(): void {
    this.userRole.set(this._authService.getUserRole());

    const token = localStorage.getItem('accessToken');
    this._checkIsAdminUser(token);
  }

  protected showTab(tab: string): boolean {
    return this.visibleTabs().includes(tab);
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
