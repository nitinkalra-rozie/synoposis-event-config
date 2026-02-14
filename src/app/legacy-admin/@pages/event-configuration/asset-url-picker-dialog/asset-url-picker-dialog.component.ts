import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    inject,
    OnInit,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
    MAT_DIALOG_DATA,
    MatDialogModule,
    MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { firstValueFrom } from 'rxjs';
import { BackendApiService } from 'src/app/legacy-admin/@services/backend-api.service';

export interface AssetUrlPickerDialogData {
  eventName: string;
}

@Component({
  selector: 'app-asset-url-picker-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  template: `
    <h2 mat-dialog-title>Choose from asset library</h2>
    <mat-dialog-content>
      @if (loading) {
        <div class="picker-loading">
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
          <p>Loading assets...</p>
        </div>
      } @else if (assets.length === 0) {
        <p class="picker-empty">No assets found. Upload assets first.</p>
      } @else {
        <mat-list class="picker-list">
          @for (asset of assets; track asset.url) {
            <mat-list-item
              class="picker-item"
              (click)="select(asset.url)"
              role="button">
              <mat-icon matListItemIcon>image</mat-icon>
              <span matListItemTitle class="asset-name">{{ asset.name }}</span>
              <span matListItemMeta class="picker-arrow">&#8250;</span>
            </mat-list-item>
          }
        </mat-list>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .picker-loading {
        padding: 1rem;
      }
      .picker-loading p {
        margin: 0.5rem 0 0;
        font-size: 14px;
        color: #666;
      }
      .picker-empty {
        padding: 1.5rem;
        color: #666;
        margin: 0;
      }
      .picker-list {
        max-height: 320px;
        overflow-y: auto;
      }
      .picker-item {
        cursor: pointer;
      }
      .picker-item:hover {
        background: #f5f5f5;
      }
      .asset-name {
        font-size: 13px;
        word-break: break-word;
      }
      .picker-arrow {
        font-size: 18px;
        color: #999;
        font-weight: 300;
      }
    `,
  ],
})
export class AssetUrlPickerDialogComponent implements OnInit {
  private readonly _dialogRef = inject(
    MatDialogRef<AssetUrlPickerDialogComponent>
  );
  private readonly _data = inject<AssetUrlPickerDialogData>(MAT_DIALOG_DATA);
  private readonly _backendApi = inject(BackendApiService);
  private readonly _cdr = inject(ChangeDetectorRef);

  public loading = true;
  public assets: Array<{ name: string; url: string }> = [];

  ngOnInit(): void {
    this.loadAssets();
  }

  private loadAssets(): void {
    const eventName = this._data?.eventName ?? '';
    if (!eventName) {
      this.assets = [];
      this.loading = false;
      this._cdr.markForCheck();
      return;
    }
    firstValueFrom(this._backendApi.listS3Files(eventName))
      .then((res) => {
        if (res?.success && res.data?.files?.length) {
          this.assets = res.data.files.map((f) => ({
            name: (f.key ?? '').split('/').pop() ?? f.key ?? '',
            url: f.url ?? '',
          }));
        } else {
          this.assets = [];
        }
        this._cdr.markForCheck();
      })
      .catch(() => {
        this.assets = [];
        this._cdr.markForCheck();
      })
      .finally(() => {
        this.loading = false;
        this._cdr.markForCheck();
      });
  }

  select(url: string): void {
    this._dialogRef.close(url);
  }
}
