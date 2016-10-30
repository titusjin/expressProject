const Xml2js = require('xml2js');
const Helper = require('smg-helper');
const rp = require('request-promise');

var helper = {
	config : function(configName){
      return Helper.config(configName);
  	},
	logger : function(appName){
      var logger = Helper.logger();
      var config = Helper.config('config');

      var options = {
		appName: (appName) ? appName : 'smg_op',
		levels: config.log.levels,
		logDir: config.log.logDir,
		print: config.log.print,
        slack:{
            turnOff: config.log.slack.turnOff
		}
      };

      logger.configure(options);
      return logger;
  	},
  	dateFormater : function(date){
		return Helper.dateformater(date);
	},
  	todayString : function(){
		return this.dateFormater(new Date()).shortDate;
	},
	dateString: function (date) {
		return this.dateFormater(date).longDate;
	},
	dateTimeUUID: function (date) {
		var year = String(date.getFullYear());
		var month = String(date.getMonth()+1);
		var day = String(date.getDate());
		var hour = String(date.getHours());
		var min = String(date.getMinutes());
		var sec = String(date.getSeconds());
		var msec = String(date.getMilliseconds());
		return year + month + day + hour + min + sec + msec;
	},
	batchString: function () {
		var date = new Date();
		var year = date.getFullYear();
		var month = date.getMonth()+1;
		var day = date.getDate();
		var hour = date.getHours();
		var min = date.getMinutes();
		if (month<10) {
			month = '0'+month;
		}
		if (day<10) {
			day = '0'+day;
		}
		if (hour<10) {
			hour = '0'+hour;
		}
		if (min<10) {
			min = '0'+min;
		}
		return 'batch_'+year+month+day+hour+min;
	},
	apiCall: function(api, opts, callback) {
		if (typeof opts === 'function') {
			callback = opts;
			opts = { format : 'json' };
		};

		var options = {
	      	uri : api,
	      	method : opts.method || 'GET',
	      	headers: opts.headers || {
				'Cache-Control': 'private, no-cache, no-store, must-revalidate',
				'Expires': '-1',
				'Pragma': 'no-cache'
	    	},
	    	format: opts.format || 'json',
	    	resolveWithFullResponse : true
		};

		//change to use request-promise
		rp(options).then(function(response){
			var stCode = response.statusCode;

			if(!(/^2/.test('' + stCode))){
				return callback('statusCode :' + stCode + '. api call error : ' + response.error);
			}else{
				if (opts.format == 'xml') {
					Xml2js.parseString(response.body, function(err, result){
			        	if (err) {
			        		callback(err);
			        	}else{
			        		callback(null, result);
			        	}
	        		});
				}else if(opts.format == 'origin'){
					callback(null, result.body);
				}else{
					try{
						var parsed = JSON.parse(response.body);
						callback(null, parsed);
					}catch(err){
						callback(err);
					}
				}
			}
		}).catch(function (err) {
			console.error(err);
			callback(err);
    	});
	}
};


module.exports = helper;
