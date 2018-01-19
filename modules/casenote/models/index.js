"use strict";

var fs = require("fs"),
    path = require("path"),
    Sequelize = require("sequelize"),
    env = process.env.NODE_ENV || "development",
    dbconf = require(path.join(__dirname, '../../../', 'config', 'config.json'))[env],
    db = {},
    Op = Sequelize.Op,
    operatorsAliases = {
        $gt: Op.gt
    };

db.operatorsAliases = operatorsAliases;

var sequelize = new Sequelize(dbconf.database, dbconf.username, dbconf.password, dbconf);

//console.log("===XXXX++++XXXX+++++XXXXX+++++X")

fs
    .readdirSync(__dirname)
    .filter(function(file) {

        return (file.indexOf(".") !== 0) && (file !== "index.js");
    })
    .forEach(function(file) {
        //console.log( file );
        if (file != 'old') {
            var model = sequelize.import(path.join(__dirname, file));
            //console.log(model.name)
            db[model.name] = model;
        }

    });

Object.keys(db).forEach(function(modelName) {
    if ("associate" in db[modelName]) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
