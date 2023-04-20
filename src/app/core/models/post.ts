interface message {
  author: any,
  timestamp:Date,
  content: string,
}
export class Post {
  constructor(
    public _id: string,
    public title: string,
    public author: any,
    public timestamp:Date,
    public content: string,
    public replies: message[]
  ) {

  }
}


