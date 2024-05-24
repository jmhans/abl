import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OwnerListComponent } from './owners/owner-list/owner-list.component';
//import { RosterListComponent } from './rosters/roster-list/roster-list.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { OwnersComponent } from './owners/owners.component';
import { CallbackComponent } from './pages/callback/callback.component';
import { AuthGuard } from './auth/auth.guard';
import { AdminGuard } from './auth/admin.guard';
import { AdminComponent } from './pages/admin/admin.component';
import { AblAdminComponent } from './pages/admin/abl-admin/abl-admin.component';
import { TeamComponent } from './pages/team/team.component';
import { GameComponent } from './pages/game/game.component';
import { GamesComponent } from './pages/games/games.component';
import { PlayersComponent } from './pages/players/players.component';
import { StandingsComponent } from './pages/standings/standings.component';
import { SuppDraftComponent} from './pages/supp-draft/supp-draft.component';
import { MessagesComponent } from './messages/messages.component';


import { UpdateTeamComponent } from './pages/admin/update-team/update-team.component';
import { CreateTeamComponent } from './pages/admin/create-team/create-team.component';
import { DeleteTeamComponent } from './pages/admin/delete-team/delete-team.component';
import { UpdateGameComponent } from './pages/admin/game/update-game/update-game.component';
import { CreateGameComponent } from './pages/admin/game/create-game/create-game.component';
import { DeleteGameComponent } from './pages/admin/game/delete-game/delete-game.component';
import { ManageGamesComponent } from './pages/admin/manage-games/manage-games.component';
import { PlayoffsComponent } from './pages/playoffs/playoffs.component';
import { DraftComponent } from './pages/draft/draft.component';
import { HistoryComponent } from './pages/history/history.component';


const routes: Routes = [{path:'owners', component: OwnerListComponent, pathMatch: 'full'},
                       {path:'owners2', component: OwnersComponent},
                       {path: 'dashboard', component: DashboardComponent},
                       {path: '', redirectTo: 'dashboard', pathMatch: 'full'},
                       {path: 'games', canActivate: [AuthGuard], component: GamesComponent},
                       {path: 'callback', component: CallbackComponent},
                       {path: 'admin', canActivate: [ AuthGuard, AdminGuard ], children: [ { path: '', component: AdminComponent }]},
                       {path: 'team', canActivate:[ AuthGuard ], children: [ {path: ':id', component: TeamComponent},
                                                                            {path: 'update/:id', component: UpdateTeamComponent},
                                                                            {path: 'update/:id/owner/:ownerId', component: UpdateTeamComponent},
                                                                            {path: 'new', component: CreateTeamComponent},
                                                                            {path: 'delete/:id', component: DeleteTeamComponent}]},
                       {path: 'abladmin', canActivate: [ AuthGuard, AdminGuard ], children: [ { path: '', component: AblAdminComponent },
                                                                                            {path: 'games', component: ManageGamesComponent}]},
                       {path: 'create/team', component: CreateTeamComponent, canActivate: [ AuthGuard ]},
                        {path: 'create/game', component: CreateGameComponent, canActivate: [ AuthGuard ]},
                        {path: 'game', canActivate:[ AuthGuard ], children: [ {path: ':id', component: GameComponent},
                                                                            {path: 'update/:id', component: UpdateGameComponent},
                                                                            {path: 'update/:id/owner/:ownerId', component: UpdateGameComponent},
                                                                            {path: 'delete/:id', component: DeleteGameComponent}]},
                       {path: 'players', component: PlayersComponent, canActivate: [ AuthGuard ]},
                        {path: 'standings', component: StandingsComponent, canActivate: [ AuthGuard ]},
                        {path: 'suppdraft', component: SuppDraftComponent, canActivate: [ AuthGuard ]},
                        {path: 'draft', component: DraftComponent, canActivate: [ AuthGuard ]},
                        {path: 'playoffs', component: PlayoffsComponent, canActivate: [ AuthGuard ]},
                        {path: 'messages', component: MessagesComponent, canActivate: [ AuthGuard ]},
                        {path: 'history', component: HistoryComponent, canActivate: [ AuthGuard ]}

                       ];

@NgModule({
  imports: [RouterModule.forRoot(routes, {onSameUrlNavigation: 'reload'})],
  exports: [RouterModule],
  providers: [
    AuthGuard,
    AdminGuard
  ],
})
export class AppRoutingModule { }
