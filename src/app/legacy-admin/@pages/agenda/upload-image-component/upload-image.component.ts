import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BackendApiService } from 'src/app/legacy-admin/@services/backend-api.service';

export function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not found'));
        return;
      }

      // Set canvas to target size
      canvas.width = maxWidth;
      canvas.height = maxHeight;

      // Calculate scale to fill the canvas
      const scale = Math.max(maxWidth / img.width, maxHeight / img.height);

      // Calculate new dimensions
      const newWidth = img.width * scale;
      const newHeight = img.height * scale;

      // Calculate position to center and crop
      const x = (maxWidth - newWidth) / 2;
      const y = (maxHeight - newHeight) / 2;

      // Draw image to fill canvas
      ctx.drawImage(img, x, y, newWidth, newHeight);

      // Convert to JPEG
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas to Blob conversion failed'));
            return;
          }
          resolve(
            new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
          );
        },
        'image/jpeg',
        0.8 // Quality setting
      );
    };

    img.onerror = reject;
  });
}

export async function urlToFile(url: string, filename: string): Promise<File> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch image. Status: ${response.status} ${response.statusText}`
      );
    }

    const allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif'];
    const mimeType = response.headers.get('Content-Type') || '';

    if (!allowedTypes.includes(mimeType.toLowerCase())) {
      throw new Error(
        `Invalid MIME type: ${mimeType}. Allowed types are: ${allowedTypes.join(', ')}`
      );
    }
    const blob = await response.blob();
    return new File([blob], filename, { type: mimeType });
  } catch (error) {
    return null;
  }
}

export async function uploadSpeakerImage(
  file: File,
  backendApiService: BackendApiService
): Promise<string> {
  if (!file) return '';

  const fileExtension = file.type.replace('image/', '');
  const fileType = 'speaker_headshots';

  try {
    const uploadUrlResponse = await backendApiService
      .getUploadPresignedUrl(fileType, fileExtension)
      .toPromise();

    if (uploadUrlResponse?.['success']) {
      const preSignedUrl = uploadUrlResponse['data']['preSignedUrl'];
      const s3Key = uploadUrlResponse['data']['key'];
      await backendApiService
        .uploadFileUsingPreSignedUrl(file, preSignedUrl)
        .toPromise();
      return s3Key;
    }
  } catch (error) {
    console.error('Upload failed:', error);
    this.displayErrorMessageFn.emit('Error uploading image. Please try again.');
  }

  return '';
}

@Component({
  selector: 'app-speaker-image-uploader',
  templateUrl: './upload-image.component.html',
  styleUrls: ['./upload-image.component.scss'],
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
})
export class UploadImageComponent {
  @Input() public speakerImage!: string;
  @Input() public eventName!: string;
  @Input() public isUploading = false;

  @Output() public updateSpeakerImage: EventEmitter<string> =
    new EventEmitter<string>();
  @Output() public displayErrorMessageFn: EventEmitter<string> =
    new EventEmitter<string>();
  private _backendApiService = inject(BackendApiService);

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file && this.validateImage(file)) {
      this.isUploading = true;
      try {
        // Resize the image before uploading
        const resizedFile = await resizeImage(file, 400, 400);
        const imageS3Key = await uploadSpeakerImage(
          resizedFile,
          this._backendApiService
        );

        if (imageS3Key) {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            this.speakerImage = e.target.result;
          };
          reader.readAsDataURL(resizedFile);
          this.updateSpeakerImage.emit(imageS3Key);
        } else {
          this.displayErrorMessageFn.emit(
            'Error uploading image. Please try again.'
          );
        }
      } catch (error) {
        console.error(error);
        this.displayErrorMessageFn.emit(
          'Error uploading image. Please try again.'
        );
      } finally {
        this.isUploading = false;
        input.value = '';
      }
    }
  }

  onRemoveImage(): void {
    this.speakerImage = '';
    this.updateSpeakerImage.emit('');
  }

  private validateImage(file: File): boolean {
    const maxSize = 10 * 1024 * 1024; // 5MB
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

    if (!validTypes.includes(file.type)) {
      this.displayErrorMessageFn.emit(
        'Invalid file type. Please upload a JPEG, PNG or GIF.'
      );
      return false;
    }

    if (file.size > maxSize) {
      this.displayErrorMessageFn.emit('File size too large. Max 10MB allowed.');
      return false;
    }

    return true;
  }
}
