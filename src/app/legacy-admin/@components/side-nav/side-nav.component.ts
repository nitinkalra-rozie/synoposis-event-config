import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { AuthService } from 'src/app/legacy-admin/services/auth.service';
import { UserRole } from 'src/app/legacy-admin/shared/enums';

interface TabConfig {
  id: string;
  label: string;
  icon: string;
  isSvg?: boolean;
  route: string;
  roles: UserRole[];
}

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss'],
  imports: [RouterModule, MatTooltipModule, MatIconModule],
})
export class SideNavComponent implements OnInit {
  public readonly userRole = signal<UserRole | null>(null);
  public readonly visibleTabs = computed(() => {
    const role = this.userRole();
    return this._tabs.filter((tab) => tab.roles.includes(role!));
  });

  private readonly _authService = inject(AuthService);
  private readonly _tabs: TabConfig[] = [
    {
      id: 'admin',
      label: 'Admin Dashboard',
      icon: 'syn:space_dashboard_outlined',
      isSvg: true,
      route: '/admin',
      roles: [UserRole.SUPERADMIN, UserRole.ADMIN],
    },
    {
      id: 'insights-editor',
      label: 'Insights Editor',
      icon: 'dashboard',
      route: '/insights-editor',
      roles: [UserRole.SUPERADMIN, UserRole.EDITOR],
    },
    {
      id: 'content-editor',
      label: 'Content Editor',
      icon: 'description',
      route: '/content-editor',
      roles: [UserRole.SUPERADMIN, UserRole.EDITOR],
    },
    {
      id: 'agenda',
      label: 'Agenda Tool',
      icon: 'event',
      route: '/agenda',
      roles: [UserRole.SUPERADMIN, UserRole.EVENTORGANIZER],
    },
    {
      id: 'analytics',
      label: 'Analytics Dashboard',
      icon: 'analytics',
      route: '/analytics',
      roles: [UserRole.SUPERADMIN, UserRole.EVENTORGANIZER],
    },
  ];

  ngOnInit(): void {
    const token = localStorage.getItem('accessToken');
    this.userRole.set(this._authService.getUserRole());
    this._checkIsAdminUser(token);
  }

  private _checkIsAdminUser(token: string | null): void {
    if (!token) return;
    try {
      const decoded: any = jwtDecode(token);
      const normalizedEmail = decoded?.username?.toLowerCase().trim();
      const isAdmin = normalizedEmail?.endsWith('@rozie.ai');
    } catch (error) {
      console.error('Invalid token:', error);
    }
  }
}
