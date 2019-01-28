import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
 
import { RosterListComponent }    from './roster-list/roster-list.component';
import { RosterDetailsComponent }  from './roster-details/roster-details.component';
 
const rostersRoutes: Routes = [
  { path: 'rosters',  component: RosterListComponent },
  { path: 'roster/:id', component: RosterDetailsComponent }
];
 
@NgModule({
  imports: [
    RouterModule.forChild(rostersRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class RostersRoutingModule { }