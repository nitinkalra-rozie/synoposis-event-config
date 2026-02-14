import { CommonModule } from '@angular/common';
import {
    ChangeDetectorRef,
    Component,
    ElementRef,
    inject,
    OnInit,
    ViewChild,
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { BackendApiService } from 'src/app/legacy-admin/@services/backend-api.service';
import { LegacyBackendApiService } from 'src/app/legacy-admin/services/legacy-backend-api.service';

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.svg'];
const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/svg+xml',
];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export interface ConfigAssetItem {
  name: string;
  key?: string;
  url?: string;
  uploadedAt?: string;
}

export interface UploadAssetDialogData {
  eventIdentifier?: string;
  domain?: string;
  displayErrorMessageFn?: (msg: string) => void;
  existingAssets?: ConfigAssetItem[];
}

/**
 * Dialog for listing configuration assets and uploading new ones.
 * Accepts .png, .jpg, .jpeg, and .svg files.
 */
@Component({
  selector: 'app-upload-asset-dialog',
  standalone: true,
  templateUrl: './upload-asset-dialog.component.html',
  styleUrls: ['./upload-asset-dialog.component.scss'],
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressBarModule,
    MatSnackBarModule,
  ],
})
export class UploadAssetDialogComponent implements OnInit {
  @ViewChild('fileInput') private _fileInput!: ElementRef<HTMLInputElement>;

  public selectedFile: File | null = null;
  public isUploading = false;
  public isLoadingAssets = false;
  public deletingKey: string | null = null;
  public assetList: ConfigAssetItem[] = [];

  private readonly _dialogRef = inject(
    MatDialogRef<UploadAssetDialogComponent>
  );
  private readonly _dialogData = inject<UploadAssetDialogData>(MAT_DIALOG_DATA);
  private readonly _backendApi = inject(BackendApiService);
  private readonly _legacyBackend = inject(LegacyBackendApiService);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _cdr = inject(ChangeDetectorRef);

  constructor() {}

  ngOnInit(): void {
    this.loadAssets();
  }

  public get dialogData(): UploadAssetDialogData {
    return this._dialogData;
  }

  public get eventName(): string | null {
    return (
      this._dialogData.eventIdentifier ??
      this._legacyBackend.getCurrentEventName() ??
      null
    );
  }

  loadAssets(): void {
    const eventName = this.eventName;
    if (!eventName) {
      this.assetList = [...(this._dialogData.existingAssets ?? [])];
      this._cdr.detectChanges();
      return;
    }
    this.isLoadingAssets = true;
    this._cdr.detectChanges();
    firstValueFrom(this._backendApi.listAssets(eventName))
      .then((res) => {
        if (res?.success && res.data?.files?.length) {
          this.assetList = res.data.files.map((f) => ({
            name: f.key.split('/').pop() ?? f.key,
            key: f.key,
            url: f.url,
            uploadedAt: f.lastModified ?? undefined,
          }));
        } else {
          this.assetList = [];
        }
        this._cdr.detectChanges();
      })
      .catch(() => {
        this.assetList = [...(this._dialogData.existingAssets ?? [])];
        this._cdr.detectChanges();
      })
      .finally(() => {
        this.isLoadingAssets = false;
        this._cdr.detectChanges();
      });
  }

  onDeleteAsset(asset: ConfigAssetItem): void {
    const key = asset.key;
    const eventName = this.eventName;
    if (!key || !eventName) return;
    this.deletingKey = key;
    this._cdr.detectChanges();
    firstValueFrom(this._backendApi.deleteAsset(key, eventName))
      .then((res: { success?: boolean; message?: string }) => {
        if (res?.success) {
          this.assetList = this.assetList.filter((a) => a.key !== key);
          this._snackBar.open('Asset deleted.', 'Close', { duration: 3000 });
        } else {
          this.showError(
            (res as { message?: string })?.message ?? 'Delete failed'
          );
        }
        this._cdr.detectChanges();
      })
      .catch((err) => {
        const msg =
          err?.error?.message ?? err?.message ?? 'Failed to delete asset.';
        this.showError(msg);
        this._cdr.detectChanges();
      })
      .finally(() => {
        this.deletingKey = null;
        this._cdr.detectChanges();
      });
  }

  onCopyUrl(asset: ConfigAssetItem): void {
    const url = asset.url?.trim();
    if (!url) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(
        () => {
          this._snackBar.open('URL copied to clipboard.', 'Close', {
            duration: 3000,
          });
        },
        () => {
          this.showError('Failed to copy URL.');
        }
      );
    } else {
      this.showError('Clipboard not available.');
    }
  }

  openFileDialog(): void {
    this._fileInput?.nativeElement?.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const ext = file.name.includes('.')
      ? '.' + file.name.split('.').pop()?.toLowerCase()
      : '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      this.showError('Invalid file type. Allowed: .png, .jpg, .jpeg, .svg');
      input.value = '';
      return;
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type) && file.type !== '') {
      this.showError('Invalid file type. Allowed: PNG, JPG, JPEG, SVG.');
      input.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.showError('File size must be less than 10MB.');
      input.value = '';
      return;
    }
    this.selectedFile = file;
    this._cdr.detectChanges();
  }

  removeFile(): void {
    this.selectedFile = null;
    if (this._fileInput?.nativeElement) {
      this._fileInput.nativeElement.value = '';
    }
    this._cdr.detectChanges();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  onUpload(): void {
    if (!this.selectedFile) return;
    this.isUploading = true;
    this._cdr.detectChanges();
    const eventId =
      this._dialogData.eventIdentifier ??
      this._legacyBackend.getCurrentEventName() ??
      undefined;
    const prefix = eventId ? `configAsset/${eventId}` : 'configAsset';
    firstValueFrom(
      this._backendApi.uploadAsset(this.selectedFile, {
        prefix,
        contentType: this.selectedFile.type || undefined,
      })
    )
      .then((res) => {
        if (!res?.success) {
          throw new Error(
            (res as { message?: string })?.message ?? 'Upload failed'
          );
        }
        const data = res.data as {
          key?: string;
          fileName?: string;
          url?: string;
        };
        this.assetList = [
          ...this.assetList,
          {
            name: data?.fileName ?? this.selectedFile!.name,
            key: data?.key,
            url: data?.url,
            uploadedAt: new Date().toISOString(),
          },
        ];
        this._snackBar.open('Asset uploaded successfully.', 'Close', {
          duration: 3000,
        });
        this.removeFile();
        this._cdr.detectChanges();
      })
      .catch((err) => {
        console.error('Upload failed:', err);
        const msg =
          err?.error?.message ??
          err?.message ??
          'Upload failed. Please try again.';
        this.showError(msg);
      })
      .finally(() => {
        this.isUploading = false;
        this._cdr.detectChanges();
      });
  }

  onCancel(): void {
    this._dialogRef.close(
      this.assetList.length > 0 ? { assets: this.assetList } : null
    );
  }

  private showError(message: string): void {
    if (this._dialogData.displayErrorMessageFn) {
      this._dialogData.displayErrorMessageFn(message);
    } else {
      this._snackBar.open(message, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    }
  }
}
