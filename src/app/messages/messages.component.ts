import { Component, OnInit, OnDestroy } from '@angular/core';
import { MessageService } from '../core/services/message.service';
import { AuthService } from '../auth/auth.service';
import { UserContextService } from '../core/services/user.context.service';
import {  Observable, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {FlatTreeControl,NestedTreeControl} from '@angular/cdk/tree';
import {MatTreeFlatDataSource,MatTreeNestedDataSource, MatTreeFlattener} from '@angular/material/tree';
import { MessageNode, MessageFlatNode } from './../core/models/message.model'

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss']
})
export class MessagesComponent implements OnInit {

unsubscribe$:Subject<any> = new Subject();
user:any;
currentUserSub: Subscription;

//prevExpansionModel: any;
//nestedNodeMap = new Map<MessageNode,MessageFlatNode>();
//flatNodeMap = new Map<MessageFlatNode, MessageNode>();
//flattener: MatTreeFlattener<MessageNode, MessageFlatNode>;
//flatTreeControl:FlatTreeControl<MessageFlatNode>;
//flatDataSource: MatTreeFlatDataSource<MessageNode, MessageFlatNode>;
dataSource: MatTreeNestedDataSource<MessageNode> = new MatTreeNestedDataSource();
nestedTreeControl:NestedTreeControl<MessageNode>= new NestedTreeControl<MessageNode>(node=> node.replies);;
prevNestedExpansionModel: any;


constructor(
    public messageService: MessageService,
    public auth: AuthService,
    public userContext: UserContextService,
    ) {
//      this.flattener = new MatTreeFlattener(
//        this.transformer,
//        this.getLevel,
//        this.isExpandable,
//        this.getReplies,
//      )
//      this.flatTreeControl = new FlatTreeControl<MessageFlatNode>(this.getLevel, this.isExpandable);
//      this.flatDataSource = new MatTreeFlatDataSource(this.flatTreeControl, this.flattener)

    }

//    getLevel = (node: MessageFlatNode) => node.level;

//    isExpandable = (node: MessageFlatNode) => node.expandable;

//    getReplies = (node: MessageNode): MessageNode[] => node.replies;
//    hasNoContent = (_: number, _nodeData: MessageFlatNode) => _nodeData._id === '';

//    transformer = (node: MessageNode, level: number) => {
//      const existingNode = this.nestedNodeMap.get(node);
//      const flatNode =
//        existingNode && existingNode._id === node._id ? {...existingNode, ...node} : {...new MessageFlatNode(), ...node};

      //flatNode._id = node._id;
//      flatNode.level = level;
//      flatNode.expandable = !!node.replies?.length;
//      this.flatNodeMap.set(flatNode, node);
//      this.nestedNodeMap.set(node, flatNode);
//      return flatNode;
//    };

  ngOnInit() {
    this.messageService.allPostsSubj$.pipe(takeUntil(this.unsubscribe$)).subscribe(data=>{
//      this.prevExpansionModel = this.flatTreeControl.expansionModel.selected
//      this.flatDataSource.data = data
//      this.prevExpansionModel.forEach(element => this.moveExpansionState(element));

      this.prevNestedExpansionModel = this.nestedTreeControl.expansionModel.selected
      this.dataSource.data = data
      this.prevNestedExpansionModel.forEach(element => this.moveNestedExpansionState(element));
    })
    this.currentUserSub = this.userContext.owner$.pipe(takeUntil(this.unsubscribe$)).subscribe(data=> {
      this.user = data;
    })

  }

//  moveExpansionState(from: MessageFlatNode ) {
//      this.flatTreeControl.collapse(from);
//      this.flatTreeControl.expand(this.flatTreeControl.dataNodes.find(n=> {return n._id == from._id}));
//  }
  moveNestedExpansionState(from: MessageNode) {
      this.nestedTreeControl.collapse(from);
      this.expandTreeToNode(from._id);

      //this.nestedTreeControl.expand(this.nestedTreeControl.dataNodes.find(n=> {return n._id == from._id}))
  }
  expandTreeToNode(nodeId: string) {
    let selectNode: MessageNode | null = this.findIsolatedMessageNode(this.dataSource.data, nodeId);
    if (selectNode != null ) {
        // expand the returned tree, from shallowest to deepest level
        //for (let i : number = selectNode.length - 1; i >= 0; --i)
          this.nestedTreeControl.expand(selectNode); //[i]);
        // function to make stuff happen when you click on a node.
    }
}

findIsolatedMessageNode(collection: MessageNode[], nodeId: string) : MessageNode | null {

for (let i = 0; i < collection.length; ++i) {
  let item: MessageNode = collection[i];
  if (item._id == nodeId) return item
  let chItem: MessageNode | null = this.findIsolatedMessageNode(item.replies, nodeId);
  if (chItem != null) {
    return chItem
  }
}
}

findTreeNode(collection: MessageNode[], nodeId: string) : MessageNode[] | null
{
    for (let i = 0; i < collection.length; ++i)
    {
        let item : MessageNode = collection[i];
        if (item._id == nodeId)
            return new Array(item);
        let chItem : MessageNode[] | null = this.findTreeNode(item.replies, nodeId);
        if (chItem != null) {
            chItem[chItem.length] = item;
            return chItem;
        }
    }
    return null;
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
