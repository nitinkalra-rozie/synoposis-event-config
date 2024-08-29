import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ModalService } from 'src/app/services/modal.service';

@Component({
  selector: 'app-pop-up-window',
  templateUrl: './pop-up-window.component.html',
  styleUrls: ['./pop-up-window.component.css']
})
export class PopUpWindowComponent implements OnInit, OnDestroy {
  title = '';
  message = '';
  isVisible = false;
  buttonType: 'yes_no' | 'ok' = 'yes_no';
  private subscription: Subscription;
  public onConfirm: () => void;
  public onCancel: () => void;

  constructor(private modalService: ModalService) {}

  ngOnInit() {
    this.subscription = this.modalService.getModalState().subscribe(state => {
      this.isVisible = state.isVisible;
      this.title = state.title || '';
      this.message = state.message || '';
      this.onConfirm = state.onConfirm;
      this.onCancel = state.onCancel;
      this.buttonType = state.buttonType || 'yes_no';
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  confirmAction() {
    this.modalService.close();
    if (this.onConfirm) {
      this.onConfirm();
    }
  }

  cancelAction() {
    this.modalService.close();
    if (this.onCancel) {
      this.onCancel();
    }
  }
}
