var fs = require('fs');
var readline = require('readline');
var stream = require('stream');
var urlencode = require('urlencode');
var events = require("events");
var parsingProgress = new events.EventEmitter();
var getManNamesEvent = new events.EventEmitter();

var ParsedObj ={};
var NextLinesSectionName = "";

var DriverObj={};


var OsVer = {"6":["Windows Vista","Windows Server 2008","Windows 7", "Windows Server 2008 R2"],
"5":["Windows 2000", "Windows XP", "Windows Server 2003", "Windows Server 2003 R2"]};

var ArcVer = {"AMD64":"64 bit", "X86":"32 bit", "IA64":"64 bit Intel Itanium"};

getOSVersions('IntcADSPGen.inf', 'CP-1252');
//getOSVersions('IntcADSPGen.inf', 'utf-8');
//getOSVersions('bcmwl6.inf', 'utf-16');

function getOSVersions(fileName, encoding){
	parseFile(arguments.callee.name, fileName, encoding, ['Manufacturer']);
	parsingProgress.on(arguments.callee.name+" finished", function(){
		for (manufacturerAlias in ParsedObj.Manufacturer) {	
			var propertiesArr = ParsedObj.Manufacturer[manufacturerAlias].split(',');
			propertiesArr = trimStringsInArr(propertiesArr);			
			var model = propertiesArr.shift();
			var modelOSObj = {};	
			modelOSObj[model] = propertiesArr;
			DriverObj[manufacturerAlias] = modelOSObj;
		}		
		getManufacturerNames(fileName, encoding);	
	});
	getManNamesEvent.on("finished", function(){
		getOsFullNames();
		console.log(DriverObj);
	});

};

function getManufacturerNames(fileName, encoding){
	var targetLinesArr=[];	
	for (manAlias in DriverObj) {
		if (~manAlias.indexOf("%")){			
			targetLinesArr.push(manAlias.replace(/(^%+|%+$)/g,''));
		}		
	}
	parseFile(arguments.callee.name, fileName, encoding, ['Strings'], targetLinesArr);
	parsingProgress.on(arguments.callee.name+" finished", function(){
		for (m in targetLinesArr) {
				var manAlias = "%"+targetLinesArr[m]+"%";							
				DriverObj[ParsedObj.Strings[targetLinesArr[m]]] = DriverObj[manAlias];			
				delete DriverObj[manAlias];				
		}
		getManNamesEvent.emit("finished");
	});
} 

function getOsFullNames(){
	for (manufacturer in DriverObj){
		for(model in DriverObj[manufacturer]){			
			for (os in DriverObj[manufacturer][model]){				
				var osname = changeOsName(DriverObj[manufacturer][model][os]);
				DriverObj[manufacturer][model][os] = osname;
			}
		}
	}
}

 function changeOsName(osname){ 	
 	var osNameArr = osname.replace(/^NT/,'').toUpperCase().split(".");
 	var osArcVer = osNameArr[0];
 	var osMajorVer = osNameArr[1]; 	
 	osname = OsVer[osMajorVer]+" "+ArcVer[osArcVer];
 	return osname;
 }

function parseFile (caller, fileName, encoding, targetSectionsArr, targetLinesArr) {
	console.log(caller);
	var instream = fs.createReadStream(fileName); 
	var outstream = new stream;
	var rl = readline.createInterface(instream, outstream);	
	
	rl.on('line', function(line) {		
		//line = urlencode.decode(line, encoding);

		var lineForSaving = ckeckTargetSectionEntry(line, targetSectionsArr,targetLinesArr);
		if (NextLinesSectionName && lineForSaving ) {
			buildParsedObj(NextLinesSectionName, line);
		}
		ckeckTargetSectionEntry(line, targetSectionsArr,targetLinesArr);
	});

	rl.on('close', function() {
		console.log("Object successfully parsed");		
		parsingProgress.emit(caller+" finished");
	});
}

function ckeckTargetSectionEntry(line, targetSectionsArr, targetLinesArr) {
	if (~line.indexOf("[")) {
		var sectionName = line.replace("[","").replace("]","");				
		if (~targetSectionsArr.indexOf(sectionName)) {			
			NextLinesSectionName = sectionName;									
		} else {
			NextLinesSectionName = "";
		}
		return false;
	} else if (isLineForSaving(line, targetLinesArr)){
		return true;
	} else {
		return false;
	}	
}

function isLineForSaving(line, targetLinesArr){
	if (targetLinesArr){
		return isInTargetLinesArr(line, targetLinesArr);
	} else {
		return !isEmptyLineOrComment(line);
	}
}


function isInTargetLinesArr(line, targetLinesArr){
	for (tragetLineId in targetLinesArr){
		if (line.indexOf(targetLinesArr[tragetLineId])==0) {
			return true;
		} else {
			return false;
		}
	}
}

function isEmptyLineOrComment(line){	
	if (line.indexOf(";")==0 || line == ""){
		return true;
	} else {
		return false;
	}
}


function buildParsedObj(sectionName, line) {
	var linePartsArr = line.split('=');	
 	linePartsArr = trimStringsInArr(linePartsArr);
	if (sectionName in ParsedObj) {
		ParsedObj[sectionName][linePartsArr[0]] = linePartsArr[1];
	} else {
		ParsedObj[sectionName] ={};
		ParsedObj[sectionName][linePartsArr[0]] = linePartsArr[1];  // Убрать лишнее 
	}
	return ParsedObj;
}



function trimStringsInArr(arr){
	for (n in arr) {
		arr[n] = arr[n].replace(/(^\s|"+|\s|"+$)/g,'') 		
	}
	return arr;
}