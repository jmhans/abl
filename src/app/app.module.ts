import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { HttpClientModule }    from '@angular/common/http';


import { HttpClientInMemoryWebApiModule } from 'angular-in-memory-web-api';
import { InMemoryDataService }  from './in-memory-data.service';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PlayerDetailsComponent } from './players/player-details/player-details.component';
import { PlayerListComponent } from './players/player-list/player-list.component';
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

@NgModule({
  declarations: [
    AppComponent,
    PlayerDetailsComponent,
    PlayerListComponent,
    OwnerDetailsComponent,
    OwnerListComponent,
    RosterListComponent,
    RosterDetailsComponent,
    HeroesComponent,
    HeroDetailComponent,
    MessagesComponent,
    DashboardComponent,
    HeroSearchComponent
  ],
  imports: [
    BrowserModule,
    FormsModule, 
    HttpModule, 
    HttpClientModule,
    HttpClientInMemoryWebApiModule.forRoot(
      InMemoryDataService, {dataEncapsulation: false, passThruUnknownUrl: true}
      ), 
    OwnersModule,
    AppRoutingModule, 
    
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
