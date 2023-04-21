import { Injectable, OnDestroy } from '@angular/core';
import { ApiService } from '../api.service';
import {  Observable, Subject } from 'rxjs';
import { Post } from '.././models/post';
import { takeUntil, filter,  } from 'rxjs/operators';


@Injectable({
  providedIn: 'root',
})
export class MessageService implements OnDestroy {
  messages: string[] = [];

  allPosts$: Observable<Post[]>
  unsubscribe$: Subject<void> = new Subject<void>();

  constructor (
    public api: ApiService) {
      this.getPosts()
    }

    getPosts() {
      this.allPosts$ = this.api.getAPIData$('posts')
    }

  add(author: string,  message: string) {
    //this.messages.push(message);

    this.api.postAPIData$('posts', [{'title': "this is another title", "author": author, "content": message, 'timestamp': new Date()}]).pipe(takeUntil(this.unsubscribe$)).subscribe(
      res=> {
        this.getPosts()
      },
      err => {
        console.error(err)
      })
  }

  reply(id: string,user: string, newReply: string) {

    this.api.putAPIData$('posts', id, {$push: {'replies': {'content': newReply, 'author': user, 'timestamp': new Date()}}}).pipe(takeUntil(this.unsubscribe$)).subscribe(
      res=> {
        this.getPosts()
      },
      err => {
        console.error(err)
      })
  }

  clear() {
    this.messages = [];
  }


    ngOnDestroy() {

      this.unsubscribe$.next();
      this.unsubscribe$.complete();
    }

}
