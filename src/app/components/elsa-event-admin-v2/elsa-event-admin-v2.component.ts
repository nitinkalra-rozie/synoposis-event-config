import { Component, OnInit } from "@angular/core";
import { BackendApiService } from "src/app/services/backend-api.service";
import { EventDetail } from "src/app/shared/types";

@Component({
  selector: "app-elsa-event-admin-v2",
  templateUrl: "./elsa-event-admin-v2.component.html",
  styleUrls: ["./elsa-event-admin-v2.component.css"],
})
export class ElsaEventAdminV2Component implements OnInit {
  selectedEvent: string = "";
  selectedTheme: string = "dark";
  eventNames: Array<string> = [];
  eventDetails: Array<EventDetail> = [];

  constructor(private backendApiService: BackendApiService) {}

  ngOnInit() {
    this.getEventDetails();
  }

  getEventDetails = () => {
    this.backendApiService.getEventDetails().subscribe((data: any) => {
      this.eventDetails = data;
      this.populateEventNames();
      // this.selectDefaultOptions();
    });
  };

  populateEventNames = () => {
    this.eventNames = Array.from(
      new Set(this.eventDetails.map((event) => event.Event))
    );
  };
}
