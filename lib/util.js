var u = {
	dateString: function (date) {
		var year = date.getFullYear();
		var month = date.getMonth()+1;
		var day = date.getDate();
		var hour = date.getHours();
		var min = date.getMinutes();
		var sec = date.getSeconds();

		return year+"-"+month+"-"+day+" "+hour+":"+min+":"+sec;
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
	}
};

module.exports = u;