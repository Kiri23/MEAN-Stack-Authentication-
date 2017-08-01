// Contain the endpoint for all the users routes
'use strict'
const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
// Import third partie library js
const underscore = require('underscore');


const config = require('../config/databse');
var upload = require ('../config/multer');

const User = require('../models/user');
const Administrator = require('../models/administrator');

//aget6 shortcut for app.get


/**
 * @apiDefine error
 *
 * @apiError error Contain the error message.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "success": "false"
 *       "msg": "Failed to register user"
 *       "error": "{Object} errorMessage"
 *     }
 */


/**
* @api {post} register/ Register a new User
* @apiDescription This route is used for register a new user
* @apiGroup User
* @apiName registerUser
* @apiSuccess {Object} user The new user store in the db.
* @apiSuccess {Bolean} success If the user got Succesfully saved in the db.
* @apiSuccess {String} msg Contain the error mesage or a Succesfully message.
*
* @apiSuccessExample Success-Response:
*     HTTP/1.1 200 OK
*     {
*       "success": "True",
*       "msg": "User Registered",
*       "user": "{Object} of User "
*     }
* @apiUse error
*/
// Register
// cause whe're in the users file is users/register
router.post('/register', (req, res,next) => {
  // User Object Retriev user Properties from Form
  // console.log(req.body.user + " hello");
  // str = JSON.stringify(req.body.user, null, 4); // (Optional) beautiful indented output.
  console.log(JSON.stringify(req.body.user, null, 4)); // how to show [object object] in console
  let newUser = new User({
    name: req.body.user.name,
    email: req.body.user.email,
    username: req.body.user.username,
    password: req.body.user.password,
    file: req.body.user.file,
    nombreEscuela: req.body.user.nombreEscuela.toString().trim()//replace(/\s+/g, '')
    // role:req.body.user.role,
    // CreatedDate:req.body.user.CreatedDate
  });

  console.log("Escuela en miniscula y sin espacio " + newUser.nombreEscuela);
  User.numberOfEscuelas(newUser.nombreEscuela,(err, count) => {
    if (err){
      console.log("Error al buscar el total de escuela en la base de datos");
      res.json({success: false,msg:"Error al buscar el total de escuela en la base de datos"})
    }else{
      console.log("total de escuelas: " + count + " de " + newUser.nombreEscuela);
      if (count >= 3){
        res.json({succes:false,msg:"Ya la escuela " + newUser.nombreEscuela + " llego a su limite de 3 profesores por escuela"})
      }else {
        // Add User to mongoDb
          User.addUser(newUser,(err, user) => {
            if(err){
              console.log(err + " add user");
              res.json({success: false, msg:'Failed to register user',error:err});
            }else{ // addUser to the Database
              res.json({success:true,msg:'User Registered',user:newUser});
            }
          });
        // End add User logic

        }
      }
    });
  });


  /**
   * @apiDefine throwError
   * @apiError error Throw an error message. Failed to do the main purpose of the route.
   *
   */

  /**
  * @api {post} authenticate/ Authenticate a User when Logged In
  * @apiDescription This route is used for Authenticate user when Logged In. This route get call
  * when a user attemp to Logged in to the application.
  *
  *
  * @apiGroup User
  * @apiName AuthenticateUser
  * @apiSuccess {String} msg Contain the error mesage or a Succesfully message.
  * @apiSuccess {Bolean} token Unique Token.
  * @apiSuccess {Object} user The user who logged in.
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {
  *       "success": "True",
  *       "token": "Unique token for each user logged in",
  *       "user": "{Object} of User "
  *     }
  * @apiUse throwError
  * @apiError UserNotFound User Not found in db.
  * @apiErrorExample UserNotFound Error:
  *     HTTP/1.1 404 Not Found
  *     {
  *       "success": "false"
  *       "msg": "User not found"
  *     }
  */
// Authenticate Route
router.post('/authenticate', (req, res,next) => {
  const username = req.body.username;
  const password = req.body.password;

    // Get the user to authenticate
    User.getUserByUsername(username,(err,user) => {
      if (err) throw err;
      if(!user){

        console.log("va a buscar los administradores ahora ")
        console.log("password: " + password);
        Administrator.getAdministratorByUsername(username,(err,administrator) => {
           console.log("User Role from call from db: " + administrator.role);
            // if not administrator where found in the db
            if(!administrator){
              return res.json({success:false,msg:'User not found'});
            }
            // compare the administrator Password
            Administrator.comparePassword(password,administrator.password,(err,isMatch) => {
               userCheckPassowrd(res,err,isMatch,administrator);
            });

        });

      }
       else{
          // Compare the Password of the regular user
          User.comparePassword(password,user.password,(err,isMatch) => {
            userCheckPassowrd(res,err,isMatch,user);

          });
      }
   });
});

