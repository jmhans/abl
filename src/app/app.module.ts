import { BrowserModule, Title } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { HttpClientModule }    from '@angular/common/http';

import { HttpClientInMemoryWebApiModule } from 'angular-in-memory-web-api';
import { InMemoryDataService }  from './in-memory-data.service';

import { DatePipe } from '@angular/common';
import { ApiService } from './core/api.service';
import { UtilsService } from './core/utils.service';
import { FilterSortService } from './core/filter-sort.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DataTablesModule } from 'angular-datatables';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';


import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { OwnerDetailsComponent } from './owners/owner-details/owner-details.component';
import { OwnerListComponent } from './owners/owner-list/owner-list.component';
import { RosterListComponent } from './rosters/roster-list/roster-list.component';
import { RosterDetailsComponent } from './rosters/roster-details/roster-details.component';
import { OwnersModule } from './owners/owners.module';
import { HeroesComponent } from './heroes/heroes.component';
import { HeroDetailComponent } from './hero-detail/hero-detail.component';
import { MessagesComponent } from './messages/messages.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HeroSearchComponent } from './hero-search/hero-search.component';
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




@NgModule({
  declarations: [
    AppComponent, 
    CallbackComponent,
    OwnerDetailsComponent,
    OwnerListComponent,
    RosterListComponent,
    RosterDetailsComponent,
    HeroesComponent,
    HeroDetailComponent,
    MessagesComponent,
    DashboardComponent,
    HeroSearchComponent,
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
    DeleteTeamComponent, PlayersComponent, ManageRostersComponent, RosterFormComponent, OwnerFormComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule, 
    HttpClientModule,
    HttpClientInMemoryWebApiModule.forRoot(
      InMemoryDataService, {dataEncapsulation: false, passThruUnknownUrl: true}
      ), 
    OwnersModule,
    AppRoutingModule, 
    BrowserAnimationsModule, 
    DataTablesModule, 
    DragDropModule,
    NgbModule,
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