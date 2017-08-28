#! /usr/bin/env node

"use strict"; 

var fs = require('fs');
const EventEmitter = require('events').EventEmitter;

// -----------------
// Private interface
// -----------------

//  Breaks doc (multiline buffer) into array of lines using '\n' as
//  line delim.  If last line ends in '\n' we get null line at
//  end...so we pop that off if present
function _lines(doc, delim = '\n') {
    var lines = doc.toString().split(delim);
    if (lines[lines.length - 1] === '') lines.pop();  // remove null last line
    return lines;
}

// Breaks line into fields based on delim, whicch defaults to comma
function _fields(line, delim = ',') {
    return line.toString().split(delim);
}

// returns indices of strings in a list
function _indicesOfStrings(list, strings) {
    var idxs = [];
    if (Array.isArray(list) && Array.isArray(strings)) {
	for (var i = 0; i < strings.length; i++) {
	    var idx = list.indexOf(strings[i]);
	    if (idx > -1) {
		idxs.push(idx);
	    }
	}
	return idxs;
    } else {
	return null;
    }
}

//  Function to generate the callback function which converts contents
//  of CSV file into a JS object (dictionary) where the key is derived
//  by concatenating one/more of the fields in the CSV line.
var _makeJsonObjCB = function(obj) {
    var tblName      = obj.tblName;
    var tblDescr     = obj.tblDescr;
    var numFields    = obj.numFields;  // names of fields to be parsed as numbers
    var keyFields    = obj.keyFields;
    var selFields    = obj.selFields;
    var delim        = obj.delim;
    return function(err, raw) {
	if (err) {
	    console.info("Error: " + err);
	    process.exit(1);
	}
	
	var lines = _lines(raw);
	console.info(lines.length + " lines in file");
	lines = lines.map(function(f) {return f.replace(/"/g, '')});
	
	var headerFields = _fields(lines[0], delim);
	var tblObj = new Object();  // object created by this CB to represent
                                    // the csv file

	// get the indices of the selection and key fields
	numFields = numFields ? numFields : [];  // defaults to []
	selFields = selFields ? selFields : headerFields;  // defaults to "all"
	keyFields = keyFields ? keyFields : headerFields[0]; // defaults to col 1
 	var numIndices   = _indicesOfStrings(headerFields, numFields);
	var keyIndices   = _indicesOfStrings(headerFields, keyFields);
	var selIndices   = _indicesOfStrings(headerFields, selFields);

	// now process the lines of the csv file
	for (var i = 1; i < lines.length; i++) {
	    var fields = _fields(lines[i], delim);

	    // replace number strings with numbers if numFields specified
	    for (var nIdx = 0; nIdx < numIndices.length; nIdx++) {
		var numIdx = numIndices[nIdx];
		fields[numIdx] = Number(fields[numIdx]);
	    }
	    
	    var rowKeyArr    = [];
	    for (var j = 0; j < keyIndices.length; j++) {
		var keyIdx = keyIndices[j];
		rowKeyArr.push(fields[keyIdx]);
	    }

	    var rowKey = rowKeyArr.join('.');
	    
	    var rowObj = {};
	    for (var k = 0; k < selIndices.length; k++) {
		var selIdx = selIndices[k];
		var name = headerFields[selIdx];   // field name
		var value = fields[selIdx];        // field value
		rowObj[name] = value;
	    }

	    tblObj[rowKey] = rowObj;
	    
	}
	
	obj.data = tblObj;
	obj.emit('tblLoaded', tblName)
    };
};

// ----------------
// Public interface
// ----------------
module.exports = CsvDict;

function CsvPathException(obj) {
    this.value = obj.value;
    this.type  = obj.type;
    this.toString = function() {
	if (this.type === "missing") {
	    return "Missing or invalid path specified";
	} else if (this.type === "invalid") {
	    return "Path (" + this.value + ") is invalid";
	} else if (this.type === "nonexistent") {
	    return "Path (" + this.value + ") not found";
	} else if (this.type === "unreadable") {
	    return "Path (" + this.value + ") not readable";
	} else {
	    return "Path exception of unknown type (" + this.type + ")";
	}
    }
}

function CsvDict(params) {
    if ( ! params ||  typeof params.csvPath === "undefined") {
	console.log("Need params.csvPath");
	throw new CsvPathException({type: "missing"});
	return;
    } else if (params.csvPath === null) {
	console.log("Error: Null params.csvPath");
	throw new CsvPathException({type: "invalid", value : "null"});
    }
    
    var csvFileName = params.csvPath.split('/').reverse()[0];
    
    EventEmitter.call(this);
    this.tblName     = params.tblName || csvFileName;
    this.tblDescr    = params.tblDescr;
    this.csvPath     = params.csvPath;      // required
    this.numFields   = params.numFields;    // defaults to field 1
    this.keyFields   = params.keyFields;    // defaults to field 1
    this.selFields   = params.selFields;    // defaults to all fields
    this.delim       = params.delim || ',';
    this.data        = null;
    
    var jsonObjCB = _makeJsonObjCB(this);
    
    fs.readFile(this.csvPath, jsonObjCB);
    
};

CsvDict.prototype = Object.create(EventEmitter.prototype);

// Returns an array containing the keys of the csv-dict data
CsvDict.prototype.tblKeys = function() {
    return Object.getOwnPropertyNames(this.data);
};

// Returns an array of arrays containing selected fields from selected
// records
CsvDict.prototype.valuesForKeys = function(obj) {
    var k, f;
    if (typeof obj === 'object') {
	k = obj.keys   ;
	f = obj.fields ;
    }

    // Supply missing args ... convert to arrays if necessary
    var keys, fields;
    if (typeof(k) === 'undefined' ) {
	keys = this.tblKeys();
    } else if (Array.isArray(k)) { keys = k }  else  { keys = [k] }

    if (typeof(f) === 'undefined' ) {
	fields = this.selFields;
    } else if (Array.isArray(f)) { fields = f } else { fields = [f] }
	
    var recs = [];  // to be returned

    keys.forEach((k) => {
	var record = this.data[k];
	if (record) {   // k is valid property of csv-dict
	    var values = [];
	    values.push(k);
	    fields.forEach((f)=>{
		var v = record[f];
		values.push( typeof(v) === 'undefined' ? '' : v );
	    });
	    recs.push(values);
	}
    });
    return recs;
}

// Returns selected fields of every record
CsvDict.prototype.values = function(f) {
    return this.valuesForKeys({fields : f });
}


