import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

interface ModalState {
  isVisible: boolean;
  title?: string;
  message?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  buttonType?: 'yes_no' | 'ok'; // 'yes_no' for Yes/No buttons, 'ok' for an OK button
}

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private _modalState: BehaviorSubject<ModalState> =
    new BehaviorSubject<ModalState>({ isVisible: false });

  getModalState(): Observable<ModalState> {
    return this._modalState.asObservable();
  }

  open(
    title: string,
    message: string,
    buttonType: 'yes_no' | 'ok' = 'yes_no',
    onConfirm?: () => void,
    onCancel?: () => void
  ): void {
    this._modalState.next({
      isVisible: true,
      title,
      message,
      onConfirm,
      onCancel,
      buttonType,
    });
  }

  close(): void {
    this._modalState.next({ isVisible: false });
  }
}
