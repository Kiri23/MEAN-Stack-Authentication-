/** 
 * Author: Christian Nogueras
 * 
 * app.js - main start application 
*/

// Global Variable. Para poner el nombre de la compañia a la que le estoy haciendo el producto.
process.env.Compañia = "OPAS"
var gfs // dont delete this variable is used when conecting to mongodb function
// Modules que se leen de un archvio externo . Need to be first because of appDynamic
const modules = require('./config/modules')
// variables que se leen de un archivo externo
const variables = require('./config/variables')
const passport = require('passport')
callAllUncaughtExceptionFromNodeJs() // no registrada en los archivos.js del app.Need to be after const variables

// route files
const organization = require('./routes/organization');
const administration = require('./routes/administration');
const users = require('./routes/users');
const fileNames = require('./routes/filename');
const escuelaArchivos = require('./routes/escuelaArchivos');
const paypal = require('./routes/paypal');

modules.Grid.mongo = modules.mongoose.mongo;
// modules.LogRocket.init('rtbfoe/opas-web-app');
// console.log("este el archivo node app que debe llamar al hijo")
// var exec = require('child_process').exec
// exec('node app1.js',(err)=>{
//   if (err){
//     console.log(err)
//   }else {
//     console.log('se llamo al hijo')
//   }
// })

connectToMongoDatabase()

checkMongooseConnections()


// The request handler must be the first middleware on the app
variables.app.use(variables.raven.requestHandler());

// sendMessageToSlack("/foodme")

variables.wisntonLogger.log({
  level: 'info',
  message: 'Hello distributed log files!'
});

variables.wisntonLogger.log({
  level: 'error',
  message: 'Hello distributed log files! error'
});

variables.wisntonLogger.log({
  level: 'warn',
  message: "Test Message"
});


console.log("Se va a llamar el metodo")
// express cors google- App.Use Cors lo que hace es que
// da Allow Acces a cualquier dominio y tambien acepta tipo de data que se envie en el nuevo request.
//CORS Middleware
variables.app.use(modules.cors());

// Body Parser Middleware
variables.app.use(modules.bodyParser.json());
// anything that is /users will go to that users file
variables.app.use('/users',users);
// route for organization
variables.app.use('/organization',organization);
// route for Administrator
variables.app.use('/administrator',administration);
// route for files retrieval
variables.app.use('/',[fileNames,escuelaArchivos,paypal]);

// Set Static Folder for when we use Angular an other files - staticfile keyboard shortcut
// Esto ultiliza los archivos Html o Javscript que tu pongas dentro de el y busca siempre en un folder que se llama public que lo junta con el current directories por eso path.join(__dirname)
variables.app.use(modules.express.static(modules.path.join(__dirname,'public')));


// Passport Middleware
variables.app.use(passport.initialize());
variables.app.use(passport.session());
// this need to be here for the authentication to work 
require('./config/passport')(passport)

variables.app.get('/m',passport.authenticate('jwt',{session:false}),(req,res,next) =>{
  var err = new Error("E");
  err.customMsg = "Custom Meessage error"
  next(err)
});

variables.app.get('/s',(req,res)=>{

})
// Express error Handling Middleware. Cualquier error no cactheado en la aplicacion epxress de opas pasara a esta funcion y cualquier error que surga tendra este mensaje de json
variables.app.use(function (err,req,res,next){
  console.log("Error custom message ", err.customMsg)
  // My error reporting tool
  variables.raven.sendErrorMessageToSentry(err)
  if(err.customMsg){
    return variables.errorUtility.sendErrorHttpJsonMessage(res,err,err.customMsg);    
  }else {
    console.log("Error general en aplicacion express de Opas")
    const customMsg = "Error no documentado en la aplicacion express de " + variables.compañia + ". Intentelo nuevamente, si el problema persiste porfavor notifique a un representate de OPAS de este error a continuacion. Error: " + err.message 
    return variables.errorUtility.sendErrorHttpJsonMessage(res,err,customMsg);
    // variables.nodeSendEmail.
  }
  
});

// The error handler must be before any other error middleware
variables.app.use(variables.raven.errorHandler());

// index Route. Invalid Route 
variables.app.get('/',(req,res) => {
  res.send('invalid EndPoint');
})

// This is how you combine Angular with Node.js
// Catch all other routes and return the index file that mange the angular logic
variables.app.get('*', (req, res) => {
  res.sendFile(modules.path.join(__dirname, './public/index.html'));
});

// Start Server
variables.app.listen(variables.port,(req,res) => {
  console.log('Server started on port '+ variables.port);
  variables.raven.captureBreadcrumb({
    message: 'Conecion a servidor hecha',
    category: 'payment',
    data: {
       amount: 312,
    }
  });
})

// ********** Functions  ***************** // 

