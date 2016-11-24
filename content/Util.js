var Util = {
	path: {
		join: function() {
			var separator = '/';
			var replace = new RegExp(separator+'{1,}', 'g');
			var args = arguments;
			return Object.keys(args).map(function(a) { return args[a]; }).join(separator).replace(replace, separator);
		}
	}
};