// Function to compare the password of a regular user or administratopr
function userCheckPassowrd(res,err,isMatch,user){
  // TODO return a Json Error
  if (err) throw err;
  // if the password match
  if(isMatch){
    // construct the token- it has option
    const token = jwt.sign(user,config.secret,{
      expiresIn:120000 // 20 minutes
    });

    console.log("User Role from authenticate route: " + user.role + "\n" +
                " from User Name: " + user.name
   );
    // Send the reponse in Json Format
    res.json({success:true,
      token:'JWT '+token,
      user:{
        id:user._id,
        name:user.name,
        username:user.username,
        email:user.email,
        role:user.role,
        CreatedDate:user.CreatedDate

      }
    });
  }
  // if no match
  else {
    return res.json({success:false,msg:'Wrong password'});
  }
}



/**
* @api {post} upload/ Upload a file
* @apiDescription This route is used for user who want to upload a file.
* @apiGroup User
* @apiName UploadFile
* @apiSuccess {Intenger} error_code The error code for this operation.
* @apiSuccess {String} err_desc  Error description if there's one.
* @apiSuccess {String} file The file uploaded.
* @apiSuccess {String} filename The name of the file uploaded.
* @apiSuccess {String} dbId The Id of the file uploaded.
*
* @apiSuccessExample Success-Response:
*     HTTP/1.1 200 OK
*     {
*       "error_code": "0",
*       "err_desc": Null,
*       "File": "BytStream of the file uploaded",
*       "FileName": "NameOfYourFile.pdf",
*       "dbId": "Unique Id"
*     }
* @apiUse throwError
* @apiError UserNotFound The user who's trying to upload this file dont exit in the DB.
* @apiError UserSaveFilenameError Error attemping to save the file of the user in the DB.
* @apiErrorExample Success-Response:
*     HTTP/1.1 200 OK
*     {
*       "err": Object of err,
*       "msg": "The message of the error",
*     }
*/
// route to upload a file
router.post('/upload',(req, res) => {
  // si el userId es undefined mandar un json con una propiedad mensajes
  var userId = req.query.userId;
  console.log("UserId from users/upload: " + userId);

  upload(req,res,function(err){
    console.log("body in upload method: " +JSON.stringify(req.body, null, 4));
      if(err){
           res.json({error_code:1,err_desc:err});
           return;
      }
      console.log("Filename of the file " + req.file.grid.filename);
      console.log("id of the file " + req.file.grid._id);

      User.getUserById(userId,(err,user) => {
        if (err){
          return res.json({err,msg:err.error.msg});
        }
        console.log("User Data: " +JSON.stringify(user.file, null, 4) + "\n");

        console.log("user file lenght" + user.file.length);
        // si es mayor
        // user.file.length >=5 ? user.file[user.file.length - 1] = req.file.grid.filename :
        // user.file[user.file.length] = req.file.grid.filename

        if (user.file.length >=5){
          console.log("User file lenght es mayor o igual a 5");
          // user.file[user.file.length - 1] = req.file.grid.filename
          user.file.pop();
          user.file.push(req.file.grid.filename);
        }else if (user.file.length >=0) {
          console.log("User file lenght es menor que 5 o igual a 0");
          // user.file[user.file.length] = req.file.grid.filename
          user.file.push(req.file.grid.filename)

        }else{
          return res.json({msg:"Error al guardar el archivo del usuario"})
        }


        user.save((err, updatedUser) => {
          if(err){
            //  data.error.errors.file.message - mostrar el mensajes de error de excdeio file archivos
            console.log("Error User Data: " +JSON.stringify(err, null, 4));


          }
          console.log("User Data: " +JSON.stringify(updatedUser, null, 4));
          // res.json to send json date here
          console.log("Update User Succesfully");
        })
        // return res.json({user:data})
      });

       res.json({
         error_code:0,
         err_desc:null,
         file:req.file,
         filename:req.file.grid.filename,
         dbId: req.file.grid._id
       });
  });
});


/**
* @api {get} profile/ The profile of the user
* @apiDescription This route is used to retrieve the profile of a user.
* @apiGroup User
* @apiName UserProfile
* @apiSuccess {Object} User The User information.
*
* @apiSuccessExample Success-Response:
*     HTTP/1.1 200 OK
*     {
*       "user":"Object of User"
*     }
* @apiUse throwError
*/
// protect route with our Authentication, Our Token
// Profile Route
router.get('/profile',passport.authenticate('jwt',{session:false}),(req, res,next) => {
  res.json({user:req.user});
});

