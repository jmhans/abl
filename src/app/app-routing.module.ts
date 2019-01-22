import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {OwnerListComponent } from './owners/owner-list/owner-list.component';
import {PlayerListComponent } from './players/player-list/player-list.component';

const routes: Routes = [{path:'owners', component: OwnerListComponent}, 
                       {path:'players', component: PlayerListComponent}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
