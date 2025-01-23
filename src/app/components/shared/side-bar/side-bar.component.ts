import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.scss'],
  imports: [RouterModule, MatTooltipModule, MatIconModule, CommonModule],
  standalone: true,
})
export class SideBarComponent implements OnInit {
  // Convert isAdminUser into a signal that defaults to false
  public isAdminUser = signal<boolean>(false);

  ngOnInit(): void {
    const token = localStorage.getItem('accessToken');
    this.checkIsAdminUser(token);
  }

  checkIsAdminUser(token: string): any | null {
    if (!token) return null;
    try {
      const decoded: any = jwtDecode(token);
      if (decoded?.username) {
        const normalizedEmail = decoded.username.toLowerCase().trim();
        if (normalizedEmail.endsWith('@rozie.ai')) {
          this.isAdminUser.set(true);
        } else {
          this.isAdminUser.set(false);
        }
      }
      return decoded;
    } catch (error) {
      console.error('Invalid token:', error);
      return null;
    }
  }
}