/**
* @api {get} getUserById/ Get a user by his Id
* @apiDescription This route is used to retrieve a user by his Id.
* @apiGroup User
* @apiName GetUserById
* @apiSuccess {Object} User The User information.
*
* @apiSuccessExample Success-Response:
*     HTTP/1.1 200 OK
*     {
*       "user":"Object of User"
*     }
* @apiUse throwError
*/
// Get a Users by their Id
router.get('/getUserById', (req, res) => {
  var id = req.query.userId;
  User.getUserById(id,(err,data) => {
    if (err){
      return res.json(err);
    }
    return res.json({user:data})
  });

});

/**
* @api {get} getLatestUsers/ Get the latest user from the db.
* @apiDescription This route is used to retrieve the last five user who registered to the
* application.
* @apiGroup User
* @apiName GetLatestUser
* @apiSuccess {Object} User The last five User information.
*
* @apiSuccessExample Success-Response:
*     HTTP/1.1 200 OK
*     {
*       "user":"Object of User"
*     }
* @apiUse throwError
*/
// get the Latest Users from Database
router.get('/getLatestUsers', (req, res) => {
  User.getLatestUser((err, users) => {
    if (err){
      return res.json(err);
    }
    console.log(users[0].name + " latest user from api");
    res.send(users);
  })

});

/**
* @api {get} getAllUsers/ Get all user from the db
* @apiDescription This route is used to retrieve all user in the db.
* @apiGroup User
* @apiName GetAllUsers
* @apiSuccess {Object} User All User information in the db.
*
* @apiSuccessExample Success-Response:
*     HTTP/1.1 200 OK
*     {
*       "user":"Object of User"
*     }
* @apiUse throwError
*/
// get all the Users from Database
router.get('/getAllUsers', (req, res) => {
  User.getAllUser((err, users) => {
    if (err){
      return res.json(err);
    }
    console.log(users[0].name + " All users from the api");
    res.send(users);
  })

});

// Skip Users from Database
router.get('/skipUsers', (req, res) => {
  var number = req.query.skipNumber;
  console.log(number , "number to skip api");
  // Convert number to string
  User.skipUser(parseInt(number),(err, users) => {
    if (err){
      return res.json(err);
    }
    // console.log(users[0].name + " Skip users from the api");
    res.send(users);
  })

});

router.get('/getFilesUploaded', (req, res) => {
  console.log("getFilesUploaded Route");
  const userId = req.query.userId;
  console.log("User Id: "+ userId);
  User.getFileUploaded(userId,(err, file) => {
    if(err){
      console.log("Error Obteniendo Archvivos subidos por Uusario");
      return res.json({success:false,msg:"Error Obteniendo archivos subidos por usuario",error:err})
    }

    if(! underscore.isUndefined(file) || ! underscore.isNull(file) ) {
         console.log("Enviando el Json con los getFileUploaded ");
         res.json({success:true,file:file});
      }else if (underscore.isEmpty(file)){
        console.log("No hay nignun archvio subido por el usuario");
        res.json({success:false,msg:"No hay ningun archivo subido por el usuario",file:file});
      }else {
        console.log("Error al obtener Archvivos de usuarios de la base de datos");
        res.json({success:false,msg:"Error al obtener Archivos de usuarios de la base de datos",file:file})
      }
  });
});

// EndPoit for the Role of the User
router.get('/getUserRoleById', (req, res) => {
    var id = req.query.id
    // convert the string to a Int
    console.log("User Id from route Api" +id);
    // var idInt = parseInt(idStr)
    // console.log(idInt);
    User.getUserRole(id,(err,userRole) => {
      if (err){
        return res.json(err);
      }
      // get role of a Admin User
      if (underscore.isEmpty(userRole)){
          console.log(userRole + " user role");
          console.log("User Role esta vacio.encontrando role del administrador");
          Administrator.getAdminRole(id,(err,adminRole) =>{
              if (underscore.isEmpty(adminRole)){
                console.log(adminRole + " AdminRole");
                console.log("Ningun usuario del rol fue encotrado.No usuario, no administrador");
                res.json({data:false,msg:"Usuario Role no encontrado"})
              }
              // A role is found
              else {
                res.json(adminRole)
              }

          })
      }
      // Get role of a regular user
      else {
        res.json(userRole);
      }

    });
});

router.get('/ping', (req, res) => {
    return res.json('pong');
});


module.exports = router;
