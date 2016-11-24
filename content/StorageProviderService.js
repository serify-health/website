module.provider('storageProviderService', function(){
	var StorageProvider = function(id){
		var storageId = id;
		return {
			Save: function(key, value) {
				window.localStorage.setItem(storageId + '-' + key, JSON.stringify(value));
			},
			Get: function(key) {
				var val = window.localStorage.getItem(storageId + '-' + key);
				if(!val) { return null; }
				try {
					return JSON.parse(val);
				}
				catch (exception) {
					return val;
				}
			},
			Delete: function(key) {
				window.localStorage.removeItem(storageId + '-' + key);
			}
		};
	};

	var StorageProviderService = function(){
		return {
			GetStorageProvider: function(id) { return new StorageProvider(id); }
		};
	};

	var storageProviderService = new StorageProviderService();
	this.$get = function(){ return storageProviderService; };
});