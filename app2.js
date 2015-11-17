var fs = require('fs');
var readline = require('readline');
var stream = require('stream');
var urlencode = require('urlencode');


var saveNextLines = false;


parseFile('IntcADSPGen.inf', 'CP-1252', 'Manufacturer');


function parseFile (fileName, encoding, targetSection) {
	var instream = fs.createReadStream(fileName); 
	var outstream = new stream;
	var rl = readline.createInterface(instream, outstream);	
	var targetLinesArr =[];

	rl.on('line', function(line) {	
		line = urlencode.decode(line, encoding);		
		var saveThisLine = ckeckForSection(line, targetSection);
		if (saveNextLines && saveThisLine){
			targetLinesArr.push(line);
		}
		ckeckForSection(line, targetSection);		
	});

	rl.on('close', function() {
		var OSArr = reworkSavedLines(targetLinesArr);
	 	console.log(targetLinesArr);
		console.log(OSArr);
	});
}

function ckeckForSection(line, targetSection) {
	var nextSectionStart =  line.indexOf("[");
	
	if (~nextSectionStart){		
		var targetSectionStart =  line.indexOf("["+targetSection+"]");		
		if (~targetSectionStart){
			saveNextLines = true;			
		} else {
			saveNextLines = false;
		}
		return false;
	}
	return true;
}

function getOSfromLine (line) {
	var linePartsArr = line.split(',');	
	linePartsArr.shift(); 
	return linePartsArr;
}

function reworkSavedLines(targetLinesArr) {
	var OSArr = [];
	for (line in targetLinesArr){
		 OSArr = OSArr.concat(getOSfromLine(targetLinesArr[line]));		 
	}
	return OSArr;
}



