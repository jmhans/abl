import { Component, OnInit } from '@angular/core';
import { MessageService } from '../core/services/message.service';
import { AuthService } from '../auth/auth.service';
import { UserContextService } from '../core/services/user.context.service';
import {  Observable } from 'rxjs';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit {

  constructor(
    public messageService: MessageService,
    public auth: AuthService,
    public userContext: UserContextService,
    ) { }

  ngOnInit() {

  }

}
