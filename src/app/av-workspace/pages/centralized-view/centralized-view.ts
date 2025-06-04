import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-centralized-view',
  templateUrl: './centralized-view.html',
  styleUrl: './centralized-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
})
export class CentralizedView {}
