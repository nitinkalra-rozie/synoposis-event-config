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
  protected readonly _menuItems = inject(NAVIGATION_MENU);

  protected readonly isAdminUser = signal<boolean>(false);
  protected readonly userRole = signal<UserRole | null>(null);

  protected readonly filteredMenuItems = computed(() => {
    const role = this.userRole();
    if (!role) return [];
    return this._menuItems.filter((item) => role && item.roles.includes(role));
  });

  ngOnInit(): void {
    this.userRole.set(this._authService.getUserRole());
    this.isAdminUser.set(this._authService.isUserAdmin());
  }
}
