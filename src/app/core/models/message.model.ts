
export class MessageNode {
  _id: string;
  title: string;
  replies?: MessageNode[];
  likes?: any[];
  content: string;
  author: string;
  timestamp: Date;
  parent: string;


}
export class MessageFlatNode {
  _id: string;
  title: string;
  level: number;
  likes?: any[];
  expandable: boolean;
  content: string;
  author: string;
  timestamp: Date;
  parent: string;
}
