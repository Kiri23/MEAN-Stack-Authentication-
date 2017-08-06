import { Component, OnInit } from '@angular/core';
import {UsersService} from '../../services/users.service';

import * as underscore from 'underscore';


@Component({
  selector: 'app-display-professors',
  templateUrl: './display-professors.component.html',
  styleUrls: ['./display-professors.component.css']
})
export class DisplayProfessorsComponent implements OnInit {
  
  /**
   * The names of the school in the db.
   * @memberOf TableComponent
   */ 
  schoolNames;
  /**
   * The profesors on each schools 
   * @memberOf TableComponent
   */
  professors = [];
  dictionaryKeys = Object.keys;
  filesDictionary: {[escuela:string]:number;} = {}  
  files = 0;

  dictionary: {[escuela:string]:string[];} = {
      // "Escuela uno":["Mi nombre","Segundo Nombre","Tercer Nombre"],
      // "Escuela dos":["Mi nombre"], 
      // "Escuela Tres":["Nombre de jose Juan","Jose juan nombre"],
      // "Escuela Cuatro":["Juan jaramillo","Jason barwone","jasonz"]
  };

  constructor(private userService:UsersService) { }

  ngOnInit() {
    this.showSchoolNamesAndProfessor2()
  }

     /**
   * Function to retrieve all the School in the DB with his professor 
   * @memberOf TableComponent
   */
  showSchoolNamesAndProfessor2(){
    this.userService.getAllSchoolAndProfessor().subscribe(data => {
        console.log("Data de escuela: "+ JSON.stringify(data.professors, null, 4));
        this.schoolNames = data.schools;
        this.professors = data.professors
        var arra = [];
        var start = 0
        var end = data.numberOfSchool[this.schoolNames[0]];
        var count = 0;
        var co = -1 ;
        var achivos = 0;
        var nu = 0;
        var multipl = 1;
        for (var index = 0; index < data.schools.length; index++) {
            // this.professors.push(data.professors[index].name)
            this.dictionary[this.schoolNames[index]] = this.professors.slice(start,end)
            start = end
            end += data.numberOfSchool[this.schoolNames[index + 1]]; 
            if (index != data.schools.length - 1){
              multipl += data.numberOfSchool[this.schoolNames[index + 1]]; 
            }
            }

        // multiplicar todos los numberschool para saber las repeteciones
        for (var index2 = 0; index2 < 10000; index2++) {
            console.log("count: " + index2)
            this.files += data.data[index].file.length
            this.filesDictionary[this.schoolNames[index]] = data.data[index].file.length
            if (co == -1){
                count = data.numberOfSchool[this.schoolNames[nu]]
                co = 0
            }          
            if (co < count){
              console.log("co " + co + " es menor que "+ "count " + count)
              if (co == 0){
                achivos = nu
              }
              co++
              console.log("index: " + achivos) 
              console.log("Escuela: " + this.schoolNames[achivos])               
              console.log("***************")
            }else {
              console.log("----------------")
              nu ++;                
              count = data.numberOfSchool[this.schoolNames[nu]]
              console.log("El nuevo count es " + count)
              console.log("----------------")                
              co = 0
            }
            if (count == undefined){
              break;
            }

          
        }
        console.log("multipli es " + multipl)
        console.log("Profesores de escuela: "+ JSON.stringify(this.professors, null, 4)); 
        console.log("Escuela uno "+ this.dictionary["Escuela uno"])  
         
    });
  }
            // For debugging Purpose
            // console.log("Start antes : " + start + " ,End antes: "+ end + "\n")
            // console.log("School Names:  " + this.schoolNames[index])            
            // console.log("Professor slice: " ,this.professors.slice(start,end))
            // console.log("Cantida de profesores : " + data.numberOfSchool[this.schoolNames[index]] + " para escuela: " + this.schoolNames[index]);
            // console.log("Index del loop: " + index + "\n \n")
}