// Este metodo va a coger todas las excepciones que no se han recogido en mi codigo y va a llamar un evento para enviar un json al server
function callAllUncaughtExceptionFromNodeJs(){
  process.on('uncaughtException', function (err) {
    // My error Reporting Tool
    variables.raven.sendErrorMessageToSentry(err)    
    console.log("Un error no registrado en toda la aplicacion de node para la apicacion de "+variables.compañia)
    console.log("Este es el erro que no se registro en toda la aplicacion node" ,err);
  })
}

var urlencodedParser = modules.bodyParser.urlencoded({ extended: false })

variables.app.post('/slashComand',urlencodedParser,(req,res)=>{
  res.status(200).end() // best practice to respond with empty 200 status code  
  console.log("form localhos")
  console.log(req.body)
  var reqBody = req.body
  var responseURL = reqBody.response_url
  console.log(reqBody.token)
  console.log(process.env.slack_verification_token)
  if (reqBody.token != process.env.slack_verification_token){
      console.log("o aqui ?")
      res.status(403).end("Access forbidden")
  }else{
    var message = {
      "text": "This is your first interactive message",
      "attachments": [
          {
              "text": "Building buttons is easy right?",
              "fallback": "Shame... buttons aren't supported in this land",
              "callback_id": "button_tutorial",
              "color": "#3AA3E3",
              "attachment_type": "default",
              "actions": [
                  {
                      "name": "yes",
                      "text": "yes",
                      "type": "button",
                      "value": "yes"
                  },
                  {
                      "name": "no",
                      "text": "no",
                      "type": "button",
                      "value": "no"
                  },
                  {
                      "name": "maybe",
                      "text": "maybe",
                      "type": "button",
                      "value": "maybe",
                      "style": "danger"
                  }
              ]
          }
      ]
  }
  console.log("Se llega aqui?")
  sendMessageToSlackResponseURL(responseURL, message)  
}
console.log("No llega a ninguno de los dos")
})

var urlencodedParser = modules.bodyParser.urlencoded({ extended: false })

variables.app.post("/incomingSlackMessageAction",urlencodedParser,(req,res)=>{
  res.status(200).end()
  console.log("Hello baby")
  console.log(req.body)

  var actionJSONPayload = JSON.parse(req.body.payload) // parse URL-encoded payload JSON string

  var message = {
    "text": actionJSONPayload.user.name+" clicked: "+actionJSONPayload.actions[0].value,
    "replace_original": false
}
sendMessageToSlackResponseURL(actionJSONPayload.response_url, message)
  // res.send(req.body)
});


variables.app.post("/slackEvents",(req,res)=>{
  console.log("Se llamo events")
  // console.log(req.body)
  if (req.body.type === 'url_verification') {
    res.send(req.body.challenge);
  }

  let q = req.body;
  // 1. To see if the request is coming from Slack
  if (q.token !== process.env.SLACK_VERIFICATION_TOKEN) {
    res.sendStatus(400);
    return;
  }
  // 2. Events - get the message text
  else if (q.type === 'event_callback') {
    if(!q.event.text) return;
      // Do logic here
      //  analyzeTone(q.event); // sentiment analysis
  }

})


function sendMessageToSlackResponseURL(responseURL, JSONmessage){
  console.log('hello response url')
  console.log(responseURL)
  console.log(JSONmessage)
  var postOptions = {
      uri: responseURL,
      method: 'POST',
      headers: {
          'Content-type': 'application/json'
      },
      json: JSONmessage
  }
  modules.request(postOptions, (error, response, body) => {
      if (error){
          console.log(error)
          // handle errors as you see fit
      }else {
        console.log("se envio el mensaje?")
        console.log(body)
      }
  })
}


// Function to chech different event in mongoDb
function checkMongooseConnections(){
  modules.mongoose.connection.on('open', function (ref) {
      console.log('open connection to mongo server.');
  });

  modules.mongoose.connection.on('disconnected', function (ref) {

      console.log('disconnected from mongo server.');
  });

  modules.mongoose.connection.on('close', function (ref) {

      console.log('close connection to mongo server');
  });

  modules.mongoose.connection.on('error', function (err) {

      console.log('error connection to mongo server!');
      console.log(err);
  });

  // modules.mongoose.connection.db
  // modules.mongoose.connection.db.on('reconnect', function (ref) {
  //     console.log('reconnect to mongo server.');
  // });
}

function connectToMongoDatabase (){
  // ********************** MONGO Database *************** // 
    // Connect to Mongodb Database 
    // To start the mongodb Server go to /usr/local/bin and run ./mongo - that will start the server and you can use 'mongod'
    // Cant fix deprecation because required to change the logic of the mongoose connection
    var promise = modules.mongoose.connect(variables.config.database, {
      useMongoClient: true,
      /* other options */
    });
    promise.then( ()=>{
      gfs = modules.Grid(modules.mongoose.connection.db);
      variables.raven.captureBreadcrumb({
        message: 'Conecion a base de datos',
        category: 'payment',
        data: {
           amount: 312,
        }
      });
      // Check Mongodb connections
      checkMongooseConnection(mongoose);
    });

// ********************** End MONGO Database *************** // 
}
