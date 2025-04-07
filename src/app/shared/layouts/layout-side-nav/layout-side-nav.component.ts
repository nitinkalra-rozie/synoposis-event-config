import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
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
  private readonly _authService = inject(AuthService);

  protected userRoleRank = signal<number>(2);
  // TODO:@later use isAdminUser in the template as the necessity arises
  protected isAdminUser = signal<boolean>(false);

  ngOnInit(): void {
    const token = localStorage.getItem('accessToken');
    this._checkIsAdminUser(token);
    this.userRoleRank.set(this._authService.getUserRoleRank());
  }

  private _checkIsAdminUser(token: string | null): DecodedToken | null {
    if (!token) return null;

    try {
      const decoded: DecodedToken = jwtDecode(token);

      if (decoded?.username) {
        const normalizedEmail = decoded.username.toLowerCase().trim();
        this.isAdminUser.set(normalizedEmail.endsWith(ADMIN_EMAIL_DOMAIN));
      } else {
        this.isAdminUser.set(false);
      }

      return decoded;
    } catch (error) {
      console.error('Invalid token:', error);
      this.isAdminUser.set(false);
      return null;
    }
  }
}
