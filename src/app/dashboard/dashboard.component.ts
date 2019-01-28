import { Component, OnInit } from '@angular/core';
import { Hero } from '../hero';
import { HeroService } from '../hero.service';

import { Owner } from '../owners/owner';
import { OwnerService } from '../owners/owner.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: [ './dashboard.component.css' ]
})

export class DashboardComponent implements OnInit {
  owners: Owner[] = [];
  
  constructor(private ownerService: OwnerService) { }

  ngOnInit() {
    this.getOwners();
  }

  getOwners(): void {
//     this.heroService.getHeroes()
//       .subscribe(heroes => this.heroes = heroes.slice(1, 5));
    this.ownerService.getOwners2()
      .subscribe(owners => this.owners = owners)
  }
}