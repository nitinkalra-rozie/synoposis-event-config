import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

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
  private modalState: BehaviorSubject<ModalState> = new BehaviorSubject<ModalState>({ isVisible: false });

  getModalState() {
    return this.modalState.asObservable();
  }

  open(
    title: string,
    message: string,
    buttonType: 'yes_no' | 'ok' = 'yes_no',
    onConfirm?: () => void,
    onCancel?: () => void
  ) {
    this.modalState.next({ isVisible: true, title, message, onConfirm, onCancel, buttonType });
  }

  close() {
    this.modalState.next({ isVisible: false });
  }
}
