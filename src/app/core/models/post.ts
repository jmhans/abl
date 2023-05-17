interface message {
  title:string,
  author: any,
  timestamp:Date,
  content: string,
}

interface Like {
  timestamp: Date,
  user: string
}
export class Post {
  constructor(
    public _id: string,
    public title: string,
    public author: any,
    public timestamp:Date,
    public content: string,
    public replies: Post[],
    public likes: Like[]
  ) {

  }
}


