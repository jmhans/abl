import { BrowserModule, Title } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AuthModule } from '@auth0/auth0-angular';

import { AUTH_CONFIG } from './auth/auth.config';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {MatCardModule} from '@angular/material/card';
import {MatSelectModule} from '@angular/material/select';
import {MatTableModule} from '@angular/material/table';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatSortModule} from '@angular/material/sort';
import {MatSliderModule} from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox'; 
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import {MatTabsModule} from '@angular/material/tabs';
import { ButtonsModule,CollapseModule } from 'angular-bootstrap-md'
import { IconsModule ,WavesModule, TableModule} from 'angular-bootstrap-md'
import {MatButtonToggleModule} from '@angular/material/button-toggle';

import { HttpClientModule }    from '@angular/common/http';

import { DatePipe } from '@angular/common';
import { ApiService } from './core/api.service';
import { UtilsService } from './core/utils.service';
import { FilterSortService } from './core/filter-sort.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DataTablesModule } from 'angular-datatables';
import { DragDropModule } from '@angular/cdk/drag-drop'
import { FlexLayoutModule } from '@angular/flex-layout';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Angular2CsvModule } from 'angular2-csv';
 

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { OwnerDetailsComponent } from './owners/owner-details/owner-details.component';
import { OwnerListComponent } from './owners/owner-list/owner-list.component';
import { RosterListComponent } from './rosters/roster-list/roster-list.component';
import { RosterDetailsComponent } from './rosters/roster-details/roster-details.component';
import { OwnersModule } from './owners/owners.module';


import { MessagesComponent } from './messages/messages.component';
import { DashboardComponent } from './dashboard/dashboard.component';

import { AuthService } from './auth/auth.service';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { CallbackComponent } from './pages/callback/callback.component';
import { AdminComponent } from './pages/admin/admin.component';
import { EventComponent } from './pages/event/event.component';
import { EventDetailComponent } from './pages/event/event-detail/event-detail.component';
import { RsvpComponent } from './pages/event/rsvp/rsvp.component';
import { RsvpFormComponent } from './pages/event/rsvp/rsvp-form/rsvp-form.component';
import { SubmittingComponent } from './core/forms/submitting.component';
import { CreateEventComponent } from './pages/admin/create-event/create-event.component';
import { UpdateEventComponent } from './pages/admin/update-event/update-event.component';
import { EventFormComponent } from './pages/admin/event-form/event-form.component';
import { AblAdminComponent } from './pages/admin/abl-admin/abl-admin.component';
import { GameComponent } from './pages/game/game.component';
import { TeamGameComponent } from './pages/team/game/game.component';
import { GameDetailComponent } from './pages/game/game-detail/game-detail.component';
import { GamesComponent } from './pages/games/games.component';
import { TeamComponent } from './pages/team/team.component';
import { TeamDetailComponent } from './pages/team/team-detail/team-detail.component';
import { RosterComponent } from './pages/team/roster/roster.component';
import { UpdateTeamComponent } from './pages/admin/update-team/update-team.component';
import { TeamFormComponent } from './pages/admin/team-form/team-form.component';
import { CreateTeamComponent } from './pages/admin/create-team/create-team.component';
import { DeleteTeamComponent } from './pages/admin/delete-team/delete-team.component';
import { PlayersComponent } from './pages/players/players.component';
import { ManageRostersComponent } from './pages/admin/manage-rosters/manage-rosters.component';
import { RosterFormComponent } from './pages/admin/roster-form/roster-form.component';
import { OwnerFormComponent } from './pages/admin/team-form/owner-form/owner-form.component';
import { GameFormComponent } from './pages/admin/game-form/game-form.component';
import { CreateGameComponent } from './pages/admin/game/create-game/create-game.component';
import { UpdateGameComponent } from './pages/admin/game/update-game/update-game.component';
import { DeleteGameComponent } from './pages/admin/game/delete-game/delete-game.component';
import { PlayerGameLineComponent } from './player-game-line/player-game-line.component';
import { TeamRosterComponent } from './team-roster/team-roster.component';
import { GameTeamDetailComponent } from './pages/game/game-detail/game-team-detail/game-team-detail.component';
import { MyFilterPipe } from './core/pipes/filter.pipe';
import { StandingsComponent } from './pages/standings/standings.component';
//import { LineupFormComponent } from './pages/admin/lineup-form/lineup-form.component';


@NgModule({
  declarations: [
    AppComponent, 
    CallbackComponent,
    OwnerDetailsComponent,
    OwnerListComponent,
    RosterListComponent,
    RosterDetailsComponent,
    MessagesComponent,
    DashboardComponent,
    HeaderComponent,
    FooterComponent,
    AdminComponent,
    EventComponent,
    EventDetailComponent,
    RsvpComponent,
    RsvpFormComponent,
    SubmittingComponent,
    CreateEventComponent,
    UpdateEventComponent,
    EventFormComponent,
    AblAdminComponent,
    GameComponent,
    GameDetailComponent,
    GamesComponent,
    TeamComponent,
    TeamDetailComponent,
    RosterComponent,
    UpdateTeamComponent,
    TeamFormComponent,
    CreateTeamComponent, 
    DeleteTeamComponent, PlayersComponent, ManageRostersComponent, RosterFormComponent, OwnerFormComponent, GameFormComponent, CreateGameComponent, UpdateGameComponent, DeleteGameComponent, PlayerGameLineComponent, TeamRosterComponent, GameTeamDetailComponent, MyFilterPipe, TeamGameComponent, StandingsComponent
    //, LineupFormComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    MatSortModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    FlexLayoutModule,
    HttpClientModule,
    OwnersModule,
    AppRoutingModule, 
    BrowserAnimationsModule, 
    DataTablesModule, 
    DragDropModule,
    NgbModule,
    MatButtonModule,
    MatTabsModule,
    ButtonsModule, WavesModule, CollapseModule,
    IconsModule,
    TableModule,
    MatCheckboxModule ,
    Angular2CsvModule,
    MatButtonToggleModule,
    AuthModule.forRoot({
      domain: AUTH_CONFIG.CLIENT_DOMAIN,
      clientId: AUTH_CONFIG.CLIENT_ID,
    })
  ],
  providers: [ 
    Title, 
    AuthService, 
    ApiService, 
    DatePipe, 
    UtilsService, 
    FilterSortService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }