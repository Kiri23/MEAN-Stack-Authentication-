const variables = require('../config/variables');
const modules = require('../config/modules');

const paypal = modules.paypal
require('../config/paypal'); // require configuration paypal

 variables.router.post('/pay',(req, res)=>{
    createPaypalPayment(res)
});

variables.router.get('/succes',(req,res)=> {
   const payerId = req.query.PayerID;
   const paymentId = req.query.paymentId;
   excecutePayment(paymentId,payerId,res)
});


variables.router.get('/cancel', (req, res) => {
    res.send('Cancelled')
});

    /******* FUNCTIONS ********/

function configurePaypal(){
    paypal.configure({
        'mode': 'live', //sandbox or live
        'client_id':process.env.client_id ,
        'client_secret':process.env.client_secret // no funciona si quito las string y pongo variables
      });
}

 function createPaypalPayment(res){
    var create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://localhost:3002/succes",
            "cancel_url": "http://localhost:3002/cancel"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": "Registro Opa",
                    "sku": "item",
                    "price": "1.00",
                    "currency": "USD",
                    "quantity": 1
                }]
            },
            "amount": {
                "currency": "USD",
                "total": "1.00"
            },
            "description": "Registrate para ecoescuela en OPAS."
        }]
    }; // en create_payment_json Variable

    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            throw error;
        } else {
            console.log(payment)
            for(let i = 0; i< payment.links.length; i++) {
                if (payment.links[i].rel == "approval_url"){
                    console.log("approval url")
                    return res.json({paymentLink:payment.links[i].href,msg:'Succes'})
                }
            }
        }
    });
}

function excecutePayment(paymentId,payerId,res){
    const execute_payment_json = {
        "payer_id": payerId,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": "1.00"
            }
        }]
      };
    
      paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
        if (error) {
            console.log(error.response);
            throw error;
        } else {
            console.log(JSON.stringify(payment));
            res.send('Success');
        }
     });

}

module.exports = variables.router;
