import { Component, OnInit, OnDestroy } from '@angular/core';
import { MessageService } from '../core/services/message.service';
import { AuthService } from '../auth/auth.service';
import { UserContextService } from '../core/services/user.context.service';
import {  Observable, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit {

unsubscribe$:Subject<any> = new Subject();
user:any;
currentUserSub: Subscription;

  constructor(
    public messageService: MessageService,
    public auth: AuthService,
    public userContext: UserContextService,
    ) { }

  ngOnInit() {
    this.currentUserSub = this.userContext.owner$.pipe(takeUntil(this.unsubscribe$)).subscribe(data=> {
      this.user = data;
    })

  }
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.unsubscribe();
  }

}
