import { NestedTreeControl } from "@angular/cdk/tree";
import { MatTreeNestedDataSource, MatTree } from "@angular/material/tree";

/**
 * Food data with nested structure.
 * Each node has a name and an optional list of children.
 */
export interface MessageNode {
  title: string;
  content: string;
  likes?: any[];
  author: string;
  timestamp: Date;
  parent: string;
  replies?: MessageNode[];
  _id: string;
}

export class TreeDataSource extends MatTreeNestedDataSource<MessageNode> {
  constructor(
    private treeControl: NestedTreeControl<MessageNode>,
    intialData: MessageNode[]
  ) {
    super();
    this._data.next(intialData);
  }

  /** Add node as child of parent */
  public add(node: MessageNode, parent: MessageNode) {
    // add dummy root so we only have to deal with `FoodNode`s
    const newTreeData = { title: "Dummy Root", content: '', author: '', timestamp: new Date(), parent: '', _id: '', replies: this.data };
    this._add(node, parent, newTreeData);
    this.data = newTreeData.replies;
  }

  /** Remove node from tree */
  public remove(node: MessageNode) {
    const newTreeData = { title: "Dummy Root", content: '', author: '', timestamp: new Date(), parent: '', _id: '', replies: this.data };
    this._remove(node, newTreeData);
    this.data = newTreeData.replies;
  }

  /*
   * For immutable update patterns, have a look at:
   * https://redux.js.org/recipes/structuring-reducers/immutable-update-patterns/
   */

  protected _add(newNode: MessageNode, parent: MessageNode, tree: MessageNode) {
    if (tree === parent) {
      console.log(
        `replacing children array of '${parent.title}', adding ${newNode.title}`
      );
      tree.replies = [...tree.replies!, newNode];
      this.treeControl.expand(tree);
      return true;
    }
    if (!tree.replies) {
      console.log(`reached leaf node '${tree.title}', backing out`);
      return false;
    }
    return this.update(tree, this._add.bind(this, newNode, parent));
  }

  _remove(node: MessageNode, tree: MessageNode): boolean {
    if (!tree.replies) {
      return false;
    }
    const i = tree.replies.indexOf(node);
    if (i > -1) {
      tree.replies = [
        ...tree.replies.slice(0, i),
        ...tree.replies.slice(i + 1)
      ];
      this.treeControl.collapse(node);
      console.log(`found ${node.title}, removing it from`, tree);
      return true;
    }
    return this.update(tree, this._remove.bind(this, node));
  }

  protected update(tree: MessageNode, predicate: (n: MessageNode) => boolean) {
    let updatedTree: MessageNode, updatedIndex: number;

    tree.replies!.find((node, i) => {
      if (predicate(node)) {
        console.log(`creating new node for '${node.title}'`);
        updatedTree = { ...node };
        updatedIndex = i;
        this.moveExpansionState(node, updatedTree);
        return true;
      }
      return false;
    });

    if (updatedTree!) {
      console.log(`replacing node '${tree.replies![updatedIndex!].title}'`);
      tree.replies![updatedIndex!] = updatedTree!;
      return true;
    }
    return false;
  }

  moveExpansionState(from: MessageNode, to: MessageNode) {
    if (this.treeControl.isExpanded(from)) {
      console.log(`'${from.title}' was expanded, setting expanded on new node`);
      this.treeControl.collapse(from);
      this.treeControl.expand(to);
    }
  }
}
