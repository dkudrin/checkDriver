var fs = require('fs');
var readline = require('readline');
var stream = require('stream');
var urlencode = require('urlencode');
var events = require("events");
var parsingProgress = new events.EventEmitter();

var SectionsObj ={};
var NextLinesSectionName = "";

var manufacturerAliasArr=[];
var OSAliasArr=[];
var ModelsArr=[];


getOSVersions();
function getOSVersions(){
	parseFile('IntcADSPGen.inf', 'CP-1252', ['Manufacturer']);
	parsingProgress.on("finished", function(){
		for (var manufacturerAlias in SectionsObj.Manufacturer) {
			manufacturerAliasArr.push(manufacturerAlias);
			var propertiesArr = SectionsObj.Manufacturer[manufacturerAlias].split(',');		
			OSAliasArr.push(propertiesArr.shift());
			ModelsArr.push(propertiesArr[0]);
		}
		console.log("OS>> "+OSAliasArr);
		console.log("Models>> "+ModelsArr);
	});
};

function parseFile (fileName, encoding, targetSectionsArr) {
	var instream = fs.createReadStream(fileName); 
	var outstream = new stream;
	var rl = readline.createInterface(instream, outstream);	
	var targetLinesArr =[];

	rl.on('line', function(line) {	
		line = urlencode.decode(line, encoding);

		var lineForSaving = ckeckTargetSectionEntry(line, targetSectionsArr);
		if (NextLinesSectionName && lineForSaving ) {
			buildSectionsObj(NextLinesSectionName, line);
		}
		ckeckTargetSectionEntry(line, targetSectionsArr);
	});

	rl.on('close', function() {
		//console.log(SectionsObj);
		//console.log(SectionsObj.Manufacturer[Object.keys(SectionsObj.Manufacturer)[0]]);
		console.log("Object successfully parsed");
		parsingProgress.emit("finished");

	});
}

function ckeckTargetSectionEntry(line, targetSectionsArr) {
	if (line.indexOf(";")==0 || line == ""){
		var emptyLineOrComment = true;
	} else {
		var emptyLineOrComment = false;
	}

	var nextSectionStart =  line.indexOf("[");
	if (~nextSectionStart) {
		var sectionName = line.replace("[","").replace("]","");				
		if (~targetSectionsArr.indexOf(sectionName)) {			
			NextLinesSectionName = sectionName;									
		} else {
			NextLinesSectionName = "";
		}
		return false;
	} else if (!emptyLineOrComment){
		return true;
	} else {
		return false;
	}	
}


function buildSectionsObj(sectionName, line) {
	var linePartsArr = line.split('=');
	if (sectionName in SectionsObj) {
		SectionsObj[sectionName][linePartsArr[0]] = linePartsArr[1];
	} else {
		SectionsObj[sectionName] ={};
		SectionsObj[sectionName][linePartsArr[0]] = linePartsArr[1];  // Убрать лишнее 
	}
	return SectionsObj;
}

function reworkSavedLines(targetLinesArr) {
	var OSArr = [];
	for (line in targetLinesArr){
		 OSArr = OSArr.concat(getOSfromLine(targetLinesArr[line]));		 
	}
	return OSArr;
}

function getOSfromLine (line) {
	var linePartsArr = line.split(',');	
	linePartsArr.shift(); 
	return linePartsArr;
}


// sectionsObj = {
// 		"Manufacturer": {
// 			"%V_BCM%": "BROADCOM, NTx86.6.0, NTamd64.6.0, NTx86.6.1, NTamd64.6.1",
// 			"%V_BCM%": "BROADCOM, NTx86.6.0, NTamd64.6.0, NTx86.6.1, NTamd64.6.1"
// 		},
// 		"Strings": {
// 			"V_BCM":"Broadcom",
// 			"BCM430G_DeviceDesc":"Broadcom 802.11b/g WLAN",
// 			"BCM430M_DeviceDesc":"Broadcom 802.11a/b/g WLAN"
// 		},
// 		"BROADCOM.NTamd64.6.1": {
// 			"%BCM430G_DeviceDesc%" = "BCM43XG_NT60, PCI\VEN_14E4&DEV_4320&SUBSYS_00E70E11&REV_03",
// 			"%BCM430G_DeviceDesc%" = "BCM43XGT_NT60, PCI\VEN_14E4&DEV_4320&SUBSYS_12F4103C&REV_03"
// }
