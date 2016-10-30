var fs = require('fs');
var dir;
var logName;
var errLogName;

function Logger(opts){

	dir = opts.dir || '/var/log/smg/';
	if (!opts.logName) {
		console.error('未指定Log檔案名稱！');
	}else{
		logName = opts.logName;
	}
	if (opts.errLogName) {
		errLogName = opts.errLogName;
	};
};

Logger.prototype.log = function() {
	var message = (new Date()).toLocaleString() + " => ";

	if (arguments.length == 0) {
		console.error('未輸入任何訊息！');
		return;
	};

	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}

	var len = arguments.length;
	for (var i = 0; i < len; i++) {
		message += JSON.stringify(arguments[i]) + ' ';
	};

	fs.appendFileSync(dir + logName, message+'\n');

	console.log(message);
};

Logger.prototype.error = function() {
	var message = (new Date()).toLocaleString() + " => ";

	if (arguments.length == 0) {
		console.error('未輸入任何錯誤訊息！');
		return;
	};

	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}

	var len = arguments.length;
	for (var i = 0; i < len; i++) {
		message += JSON.stringify(arguments[i]) + ' ';
	};


	fs.appendFileSync(dir + errLogName, message+'\n');

	console.error(message);
};

module.exports = Logger;
