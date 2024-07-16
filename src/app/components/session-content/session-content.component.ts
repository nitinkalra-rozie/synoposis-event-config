import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-session-content',
  templateUrl: './session-content.component.html',
  styleUrls: ['./session-content.component.css']
})
export class SessionContentComponent implements OnInit {
  event_cards = [
    { title: 'Welcome Screen', imageUrl: '../../../assets/admin screen/welcomw_screen.svg' },
    { title: 'Thank You Screen', imageUrl: '../../../assets/admin screen/thank_you_page.svg' },
    { title: 'Info Screen', imageUrl: '../../../assets/admin screen/qr_screen.svg' },
  ];
  session_cards = [
    { title: 'Title & Speaker Name Screen', imageUrl: '../../../assets/admin screen/moderator_screen.svg' },
    { title: 'Backup Screen', imageUrl: '../../../assets/admin screen/welcomw_screen.svg' },
    { title: 'Post Session Insights Screens', imageUrl: '../../../assets/admin screen/summary_screen.svg',icon:'../../../assets/admin screen/note.svg' },
  ];
  multi_session_card=[
    { title: 'Post Session Insights Screens', imageUrl: '../../../assets/admin screen/summary_screen.svg' ,icon:'../../../assets/admin screen/note.svg'  },
 
  ]
  constructor() { }

  ngOnInit() {
  }

}
