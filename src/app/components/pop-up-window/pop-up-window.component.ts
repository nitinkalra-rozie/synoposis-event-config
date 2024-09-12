import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ModalService } from 'src/app/services/modal.service';

@Component({
  selector: 'app-pop-up-window',
  templateUrl: './pop-up-window.component.html',
  styleUrls: ['./pop-up-window.component.scss'],
  standalone: true,
})
export class PopUpWindowComponent implements OnInit, OnDestroy {
  constructor(private modalService: ModalService) {}

  protected title = '';
  protected message = '';
  protected isVisible = false;
  protected buttonType: 'yes_no' | 'ok' = 'yes_no';

  protected onConfirm: () => void;
  protected onCancel: () => void;

  private _subscription: Subscription;

  ngOnInit(): void {
    this._subscription = this.modalService
      .getModalState()
      .subscribe((state) => {
        this.isVisible = state.isVisible;
        this.title = state.title || '';
        this.message = state.message || '';
        this.onConfirm = state.onConfirm;
        this.onCancel = state.onCancel;
        this.buttonType = state.buttonType || 'yes_no';
      });
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  confirmAction(): void {
    this.modalService.close();
    if (this.onConfirm) {
      this.onConfirm();
    }
  }

  cancelAction(): void {
    this.modalService.close();
    if (this.onCancel) {
      this.onCancel();
    }
  }
}
