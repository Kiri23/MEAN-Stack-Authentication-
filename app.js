/** 
 * Author: Christian Nogueras
 * 
 * app.js - main start application 
*/

// Global Variable. Para poner el nombre de la compañia a la que le estoy haciendo el producto.
process.env.Compañia = "OPAS"

var gfs
let logger
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

// sendMessageToSlack("/foodme")

setupWinstonLogger()

logger.log({
  level: 'info',
  message: 'Hello distributed log files!'
});

logger.log({
  level: 'error',
  message: 'Hello distributed log files! error'
});

logger.log({
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
  if(err.customMsg){
    return variables.errorUtility.sendErrorHttpJsonMessage(res,err,err.customMsg);    
  }else {
    console.log("Error general en aplicacion express de Opas")
    const customMsg = "Error no documentado en la aplicacion express de " + variables.compañia + ". Intentelo nuevamente, si el problema persiste porfavor notifique a un representate de OPAS de este error a continuacion. Error: " + err.message 
    return variables.errorUtility.sendErrorHttpJsonMessage(res,err,customMsg);
    // variables.nodeSendEmail.
  }
  
});



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
variables.app.listen(variables.port,() => {
  console.log('Server started on port '+ variables.port);

})


// ********** Functions  ***************** // 

// Este metodo va a coger todas las excepciones que no se han recogido en mi codigo y va a llamar un evento para enviar un json al server
function callAllUncaughtExceptionFromNodeJs(){
  process.on('uncaughtException', function (err) {
    console.log("Un error no registrado en toda la aplicacion de node para la apicacion de "+variables.compañia)
    console.log("Este es el erro que no se registro en toda la aplicacion node" ,err);
    process.exit(1)
  })
}

function setupWinstonLogger(){
  logger = modules.winston.createLogger({
    level: 'info',
    format: modules.winston.format.combine(
      modules.winston.format.colorize({ all: true }),
      modules.winston.format.simple()
    ),
    transports: [
      //
      // - Write to all logs with level `info` and below to `combined.log` 
      // - Write all logs error (and below) to `error.log`.
      //
      new modules.winston.transports.File({ filename: 'logs/error.log', 
                                            level: 'error' ,
                                            maxsize: 5242880, //5MB
                                            maxFiles: 5
                                          }),
      new modules.winston.transports.File({ filename: 'logs/combined.log' }),
    ]
  });
  logger.add(new modules.winston.transports.Console({
   format: modules.winston.format.simple(),
    colorize:true  
  }));
}

function sendMessageToSlack(message){
  payload = {
    "text": message}

  modules.request.post(
    process.env.slack_webhook_url,
    { json: message },
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body)
        }else {
          console.log(body)
        }
    }
);

}

function buttonSlack(){
  console.log("llamando butones")
  var token = process.env.slack_token  
  var apiEndPoint = "https://slack.com/api/chat.postMessage?token="+token+"&channel=C0G3G37HN&text=hola&attachments=%5B%7B%22text%22%3A%22Chose%20a%20game%20to%20play%22%2C%22attachment_type%22%3A%20%22default%22%2C%22actions%22%3A%20%5B%20%7B%20%20%22name%22%3A%20%22game%22%2C%20%20%22text%22%3A%20%22Chess%22%2C%20%20%22type%22%3A%20%22button%22%2C%20%22value%22%3A%20%22chess%22%20%7D%5D%7D%5D%5D&pretty=1"
  modules.request.get(apiEndPoint)
}

// buttonSlack()

var urlencodedParser = modules.bodyParser.urlencoded({ extended: false })

variables.app.post('/slashComand',urlencodedParser,(req,res)=>{
  res.status(200).end() // best practice to respond with empty 200 status code  
  console.log("form localhos")
  console.log(req.body)
  var reqBody = req.body
  var responseURL = reqBody.response_url
  if (reqBody.token != process.env.slack_verifcation_token){
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
      // Check Mongodb connections
      checkMongooseConnection(mongoose);
    });

// ********************** End MONGO Database *************** // 
}