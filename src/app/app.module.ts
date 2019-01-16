import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ContactDetailsComponent } from './contacts/contact-details/contact-details.component';
import { ContactListComponent } from './contacts/contact-list/contact-list.component';
import { PlayerDetailsComponent } from './players/player-details/player-details.component';
import { PlayerListComponent } from './players/player-list/player-list.component';
import { OwnersComponent } from './owners/owners.component';
import { OwnerDetailsComponent } from './owners/owner-details/owner-details.component';
import { OwnerListComponent } from './owners/owner-list/owner-list.component';

@NgModule({
  declarations: [
    AppComponent,
    ContactDetailsComponent,
    ContactListComponent,
    PlayerDetailsComponent,
    PlayerListComponent,
    OwnersComponent,
    OwnerDetailsComponent,
    OwnerListComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule, 
    FormsModule, 
    HttpModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
