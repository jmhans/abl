import { BrowserModule, Title } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AuthModule } from '@auth0/auth0-angular';
import { AUTH_CONFIG } from './auth/auth.config';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ButtonsModule,CollapseModule } from 'angular-bootstrap-md'
import { IconsModule ,WavesModule, TableModule} from 'angular-bootstrap-md'


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
//import { Angular2CsvModule } from 'angular2-csv';


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

import { SubmittingComponent } from './core/forms/submitting.component';
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
import { DialogOverviewExampleDialog } from './pages/players/players.component';
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

import { LocalMaterialModule } from './core/local-material-module/local-material.module';
import { RosterImportComponent } from './pages/team/roster/roster-import/roster-import.component';
import { ManageGamesComponent } from './pages/admin/manage-games/manage-games.component';


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
        SubmittingComponent,
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
        DeleteTeamComponent,
        PlayersComponent,
        ManageRostersComponent,
        RosterFormComponent,
        OwnerFormComponent,
        GameFormComponent,
        CreateGameComponent,
        UpdateGameComponent,
        DeleteGameComponent,
        PlayerGameLineComponent,
        TeamRosterComponent,
        GameTeamDetailComponent,
        MyFilterPipe,
        TeamGameComponent,
        StandingsComponent,
        DialogOverviewExampleDialog,
        RosterImportComponent,
        ManageGamesComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        FlexLayoutModule,
        HttpClientModule,
        OwnersModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        DataTablesModule,
        NgbModule,
        ButtonsModule,
        WavesModule,
        CollapseModule,
        IconsModule,
        TableModule,
        //  Angular2CsvModule,
        LocalMaterialModule,
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
