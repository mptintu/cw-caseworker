var controller = require('../controllers/controller'),
    queue = 'MAP.Casenote.DBWrite',
    exchange = 'MAP',
    key = 'MAP.Casenote.DBWrite',
    amqp = require('amqplib/callback_api'),
    mq = require('../../../config/mq.js'),
    amqpConn,
    ch = null,
    path = require('path'),
    connString = mq.rabbitUser + ":" + mq.rabbitPassword + "@" + mq.rabbitServer + ":" + mq.rabbitPort + "/?heartbeat=" + mq.rabbitHeartBeat,
    start = function(callback) {
        console.log(connString);
        amqp.connect("amqp://" + connString, function(err, conn) {
            if (err) {
                console.log(err)
                console.error("[AMQP]", err.message);
                return setTimeout(start, 1000);
            } else {
                conn.on("error", function(err) {
                    console.log(err)
                    if (err.message !== "Connection closing") {
                        console.error("[AMQP] conn error", err.message);
                    }
                });
                conn.on("close", function() {
                    console.error("[AMQP] reconnecting");
                });

                console.log("[AMQP] connected");
                amqpConn = conn;

                amqpConn.createChannel(function(err, channel) {
                    if (closeOnErr(err)) return;

                    ch = channel;

                    channel.on("error", function(err) {
                        console.error("[AMQP] channel error", err.message);
                    });
                    channel.on("close", function() {
                        console.log("[AMQP] channel closed");
                    });

                    channel.prefetch(1);

                    channel.assertExchange(exchange, 'topic', {
                        durable: true
                    });

                    channel.assertQueue(queue, {
                        durable: true
                    }, function(err, q) {


                        channel.bindQueue(q.queue, exchange, key);

                        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", exchange + " - " + q.queue + " - " + key);
                        channel.consume(q.queue, function(msg) {
                            console.log(" [x] %s:'%s'", msg.fields.routingKey, msg.content.toString());

                            var message = JSON.parse(msg.content.toString()),
                                ack = function() {
                                    //console.log(channel, msg)
                                    worker.ack(channel, msg);
                                },
                                reject = function() {
                                    worker.reject(channel, msg);
                                };
                            //console.log(msg);
                            console.log('Going to process request: #' + message.serial);
                            controller.add(message, ack, reject, channel, msg);

                            channel.ack(msg);

                        }, {
                            noAck: false
                        });

                        if (callback) callback();
                    });


                });
            }
        });
    },

    closeOnErr = function(err) {
        if (!err) return false;
        console.error("[AMQP] error", err);
        amqpConn.close();
        return true;
    }
worker = {
    ack: function(channel, msg) {
        channel.ack(msg);
    },
    reject: function(channel, msg) {
        channel.reject(msg, true);
    },
    start: function(entryCallback) {

        start(entryCallback)


    }
};


module.exports.worker = worker;
module.exports.connection = amqpConn;
module.exports.channel = ch;
