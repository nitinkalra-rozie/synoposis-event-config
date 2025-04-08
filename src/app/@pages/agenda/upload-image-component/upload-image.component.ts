import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BackendApiService } from 'src/app/@services/backend-api.service';

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

  async uploadSpeakerImage(file: File): Promise<string> {
    if (!file) return '';

    const fileExtension = file.type.replace('image/', '');
    const fileType = 'speaker_headshots';
    const eventName = this.eventName;

    try {
      const uploadUrlResponse = await this._backendApiService
        .getUploadPresignedUrl(eventName, fileType, fileExtension)
        .toPromise();

      if (uploadUrlResponse?.['success']) {
        const preSignedUrl = uploadUrlResponse['data']['preSignedUrl'];
        const s3Key = uploadUrlResponse['data']['key'];
        await this._backendApiService
          .uploadFileUsingPreSignedUrl(file, preSignedUrl)
          .toPromise();
        return s3Key;
      }
    } catch (error) {
      console.error('Upload failed:', error);
      this.displayErrorMessageFn.emit(
        'Error uploading image. Please try again.'
      );
    }

    return '';
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file && this.validateImage(file)) {
      this.isUploading = true;
      try {
        const imageS3Key = await this.uploadSpeakerImage(file);
        if (imageS3Key) {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            this.speakerImage = e.target.result;
          };
          reader.readAsDataURL(file);
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
    const maxSize = 5 * 1024 * 1024; // 5MB
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

    if (!validTypes.includes(file.type)) {
      this.displayErrorMessageFn.emit(
        'Invalid file type. Please upload a JPEG, PNG or GIF.'
      );
      return false;
    }

    if (file.size > maxSize) {
      this.displayErrorMessageFn.emit('File size too large. Max 5MB allowed.');
      return false;
    }

    return true;
  }
}
