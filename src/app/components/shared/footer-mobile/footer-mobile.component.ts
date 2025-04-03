import { Component } from '@angular/core';

@Component({
  selector: 'app-footer-mobile',
  templateUrl: './footer-mobile.component.html',
  styleUrls: ['./footer-mobile.component.scss'],
  standalone: true,
})
export class FooterMobileComponent {
  protected get copyrightYear(): number {
    return new Date().getFullYear();
  }
}
