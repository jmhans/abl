import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-roster',
  templateUrl: './roster.component.html',
  styleUrls: ['./roster.component.scss']
})
export class RosterComponent implements OnInit {
  @Input() teamId: string;
  
  
  constructor() { }

  ngOnInit() {
  }

}
