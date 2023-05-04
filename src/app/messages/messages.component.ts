import { Component, OnInit, OnDestroy } from '@angular/core';
import { MessageService } from '../core/services/message.service';
import { AuthService } from '../auth/auth.service';
import { UserContextService } from '../core/services/user.context.service';
import {  Observable, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {FlatTreeControl,NestedTreeControl} from '@angular/cdk/tree';
import {MatTreeFlatDataSource,MatTreeNestedDataSource, MatTreeFlattener} from '@angular/material/tree';


interface MessageNode {
  title: string;
  replies?: MessageNode[];
  likes?: any[];
}


@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss']
})
export class MessagesComponent implements OnInit {

unsubscribe$:Subject<any> = new Subject();
user:any;
currentUserSub: Subscription;
private _transformer = (node: MessageNode, level: number) => {
  return {
    expandable: !!node.replies && node.replies.length > 0,
    name: node.title,
    level: level,
  };
};
treeControl = new NestedTreeControl<MessageNode>(node => node.replies);
dataSource = new MatTreeNestedDataSource<MessageNode>();

  constructor(
    public messageService: MessageService,
    public auth: AuthService,
    public userContext: UserContextService,
    ) {

    }

  ngOnInit() {
    this.messageService.allPosts$.pipe(takeUntil(this.unsubscribe$)).subscribe(data=>{
      this.dataSource.data = data
    })
    this.currentUserSub = this.userContext.owner$.pipe(takeUntil(this.unsubscribe$)).subscribe(data=> {
      this.user = data;
    })

  }

  user_has_liked(msg, user) {
    if (msg.likes) {
      return msg.likes.find((like) => {return like.user == user})
    }
    return false
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.unsubscribe();
  }

  hasChild = (_: number, node: MessageNode) => !!node.replies && node.replies.length > 0;


}
