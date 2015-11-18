var fs = require('fs');
var stream = require('stream');
var readline = require('readline');
var urlencode = require('urlencode');
var NextLinesSectionName = "";

exports.parseFile = parseFile;
exports.trimStringsInArr =  trimStringsInArr;


function parseFile (callback, fileName, encoding, targetSectionsArr, targetLinesArr, ParsedObj) {		
	console.log("File parsing started");
	if (!ParsedObj) var ParsedObj={};	
	var instream = fs.createReadStream(fileName);
	var outsream;	
	var rl = readline.createInterface(instream, outsream);
	
	rl.on('line', function(line) {		
		//line = urlencode.decode(line, encoding);		
		var lineForSaving = ckeckLine(line, targetSectionsArr,targetLinesArr);
		if (NextLinesSectionName && lineForSaving ) {
			ParsedObj = buildParsedObj(ParsedObj, NextLinesSectionName, line);
		}
		ckeckLine(line, targetSectionsArr, targetLinesArr);
	});

	rl.on('close', function() {		
		console.log("File parsing finished");		
		callback(ParsedObj);		
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

function buildParsedObj(ParsedObj, sectionName, line) {	
	var linePartsArr = line.split('=');	
 	linePartsArr = trimStringsInArr(linePartsArr);
	if (!(sectionName in ParsedObj)) ParsedObj[sectionName] ={};
	ParsedObj[sectionName][linePartsArr[0]] = linePartsArr[1];
	return ParsedObj;
}

function trimStringsInArr(arr){
	for (n in arr) arr[n] = arr[n].replace(/(^\s|"+|\s|"+$)/g,'');	
	return arr;
}


