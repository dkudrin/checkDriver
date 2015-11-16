var fs = require('fs');
var readline = require('readline');
var stream = require('stream');
var urlencode = require('urlencode');

var instream = fs.createReadStream('IntcADSPGen.inf'); // C:/Program Files/Broadcom/Broadcom 802.11/Driver/bcmwl6.inf
var outstream = new stream;
var rl = readline.createInterface(instream, outstream);

var targetSection = "Manufacturer"; // IntcADSPModel_ASUS1043181D  Manufacturer
var targetLinesArr =[];
var saveNextLines = false;
var encoding ="CP-1252"

rl.on('line', function(line) {	
	line = urlencode.decode(line, encoding);
	var saveThisLine = ckeckForSection(line, targetSection);
	if (saveNextLines && saveThisLine){
		targetLinesArr.push(line);
	}
	ckeckForSection(line, targetSection);		
});


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

var OSArr = [];
function reworkSavedLines(targetLinesArr) {
	for (line in targetLinesArr){
		 OSArr = OSArr.concat(getOSfromLine(targetLinesArr[line]));		 
	}
}

rl.on('close', function() {
	reworkSavedLines(targetLinesArr);
 	//console.log(targetLinesArr);
	console.log(OSArr);
});

