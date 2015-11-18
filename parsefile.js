var fs = require('fs');
var stream = require('stream');
var readline = require('readline');
var stream = require('stream');
var urlencode = require('urlencode');
var events = require("events");
var parsingProgress = new events.EventEmitter();
var NextLinesSectionName = "";

var ParsedObj = {};
var DriverObj = {};

exports.parseFile = parseFile;
exports.ParsedObj = ParsedObj;
exports.DriverObj = DriverObj;
exports.parsingProgress = parsingProgress;
exports.trimStringsInArr =  trimStringsInArr;
exports.clearOldData =  clearOldData;


function parseFile (caller, fileName, encoding, targetSectionsArr, targetLinesArr) {
	console.log(">>>"+arguments.callee.name+" fired, caller: "+caller);
	
	var instream = fs.createReadStream(fileName);
	var outsream;	
	var rl = readline.createInterface(instream, outsream);	
	
	rl.on('line', function(line) {		
		//line = urlencode.decode(line, encoding);		
		var lineForSaving = ckeckLine(line, targetSectionsArr,targetLinesArr);
		if (NextLinesSectionName && lineForSaving ) buildParsedObj(NextLinesSectionName, line);
		ckeckLine(line, targetSectionsArr, targetLinesArr);
	});

	rl.on('close', function() {
		console.log("Parsing for "+caller+" finished");		
		parsingProgress.emit("Parsing for "+caller+" finished");
		
	});
	
}

function ckeckLine(line, targetSectionsArr, targetLinesArr) {
	if(!isSectionEntry(line, targetSectionsArr)) return (isLineForSaving(line, targetLinesArr));
	return false;
}

function isSectionEntry(line, targetSectionsArr){
	if (~line.indexOf("[")) {
		var sectionName = line.replace("[","").replace("]","");				
		if (~targetSectionsArr.indexOf(sectionName)) {			
			NextLinesSectionName = sectionName;									
		} else { NextLinesSectionName = ""	}
		return true;
	} return false;
}

function isLineForSaving(line, targetLinesArr){
	if (targetLinesArr) return isInTargetLinesArr(line, targetLinesArr);
	return !isEmptyLineOrComment(line);	
}

function isInTargetLinesArr(line, targetLinesArr){
	for (tragetLineId in targetLinesArr){
		if (line.indexOf(targetLinesArr[tragetLineId])==0) return true;
	} 	
}

function isEmptyLineOrComment(line){	
	if (line.indexOf(";")==0 || line == "") return true;		
}

function buildParsedObj(sectionName, line) {	
	var linePartsArr = line.split('=');	
 	linePartsArr = trimStringsInArr(linePartsArr);
	if (!(sectionName in ParsedObj)) ParsedObj[sectionName] ={};
	ParsedObj[sectionName][linePartsArr[0]] = linePartsArr[1];
}

function trimStringsInArr(arr){
	for (n in arr) arr[n] = arr[n].replace(/(^\s|"+|\s|"+$)/g,'');	
	return arr;
}

function clearOldData(){
	console.log(">>>"+arguments.callee.name+" fired");
	ParsedObj={};
	DriverObj={};
	NextLinesSectionName = "";			
}
