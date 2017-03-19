(function (isStorage) {
    if (!isStorage) {
        /* jshint -W093 */
        var localStorageData = {};
        window.localStorage = {};
        window.localStorage.setItem = function(id, val) { return localStorageData[id] = String(val); };
        window.localStorage.getItem = function(id) { return localStorageData.hasOwnProperty(id) ? localStorageData[id] : null; };
        window.localStorage.removeItem = function(id) { return delete localStorageData[id]; };
        window.localStorage.clear = function() { return localStorageData = {}; };

        var data = {};
        window.sessionStorage = {};
        window.sessionStorage.setItem = function(id, val) { return sessionStorageData[id] = String(val); };
        window.sessionStorage.getItem = function(id) { return sessionStorageData.hasOwnProperty(id) ? sessionStorageData[id] : null; };
        window.sessionStorage.removeItem = function(id) { return delete sessionStorageData[id]; };
        window.sessionStorage.clear = function() { return sessionStorageData = {}; };
        /* jshint +W093 */
    }
})((function () {
    try {
        /* jshint -W041 */
        return "localStorage" in window && window.localStorage != null && (window.localStorage.setItem("available", true) || true) && window.localStorage.getItem("available");
        /* jshint +W041 */
    } catch (e) {
        return false;
    }
})());