window.localStorage.setItem('DEBUG', 'false');
window.isDebug = function() { return window.localStorage.getItem('DEBUG') == 'true'; };
window.toggleDebug = function() {
	window.localStorage.setItem('DEBUG', (!window.isDebug()).toString());
};

window.ErrorHandlerList = [];
window.onerror = function(error, func, line) {
	var message = 'Error: ' + error.toString() + ' excuting ' + func.toString() + ':' + line.toString();
	console.error(message);
	if(window.isDebug()) { alert(message); }
	else {
		window.ErrorHandlerList.map(function(handler) {
			handler(error, func, line);
		});
	}
};