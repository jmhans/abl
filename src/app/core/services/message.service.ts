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

  add(message: string) {
    //this.messages.push(message);

    this.api.postAPIData$('posts', [{'title': "this is another title", "content": message}]).pipe(takeUntil(this.unsubscribe$)).subscribe(
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
