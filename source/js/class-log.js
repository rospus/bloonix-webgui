var Log = function() {};

Log.cache = [];
Log.level = "info";

Log.levelByName = {
    debug: 4,
    info: 3,
    warning: 2,
    error: 1,
    fatal: 0
};

Log.debug = function(msg) { Log.log("debug", msg) };
Log.info = function(msg) { Log.log("info", msg) };
Log.warning = function(msg) { Log.log("warning", msg) };
Log.error = function(msg) { Log.log("error", msg) };
Log.fatal = function(msg) { Log.log("fatal", msg) };

Log.log = function(level, msg) {
    if (Log.levelByName[level] <= Log.levelByName[Log.level]) {
        console.log(level +": ", msg);
    }
    if (Log.levelByName[level] < 3) {
        if (!Bloonix.forceScreen && Bloonix.objects.footerStats.Alerts) {
            Bloonix.objects.footerStats.Alerts.css({
                "font-weight": "bold",
                "color": "#ff0000"
            });
        }
        Log.cache.push({ level: level, message: msg });
        if (Log.cache.length > 20) {
            Log.cache.shift();
        }
    }
};
