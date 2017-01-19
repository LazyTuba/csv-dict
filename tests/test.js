#! /usr/bin/env node

'use strict';

var CsvDict = require('../csv-dict.js');

// stop_id,stop_code,stop_name,stop_lat,stop_lon,zone_id
var csvFile = 'tests/stops.txt';

var keyFields = ['stop_id'];
var selFields = ['stop_id','stop_code','stop_name',
		 'stop_lat','stop_lon'];

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
    console.log(" i) Table named '%s' is loaded", event);
    var tblKeys = csvDict.tblKeys();
    var keyCount = tblKeys.length;
    console.log(" 2) %d Keys: %s", keyCount, tblKeys.join(", "));
    console.log(JSON.stringify(csvDict.data, null, 2));
    console.log(' 3) ---');
    var answer = csvDict.valuesForKeys({keys : '9', fields : ['stop_code', 'stop_name']})
    console.log(JSON.stringify(answer));
    console.log(' 4) ---');
    var answer = csvDict.valuesForKeys({keys : ['9','10'], fields : 'stop_code'})
    console.log(JSON.stringify(answer));
    console.log(' 5) ---');
    var answer = csvDict.values(['stop_code', 'stop_name']);
    console.log(JSON.stringify(answer));
    console.log(' 6) ---');
    var answer = csvDict.values();
    console.log(JSON.stringify(answer));
}


