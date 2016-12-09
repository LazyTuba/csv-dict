# csv-dict.js

## Description

Some Node modules represent a CSV file as an ARRAY of javascript (JS)
objects.  This module represents a CSV file as a DICTIONARY of JS
objects.  It reads a CSV file and returns a single JS 'object of
objects' where each line of the CSV file is represented as a named
property of the returned object.  This object of objects can serve as
a (sort of) database table to represent a small-ish CSV file.

## Constraints

 1. The module assumes and requires a 'header' line: the
 comma-separated values in the first line of the CSV file are the
 names of the comma-separated 'fields' in each of the succeeding
 'data' lines.

 2. The module also assumes and requires that a subset of one or more
 of the fields of the CSV file contain, in each line, values which
 uniquely identify that line.  These 'key field(s)' are used to derive
 a key for each line of the CSV file by concatenating the value(s) of
 those field(s) to form a string that's unique across all lines.

## USAGE

var CsvDict = require('csv-dict');
    
    var csvdict = new CsvDict({
        tblName    = <string>,                   // deafaults to the file name
        tblDescr   = <string>,                   // nice to have..future use
        csvPath    = <string>,                   // required
        keyFields  = [<field1>,..],              // defaults to field #1
        selFields  = [<field1>, <field2>, ...],  // defaults to all fields
        delim      = ','                         // defaults to comma
	});

The module's constructor function accepts arguments represented as
properties of a single object.

The "keyFields" argument is an array of one/more field name(s) (a
subset of values in first line of CSV file).  The field(s) in the
keyFields array specify the fields containing values which form, for
each of the succeeding data lines, the a 'key' unique among all lines
of the CSV file, and which is used to derive the name of the property
that will represent that line.

The "selFields" (as in "select fields") argument is analogous to the
SQL "SELECT" directive and specifies the fields which should be
included in the csv-dict object.  If not specified, it defaults to all
fields.

Each data line of the CSV file is represented in the returned object
as a property, where the property name is the line's 'key' (the
concatenation of the value(s) of that line's key field(s)) and the
property value is a JS 'row' object.  The 'row object' for each line
is itself an object with properties corresponding to all, or a subset
(specified by selFields) of, the CSV file's fields, where each
property's name is one of the field names and the property value is
the value of that field in the line.

## Usage Example

    var csvdict = require('../csv-dict.js');
    
    // stop_id,stop_code,stop_name,stop_lat,stop_lon,zone_id
    var csvFile = 'tests/stops.txt';
    
    var keyFields = ['stop_id'];
    var selFields = ['stop_id','stop_code','stop_name',
    		 'stop_lat','stop_lon','zone_id'];
    
    try {
        var csv2dict = new Csv-dict({
    	tblName     : 'Stops',
    	tblDescr    : 'Train stops',
    	csvPath     : csvFile,
    	keyFields   : keyFields,
    	selFields   : selFields,
    	delim       : ""
        });
    } catch (e) {
        console.log("Failed to instantiate the Csv2dict. ");
        console.log("Error: %s", e);
        process.exit(1);
    }
    
    csv2dict.on('tblLoaded', report);
    
    function report(event) {
        console.log("Table named '%s' is loaded", event);
        var tblKeys = csv2dict.tblKeys();
        var keyCount = tblKeys.length;
        console.log("%d Keys: %s", keyCount, tblKeys.join(", "));
        console.log(JSON.stringify(csv2dict.data, null, 2));
    }
    

