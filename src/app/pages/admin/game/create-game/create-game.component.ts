import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-create-game',
  templateUrl: './create-game.component.html',
  styleUrls: ['./create-game.component.scss']
})
export class CreateGameComponent implements OnInit {
  pageTitle = 'Create Game';

  constructor(private title: Title) { }

  ngOnInit() {
    this.title.setTitle(this.pageTitle);
  }

}

