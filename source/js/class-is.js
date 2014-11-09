var Is = function() {};
var IsNot = function() {};

Is.empty = function(x) {
    if (x === undefined || x === false || x.toString().length === 0) {
        return true;
    }   
    
    return false;
};

IsNot.empty = function(x) {
    if (Is.empty(x)) {
        return false;
    }

    return true;
};
