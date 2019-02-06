import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {OwnerListComponent } from './owners/owner-list/owner-list.component';
import {PlayerListComponent } from './players/player-list/player-list.component';
import {RosterListComponent } from './rosters/roster-list/roster-list.component';
import { HeroesComponent } from './heroes/heroes.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HeroDetailComponent } from './hero-detail/hero-detail.component';
import { OwnersComponent } from './owners/owners.component';

const routes: Routes = [{path:'owners', component: OwnerListComponent, pathMatch: 'full'}, 
                       {path:'players', component: PlayerListComponent}, 
                       {path:'owners2', component: OwnersComponent}, 
                       {path: 'dashboard', component: DashboardComponent}, 
                       {path: '', redirectTo: 'dashboard', pathMatch: 'full'}, 
                       {path: 'detail/:id', component: HeroDetailComponent}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
