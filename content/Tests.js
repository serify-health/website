var TESTS = (function(){
    var dict = {
        "HIV": {
            name: "HIV"
        },
        "Gonorrhea": {
            name: "Gonorrhea"
        },
        "Chlamydia": {
            name: "Chlamydia"
        },
        "Herpes": {
            name: "Herpes I"
        },
        "HerpesII": {
            name: "Herpes II"
        },
        "Syphilis": {
            name: "Syphilis"
        },
        "HPV": {
            name: "HPV Vaccine"
        },
        "PrEP": {
            name: "Pre-exposure prophylaxis"
        }
    };
    return Object.keys(dict).map(function(key){
        return { id: key, name: dict[key].name };
    });
})();