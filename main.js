var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var multer = require('multer');
var renderingEngine = require('ejs-locals');
var stream = require('stream');
var parsefile = require('./parsefile.js');
var parseFile = parsefile.parseFile;
var trimStringsInArr = parsefile.trimStringsInArr;
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

var DriverObj = {};
var upload = multer({ storage: storage });
var fileName ="";
var encoding = "CP-1252";
var targetLinesArr=[];
var response;

app.get('/', function(req, res){
	res.render('index');
});

app.post('/uploads', upload.array('inffile', 10), function(req, res){
	console.log(req.files);			
	response = res;
	fileName = "uploads/"+req.files[req.files.length - 1]["filename"];
	collectOSData();
});

function collectOSData(){	
	parseFile(function(ParsedObj){getManufacturerNames(ParsedObj)}, fileName, encoding, ['Manufacturer']);
};

function getManufacturerNames(ParsedObj){	
	for (manufacturerAlias in ParsedObj.Manufacturer) {
			var propertiesArr = ParsedObj.Manufacturer[manufacturerAlias].split(',');
			propertiesArr = trimStringsInArr(propertiesArr);			
			var model = propertiesArr.shift();
			var modelOSObj = {};	
			modelOSObj[model] = propertiesArr;
			DriverObj[manufacturerAlias] = modelOSObj;
		}	
	for (manAlias in DriverObj) {
		if (~manAlias.indexOf("%")){			
			targetLinesArr.push(manAlias.replace(/(^%+|%+$)/g,''));
		}		
	}
	parseFile(function(){getMan(ParsedObj)}, fileName, encoding, ['Strings'], targetLinesArr, ParsedObj);
}

function getMan(ParsedObj){
	for (m in targetLinesArr) {
				var manAlias = "%"+targetLinesArr[m]+"%";							
				DriverObj[ParsedObj.Strings[targetLinesArr[m]]] = DriverObj[manAlias];			
				delete DriverObj[manAlias];				
		}
		getOsFullNames();
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
	console.log(DriverObj);	
	ResponseCallBack();	
}

 function changeOsName(osname){ 	
 	var osNameArr = osname.replace(/^NT/,'').toUpperCase().split(".");
 	var osArcVer = osNameArr[0];
 	var osMajorVer = osNameArr[1];
 	console.log("Arc and MajorV: "+osArcVer+" "+osMajorVer);
 	if (!osMajorVer){if ((osArcVer=="AMD64")||(osArcVer=="X86")) {osMajorVer = "64_86"}}; 	
 	osname = ArcVer[osArcVer]+": "+OsVer[osMajorVer];
 	return osname;
 }

function ResponseCallBack(){
		var driverStr = JSON.stringify(DriverObj);
		response.write(driverStr);				
		response.end();
		clearOldData();
	};

function clearOldData(){
	response={};		
	fileName ="";	
	DriverObj={};
	NextLinesSectionName = "";
	targetLinesArr=[];
	console.log("Old data clearing completed");		
}