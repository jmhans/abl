import { Injectable, OnDestroy } from '@angular/core';
import { ApiService } from '../api.service';
import {  BehaviorSubject, Observable, Subject, merge } from 'rxjs';
import { Post } from '.././models/post';
import { takeUntil, filter, map, repeatWhen} from 'rxjs/operators';
import {CollectionViewer, SelectionChange, DataSource} from '@angular/cdk/collections';
import {FlatTreeControl} from '@angular/cdk/tree';


interface MessageNode {
  title: string;
  content: string;
  likes?: any[];
  author: string;
  timestamp: Date;
  parent: string;
  replies?: MessageNode[];
  _id: string;
}

@Injectable({
  providedIn: 'root',
})
export class MessageService implements OnDestroy {
  messages: string[] = [];

  allPosts$: Observable<Post[]>
  unsubscribe$: Subject<void> = new Subject<void>();
  allPostsSubj$: BehaviorSubject<MessageNode[]> = new BehaviorSubject([]);
  private messageData: MessageNode[];
  refresh$: Subject<void> = new Subject<void>();

  constructor (
    public api: ApiService) {
      this.getPosts()
    }

    getPosts() {
      //this.allPosts$ = this.api.getAPIData$('posts').pipe(map(this.mapMsgs)).subscribe
      this.api.getAPIData$('posts').pipe(takeUntil(this.unsubscribe$), map(this.mapMsgs), repeatWhen( ()=> this.refresh$)).subscribe(
        res=> {
          this.messageData =res
          this.updateMessages()
        },
        err => {
          console.error(err)
        })
    }

    updateMessages() {
      if (this.messageData) {this.allPostsSubj$.next(this.messageData)}
    }
    mapMsgs(msgList: MessageNode[]) {
      let rootNodes = msgList.filter((msg)=> {return !msg.parent})
      let getChildren = (node:MessageNode) => {
        return {
          _id: node._id,
          title: node.title,
          content: node.content,
          likes: node.likes,
          parent: node.parent,
          author: node.author,
          timestamp: node.timestamp,
          replies: msgList.filter(msg=> msg.parent == node._id).map(getChildren)
        }
      }
      // Find the direct children for each parent.
      return rootNodes.map(getChildren)


    }


  add(author: string,  message: string) {
    //this.messages.push(message);

    this.api.postAPIData$('posts', [{'title': "this is another title", "author": author, "content": message, 'timestamp': new Date()}]).pipe(takeUntil(this.unsubscribe$)).subscribe(
      res=> {
        //this.getPosts()
        this.refresh$.next()
      },
      err => {
        console.error(err)
      })
  }

  reply(id: string,user: string, newReply: string) {

    // this.api.putAPIData$('posts', id, {$push: {'replies': {'content': newReply, 'author': user, 'timestamp': new Date()}}}).pipe(takeUntil(this.unsubscribe$)).subscribe(
    //   res=> {
    //     this.getPosts()
    //   },
    //   err => {
    //     console.error(err)
    //   })
      this.api.postAPIData$('posts', [{
        content: newReply,
        author: user,
        parent: id,
        timestamp: new Date()
      }]).pipe(takeUntil(this.unsubscribe$)).subscribe(
        res=> {
          //this.getPosts()
          this.refresh$.next();
        },
        err => {
          console.error(err)
        })
    }

  togglelike(id: string, user: string, status: boolean) {
    let updateString = {}
    if (status) {
      updateString ={$push: {'likes': {'user': user, 'timestamp': new Date()}}}
    } else {
      updateString ={$pull: {'likes': {'user': user}}}
    }
    this.api.putAPIData$('posts', id, updateString).pipe(takeUntil(this.unsubscribe$)).subscribe(
      res=> {
        //this.getPosts()
        this.refresh$.next();
      },
      err => {
        console.error(err)
      }
    )
  }

  clear() {
    this.messages = [];
  }


    ngOnDestroy() {

      this.unsubscribe$.next();
      this.unsubscribe$.complete();
    }

}
