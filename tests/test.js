#! /usr/bin/env node

'use strict';

var CsvDict = require('../csv-dict.js');

// stop_id,stop_code,stop_name,stop_lat,stop_lon,zone_id
var csvFile = 'tests/stops.txt';

var keyFields = ['stop_id'];
var selFields = ['stop_id','stop_code','stop_name',
		 'stop_lat','stop_lon','zone_id'];

try {
    var csvDict = new CsvDict({
	tblName     : 'Stops',
	tblDescr    : 'Train stops',
	csvPath     : csvFile,
	keyFields   : keyFields,
	selFields   : selFields,
	delim       : ","
    });
} catch (e) {
    console.log("Failed to instantiate the CsvDict. ");
    console.log("Error: %s", e);
    process.exit(1);
}

csvDict.on('tblLoaded', report);

function report(event) {
    console.log("Table named '%s' is loaded", event);
    var tblKeys = csvDict.tblKeys();
    var keyCount = tblKeys.length;
    console.log("%d Keys: %s", keyCount, tblKeys.join(", "));
    console.log(JSON.stringify(csvDict.data, null, 2));
}

