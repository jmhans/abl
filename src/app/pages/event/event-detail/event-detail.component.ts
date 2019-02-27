// src/app/pages/event/event-detail/event-detail.component.ts
import { Component, Input } from '@angular/core';
import { AuthService } from './../../../auth/auth.service';
import { UtilsService } from './../../../core/utils.service';
import { EventModel } from './../../../core/models/event.model';

@Component({
  selector: 'app-event-detail',
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.css']
})
export class EventDetailComponent {
  @Input() event: EventModel;

  constructor(
    public utils: UtilsService,
    public auth: AuthService
  ) { }

}