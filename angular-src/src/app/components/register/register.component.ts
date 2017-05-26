// Modules
import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
// Service for validate blank(empty) form and email
import {ValidateService} from '../../services/validate.service';
import {AuthService} from '../../services/auth.service';
// external module 3rd party
import {FlashMessagesService} from 'angular2-flash-messages';


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  name:String;
  username:String;
  email:String;
  password:String;

  error = ""

  //anytime we use a service we need to inject to a constructor and module also need to be injected
  // so we can this.validateService
  constructor(private validateService:ValidateService,private flashMessage:FlashMessagesService,private authService:AuthService,private router:Router) { }

  ngOnInit() {
  }

  onRegisterSubmit(){
    console.log(this.name,this.username,this.email)
    const user = {
      name: this.name,
      email:this.email,
      username:this.username,
      password:this.password
    }
    // Required Fields
    if(!this.validateService.validateRegister(user)){
      // send a flash message error. contains options you want to show eg. cssClass,timeout-set a timeout to go away watch angular2-flash message documentaion on google
      this.flashMessage.show("Please fill in all fields",{cssClass: 'alert-danger',timeout: 3000});
      return false;
    }

    // Validate Email
    if(!this.validateService.validateEmail(user.email)){
      // send a flash message error. contains options you want to show eg. cssClass,timeout-set a timeout to go away watch angular2-flash message documentaion on google
      this.flashMessage.show("Please use a valid email",{cssClass: 'alert-danger',timeout: 3000});
      return false;
    }
    // register user. since it's an observable we need to subcribe to it.
    this.authService.registerUser(user).subscribe(data=> {
      // console.log(data);
      // callback with the data(aka json)
      // data.succes I refer to this as the json come with the respond. if user register
      if(data.success){
        // show a message
        this.flashMessage.show("You are now registered and can log in",{cssClass: 'alert-success',timeout: 3000});
        // Redirect to login
        this.router.navigate(['/login'])
      }else{ // user can not be register
        // show a message. sugestion maye in the json can be a error message
        this.flashMessage.show("Something went wrong" + data.error,{cssClass: 'alert-danger',timeout: 3000});
        // Redirect to login
        this.router.navigate(['/register'])
      }
    });

  }

}