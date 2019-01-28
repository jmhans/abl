import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
 
import { RosterListComponent }    from '../rosters/roster-list/roster-list.component';
import { RosterDetailsComponent }  from '../rosters/roster-details/roster-details.component';
 
const ownersRoutes: Routes = [
  { path: 'owners/roster',  component: RosterListComponent },
  { path: 'owners/detail', component: RosterDetailsComponent }
];
 
@NgModule({
  imports: [
    RouterModule.forChild(ownersRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class OwnersRoutingModule { }