var fs = require('fs');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var multer = require('multer');
var renderingEngine = require('ejs-locals');
var stream = require('stream');
var urlencode = require('urlencode');
var events = require("events");
var collectingProgress = new events.EventEmitter();
var getManNamesEvent = new events.EventEmitter();
var parsefile = require('./parsefile.js');
var parseFile = parsefile.parseFile;
var ParsedObj = parsefile.ParsedObj;
var DriverObj = parsefile.DriverObj;
var trimStringsInArr = parsefile.trimStringsInArr;
var parsingProgress = parsefile.parsingProgress;
var clearOldData = parsefile.clearOldData;
var OsVer = {"6":["Windows Vista","Windows Server 2008","Windows 7", "Windows Server 2008 R2"],"5":["Windows 2000", "Windows XP", "Windows Server 2003", "Windows Server 2003 R2"], "64_86":["Windows XP", "Windows Server 2003", "Windows Server 2003 R2", "Windows 7", "Windows 8", "Windows 10"]};
var ArcVer = {"AMD64":"64 BIT", "X86":"32 BIT", "IA64":"64 BIT (Intel Itanium)"};

var app = express();
app.engine('ejs', renderingEngine);
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.listen(8080, function () {    
    console.log('Express server listening on port 8080');
});

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname+'/uploads')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now()+"_"+file.originalname)
  }
}) 
var upload = multer({ storage: storage });

app.get('/', function(req, res){
	res.render('index');
});

app.post('/uploads', upload.array('inffile', 10), function(req, res){
	console.log(req.files);
	collectOSData("uploads/"+req.files[req.files.length - 1]["filename"], 'CP-1252');
	
	
	collectingProgress.on("finished", function(){		
		var driverStr = JSON.stringify(DriverObj);
		res.write(driverStr);
		clearOldData();
		res.end();			
	});
	
});


//collectOSData('IntcADSPGen.inf', 'CP-1252');
//collectOSData('IntcADSPGen.inf', 'utf-8');
//collectOSData('bcmwl6.inf', 'utf-16');

function collectOSData(fileName, encoding){	
	parseFile("collectOSData", fileName, encoding, ['Manufacturer']);	
	parsingProgress.on("Parsing for collectOSData finished", function(){			
		
		for (manufacturerAlias in ParsedObj.Manufacturer) {	
			var propertiesArr = ParsedObj.Manufacturer[manufacturerAlias].split(',');
			propertiesArr = trimStringsInArr(propertiesArr);			
			var model = propertiesArr.shift();
			var modelOSObj = {};	
			modelOSObj[model] = propertiesArr;
			DriverObj[manufacturerAlias] = modelOSObj;
		}		
		getManufacturerNames("collectOSData", fileName, encoding);		
	});
	getManNamesEvent.on("finished", function(){			
		getOsFullNames();		
		console.log(DriverObj);		
		collectingProgress.emit("finished");
	});

};

function getManufacturerNames(caller, fileName, encoding){	
	var targetLinesArr=[];	
	for (manAlias in DriverObj) {
		if (~manAlias.indexOf("%")){			
			targetLinesArr.push(manAlias.replace(/(^%+|%+$)/g,''));
		}		
	}
	parseFile("getManufacturerNames", fileName, encoding, ['Strings'], targetLinesArr);
	parsingProgress.on("Parsing for getManufacturerNames finished", function(){		
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
 	console.log(">>>>>>>"+osArcVer+" "+osMajorVer);
 	if (!osMajorVer){if ((osArcVer=="AMD64")||(osArcVer=="X86")) {osMajorVer = "64_86"}}; 	
 	osname = ArcVer[osArcVer]+": "+OsVer[osMajorVer];
 	return osname;
 }



