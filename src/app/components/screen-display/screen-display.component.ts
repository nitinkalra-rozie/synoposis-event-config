import { Component, OnInit,Input} from '@angular/core';

@Component({
  selector: 'app-screen-display',
  templateUrl: './screen-display.component.html',
  styleUrls: ['./screen-display.component.css']
})
export class ScreenDisplayComponent implements OnInit {

  @Input() title: string = '';
  @Input() icon: string | null = null;
  @Input() imageUrl: string;
  @Input() showStartListeningButton: boolean = false;
  @Input() showStopScreenButton: boolean = false;
  @Input() ShowCombineDropdown: boolean=false;
  @Input() cards: Array<{ title: string, imageUrl: string, icon?: string }> = [];
  @Input() sessionValueDropdown: boolean=false;
  @Input() subSessionValueDropdown: boolean=false;
  constructor() { }

  ngOnInit() {
  }
  startListening(){
    
  }
  stopScreen(){}
}
