'use strict';

/*var pmx = require('pmx').init({
  http          : true, // HTTP routes logging (default: true)
  ignore_routes : [/socket\.io/, /notFound/], // Ignore http routes with this pattern (Default: [])
  errors        : true, // Exceptions logging (default: true)
  custom_probes : true, // Auto expose JS Loop Latency and HTTP req/s as custom metrics
  network       : false, // Network monitoring at the application level XXX BUG WITH AMQPLIB
  ports         : true  // Shows which ports your app is listening on (default: false)
});*/

var worker = require('./modules/casenote/workers/worker.js').worker,
    models = require('./modules/casenote/models/index.js');

process.on('SIGINT', function() {
    if( worker.channel ) ch.close();
    if( worker.connection ) connection.close();
    
    models.sequelize.close();
    
    process.exit(1);
});

// windows graceful stop
process.on('message', function(msg) {
  if (msg == 'shutdown') {
    if( worker.channel ) ch.close();
    if( worker.connection ) connection.close();
    
    models.sequelize.close();

    process.exit(0);
  }
});

worker.start( function(){
    // execute function when worker is started
} );
