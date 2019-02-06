import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

import { Owner, Team } from '../owners/owner';
import { OwnerService } from '../owners/owner.service';

@Component({
  selector: 'app-hero-detail',
  templateUrl: './hero-detail.component.html',
  styleUrls: [ './hero-detail.component.css' ]
})
export class HeroDetailComponent implements OnInit {
  @Input() owner: Owner;
  newTeamName: string;

  constructor(
    private route: ActivatedRoute,
    private ownerService: OwnerService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.getOwner();
  }
 
  getOwner(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.ownerService.getOwner(id)
      .subscribe(owner => this.owner = owner)
  }
  
  addTeam(name: string): void {
    var team: Team = {
      name: name,
    };
    this.owner.teams.push(team);
    //this.ownerService.addTeam(team ).subscribe(team=> this.owner.teams.push(team));
  }
  
  saveOwner(): void {
    this.ownerService.updateOwner2(this.owner)
      .subscribe(() => this.goBack());
  }

  goBack(): void {
    this.location.back();
  }
  
//   addAttribute(attVal: string): void {
//     this.hero.list.push(attVal);
//     this.save();
//   }
  
}