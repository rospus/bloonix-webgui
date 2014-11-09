Bloonix.initAjax = function() {
    Ajax.defaults.err = {
        "err-400": function() { location.href = "/login/" },
        "err-405": function() { location.href = "/login/" },
        "err-410": function() { location.href = "/" },
        "err-415": function() { Bloonix.noAuth() },
        "err-700": function() { Bloonix.changeUserPassword({ force: true }) }
    };

    Ajax.defaults.beforeSuccess = function(result) {
        if (result.version && Bloonix.version && Bloonix.version !== result.version) {
            console.log("new application version available:", result.version);
            if ($("#int-version-note").length) {
                return;
            }
            Bloonix.createNoteBox({
                id: "int-version-note",
                baseClass: "headnote",
                text: Text.get("info.new_version")
            });
        }
    };

    Ajax.defaults.ignoreErrors = {
        "err-605": true,
        "err-610": true,
        "err-620": true,
        "err-701": true,
        "err-702": true,
        "err-703": true,
        "err-704": true,
        "err-705": true
    };
};

Bloonix.initUser = function() {
    Log.debug("initUser()");
    Ajax.post({
        url: "/whoami/",
        async: false,
        success: function(result) {
            Bloonix.user = result.data;
            if (Bloonix.user.password_changed == "0") {
                Bloonix.initHeader();
                Bloonix.initFooter();
                Bloonix.changeUserPassword({ force: true });
            }
        }
    });
};

Bloonix.getStats = function() {
    Log.debug("getStats()");

    Bloonix.getHostServiceStats();
    Bloonix.getBrowserStats();
};

Bloonix.getHostServiceStats = function() {
    var hostStats, serviceStats;

    Ajax.post({
        url: "/hosts/stats/status/",
        async: false,
        success: function(data) {
            hostStats = data.data;
        }
    });

    Ajax.post({
        url: "/services/stats/status/",
        async: false,
        success: function(data) {
            serviceStats = data.data;
        }
    });

    if (hostStats != undefined && serviceStats != undefined) {
        $.each([ "UNKNOWN", "CRITICAL", "WARNING", "INFO", "OK" ], function(i, stat) {
            var value = parseFloat(hostStats[stat]);
            var text = value == "1" ? "Host" : "Hosts";
            Bloonix.objects.footerStats[stat].text(value +" "+ text);
        });

        Bloonix.objects.footerStats.Time.html(
            DateFormat(new Date, DateFormat.masks.bloonixNoHour)
        );
    }

    setTimeout(function() { Bloonix.getStats() }, 30000);
};

Bloonix.getBrowserStats = function() {
    if (window.performance) {
        if (window.performance.memory) {
            Bloonix.objects.footerStats.Browser.show()
            Bloonix.updateBrowserStats();
        }
    }
};

Bloonix.updateBrowserStats = function() {
    var m = window.performance.memory;

    var usedHeapSize = Utils.bytesToStr(m.usedJSHeapSize),
        totalHeapSize = Utils.bytesToStr(m.totalJSHeapSize);

    Bloonix.objects.footerStats.Browser
        .text(usedHeapSize +"/"+ totalHeapSize);

    setTimeout(function() { Bloonix.updateBrowserStats() }, 1000);
};
