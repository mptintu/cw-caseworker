'use strict';

var httpRequest = require('request'),
    Model = function() {},
    path = require("path"),
    models = require(path.join(__dirname, '../models/index.js')),
    table = models.DemoUser,
    PayloadMiddleware = require('./PayloadMiddleware'),
    params = ['first_name', 'last_name', 'email', 'type'],
    mail_queue = 'MAP.mail.send',
    send = function( channel, msg ) {
        var exchange = "MAP",
            key = "MAP.Casenote.Update";

        msg = JSON.stringify(msg);
        channel.publish(exchange, key, new Buffer(msg));
    },
    worker_name = 'MS-Users-Demo';

exports.add = function( args, ack, reject, channel, msg ) {
    /**
     * Add user
     **/
    var payload = args.payload,
        recordData = PayloadMiddleware.getAllowedParamsAndValuesAsHash(payload,params),
        message,
        mail_task;
        /*sendMessageToMediator = function( message, callback ){
            httpRequest({
                url: 'http://localhost:3080/send',
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                json: message
            }, function(err, response, body) 
            {
                if (err) {
                    console.log(err);
                    console.log(" [x] Could not Send to Mediator ");
                } else {
                    console.log(body);
                    console.log(" [x] Sent to Mediator");
                }
                if( callback ) callback();
            });
        };*/

    console.log(" Trying to execute now ");


    table.create(recordData).then(function(record) 
    {
        message = {
            role: 'user',
            cmd: 'add',
            type: record.type,
            success: true,
            payload: recordData,
            data: record,
            id: record.id,
            serial: record.id,
            source: worker_name,
            status: "done"
        };

        mail_task = {
            role: 'mail',
            cmd: 'send',
            payload: {
                to: record.email,
                subject: ' Wellcome to MAP #'+record.id+' ' + record.first_name,
                message: ' Wellcome to MAP #'+record.id+' ' + record.first_name + " " + record.last_name,
            },
            status: 'waiting',
            serial: record.id,
            source: worker_name
        };

        // Note: on Node 6 Buffer.from(msg) should be used
        //channel.sendToQueue(mail_queue, new Buffer( JSON.stringify( mail_task ) ), {persistent: true});


        //var message = JSON.parse(msg.content.toString());
        //console.log(" [x] %s:'%s'", msg.fields.routingKey, msg.content.toString());
        //console.log('Master worker Going to process request: #' + message.serial);
        //console.log('Master worker Going to process from ' + message.source);
        //console.log(message);


        send( channel, message );

        //sendMessageToMediator( message, function(){
            //ack();
        //} );

    }).catch(function(err) {
        if (err.name == "SequelizeValidationError") {
            console.log(err);
            console.log(" [x] Done with error - bad payload ");
        } else {
            console.log(err);
            console.log(" [x] Done with error ");
        }
        message = {
            role: 'user',
            cmd: 'add',
            type: (payload) ? payload.type : "",
            success: false,
            data: payload,
            err: err,
            source: worker_name
        };
        send( channel, message );
        //sendMessageToMediator(message, function() {
        //    //reject();
        //});
    });
};
