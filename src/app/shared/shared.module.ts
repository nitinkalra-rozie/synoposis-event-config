import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OutsideClickDirective } from '../directives/outside-click.directive';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    OutsideClickDirective,
  ],
  exports: [
    OutsideClickDirective,
   
  ]
})
export class SharedModule { }
