import { Injectable, OnDestroy } from '@angular/core';
import { ApiService } from '../api.service';
import {  BehaviorSubject, Observable, Subject, merge } from 'rxjs';
import { Post } from '.././models/post';
import { takeUntil, filter, map} from 'rxjs/operators';
import {CollectionViewer, SelectionChange, DataSource} from '@angular/cdk/collections';
import {FlatTreeControl} from '@angular/cdk/tree';


interface MessageNode {
  title: string;
  content: string;
  replies?: MessageNode[];
  likes?: any[];
}
export class DynamicMessageNode {
  constructor(
    public item: MessageNode,
    public level = 1,
    public expandable = false,
    public isLoading = false,
  ) {}
}

@Injectable({providedIn:'root'})
export class DynamicDatabase {
  dataMap = new Map<string, string[]>([
    ['Fruits', ['Apple', 'Orange', 'Banana']],
    ['Vegetables', ['Tomato', 'Potato', 'Onion']],
    ['Apple', ['Fuji', 'Macintosh']],
    ['Onion', ['Yellow', 'White', 'Purple']],
  ]);

  rootLevelNodes: string[] = ['Fruits', 'Vegetables'];

  /** Initial data from database */
  initialData(): DynamicMessageNode[] {
    return this.rootLevelNodes.map(name => new DynamicMessageNode(name, 0, true));
  }

  getChildren(node: string): string[] | undefined {
    return this.dataMap.get(node);
  }

  isExpandable(node: string): boolean {
    return this.dataMap.has(node);
  }
}

export class DynamicDataSource implements DataSource<DynamicMessageNode> {
  dataChange = new BehaviorSubject<DynamicMessageNode[]>([]);

  get data(): DynamicMessageNode[] {
    return this.dataChange.value;
  }
  set data(value: DynamicMessageNode[]) {
    this._treeControl.dataNodes = value;
    this.dataChange.next(value);
  }

  constructor(
    private _treeControl: FlatTreeControl<DynamicMessageNode>,
    private _database: DynamicDatabase,
  ) {}

  connect(collectionViewer: CollectionViewer): Observable<DynamicMessageNode[]> {
    this._treeControl.expansionModel.changed.subscribe(change => {
      if (
        (change as SelectionChange<DynamicMessageNode>).added ||
        (change as SelectionChange<DynamicMessageNode>).removed
      ) {
        this.handleTreeControl(change as SelectionChange<DynamicMessageNode>);
      }
    });

    return merge(collectionViewer.viewChange, this.dataChange).pipe(map(() => this.data));
  }

  disconnect(collectionViewer: CollectionViewer): void {}

  /** Handle expand/collapse behaviors */
  handleTreeControl(change: SelectionChange<DynamicMessageNode>) {
    if (change.added) {
      change.added.forEach(node => this.toggleNode(node, true));
    }
    if (change.removed) {
      change.removed
        .slice()
        .reverse()
        .forEach(node => this.toggleNode(node, false));
    }
  }

  /**
   * Toggle the node, remove from display list
   */
  toggleNode(node: DynamicMessageNode, expand: boolean) {
    const children = this._database.getChildren(node.item);
    const index = this.data.indexOf(node);
    if (!children || index < 0) {
      // If no children, or cannot find the node, no op
      return;
    }

    node.isLoading = true;

    setTimeout(() => {
      if (expand) {
        const nodes = children.map(
          name => new DynamicMessageNode(name, node.level + 1, this._database.isExpandable(name)),
        );
        this.data.splice(index + 1, 0, ...nodes);
      } else {
        let count = 0;
        for (
          let i = index + 1;
          i < this.data.length && this.data[i].level > node.level;
          i++, count++
        ) {}
        this.data.splice(index + 1, count);
      }

      // notify the change
      this.dataChange.next(this.data);
      node.isLoading = false;
    }, 1000);
  }
}



@Injectable({
  providedIn: 'root',
})
export class MessageService implements OnDestroy {
  messages: string[] = [];

  allPosts$: Observable<Post[]>
  unsubscribe$: Subject<void> = new Subject<void>();
  allPostsSubj$: Subject<Post[]>


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

  togglelike(id: string, user: string, status: boolean) {
    let updateString = {}
    if (status) {
      updateString ={$push: {'likes': {'user': user, 'timestamp': new Date()}}}
    } else {
      updateString ={$pull: {'likes': {'user': user}}}
    }
    this.api.putAPIData$('posts', id, updateString).pipe(takeUntil(this.unsubscribe$)).subscribe(
      res=> {
        this.getPosts()
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
