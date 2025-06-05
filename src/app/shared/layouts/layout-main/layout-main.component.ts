import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { LayoutHeaderComponent } from '../layout-header/layout-header.component';
import { LayoutSideNavComponent } from '../layout-side-nav/layout-side-nav.component';

@Component({
  selector: 'app-layout-main',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './layout-main.component.html',
  styleUrl: './layout-main.component.scss',
  imports: [
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    LayoutHeaderComponent,
    LayoutSideNavComponent,
  ],
})
export class LayoutMainComponent {
  public readonly title = input.required<string>();
  public readonly showElevation = input<boolean>(true);
}
