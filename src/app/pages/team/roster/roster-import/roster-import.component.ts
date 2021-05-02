import { Component, OnInit, Inject , ViewChild, ElementRef} from '@angular/core';
import { ApiService } from './../../../../core/api.service';
import { UtilsService } from './../../../../core/utils.service';
import {MatDialog ,MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { LineupModel ,LineupFormModel} from './../../../../core/models/lineup.model';

export interface DialogData {
  actualLineup: LineupFormModel
}


@Component({
  selector: 'app-roster-import',
  templateUrl: './roster-import.component.html',
  styleUrls: ['./roster-import.component.scss']
})
export class RosterImportComponent {
  csvLineupInput: string;
  delimiterType: string = "comma";
  includesHeaders: boolean = true;
  outputLineup: LineupFormModel;
  unmatchedPlayers: any[] = [];
  errorMessage = ''
  errorsList = [];
  
  @ViewChild('alert', { static: true }) alert: ElementRef;

  
  constructor(public api: ApiService, 
    public dialogRef: MatDialogRef<RosterImportComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData, 
                            public utils: UtilsService) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  closeAlert(i) {
   this.errorsList.splice(i, 1)
  }
  
    submitCSV() {
      this.unmatchedPlayers = [];
      this.outputLineup = null
      try {
            // code that may throw an error...
              if (this.delimiterType == "comma" && (this.csvLineupInput.match(/,/g) || []).length < (this.csvLineupInput.match(/\n/g) || []).length) { throw `There weren't many instances of that delimiter type. Are you sure you want to use ${this.delimiterType}?`}
              if (this.delimiterType == "tab" && (this.csvLineupInput.match(/\t/g) || []).length < (this.csvLineupInput.match(/\n/g) || []).length) { throw `There weren't many instances of that delimiter type. Are you sure you want to use ${this.delimiterType}?`}
              

        
              var importContent = this.utils.CSVToArray(this.csvLineupInput, (this.delimiterType == "tab" ? "\t" : ","))
              
              if (this.includesHeaders && !importContent[0].find((col)=>{return col == 'name'})) {throw "Unexpected field names"}
              if (this.includesHeaders && !importContent[0].find((col)=>{return col == 'position'})) {throw "Unexpected field names"}
      
              var outputArr = []
              if(this.includesHeaders) {
                for (var row = 1; row<importContent.length; row++) {
                  var outputObj = null
                  for (var idx =0; idx<importContent[0].length; idx++) {
                    if (importContent[row][idx] && importContent[row][idx] != "") {
                      outputObj = outputObj || {}
                      outputObj[importContent[0][idx]] = importContent[row][idx]  
                    }

                  }
                  if (outputObj) {
                    outputArr.push(outputObj)  
                  }

                }
              }
              var outputRoster= [];
              outputArr.forEach((item, index)=> {
                var match = this.data.actualLineup.roster.find((plyr)=> {return plyr.player.name == item.name})


                if (match) { 
                 // match.lineupPosition = item.position
                  //match.rosterOrder = index + 1
                  outputRoster.push({player: match.player,  lineupPosition: item.position, rosterOrder: index + 1})
                  
                  
                  
                } else {
                  // Did not find a player record that matches. 
                  this.unmatchedPlayers.push(item)
                }
              })


              this.outputLineup = new LineupFormModel(this.data.actualLineup.lineupId , this.data.actualLineup.rosterId, outputRoster, this.data.actualLineup.effectiveDate)

        
        
        }
        catch(e) {
            if(e instanceof Error) {
                // IDE type hinting now available
                // properly handle Error e
            }
            else if(typeof e === 'string' || e instanceof String) {
                // IDE type hinting now available
                // properly handle e or...stop using libraries that throw naked strings
              this.errorsList.push(e)
              //this.errorMessage = ;
              console.log(`There weren't many instances of that delimiter type. Are you sure you want to use ${this.delimiterType}?`);
            }
            else if(typeof e === 'number' || e instanceof Number) {
                // IDE type hinting now available
                // properly handle e or...stop using libraries that throw naked numbers
            }
            else if(typeof e === 'boolean' || e instanceof Boolean) {
                // IDE type hinting now available
                // properly handle e or...stop using libraries that throw naked booleans
            }
            else {
                // if we can't figure out what what we are dealing with then
                // probably cannot recover...therefore, rethrow
                // Note to Self: Rethink my life choices and choose better libraries to use.
                throw e;
            }
        }
      
      
      
      
      
  }
}
