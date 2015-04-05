// Start of encapsulation.
(function(){
"use strict";

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
var Ajax = {};

// This are the default options of Ajax() itself, not jQuery.ajax().
Ajax.defaults = {
    token: false,
    tokenURL: "/token/csrf",
    beforeSuccess: false,
    handleStatus: {},
    ignoreErrors: {},
    err: {},
    success: false
};

// This are the default options that will be passed to jQuery.ajax().
Ajax.ajaxDefaults = {
    type: "post",
    contentType: "application/json; charset=utf-8",
    scriptCharset: "utf-8",
    dataType: "json",
    processData: false,
    async: true,
    error: function() {
        Log.error(
            "Failed to load data from server."
            +"Try it again and reload the site."
            +"Please contact an administrator if the request failed again."
        );
    }
};

Ajax.post = function(opts) {
    if (opts.token === true || Ajax.defaults.token === true) {
        Ajax.__post({
            url: opts.tokenURL || Ajax.defaults.tokenURL,
            async: false,
            type: "get",
            success: function(result) {
                if (opts.data == undefined) {
                    opts.data = {};
                }
                opts.data.token = result.data;
                Ajax.__post(opts);
            }
        });
    } else {
        Ajax.__post(opts);
    }
};

Ajax.__post = function(jQueryAjaxOptions) {
    // At first the options will be splittet. "self" has options for Ajax().
    // "request" has options for jQuery.ajax().
    var opts = Utils.shift(Ajax.defaults, jQueryAjaxOptions);

    Utils.append(jQueryAjaxOptions, Ajax.ajaxDefaults);
    Utils.append(opts, Ajax.defaults);
    Utils.append(opts.handleStatus, Ajax.defaults.handleStatus);
    Utils.append(opts.ignoreErrors, Ajax.defaults.ignoreErrors);
    Utils.append(opts.err, Ajax.defaults.err);

    jQueryAjaxOptions.success = function(result) {
        Log.debug("response status: "+ result.status);

        if (opts.beforeSuccess !== false) {
            opts.beforeSuccess(result);
        }

        if (opts.handleStatus[result.status]) {
            opts.handleStatus[result.status](result);
            return false;
        }

        if (result.status === "ok" || opts.ignoreErrors[result.status] === true) {
            if (opts.success != undefined) {
                opts.success(result);
            }
            return false;
        }

        Log.error("request ("+ jQueryAjaxOptions.url +"):");
        Log.error(result);

        var infoErr;

        if (opts.err[result.status]) {
            infoErr = opts.err[result.status]();
        } else if (result.data && result.data.message) {
            infoErr = result.data.message;
        } else {
            infoErr = result.status;
        }

        if (infoErr) {
            $("#overlay").remove();
            $("#content").html(
                Utils.create("div")
                    .addClass("info-err")
                    .html(infoErr)
            );
            throw new Error();
        }
    };

    if (jQueryAjaxOptions.beforeSend == undefined) {
        jQueryAjaxOptions.beforeSend = Ajax.addXHRs;
    } else {
        var beforeSend = jQueryAjaxOptions.beforeSend;
        jQueryAjaxOptions.beforeSend = function(x) {
            Ajax.addXHRs(x);
            beforeSend(x);
        }
    }

    if (jQueryAjaxOptions.complete == undefined) {
        jQueryAjaxOptions.complete = Ajax.removeXHRs;
    } else {
        var complete = jQueryAjaxOptions.complete;
        jQueryAjaxOptions.complete = function(x) {
            Ajax.removeXHRs(x);
            complete(x);
        }
    }

    if (typeof(jQueryAjaxOptions.data) == "object") {
        jQueryAjaxOptions.data = Utils.toJSON(jQueryAjaxOptions.data);
    }

    if (jQueryAjaxOptions.data == undefined) {
        jQueryAjaxOptions.type = "get";
    } else {
        jQueryAjaxOptions.type = "post";
    }

    Log.info("request "+ jQueryAjaxOptions.url);
    $.ajax(jQueryAjaxOptions);
};

Ajax.xhrPool = [];

Ajax.addXHRs = function(jqXHR) {
    Log.debug("begin add jqXHR, cur length "+ Ajax.xhrPool.length);
    Ajax.xhrPool.push(jqXHR);
    Log.debug("end add jqXHR, new length "+ Ajax.xhrPool.length);
};

Ajax.removeXHRs = function(jqXHR) {
    Log.debug("begin remove jqXHR, cur length "+ Ajax.xhrPool.length);
    var index = Ajax.xhrPool.indexOf(jqXHR);
    if (index > -1) {
        Ajax.xhrPool.splice(index, 1);
    }
    Log.debug("end remove jqXHR, new length "+ Ajax.xhrPool.length);
};

Ajax.abortXHRs = function() {
    if (Ajax.xhrPool.length > 0) {
        Log.debug("begin abort jqXHR, cur length" + Ajax.xhrPool.length);
        var xhr = Ajax.xhrPool.shift().abort();
        Ajax.abortXHRs();
        Log.debug("end abort jqXHR, new length" + Ajax.xhrPool.length);
    }
};
var Utils = function() {};

Utils.escape = function(str){
    if (str === undefined) {
        return "";
    }
    if (typeof str === "number") {
        return str;
    }
    str = str.replace(/&/g, "&amp;");
    str = str.replace(/</g, "&lt;");
    str = str.replace(/>/g, "&gt;");
    str = str.replace(/"/g, "&quot;");
    str = str.replace(/'/g, "&#39;");
    return str;
};

Utils.replacePattern = function(str, data) {
    if (/:[a-zA-Z_0-9]+/.test(str)) {
        $.each(str.match(/(:[a-zA-Z_0-9]+)/g), function(i, match) {
            var repKey = match.replace(/:/g, "");
            str = str.replace(match, data[repKey]);
        });
    }
    return str;
};

Utils.joinHashElements = function(str, hash, array) {
    var ret, toJoin = [ ];

    $.each(array, function(i, elem) {
        toJoin.push(hash[elem]);
    });

    return toJoin.join(str);
};

Utils.extendArray = function(a, b) {
    $.each(b, function(i, row) {
        a.push(row);
    });
};

Utils.hexToRGB = function(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    var r = parseInt(result[1], 16),
        g = parseInt(result[2], 16),
        b = parseInt(result[3], 16);

    return [ r, g, b ];
};

Utils.rgbToHex = function(color) {
    if (color.substr(0, 1) === "#") {
        return color;
    }

    var nums = /\((\d+),\s*(\d+),\s*(\d+)/i.exec(color),
        r = parseInt(nums[2], 10).toString(16),
        g = parseInt(nums[3], 10).toString(16),
        b = parseInt(nums[4], 10).toString(16);

    return "#"+ (
        (r.length == 1 ? "0"+ r : r) +
        (g.length == 1 ? "0"+ g : g) +
        (b.length == 1 ? "0"+ b : b)
    );
};

Utils.objectSize = function(obj) {
    var size = 0, key;

    for (key in obj) {
        size++;
    }

    return size;
};

Utils.create = function(e,o,t) {
    return $(document.createElement(e), o, t);
};

Utils.genRandStr = function(len, chars) {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
        str = "";

    if (len == undefined) {
        len = 30;
    }

    for (var i=0; i<len; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return str;
};

Utils.dump = function(data, width, height) {
    var pre;

    if (width == undefined) {
        width = "800px";
    }
    if (height == undefined) {
        height = "800px";
    }

    if ($("#jsondump").length == 0) {
        pre = Utils.create("pre")
            .attr("id", "jsondump")
            .css({
                width: width,
                height: height,
                display: "inline-block",
                position: "fixed",
                top: "130px",
                right: "10px",
                padding: "10px",
                color: "#ffffff",
                "background-color": "rgba(0,0,0,.8)",
                overflow: "scroll",
                "z-index": 1000
            }).appendTo("body");
    } else {
        pre = $("#jsondump");
    }

    pre.html("Dump:<br/><br/>"+ Utils.escape(JSON.stringify(data, null, "\t")) +"<br/><br/>")
};

Utils.toJSON = function(obj) {
    return JSON.stringify(obj);
};

Utils.secondsToString = function(seconds) {
    var list = Utils.secondsToStringList(seconds);
    return list.join(":");
};

Utils.secondsToStringShortReadable = function(seconds) {
    var list = Utils.secondsToStringList(seconds);
    var toReturn = [ ];

    if (list[0] != "0") {
        toReturn.push(list[0] +"d");
    }
    if (list[1] != "0") {
        toReturn.push(list[1] +"h");
    }
    if (list[2] != "0") {
        toReturn.push(list[2] +"m");
    }
    if (list[3] != "0") {
        toReturn.push(list[3] +"s");
    }

    return toReturn.join(", ");
};

Utils.secondsToStringReadable = function(seconds) {
    var list = Utils.secondsToStringList(seconds);
    list[0] += list[0] == "1" ? " "+ Text.get("word.day") : " "+ Text.get("word.days");
    list[1] += list[0] == "1" ? " "+ Text.get("word.hour") : " "+ Text.get("word.hours");
    list[2] += list[0] == "1" ? " "+ Text.get("word.minute") : " "+ Text.get("word.minutes");
    list[3] += list[0] == "1" ? " "+ Text.get("word.second") : " "+ Text.get("word.seconds");
    return list.join(", ");
};

Utils.secondsToStringList = function(seconds) {
    var minutes = 0, hours = 0, days = 0;
    if (seconds >= 86400) {
        days = Math.floor(seconds / 86400);
        seconds = seconds % 86400;
    }
    if (seconds >= 3600) {
        hours = Math.floor(seconds / 3600);
        seconds = seconds % 3600;
    }
    if (seconds >= 60) {
        minutes = Math.floor(seconds / 60);
        seconds = seconds % 60;
    }
    return [ days, hours, minutes, seconds ];
};

Utils.secondsToFormValues = function(a, nullStr) {
    var b = [];
    $.each(a, function(i, n) {
        var unit, value;

        if (nullStr != undefined && n == 0) {
            b.push({
                name: nullStr,
                value: n
            });
            return true;
        }

        if (n >= 86400) {
            value = n / 86400;
            name = value == 1 ? "day" : "days";
        } else if (n >= 3600) {
            value = n / 3600;
            name = value == 1 ? "hour" : "hours";
        } else if (n >= 60) {
            value = n / 60;
            name = value == 1 ? "minute" : "minutes";
        } else {
            value = n;
            name = value == 1 ? "second" : "seconds";
        }

        b.push({
            name: value +" "+ Text.get("word."+ name),
            value: n
        });
    });
    return b;
};

// Extend is used to extend the key-values of the second object
// to the first object. Existing keys of the first object will
// be overwritten.
Utils.extend = function(a, b) {
    if (a == undefined) {
        a = {};
    }
    if (b) {
        var n;
        for (n in b) {
            a[n] = b[n];
        }
    }
    return a;
};

/* Append is used to append the key-values of the second object
   to the first object. Existing keys of the first object will NOT
   be overwritten. In addition the key-values will only be appended
   to the first object if the first object is a object. That means
   if the first object is not an object then nothing happends. */
Utils.append = function(a, b) {
    if (a) {
        var n, c = {};
        // Javascript has no "exists" like in Perl. To check which
        // keys exists in the first object a "c" object is created.
        for (n in a) {
            c[n] = 1;
        }
        for (n in b) {
            if (c[n] != 1) { // if c[n] does not exists
                a[n] = b[n];
            }
        }
    }
};

/* Shift options from b to a new object. a should be an array with
   keys that are delete from b and stored to r. r will be returned
   as a new object. */
Utils.shift = function(a, b) {
    var n, r = {}, c = {};

    if (b) {
        for (n in b) {
            c[n] = 1;
        }
        for (n in a) {
            if (c[n] === 1) {
                r[n] = b[n];
                delete b[n];
            }
        }
    }

    return r;
};

/* Filter empty values from an object.
   Values are filtered if they are

      === undefined
      === false
      === zero length

   As example if the object to filter has

      b = { v: "", w: "a", x: false, y: 0, z: undefined };

  the returned object has

      a = { w: "a", y: 0 };

  as you can see... v, x and z are filtered.
*/
Utils.filterEmptyValues = function(b) {
    var a = {};

    if (b) {
        var n;
        for (n in b) {
            if (IsNot.empty(b[n])) {
                a[n] = b[n];
            }
        }
    }

    return a;
};

// Sort an object by key
Utils.sort = function(object, key) {
    var keys = [],
        sorted = [],
        objectByKey = {};

    $.each(object, function(i, o) {
        keys.push(o[key]);

        if (!objectByKey[o.key]) {
            objectByKey[o.key] = [];
        }

        objectByKey[o.key].push(o);
    });

    $.each(keys.sort(), function(x, k) {
        $.each(objectByKey[k], function(y, o) {
            sorted.push(o);
        });
    });

    return sorted;
};

Utils.bytesToStr = function(value, f) {
    var unit = "";

    if (f == undefined) {
        f = 1;
    }

    if (value >= 1208925819614629174706176) {
        value = value / 1208925819614629174706176;
        unit = "YB";
    } else if (value >= 1180591620717411303424) {
        value = value / 1180591620717411303424;
        unit = "ZB"
    } else if (value >= 1152921504606846976) {
        value = value / 1152921504606846976;
        unit = "EB";
    } else if (value >= 1125899906842624) {
        value = value / 1125899906842624;
        unit = "PB";
    } else if (value >= 1099511627776) {
        value = value / 1099511627776;
        unit = "TB";
    } else if (value >= 1073741824) {
        value = value / 1073741824;
        unit = "GB";
    } else if (value >= 1048576) {
        value = value / 1048576;
        unit = "MB";
    } else if (value >= 1024) {
        value = value / 1024;
        unit = "KB";
    }

    return value.toFixed(f) + unit;
};

Utils.open = function(href, title, opts) {
    window.open(href, title, opts);
};

Utils.syntaxHighlightJSON = function(json) {
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = "color:darkorange;"
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = "color:red";
            } else {
                cls = "color:green";
            }
        } else if (/true|false/.test(match)) {
            cls = "color:blue";
        } else if (/null/.test(match)) {
            cls = "color:magenta";
        }
        return '<span style="' + cls + '">' + match + '</span>';
    });
};

Utils.escapeAndSyntaxHightlightJSON = function(json) {
    json = JSON.stringify(json, null, "  ");
    json = json.replace(/</g, "&lt;");
    json = json.replace(/>/g, "&gt;");
    json = json.replace(/\\r/g, "");
    json = json.replace(/\\n/g, "<br/>");
    json = Utils.syntaxHighlightJSON(json);
    return json;
};

Utils.clear = function(o) {
    Utils.create("div")
        .addClass("clear")
        .appendTo(o);
};

Utils.linebreak = function(o) {
    Utils.create("br")
        .appendTo(o);
};
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
var Route = function(o) {
    this.routes = { routes: {} };
    Utils.extend(this, o);
};

Route.prototype = {
    beforeParse: function() {},
    afterParse: function() {},
    preCallback: function() { return true }
};

/*
    Examples:

        route.add("users/list", function(req) { listUsers() });
        route.add("users/:id/edit", function(req) { editUser(req) });
        route.add("users/:id/delete", function(req) { deleteUser(req) });

    By the call of

        users/100/edit

    the callback function is called with

        callback({ id: 100 });

*/
Route.prototype.add = function(route, callback) {
    var part = route.split("/");
    var routes = this.routes;

    $.each(part, function(i, p) {
        var pattern = false;

        if (/^:/.test(p)) {
            pattern = p.replace(/:/, "");
            p = ":pattern";
        }

        if (routes.routes[p] == undefined) {
            routes.routes[p] = { routes: {} };
            if (pattern) {
                routes.routes[p].pattern = pattern;
            }
        }
        routes = routes.routes[p];
    });

    routes.route = route;
    routes.callback = callback;
};

Route.prototype.to = function(path, args) {
    var self = this;

    if (this.preRoutingCallback) {
        this.preRoutingCallback(path, args);
    }

    if (path == undefined) {
        path = window.location.hash;
    } else if (typeof(path) == "string") {
        window.location.hash = path;
    } else {
        path = $(path).attr("href");
    }

    if (args == undefined) {
        args = {};
    }

    Log.info("process request "+ path);
    path = path.replace(/^\//, "");
    path = path.replace(/^#/, "");
    path = path.replace(/\/$/, "");
    path = path.split("/");
    Log.info("search controller for path: "+ path.join("/"));

    var routes;

    if (path.length) {
        routes = this.routes;

        $.each(path, function(x, p) {
            Log.info("check path part: "+ p);
            if (routes.routes[p]) {
                Log.info("found path part: "+ p);
                routes = routes.routes[p];
            } else if (routes.routes[":pattern"]) {
                Log.info("found pattern part: "+ p);
                routes = routes.routes[":pattern"];
                Log.info("argument: "+ routes.pattern +"="+ p);
                args[routes.pattern] = p;
            } else {
                Log.info("route part does not match: "+ p);
                routes = self.__na__;
                args = {};
                return false;
            }
        });
    } else {
        routes = this.__na__;
    }

    if (!routes.callback) {
        routes = this.__na__;
    }

    this.afterParse(routes.route, args);

    if (this.preCallback(routes.route, args)) {
        routes.callback(args);
    }
};

Route.prototype.setPreCallback = function(callback) {
    this.preCallback = callback;
};

Route.prototype.setPreRoutingCallback = function(callback) {
    this.preRoutingCallback = callback;
};

Route.prototype.defaultRoute = function(route, callback) {
    this.__na__ = {
        route: route,
        callback: callback
    };
};
var Lang = {
   "en" : {
      "info.update_success" : "The update was successful!",
      "schema.host_template.attr.description" : "Description",
      "schema.user.desc.timezone" : "Select the timezone of the user.",
      "schema.timeperiod.text.settings" : "Timeperiod settings",
      "schema.plugin_stats.attr.description" : "Description",
      "schema.service.text.multiple_help" : "<h4>This action requires to select at least one service.</h4>\nTo mark a single service just click on a row. If you want to mark multiple services\njust press and hold <i>CTRL</i> on your keyboard. If you press and hold the left mouse button\nyou can mark a range of services.",
      "site.login.error" : "Bad login! Try it again!",
      "site.login.request_success" : "Your request was successful.<br/>\nAn administrator will contact you as soon as possible.",
      "schema.dependency.text.workflow_timezone" : "Set the timezone for the timeslice",
      "schema.service.attr.message" : "Status information",
      "schema.host.desc.company_id" : "Select the company the host belongs to.",
      "schema.company.desc.max_contacts" : "The maximum number of contacts that can be created.",
      "schema.host.desc.status" : "The status of the host. Possible values are OK, INFO, WARNING, CRITICAL or UNKNOWN.",
      "schema.service.desc.fd_enabled" : "This option enables or disables the flap detection. The flap detection is very useful to detect services that switches between OK and not OK in a very short time and when the counter of <i>attempt max</i> is never reached. The flap detection checkes how many times a service switched between different states in a given time. If the status switched to many times, then a notification will be triggered.",
      "schema.host.attr.os_product" : "OS product",
      "info.last-year" : "Last year",
      "action.overview" : "Overview",
      "text.change_the_language" : "Change the language",
      "schema.user_chart.text.add_metric" : "Add metric",
      "site.wtrm.command.checkIfElementIsChecked" : "Check if the radio button or checkbox <b>%s</b> is checked",
      "text.thresholds" : "Thresholds",
      "text.last_180d" : "Last 180 days",
      "schema.service.attr.last_check" : "Last check",
      "text.report.availability.detailed_report_onclick" : "Click on a service to get a detailed availabilty report.",
      "nav.sub.contacts" : "Contacts",
      "schema.service.desc.multiple_check_type_locations" : "Select at least 3 checkpoints:",
      "word.Hosts" : "Hosts",
      "schema.host.text.multiple_notification" : "Enable or disable the notifications of multiple hosts",
      "schema.service.desc.attempt_max" : "This option controls when you gets a notification of services that are not in status OK. As example a value of 3 means that you get a notification first if the service check returns 3 times in a row a not OK status.",
      "site.help.doc.host-variables" : "Host Variablen",
      "nav.sub.downtimes" : "Scheduled downtimes",
      "text.report.title.host_from_to" : "Report for host <b>%s</b> from <b>%s</b> to <b>%s</b>",
      "schema.group.text.delete" : "Delete group",
      "schema.host.attr.location" : "Location",
      "schema.timeperiod.attr.id" : "Timeperiod ID",
      "schema.contact.attr.name" : "Name",
      "text.report.availability.AV-I" : "Time slice in percent in which the service was in status INFO.",
      "schema.user.attr.password_changed" : "Password changed?",
      "text.report.availability.lt15" : "Between 0 and 15 minutes",
      "schema.host.attr.os_manufacturer" : "OS manufacturer",
      "word.Language" : "Language",
      "schema.company.text.list" : "Overview of all companies",
      "err-701" : "Incorrect password!",
      "schema.event.attr.last_status" : "Last status",
      "schema.contact.text.timeperiod_type_send_only_mail" : "Send only mail",
      "schema.event.text.filter_message" : "Filter message",
      "site.wtrm.action.checkIfElementHasNotValue" : "Check if an <b>input</b> field or <b>textarea has <i>NOT</i></b> a specified <b>value</b>",
      "action.submit" : "Submit",
      "schema.contactgroup.text.service_members" : "Services in contact group",
      "schema.service.attr.fd_enabled" : "Flap detection enabled",
      "schema.host.desc.max_services" : "Set the maximum number of services that can be configured for the host. 0 means unlimited.",
      "action.unselect" : "Unselect",
      "schema.dependency.text.service" : "Service",
      "site.wtrm.desc.html" : "The inner HTML of an element you wish to check.",
      "action.remove" : "Remove",
      "word.Seconds" : "Seconds",
      "schema.contactgroup.text.service_nonmembers" : "Services not in contact group",
      "schema.user.desc.comment" : "This field can be used for internal comment about the user.",
      "schema.service.info.notification_disabled" : "Notifications are disabled of the service.",
      "schema.company.attr.max_dependencies_per_host" : "Max dependencies per host",
      "err-845" : "Sorry, but you cannot create more than %s groups!",
      "schema.service.desc.default_check_type_location" : "Your service is checked from the following checkpoint:",
      "site.help.doc.host-parameter" : "Host Parameter im Detail",
      "text.report.availability.h12" : "12:00 - 12:59",
      "site.wtrm.command.checkIfElementExists" : "Check if the element <b>%s</b> exists",
      "schema.service.attr.id" : "Service ID",
      "text.report.availability.EV-LT180" : "Number of events with a status duration less than 3 hours.",
      "site.help.doc.service-parameter" : "Service Parameter im Detail",
      "site.wtrm.desc.element" : "The element you want to select. As example: #id, .class, name<br/><br/>\nIt's also possible to search for tags and attributes. Example:<br/><br/>\n&lt;a&gt; - get the first 'a' tag<br/><br/>\n&lt;a[5]&gt; - get the fifth 'a' tag<br/><br/>\n&lt;a a=\"hello\" b=\"world\"&gt; - search for a 'a' tag with the specified attributes and values",
      "schema.user_chart.attr.yaxis_label" : "Y-axis label",
      "schema.host_template.text.setting" : "Template settings",
      "word.Minutes" : "Minutes",
      "schema.chart.attr.from" : "From",
      "schema.dependency.text.for_node" : "Dependencies for node <b>%s</b>",
      "text.report.availability.EV-LT30" : "Number of events with a status duration less than 30 minutes.",
      "schema.dependency.text.create_from" : "Create a new dependency from",
      "text.report.availability.Events" : "Number of total events.",
      "schema.host_template.text.view_members" : "Add / Remove hosts",
      "site.wtrm.placeholder.status" : "200",
      "site.wtrm.text.click_for_details" : "Click on a row to get a detailed report",
      "schema.service.text.select_location_check_type" : "Select the type of the check",
      "schema.service.desc.send_sms" : "This option enables or disables notifications per SMS.",
      "err-601" : "The objects you requested does not exist!",
      "schema.chart.attr.preset" : "Preset",
      "site.wtrm.command.doUrl" : "Go to URL <b>%s</b>",
      "schema.event.attr.time" : "Timestamp",
      "schema.host.text.create" : "Create a new host",
      "schema.user_chart.attr.description" : "Description",
      "schema.contact.desc.name" : "This is the full name of the contact.",
      "schema.host.action.remove_template" : "Remove template",
      "text.dashboard.use_mouse_wheel_to_zoom" : "Use the mouse wheel to zoom in and out.",
      "schema.host.attr.password" : "Password",
      "site.wtrm.attr.hidden" : "Hide",
      "site.wtrm.action.doSubmit" : "<b>Submit</b> a form",
      "schema.roster.attr.id" : "Roster ID",
      "schema.host.attr.status" : "Status",
      "schema.host.text.mtr_chart" : "MTR chart",
      "schema.service.text.sla_requirements" : "Please note that for free accounts only the default check is available!",
      "schema.timeslice.text.delete" : "Delete timeslice",
      "schema.contact.text.timeperiod_type_exclude" : "Exclude",
      "nav.sub.contactgroup_service_members" : "Services in contact group",
      "text.browsers_heap_size" : "Display of the heap size in your browser",
      "site.help.doc.users-and-groups" : "Die Benutzer- und Gruppenverwaltung",
      "text.from_now_to_4d" : "From now + 4 days",
      "site.wtrm.action.doUserAgent" : "Set the <b>user agent</b> for the request",
      "schema.hs_downtime.attr.timeslice" : "Timeslice",
      "err-810" : "Sorry, but you cannot add more than %s dashlets to a dashboard!",
      "site.wtrm.placeholder.hidden" : "Hide this value?",
      "schema.service.text.multiple" : "Service actions",
      "site.wtrm.command.doAuth" : "Use auth basic with username <b>%s</b> and password <b>%s</b>",
      "schema.host.text.list_templates" : "Host %s has the following templates configured",
      "schema.host.text.multiple_downtimes" : "Schedule a downtime for multiple hosts",
      "schema.host.desc.sysinfo" : "This field allows you to set an external link to you own host documentation, e.g.: https://mysite.test/?id=12345.<br/><br/>Not allowed characters: \"\\",
      "schema.service.attr.passive_check" : "Is this a passive check?",
      "schema.chart.text.multiple_view" : "Chart view",
      "schema.plugin.attr.info" : "Information",
      "schema.plugin_stats.attr.datatype" : "Data type",
      "schema.timeperiod.text.list" : "Overview of all timeperiods",
      "schema.plugin_stats.attr.alias" : "Name",
      "schema.service.text.clone" : "Clone service",
      "nav.sub.companies" : "Companies",
      "schema.user.desc.manage_contacts" : "Is the user allowed to manage contacts?",
      "text.report.availability.lt180" : "Between 1 and 3 hours",
      "schema.company.attr.address1" : "Address 1",
      "text.report.availability.lt60" : "Between 30 and 60 minutes",
      "nav.sub.events" : "Events",
      "site.wtrm.action.checkIfElementIsNotSelected" : "Check if a <b>value is <i>NOT</i> selected</b> in a selectbox",
      "schema.service.attr.last_mail_time" : "Last notification per mail",
      "schema.service.desc.host_alive_check" : "A host alive check is a check that determines if a host is down or alive. If this check returns a critical status then you get a special notification. If other service checks returns a critical status at the same time then the notifications will be suppressed. It's recommended you use the ping check as host alive check.",
      "schema.host.desc.virt_product" : "e.g. VMware-Server, Virtuozzo",
      "info.new_version" : "<h4>A new version is available</h4>\n<p>A new version of the Bloonix-WebGUI is available!</p>\n<p>Please reload the website!</p>",
      "schema.service.desc.multiple_check_select_concurrency" : "Select the concurrency:",
      "text.report.availability.fatal" : "Fatal issue",
      "text.sort_by_dots" : "Sort by ...",
      "schema.company.attr.max_timeslices_per_object" : "Max timeslices",
      "word.Services" : "Services",
      "nav.main.help" : "HELP",
      "err-415" : "Unauthorized access!",
      "schema.host.desc.os_product" : "e.g. RHEL5, Debian Lenny, Windows Server 2003",
      "err-427" : "Services that are inherited from a host template can't be deleted!",
      "action.yes_remove" : "<b>Yes, remove!</b>",
      "site.wtrm.text.quick_check" : "Quick check!",
      "err-632" : "The parameter limit must be an numeric value, min 0, max <b>%s</b>.",
      "schema.timeperiod.text.create" : "Create a new timeperiod",
      "err-400" : "Bad login! Try it again!",
      "text.dashboard.remove_dashlet" : "Remove the dashlet",
      "schema.company.attr.title" : "Title",
      "schema.service.desc.multiple_check_concurrency_title" : "Concurrency checks",
      "schema.contact.desc.mail_notification_level" : "Select the status level for which you want to receive notifications.",
      "err-847" : "Sorry, but you cannot create more than %s dependencies per host!",
      "schema.service.text.rotate_location_check_button" : "Rotate check",
      "schema.host.info.sysinfo" : "External system information available.",
      "schema.event.attr.attempts" : "Attempts",
      "action.resize" : "Resize",
      "text.report.availability.LT60" : "Filter events with a status duration less than 60 minutes.",
      "schema.service.attr.mail_warnings" : "Send WARNINGS per mail",
      "text.report.availability.EV-C" : "Number of events with status CRITICAL.",
      "err-835" : "Sorry, but you cannot create more than %s contacts!",
      "word.seconds" : "seconds",
      "schema.company.attr.email" : "E-Mail",
      "text.dashboard.service_chart" : "Service chart",
      "action.filter" : "Filter",
      "schema.host.text.view" : "Host %s",
      "schema.service.desc.is_volatile" : "With this option you can define if the check is <i>volatile</i>. Some checks has the peculiarity that they are only for a very short time in a CRITICAL status. As example if you check a logfile for specific strings, like <i>possible break-in attempt</i> and the check returns a CRITICAL status because the string were found, then it's possible that the next check does not find the string any more and would return the status OK. In this case maybe you would never notice that someone tried to break in. For this purpose you can define that the service is <i>volatile</i>. That means that the service stays in a CRITICAL or WARNING state until you clear the volatile status manually.",
      "err-630" : "Invalid parameter settings found!",
      "text.report.availability.h00" : "00:00 - 00:59",
      "schema.company.desc.max_services_per_host" : "The maximum number of services that can be created for a host.",
      "action.configure" : "Configure",
      "text.report.availability.EV-GE300" : "Number of events with a status duration greater than 5 hours.",
      "schema.host.attr.virt_manufacturer" : "Virtualization manufacturer",
      "schema.host.attr.variables" : "Host variables",
      "schema.host.desc.hostname" : "This is the fully qualified hostname.",
      "action.select" : "Select",
      "text.dashboard.create_dashboard" : "Create an empty dashboard",
      "schema.contactgroup.text.selected_services" : "Selected services",
      "schema.company.text.edit_variables" : "Global variables",
      "schema.service.text.host_template" : "Host template",
      "nav.sub.charts" : "Charts",
      "schema.service.text.no_command_options" : "This check has no settings.",
      "schema.service.desc.comment" : "This is a short internal comment to the check.",
      "schema.chart.text.multiselect" : "Select charts for multiple hosts",
      "schema.contact.attr.escalation_level" : "Escalation level",
      "site.wtrm.action.doCheck" : "Check a <b>radio button</b> or <b>checkbox</b>",
      "schema.host.text.multiple_selection_help" : "<h4>This action requires to select at least one host.</h4>\nTo mark a single host just click on a row. If you want to mark multiple hosts\njust press and hold <i>CTRL</i> on your keyboard. If you press and hold the left mouse button\nyou can mark a range of hosts.",
      "schema.user.desc.role" : "Which role does the user have? Users with the role <i>operator</i> are power users and can manage user accounts and user groups. Users with the role <i>user</i> are not allowed to manage other users and groups.",
      "text.report.availability.h10" : "10:00 - 10:59",
      "action.action" : "Action",
      "schema.group.text.group_members" : "Members of group <b>%s</b>",
      "schema.timeperiod.attr.description" : "Description",
      "schema.chart.attr.refresh" : "Refresh",
      "text.dashboard.list_top_hosts" : "Overview of the top hosts",
      "schema.group.attr.description" : "Description",
      "err-640" : "No data available!",
      "action.timeslices" : "List timeslices",
      "schema.service.text.notification_settings" : "Notification settings",
      "schema.host_template.attr.id" : "Template ID",
      "schema.contact.text.timeperiod_type_send_only_sms" : "Send only SMS",
      "schema.company.attr.sla" : "SLA",
      "text.report.availability.h18" : "18:00 - 18:59",
      "action.reload" : "Reload",
      "text.report.availability.h06" : "06:00 - 06:59",
      "schema.user_chart.text.click_to_add_metric" : "Click to add the metric",
      "schema.timeperiod.desc.name" : "This is the name of the timeperiod.",
      "site.login.contact" : "Do you have questions?",
      "nav.sub.dependencies" : "Dependencies",
      "text.report.availability.h04" : "04:00 - 04:59",
      "word.minute" : "minute",
      "site.wtrm.action.checkUrl" : "Check the <b>URL</b> in the address bar",
      "schema.contact.attr.company_id" : "Company ID",
      "info.move_with_mouse" : "Press and hold down the left mouse button while you move the box up or down.</p>",
      "text.report.availability.EV-O" : "Number of events with status OK.",
      "schema.group.text.add" : "Add a new user to the group",
      "schema.company.attr.variables" : "Global variables",
      "schema.dependency.text.depends_on_host" : "depends on host",
      "text.dashboard.rename_dashboard" : "Rename the dashboard",
      "schema.company.attr.sms_enabled" : "SMS notifications enabled",
      "schema.host.attr.max_sms" : "Max SMS per month",
      "schema.service.attr.check_by_location" : "Check by location (agent ID)",
      "schema.company.desc.variables" : "In this field you can define global variables for all hosts. These variables can be used for thresholds by the configuration of service checks. Example:<br/><br/>HTTP.PORT=9000<br/><br/>This variable could be used in the format <i>%HTTP.PORT%</i> for thresholds. Please note that two variables are pre-defined: <i>IPADDR</i> and <i>HOSTNAME</i>. These variables are replaced with the IP address and the hostname of the host. For further information read the help.<br/><br/>Allowed signs: a-z, A-Z, 0-9, dot and underscore",
      "schema.service.desc.fd_flap_count" : "This is the threshold for the flap detection. If more than x-times the status switched in a given time a notificaton is triggered.",
      "nav.sub.users" : "Users",
      "site.wtrm.placeholder.username" : "Username",
      "text.report.title.status_duration_by_hour" : "Status duration by time range",
      "nav.sub.group_settings" : "Group settings",
      "schema.host.desc.allow_from" : "With this field it's possible to set a comma separated list of IP addresses from which the Bloonix agents are allowed to deliver host statistics. Set the keyword <i>all</i> to allow all IP addresses.",
      "schema.dependency.attr.inherit" : "Inheritance",
      "site.wtrm.command.checkIfElementHasNotValue" : "Check if the input field or textarea with element <b>%s</b> does <i>NOT</i> contain <b>%s</b>",
      "schema.host.text.settings" : "Host settings",
      "schema.service.attr.volatile_retain" : "The volatile retain time",
      "schema.service.attr.plugin" : "Plugin",
      "action.logout" : "Logout",
      "schema.service.action.clear_volatile_multiple" : "Clear the volatile status of the selected services",
      "text.dashboard.save_dashboard" : "Save dashboard",
      "text.click_to_delete_seletion" : "Click to delete the selection",
      "info.add-further-options" : "Add further options",
      "schema.service.text.multiple_volatile" : "Clear the volatile status of multiple services",
      "schema.host.attr.id" : "Host ID",
      "schema.service.attr.agent_id" : "Agent location",
      "schema.user_chart.text.user_chart" : "Chart editor",
      "schema.service.desc.default_check_type_title" : "Default checkpoint",
      "schema.chart.attr.subtitle" : "Chart subtitle",
      "nav.sub.contactgroup_settings" : "Contact group settings",
      "schema.service.text.delete" : "Delete service",
      "schema.service.desc.service_name" : "This is the display name of the service.",
      "text.dashboard.choose_content_box" : "Select a dashlet",
      "schema.company.text.view" : "Company %s",
      "schema.service.desc.mail_soft_interval" : "This is the notification interval for emails. As long as the service is not OK you will be re-notified in this interval.",
      "word.no" : "no",
      "schema.host.desc.password" : "This password is used by the Bloonix Agents. If an agent wants to connect to the Bloonix server to deliver host statistics then this is only possible if the agent knows the host id and the password.",
      "schema.event.text.list" : "Events of host %s",
      "schema.host.text.delete" : "Delete host",
      "schema.service.text.clone_service" : "Clone service %s",
      "schema.dependency.text.host" : "Host",
      "action.operate_as" : "React as",
      "schema.group.text.add_user" : "Add a user to the group",
      "schema.service.info.is_volatile" : "The service is in volatile status.",
      "schema.company.attr.phone" : "Phone",
      "text.dashboard.replace_dashlet" : "Replace the dashlet",
      "text.report.availability.flapping" : "Flapping",
      "schema.service.attr.fd_time_range" : "Flap detection time range",
      "schema.host.desc.add_host_to_host_template" : "The host inherits all services from the host template.",
      "schema.host.text.remove_template_warning" : "Please note that all services of the template will be removed from all hosts that has its services inherited from this template!",
      "schema.host.attr.virt_product" : "Virtualization product",
      "word.Timeslice" : "Timeslice",
      "schema.dependency.text.list" : "Dependencies for host %s",
      "schema.service.attr.mail_soft_interval" : "Notification interval for mails (soft)",
      "text.fixed_checkpoint" : "Fixed checkpoint",
      "schema.user_chart.attr.subtitle" : "Subtitle",
      "schema.contact.desc.sms_to" : "This is the mobil number of the contact. Event notifications will be send via SMS to this number.",
      "schema.group.text.host_nonmembers" : "Non group members",
      "site.wtrm.command.doSubmit" : "Submit form <b>%s</b>",
      "schema.service.text.wtrm_result_steps" : "Web transaction - step results",
      "schema.host.attr.description" : "Description",
      "word.minutes" : "minutes",
      "schema.hs_downtime.text.preset" : "Preset",
      "site.wtrm.command.checkIfElementHasNotHTML" : "Check if the element <b>%s</b> does <i>NOT</i> contain <b>%s</b>",
      "schema.host.desc.location" : "e.g. New York, Datacenter 3, Room 6, Rack A29",
      "schema.user_chart.desc.title" : "The title of the chart.",
      "schema.host_template.text.view" : "Template %s",
      "nav.main.administration" : "ADMINISTRATION",
      "schema.host.attr.active" : "Active",
      "site.wtrm.text.service_report" : "Web transaction report for service %s",
      "action.list" : "List",
      "schema.group.text.selected_hosts" : "Selected hosts",
      "schema.dependency.text.depends_on_service" : "depends on service",
      "schema.group.text.host_members" : "Group members",
      "text.report.title.total_availability" : "The total service availability",
      "schema.user_chart.desc.description" : "Description of the chart.",
      "word.To" : "To",
      "schema.service.info.acknowledged" : "The service is acknowledged.",
      "schema.service.text.choose_plugin" : "Select a plugin",
      "nav.sub.contactgroup_members" : "Contacts in contact group",
      "schema.chart.attr.chart_size" : "Size",
      "schema.company.desc.max_dependencies_per_host" : "The maximum number of dependencies that can be create for a host.",
      "schema.user.desc.authentication_key" : "With this key it's possible to visit the notification screen without password authentification. The query string to visit the notification screen looks like<br/><br/><b>/screen/?username=XXX;authkey=XXX</b>",
      "schema.host.desc.notification" : "Enable or disable the notifications of all services.",
      "err-823" : "Sorry, but you cannot create more than %s host downtimes for host id %s!",
      "text.dashboard.add_new_dashlet" : "Add a new dashlet",
      "word.Filter" : "Filter",
      "schema.service.attr.attempt_warn2crit" : "Switch WARNING to CRITICAL",
      "site.wtrm.action.doUrl" : "Go to <b>URL</b>",
      "schema.dependency.text.workflow_from_service" : "and from service",
      "text.report.availability.h16" : "16:00 - 16:59",
      "schema.chart.text.user_charts" : "User charts",
      "site.login.login" : "Please login with your username and password:",
      "schema.company.attr.zipcode" : "Zipcode",
      "site.wtrm.attr.status" : "HTTP-Status",
      "action.edit" : "Edit",
      "site.login.request_failed" : "You request was not successful. Please try it again.",
      "err-834" : "Sorry, but you cannot create more than %s services for host id %s!",
      "site.wtrm.attr.element" : "Element",
      "site.login.title" : "Login to the monitoring system",
      "site.wtrm.action.checkIfElementHasNotText" : "Check if an <b>element does <i>NOT</i></b> contain <b>text</b>",
      "schema.service.text.clone_to_the_same_host" : "Clone the service to the same host",
      "schema.host.text.add_host_to_contactgroup" : "Add the host to a contact group",
      "schema.service.desc.mail_hard_interval" : "With this option you can define a hard interval for email notifications. Even if the status switched from CRITICAL to OK and then back to CRITICAL you will not get an notification until the interval expires.",
      "site.wtrm.desc.ms" : "This is the time in milliseconds to sleep between actions.",
      "text.dashboard.services_flapping" : "Flapping",
      "schema.service.attr.attempt_counter" : "Attempt counter",
      "schema.contactgroup.text.create" : "Create a new contact group",
      "schema.timeperiod.text.delete" : "Delete timeperiod",
      "text.report.title.no_data" : "For the following services are no data available in this time range",
      "schema.company.attr.alt_company_id" : "Real company ID",
      "text.from_now_to_1h" : "From now + 1 hour",
      "schema.contact.desc.mail_to" : "This is the email address of the contact. Event notifications will be send to this address.",
      "err-815" : "Sorry, but you cannot create more than %s charts!",
      "schema.host.attr.device_class" : "Device class",
      "schema.chart.text.service_charts" : "Service charts",
      "schema.company.attr.max_services" : "Max services",
      "schema.timeperiod.examples" : "<p><b>Syntax: DAY-RANGE TIME-RANGE</b></p></br>\n<pre>\nDAY RANGE                       EXAMPLES\n------------------------------------------------------------\nWeekday                         Monday\nWeekday - Weekday               Monday - Friday\nMonth                           Januar\nMonth - Month                   Januar - July\nMonth Day                       Januar 1\nMonth Day - Month Day           Januar 1 - July 15\nYear                            2010\nYear - Year                     2010 - 2012\nYYYY-MM-DD                      2010-01-01\nYYYY-MM-DD - YYYY-MM-DD         2010-01-01 - 2012-06-15\n</pre></br>\n<pre>\nTIME RANGE                      EXAMPLES\n------------------------------------------------------------\nHH:MM - HH:MM                   09:00 - 17:00\nHH:MM - HH:MM, HH:MM - HH:MM    00:00 - 08:59, 17:01 - 23:59\n</pre></br>\n<p><b>Examples:</b></p></br>\n<pre>\nMonday - Friday     09:00 - 17:00\nMonday - Friday     00:00 - 08:59, 17:01 - 23:59\nSaturday - Sunday   00:00 - 23:59\n</pre></br>",
      "schema.host.attr.timeout" : "Timeout",
      "info.this-year" : "This year",
      "schema.dependency.text.no_dependencies" : "There are no dependencies configured!",
      "schema.service.text.view_location_report" : "View location report",
      "text.report.availability.lt300" : "Between 3 and 5 hours",
      "text.report.availability.h11" : "11:00 - 11:59",
      "site.wtrm.attr.parent" : "Parent ID",
      "err-832" : "Sorry, but you cannot create more than %s services!",
      "site.login.forgot_password" : "Forgot your password?",
      "schema.service.text.command_options" : "Check settings",
      "schema.host.text.list" : "Overview of all hosts",
      "err-425" : "Your session token is expired!",
      "text.report.availability.h21" : "21:00 - 21:59",
      "schema.service.text.multiple_location_check_button" : "Multiple checks",
      "schema.plugin.attr.plugin" : "Plugin",
      "schema.service.attr.sms_hard_interval" : "Notification interval for SMS (hard)",
      "action.replace" : "Replace",
      "text.dashboard.map_title" : "Global host status map",
      "schema.chart.text.chart_information" : "Chart information",
      "schema.contactgroup.text.list" : "Overview of all contactgroups",
      "schema.service.desc.notification" : "This option activates or de-activates the notifications per email or SMS.",
      "schema.event.attr.status" : "Status",
      "schema.contactgroup.text.host_members" : "Hosts in group",
      "word.day" : "day",
      "action.delete" : "Delete",
      "schema.company.attr.max_downtimes_per_host" : "Max downtimes per host",
      "action.create" : "Create",
      "schema.host_template.desc.name" : "This is the name of the template.",
      "site.wtrm.placeholder.element" : "#element-id OR .class-name OR name",
      "schema.chart.text.view" : "Charts for host <b>%s</b>",
      "schema.chart.text.multiview" : "View multiple charts",
      "text.dashboard.list_top_services" : "Overview of the top services",
      "schema.company.desc.max_templates" : "The maximum number of template that can be created.",
      "schema.group.text.settings" : "Group settings",
      "schema.host.attr.hostname" : "Hostname",
      "schema.host.attr.sysgroup" : "System group",
      "err-821" : "Sorry, but you cannot create more than %s host downtimes!",
      "schema.chart.attr.title" : "Chart title",
      "text.dashboard.default_dashboard_cannot_deleted" : "The default dashboard cannot be deleted!",
      "word.No" : "No",
      "site.wtrm.command.checkIfElementHasHTML" : "Check if the element <b>%s</b> contains <b>%s</b>",
      "schema.hs_downtime.text.create" : "Create a scheduled downtime",
      "schema.company.attr.surname" : "Surname",
      "schema.chart.text.load_view" : "Load view",
      "word.Relative" : "Relative",
      "site.wtrm.action.doFill" : "Fill data into a <b>input</b> field or <b>textarea</b>",
      "schema.host.desc.max_sms" : "In this field you can define the maximum number of SMS that can be sent per month.",
      "text.dashboard.services_acknowledged" : "Acknowledged",
      "schema.company.attr.max_sms" : "Max SMS",
      "site.wtrm.placeholder.html" : "<span>Loren ipsum...</span>",
      "site.wtrm.placeholder.password" : "Secret",
      "schema.service.desc.sms_soft_interval" : "This is the notification interval for SMS. If a service is in a non OK status then you will be re-notified after this time if the service doesn't change to status OK.",
      "schema.service.desc.description" : "This is a short description of the check.",
      "schema.contact.text.escalation_level_event.x" : "active after <b>%s</b> notifications",
      "schema.host.attr.hw_manufacturer" : "HW manufacturer",
      "schema.user.desc.phone" : "The phone number can be very helpful for colleagues or the Bloonix support in emergency situations.",
      "schema.contactgroup.text.settings" : "Contact group settings",
      "schema.host.action.add_template" : "Add template",
      "text.max_length" : "Max length: <b>%s</b>",
      "schema.hs_downtime.text.delete" : "Delete a scheduled downtime",
      "nav.main.report" : "REPORT",
      "schema.service.attr.timeout" : "Timeout",
      "text.report.availability.h23" : "23:00 - 23:59",
      "site.help.title" : "Die Bloonix Hilfe",
      "schema.company.attr.max_hosts" : "Max hosts",
      "text.dashboard.dashlet_select_chart_title" : "Select a chart for the dashlet.",
      "schema.chart.text.really_delete_view" : "Do you really want to delete chart view <b><b>%s</b></b>?",
      "schema.dependency.attr.id" : "Dependency ID",
      "site.wtrm.command.doWaitForElementWithText" : "Wait for element <b>%s</b> with text <b>%s</b>",
      "schema.user.attr.manage_contacts" : "Manage contacts?",
      "site.wtrm.desc.text" : "The inner text of an element you wish to check.",
      "word.Yes" : "Yes",
      "schema.service.attr.ref_id" : "ID",
      "schema.dependency.attr.status" : "Status",
      "schema.host.text.mtr_output" : "MTR result of host %s",
      "site.wtrm.desc.url" : "This is the full URL to request. As example: http://www.bloonix.de/",
      "schema.host.desc.comment" : "This field can be used to set a short comment to the host.",
      "schema.dependency.text.workflow_to_service" : "and to service",
      "schema.service.attr.volatile_since" : "Since the status is volatile",
      "schema.host.text.add_host_to_group" : "Add the host to a user group",
      "schema.host.desc.active" : "Active or de-activate the host and all services.",
      "schema.chart.text.alignment" : "Chart alignment",
      "schema.plugin.attr.categories" : "Categories",
      "err-704" : "The passwords doesn't match!",
      "word.Absolute" : "Absolute",
      "schema.service.desc.agent_id_tooltip" : "<h3>From which location should the check be executed?</h3>\n<p>\nYou can choose between the options <i>localhost</i>, <i>intranet</i> and <i>remote</i>.\n</p>\n<h3>localhost</h3>\n<p>\nWith the option <i>localhost</i> the check is executed local on your server.\nFor this action it's necessary that the Bloonix-Agent is installed on your server.\nThis option is useful if you want to monitor the system performance like CPU,\nmemory or disk usage.\n</p>\n<h3>intranet</h3>\n<p>\nThe option <i>intranet</i> means your local network. If you want to monitor the service\nfrom your local network, then it's necessary that you install the Bloonix-Agent on a\ncentral server in your intranet. The checks will be executed from this server.\nThis option is useful if you want to monitor devices that has no direct internet connection\nlike router, switches and so on.\n</p>\n<h3>remote</h3>\n<p>\nWith the option <i>remote</i> the check is executed from a external Bloonix-Server. This is\nvery useful if you want to monitor your webserver, website, mailserver and other internet services.\n</p>",
      "err-411" : "The service is not available!",
      "site.login.choose_your_language" : "Select your language",
      "schema.company.attr.max_users" : "Max users",
      "text.from_now_to_7d" : "From now + 7 days",
      "schema.host_template.text.delete_service_warning" : "Please note that the service will be deleted from all hosts that gets the service inherited from this template.",
      "site.wtrm.action.checkIfElementIsChecked" : "Check if a <b>radio button</b> or <b>checkbox</b> is <b>checked</b>",
      "schema.sms_send.attr.time" : "Timestamp",
      "nav.sub.services" : "Services",
      "schema.service.desc.failover_check_type_locations" : "Select a fixed and two failover checkpoints",
      "schema.dependency.text.dependencies" : "Dependencies",
      "schema.service.attr.scheduled" : "Has downtime",
      "schema.service.desc.timeout" : "This is the timeout of the service. If the status of the service is not updated in this time then a critical status is set for the service with the information that it seems that the Bloonix agent is not working. If no value is set, then the timeout of the host is inherited.",
      "schema.contactgroup.text.selected_hosts" : "Selected hosts",
      "err-633" : "The parameter sort_by must begin with a character of a-z and only characters from a-z, 0-9 and a underscore are allowed. The maximum length is 63 characters.",
      "err-825" : "Sorry, but you cannot create more than %s host templates!",
      "site.wtrm.command.doWaitForElement" : "Wait for element <b>%s</b>",
      "schema.user.attr.role" : "Role",
      "site.login.documentation" : "The Bloonix documentation",
      "schema.chart.text.select" : "Chart selection for host %s",
      "text.max_value" : "Max value: <b>%s</b>",
      "schema.service.desc.volatile_retain" : "Set a time after the volatile status is automatically cleared.",
      "schema.service.attr.last_sms_time" : "Last notification per SMS",
      "schema.dependency.attr.timeslice" : "Timeslice",
      "schema.timeperiod.text.examples" : "Timeperiod examples",
      "schema.host.desc.add_host_to_contactgroup" : "Add the host to a contact group to get event notifications via email or sms.",
      "err-817" : "Sorry, but you cannot create more than %s chart views!",
      "info.go-back" : "Go back",
      "err-405" : "Your session is expired!",
      "schema.service.attr.last_event" : "Last event",
      "err-418" : "You do not have enough privileges to modify the objects!",
      "schema.hs_downtime.text.select_services" : "Services<br/><small>Do not select any servives if you want to<br/>create a downtime for the complete host.</small>",
      "site.wtrm.desc.username" : "This username for the auth basic authentification.",
      "text.report.availability.h14" : "14:00 - 14:59",
      "schema.contact.attr.mail_notification_level" : "Mail notification level",
      "text.report.availability.ge300" : "Longer than 3 hours",
      "schema.service.text.multiple_notification" : "Enable or disable the notifications of multiple services",
      "nav.sub.screen" : "Screen",
      "action.view_selected_objects" : "View selected objects",
      "site.wtrm.command.doSelect" : "Select the value <b>%s</b> from the selectbox <b>%s</b>",
      "schema.dependency.text.workflow_to_service_status" : "Select the status of the parent service that avoids a notification",
      "schema.service.info.has_result" : "This service check has advanced status information. Click me :-)",
      "schema.service.info.flapping" : "The service is flapping.",
      "text.dashboard.services_downtimes" : "Downtimes",
      "schema.user.text.new_password" : "New password",
      "action.close" : "Close",
      "schema.roster.attr.roster" : "Roster",
      "schema.user_chart.desc.yaxis_label" : "The label of the Y-axis.",
      "schema.host.action.deactivate_multiple" : "Deactivate the selected hosts",
      "text.report.availability.Service" : "Click on the service to get a detailed availabilty report.",
      "schema.contact.attr.id" : "Contact ID",
      "schema.company.desc.max_timeslices_per_object" : "The maximum number of timeslices that can be created for a timeperiod.",
      "nav.sub.hosts" : "Hosts",
      "nav.main.notifications" : "NOTIFICATIONS",
      "site.help.doc.json-api" : "Die Bloonix JSON API",
      "schema.contact.attr.mail_to" : "E-Mail",
      "schema.chart.attr.preset_last" : "Preset: last",
      "schema.host_template.text.create" : "Create a new template",
      "site.help.doc.scheduled-downtimes" : "Geplante Wartungsarbeiten einrichten",
      "action.display_from_to_rows" : "Displaying <b>%s</b>-<b>%s</b> of <b>%s</b> hits",
      "site.wtrm.placeholder.ms" : "5000",
      "schema.contactgroup.attr.description" : "Description",
      "word.inactive" : "inactive",
      "schema.company.attr.max_dashboards_per_user" : "Max dashboards per user",
      "site.login.welcome" : "Welcome to Bloonix! Please log in.",
      "schema.user.text.select_language" : "Select your preferred language",
      "schema.host.info.inactive" : "The host is not active.",
      "schema.service.action.multiple_force_next_check" : "Reset the interval and force the next check of the service",
      "schema.service.info.inactive" : "The service is inactive.",
      "site.wtrm.attr.userAgent" : "User-Agent",
      "site.wtrm.command.doFill" : "Fill element <b>%s</b> with value <b>%s</b>",
      "schema.user_chart.desc.subtitle" : "The title of the chart.",
      "schema.service.attr.sms_soft_interval" : "Notification interval for SMS (soft)",
      "schema.host.desc.coordinates" : "Select the location of the host by country code.",
      "site.wtrm.action.checkIfElementIsSelected" : "Check if a <b>value</b> is <b>selected</b> in a selectbox",
      "info.search_syntax" : "<p><b>Search syntax:</b></p>\n<p>planet <i>AND</i> mars</p>\n<p>mars <i>OR</i> pluto</p>\n<p>planet <i>AND</i> mars <i>OR</i> pluto</p>",
      "err-827" : "Sorry, but you cannot create more than %s services for template id %s!",
      "schema.user.attr.authentication_key" : "Authentication key",
      "text.report.availability.AV-W" : "Time slice in percent in which the service was in status WARNING.",
      "schema.hs_downtime.attr.username" : "Added by",
      "schema.service.action.deactivate_multiple" : "Deactivate the selected services",
      "site.wtrm.attr.url" : "URL",
      "site.help.doc.how-does-bloonix-checks-your-hosts-and-services" : "Wie überwacht Bloonix Hosts und Services",
      "schema.service.action.enable_notifications_multiple" : "Enable notifications of the selected services",
      "schema.user_chart.text.editor" : "User chart editor",
      "schema.host.text.templates_not_assigned" : "Not assigned templates",
      "word.yes" : "yes",
      "schema.dependency.attr.host_id" : "Host ID",
      "text.report.availability.timeout" : "Timeout",
      "word.From" : "From",
      "text.from_now_to_2h" : "From now + 2 hours",
      "schema.chart.desc.charts" : "<b>Select multiple charts with</b><br/><br/>\n<i>CTRL + click</i><br/>or<br/><i>press + hold left mouse button + move pointer</i>",
      "nav.main.dashboard" : "DASHBOARD",
      "schema.contact.desc.company_id" : "Select the company the contact belongs to.",
      "schema.host.action.disable_notifications_multiple" : "Disable notifications of the selected hosts",
      "text.dashboard.user_chart" : "Self created chart",
      "schema.company.attr.max_templates" : "Max templates",
      "schema.user.attr.phone" : "Phone",
      "schema.contactgroup.attr.id" : "Contactgroup ID",
      "site.login.request_password" : "Request a new password.",
      "schema.service.attr.sms_warnings" : "Send WARNINGS per SMS",
      "schema.group.text.create" : "Create a new group",
      "schema.contact.text.delete" : "Delete contact",
      "schema.service.attr.last_sms" : "Last notification per SMS",
      "schema.host.attr.hw_product" : "HW product",
      "schema.timeslice.attr.timeslice" : "Timeslice",
      "schema.dependency.text.workflow_to_host_status" : "Select the status of the parent host that avoids a notification",
      "schema.plugin_stats.attr.statkey" : "Key",
      "text.report.availability.h03" : "03:00 - 03:59",
      "site.wtrm.command.checkIfElementHasNotText" : "Check if the element <b>%s</b> does <i>NOT</i> contain <b>%s</b>",
      "schema.host_template.attr.name" : "Template name",
      "schema.contact.text.escalation_level_event.0" : "permanent active",
      "site.wtrm.attr.contentType" : "Content-Type",
      "schema.host_downtime.text.title" : "Scheduled downtimes for host %s",
      "schema.sms_send.attr.message" : "Message",
      "schema.company.attr.city" : "City",
      "schema.dependency.text.workflow_timeslice" : "Set the timeslice when the dependency is active",
      "schema.dependency.attr.on_service_id" : "Depends on service ID",
      "schema.dependency.text.really_delete" : "Do you really want to delete dependency <b>%s</b>?",
      "schema.host.attr.sysinfo" : "System information",
      "schema.user.text.password_update" : "Please enter a new password.",
      "site.wtrm.action.doUncheck" : "Uncheck a <b>radio button</b> or <b>checkbox</b>",
      "schema.timeslice.text.list" : "Overview of all timeslices",
      "schema.user_chart.text.chart_metrics" : "Chart metrics",
      "site.wtrm.placeholder.contentType" : "text/html",
      "site.wtrm.command.checkUrl" : "Check if the URL in the address bar is <b>%s</b>",
      "schema.host.info.notification_disabled" : "Notifications are disabled of the host.",
      "site.wtrm.command.checkIfElementIsNotSelected" : "Check if the value <b>%s</b> of the selectbox <b>%s</b> is <i>NOT</i> selected",
      "nav.sub.notifications" : "Notifications",
      "schema.service.attr.attempt_max" : "Notify after X attempts",
      "site.wtrm.attr.ms" : "Milliseconds",
      "err-500" : "An internal error occured! Please contact the administrator!",
      "schema.contactgroup.text.host_nonmembers" : "Hosts in group",
      "site.wtrm.attr.value" : "Value",
      "schema.host.desc.interval" : "This is the check interval of all services of the host.",
      "schema.service.desc.sms_ok" : "This option enables or disables notifications if the service is in status OK.",
      "err-705" : "The new and the old password cannot be the same!",
      "text.dashboard.reconfigure_dashlet" : "Configure dashlet",
      "schema.company.attr.active" : "Active",
      "site.wtrm.action.checkIfElementHasText" : "Check if an <b>element</b> contains <b>text</b> ",
      "schema.hs_downtime.attr.timezone" : "Timezone",
      "schema.company.desc.max_charts_per_user" : "The maximum number of user-charts that can be created by a user.",
      "text.from_now_to_8h" : "From now + 8 hours",
      "schema.service.attr.mail_hard_interval" : "Notification interval for mails (hard)",
      "nav.sub.contactgroups" : "Contactgroups",
      "action.refresh" : "Refresh",
      "info.no_chart_data" : "There are no chart data available.",
      "schema.chart.text.chart_type" : "Select the chart type",
      "text.report.availability.EV-U" : "Number of events with status UNKNOWN.",
      "bool.yesno.1" : "yes",
      "schema.service.desc.default_check_type" : "A default check has a pre-defined checkpoint.\nFrom this checkpoint your service is checked.",
      "schema.host.attr.interval" : "Interval",
      "schema.service.text.multiple_downtimes" : "Schedule a downtime for multiple services",
      "text.services" : "services",
      "schema.service.desc.interval" : "This is the check interval of the service. If no value is set, then the interval of the host is inherited.",
      "action.view" : "View",
      "text.option_examples" : "Option examples",
      "schema.contact.text.create" : "Create a new contact",
      "text.last_90d" : "Last 90 days",
      "schema.user.desc.password_changed" : "Set the value to <i>no</i> if you want to force the user to change the password after the first login.",
      "schema.host.desc.add_host_to_group" : "Add the host at least to one group.",
      "schema.plugin.text.list" : "Plugins",
      "err-420" : "The action failed!",
      "text.unlimited" : "Unlimited",
      "site.wtrm.action.doClick" : "<b>Click</b> on a element",
      "text.chart_info" : "Chart information",
      "schema.group.text.may_modify_services" : "May modify services",
      "schema.host.attr.data_retention" : "Data retention",
      "schema.service.action.disable_notifications_multiple" : "Disable notifications of the selected services",
      "action.redirect" : "Redirect",
      "schema.sms_send.attr.send_to" : "Receipient",
      "text.dashboard.name" : "Name of the dashboard",
      "schema.timeperiod.desc.description" : "This is a short description of the timeperiod.",
      "text.report.availability.AV-C" : "Time slice in percent in which the service was in status CRITICAL.",
      "err-416" : "You do not have enough access privileges for this operation!",
      "schema.chart.attr.charts" : "Charts",
      "schema.company.attr.country" : "Country",
      "schema.host.desc.os_manufacturer" : "e.g. Red Hat, Microsoft, CISCO",
      "site.wtrm.command.doSleep" : "Sleep <b>%s</b>ms",
      "site.wtrm.action.doSelect" : "<b>Select</b> a value from a selectbox",
      "action.abort" : "Abort",
      "text.report.availability.h08" : "08:00 - 08:59",
      "action.move_box" : "Move the box",
      "schema.company.attr.fax" : "Fax",
      "schema.service.desc.fd_time_range" : "This is the period the flap detection checks for status switches.",
      "action.login" : "Login",
      "schema.user.text.is_logged_in" : "Logged in",
      "schema.company.attr.max_contacts" : "Max contacts",
      "site.wtrm.desc.status" : "Enter the expected http status for the URL.",
      "schema.contact.text.timeperiod_type" : "Include / Exclude",
      "text.report.availability.h15" : "15:00 - 15:59",
      "nav.sub.contactgroup_host_members" : "Hosts in contact group",
      "site.wtrm.placeholder.userAgent" : "User-Agent",
      "text.from_now_to_1d" : "From now + 1 day",
      "text.report.availability.AV-U" : "Time slice in percent in which the service was in status UNKNOWN.",
      "schema.host.attr.max_services" : "Max services",
      "schema.user.attr.password" : "Password",
      "text.report.availability.h07" : "07:00 - 07:59",
      "schema.host.attr.allow_from" : "Allow from",
      "schema.host.desc.variables" : "In this field you can define host variables. These variables can be used for thresholds by the configuration of service checks. Example:<br/><br/>HTTP.PORT=9000<br/><br/>This variable could be used in the format <i>%HTTP.PORT%</i> for thresholds. Please note that two variables are pre-defined: <i>IPADDR</i> and <i>HOSTNAME</i>. These variables are replaced with the IP address and the hostname of the host. For further information read the help.<br/><br/>Allowed signs: a-z, A-Z, 0-9, dot and underscore",
      "schema.contact.attr.mail_notifications_enabled" : "E-Mail global enabled",
      "schema.host_template.text.clone" : "Clone the template",
      "site.wtrm.placeholder.text" : "Lorem ipsum...",
      "schema.user.attr.last_login" : "Last login",
      "info.create_failed" : "The creation was not successful!",
      "schema.host.attr.ipaddr" : "IP-Address",
      "schema.service.attr.host_alive_check" : "Is this a host alive check?",
      "schema.contact.attr.sms_notifications_enabled" : "SMS global enabled",
      "text.report.availability.EV-LT15" : "Number of events with a status duration less than 15 minutes.",
      "action.add" : "Add",
      "action.show_selected_objects" : "Show selected objects",
      "text.dashboard.dashlet_configuration" : "Dashlet configuration",
      "schema.host.action.activate_multiple" : "Activate the selected hosts",
      "text.report.availability.GE300" : "Filter events with a status duration greater than 5 hours.",
      "text.report.title.number_of_events_by_duration" : "Number of events by duration",
      "schema.company.attr.max_timeperiods" : "Max timeperiods",
      "schema.service.action.clear_acknowledgement_multiple" : "Clear the acknowledgement of the selected services",
      "schema.service.attr.active" : "Active",
      "schema.group.desc.description" : "Enter a short description about the group.",
      "schema.host.attr.notification" : "Notifications enabled",
      "schema.service.attr.mail_ok" : "Send OK notifications per mail",
      "schema.service.text.multiple_force_next_check" : "Reset the interval and force the next check of the service",
      "site.wtrm.desc.userAgent" : "This is the User-Agent to send for all requests.",
      "schema.chart.attr.from_to" : "From <b>%s</b> to <b>%s</b>",
      "schema.plugin.attr.command" : "Command",
      "text.report.availability.LT300" : "Filter events with a status duration less than 5 hours.",
      "word.second" : "second",
      "schema.hs_downtime.attr.description" : "Description",
      "schema.service.text.host_alive_check" : "Host-Alive-Check",
      "text.filter_by_category_dots" : "Filter by category ...",
      "schema.service.desc.multiple_check_type_title" : "Multiple checkpoints",
      "site.wtrm.desc.parent" : "It's possible to set a parent ID. The ID, class or name is searched within the element of the parent ID.",
      "text.report.availability.h01" : "01:00 - 01:59",
      "nav.sub.timeperiods" : "Timeperiods",
      "nav.sub.groups" : "Groups",
      "site.wtrm.action.checkIfElementNotExists" : "Check if an <b>element does <i>NOT</i> exists</b>",
      "text.report.availability.AV-O" : "Time slice in percent in which the service was in status OK.",
      "err-610" : "Please fill in the red marked fields correctly!",
      "text.report.availability.h05" : "05:00 - 05:59",
      "text.report.title.number_of_events" : "The total number of events",
      "action.generate" : "Generate",
      "schema.sms_send.text.search" : "Search for SMS",
      "site.wtrm.placeholder.parent" : "#parent-id (optional)",
      "schema.service.attr.default_location" : "Default location",
      "schema.company.desc.active" : "Activate or de-activate all objects of the company.",
      "schema.host_template.test.host_members" : "Hosts in group",
      "schema.company.desc.max_groups" : "The maximum number of groups that can be created.",
      "site.wtrm.action.checkIfElementHasHTML" : "Check if an <b>element</b> contains <b>HTML</b>",
      "schema.service.desc.multiple_check_concurrency" : "Please note that the checks are executed\nconcurrent from multiple checkpoints. To avoid overloading your service, you can specify\nthe maximum number of concurrent executions.",
      "schema.company.text.settings" : "Company settings",
      "info.update_failed" : "The update was not successful!",
      "site.wtrm.command.doCheck" : "Check the radio button or checkbox of element <b>%s</b> with value <b>%s</b>",
      "schema.dependency.text.workflow_inherit" : "Activate inheritation",
      "schema.dependency.attr.timezone" : "Timezone",
      "schema.contact.text.remove_timeperiod" : "Remove timeperiod from contact",
      "schema.host_template.text.selected_hosts" : "Selected hosts",
      "action.clone" : "Clone",
      "schema.user.desc.username" : "Enter the username in the format <i>user@domain.test</i>.",
      "site.wtrm.command.checkIfElementIsSelected" : "Check if the value <b>%s</b> of the selectbox <b>%s</b> is selected",
      "schema.chart.text.back_to_selection" : "Back to the chart selection",
      "schema.company.desc.max_users" : "The maximum number of users that can be created.",
      "schema.company.attr.id" : "Company ID",
      "schema.company.desc.max_timeperiods" : "The maximum number of timeperiods that can be created.",
      "text.report.service_has_a_availabilty_of" : "Service <b>%s</b> has a availability of",
      "schema.service.attr.acknowledged" : "Service status acknowledged",
      "schema.contact.text.timeperiod_type_send_to_all" : "Send as mail and SMS",
      "word.hour" : "hour",
      "schema.host.attr.coordinates" : "Coordinates",
      "site.help.doc.user-charts" : "Eigene Charts erstellen",
      "site.wtrm.placeholder.url" : "http://www.bloonix.de/",
      "text.second_failover_checkpoint" : "Second failover checkpoint",
      "text.dashboard.services_availability" : "Availability of all services",
      "schema.company.attr.max_dashlets_per_dashboard" : "Max dashlets per dashboard",
      "schema.host.desc.description" : "This is a short description of the host.",
      "schema.service.text.multiple_activate" : "Activate or deactivate multiple services",
      "text.report.availability.Availability" : "The total availability.",
      "site.login.password" : "Password",
      "schema.host.desc.hw_product" : "e.g. Dell Power Edge 2950",
      "nav.sub.variables" : "Variables",
      "text.dashboard.really_delete_dashboard" : "Do you really want to delete the dashboard %s?",
      "schema.contact.attr.sms_to" : "Mobil number",
      "schema.host.desc.data_retention" : "The retention in days of all data of the host and services. ",
      "err-410" : "The requested URL was not found!",
      "err-631" : "The parameter offset must be an numeric value, min 0.",
      "schema.host.text.add_host_to_host_template" : "Add the host to a host template",
      "site.wtrm.desc.password" : "This password for the auth basic authentification.",
      "schema.dependency.attr.service_id" : "Service ID",
      "err-426" : "This action requires a token!",
      "action.search" : "Search",
      "text.range_value" : "Range: %s - %s",
      "schema.group.text.update_user" : "Modify access rights",
      "site.wtrm.action.checkIfElementIsNotChecked" : "Check if a <b>radio button</b> or <b>checkbox is <i>NOT</i> checked</b>",
      "site.wtrm.text.check_it" : "Check it!",
      "schema.user.text.create" : "Create a new user",
      "schema.service.attr.send_sms" : "Notifications per SMS enabled",
      "site.wtrm.command.checkIfElementHasText" : "Check if the element <b>%s</b> contains <b>%s</b>",
      "schema.chart.text.chart_id" : "Chart-ID: %s",
      "schema.chart.text.save_view" : "Save view",
      "text.min_value" : "Min value: <b>%s</b>",
      "text.report.availability.h20" : "20:00 - 20:59",
      "schema.service.desc.attempt_warn2crit" : "This option is useful if you want that the status of the service upgrades to CRITICAL if the real status is WARNING and maximum attempts were reached.",
      "schema.dependency.text.service_to_host" : "service to host",
      "schema.host.attr.last_check" : "Last check",
      "word.Timezone" : "Timezone",
      "action.settings" : "Settings",
      "site.wtrm.command.doUncheck" : "Uncheck the radio button or checkbox <b>%s</b> with value <b>%s</b>",
      "text.from_now_to_2d" : "From now + 2 days",
      "schema.user_chart.attr.id" : "ID",
      "schema.dependency.text.host_to_host" : "host to host",
      "schema.host_template.text.delete" : "Delete a template",
      "schema.group.text.may_delete_services" : "May delete services",
      "schema.host.desc.virt_manufacturer" : "e.g. VMware, Parallels",
      "schema.company.desc.max_metrics_per_chart" : "The maximum number of metrics per user-chart.",
      "schema.contact.desc.escalation_level" : "Select an escalation level for the contact. With the escalation level it's possible to control when a contact gets a notification. The escalation level <i>permanent active</i> means that the contact gets the event notifications every time. The escalation level <i>active after 3 notifications</i> means that the contact gets a notification first if already 3 notifications were sent and the service is still not OK.",
      "err-620" : "This object already exists!",
      "nav.sub.user_group_settings" : "User group settings",
      "schema.plugin.attr.id" : "Plugin-ID",
      "schema.user.attr.username" : "Username",
      "schema.chart.attr.options" : "Chart options",
      "schema.company.desc.max_sms" : "The maximum number of SMS that can be sent per month. Set 0 (null) if unlimited.",
      "site.wtrm.command.doClick" : "Click on element <b>%s</b>",
      "err-836" : "Sorry, but you cannot create more than %s contact groups!",
      "schema.service.desc.agent_tooltip" : "<h3>Installation of the Bloonix-Agent</h3>\n<p>\nThis check is executed on your server and requires that you install the Bloonix-Agent\nand the plugin on your server.\n</p>",
      "text.report.availability.security" : "Security issue",
      "schema.event.attr.id" : "Event ID",
      "schema.host_template.text.view_services" : "View services",
      "site.login.forgot_password_info" : "Please note that the new password is not send\nautomatically to your registered e-mail address. An administrator will check\nyour request at first and contact you as soon as possible.",
      "schema.contactgroup.text.contact_members" : "Contacts in contact group",
      "schema.contactgroup.text.group_members" : "Members of contact group '<b>%s</b>'",
      "schema.service.attr.description" : "Description",
      "text.report.availability.volatile" : "Volatile",
      "schema.service.attr.status_since" : "Status since",
      "err-846" : "Sorry, but you cannot create more than %s users!",
      "schema.service.attr.agent_options.timeout" : "Global check timeout",
      "schema.user.text.repeat_password" : "Repeat the new password",
      "bool.yesno.0" : "no",
      "schema.host.desc.sysgroup" : "This is a complete free to use field with no restrictions.",
      "schema.service.text.default_location_check_button" : "Default check",
      "text.dashboard.clone_dashboard" : "Clone the dashboard",
      "schema.company.desc.max_downtimes_per_host" : "The maximum number of downtimes that can be created for a host.",
      "schema.user.attr.id" : "User ID",
      "schema.roster.attr.active" : "Active",
      "schema.service.desc.failover_check_type" : "With failover checks it's possible to select a fixed\ncheckpoint from which the service is checked. In addition it's possible to select two\nfailover checkpoints, from which the service is checked if the check from the fixed checkpoint\nreturns a status that is not OK. If the status of all 3 checkpoints is not OK, the counter\nof <i>attempt max</i> is increased.",
      "site.wtrm.action.doWaitForElement" : "Wait for element",
      "schema.group.desc.company" : "Select the company the group belongs to.",
      "err-702" : "The new password is to long (max 128 signs)!",
      "schema.company.attr.state" : "State/Province",
      "schema.chart.attr.datetime" : "Date and time",
      "schema.chart.text.delete_view" : "Delete chart view",
      "schema.dependency.text.active_time" : "Active time",
      "action.generate_string" : "Generate a random string",
      "text.report.availability.EV-W" : "Number of events with status WARNING.",
      "schema.service.attr.service_name" : "Service name",
      "schema.service.text.attempt" : "Attempts",
      "site.wtrm.command.checkIfElementHasValue" : "Check if the input field or textarea with element <b>%s</b> contains <b>%s</b>",
      "schema.contact.text.list" : "Overview of all contacts",
      "text.click_me" : "Click me",
      "site.wtrm.command.checkUrlWithContentType" : "Check if the URL <b>%s</b> has content type %s",
      "text.report.availability.LT30" : "Filter events with a status duration less than 30 minutes.",
      "schema.dependency.text.workflow_from_host" : "From host",
      "text.report.availability.h13" : "13:00 - 13:59",
      "word.Settings" : "Settings",
      "schema.service.desc.rotate_check_type_title" : "Rotate checkpoints",
      "err-700" : "Please change your password!",
      "text.dashboard.double_click_or_mouse_wheel_to_zoom" : "Double click or use the mouse wheel to zoom in and out.",
      "site.help.doc.web-transactions" : "Web-Transactions",
      "err-634" : "For the parameter sort_type only \"asc\" or \"desc\" is allowed as value.",
      "schema.company.desc.max_chart_views_per_user" : "The maximum number of chart views that can be created by a user.",
      "err-816" : "Sorry, but you cannot add more than %s metrics to a chart!",
      "site.help.doc.bloonix-webgui" : "Grundlegendes zur Bloonix-WebGUI",
      "schema.service.info.notification" : "Notifications are disabled of the service.",
      "action.genstr" : "Generate string",
      "info.create_success" : "The creation was successful!",
      "schema.service.info.host_alive_check" : "This is a host-alive-check.",
      "action.clear" : "Clear",
      "schema.service.attr.last_mail" : "Last notification per mail",
      "schema.user.desc.password" : "Enter the users login password.",
      "schema.contactgroup.desc.description" : "Set a short description for the group.",
      "schema.contact.desc.sms_notification_level" : "Select the status level for which you want to receive notifications.",
      "site.help.doc.add-new-service" : "Einen neuen Service anlegen",
      "schema.hs_downtime.attr.end_time" : "End time",
      "schema.host.desc.ipaddr" : "This is the main IP address of the host.",
      "text.inherited_from_host" : "Inherited from the host",
      "schema.contactgroup.desc.name" : "This is the name of the contact group. The name should be unique.",
      "schema.service.attr.volatile_status" : "The current volatile status of the service",
      "schema.company.desc.max_hosts" : "The maximum number of hosts that can be created. Set 0 (null) if unlimited.",
      "schema.user.text.current_password" : "Current password",
      "err-826" : "Sorry, but you cannot create more than %s services per template!",
      "schema.host.text.multiple_edit_info" : "Note: empty fields will be ignored!",
      "schema.company.attr.comment" : "Comment",
      "nav.main.monitoring" : "MONITORING",
      "schema.user.text.view" : "User %s",
      "schema.host.action.enable_notifications_multiple" : "Enable notifications of the selected hosts",
      "schema.user.attr.name" : "Name",
      "schema.dependency.text.host_to_service" : "host to service",
      "text.report.availability.EV-LT60" : "Number of events with a status duration less than 60 minutes.",
      "schema.service.text.services" : "Services",
      "text.report.availability.LT180" : "Filter events with a status duration less than 3 hours.",
      "text.report.title.number_of_events_by_tags" : "Number of events by tags",
      "text.report.availability.EV-LT300" : "Number of events with a status duration less than 5 hours.",
      "schema.service.attr.fd_flap_count" : "Notifiy after X status switches",
      "site.wtrm.command.checkIfElementNotExists" : "Check if the element <b>%s</b> does <i>NOT</i> exists",
      "text.dashboard.delete_dashboard" : "Delete the dashboard",
      "schema.service.text.failover_location_check_button" : "Failover check",
      "text.change_your_password" : "Change your password",
      "text.plugin_info" : "Plugin information",
      "schema.service.attr.sms_ok" : "Send OK notifications per SMS",
      "schema.host_template.test.host_nonmembers" : "Hosts not in group",
      "site.help.doc.bloonix-agent-installation" : "Den Bloonix-Agenten installieren",
      "schema.roster.attr.description" : "Description",
      "nav.sub.host_group_settings" : "Host group settings",
      "schema.host.desc.device_class" : "e.g.<br/>/Server/Linux/Debian<br/>/Server/Windows/Windows 2008<br/>/Network/Router<br/>/Network/Switch<br/>/Printer",
      "action.extsearch" : "Extended search",
      "schema.company.attr.max_services_per_host" : "Max services per host",
      "site.wtrm.action.checkIfElementExists" : "Check if an <b>element exists</b>",
      "schema.user.desc.select_language" : "Please note that the complete WebGUI is reloaded after the language were selected and you will be redirected to the dashboard!",
      "site.login.username" : "Email address",
      "schema.contact.attr.sms_notification_level" : "SMS notification level",
      "schema.hs_downtime.attr.begin_time" : "Begin time",
      "err-831" : "Sorry, but you cannot create more than %s hosts!",
      "schema.service.desc.agent_options.timeout" : "This is the global execution timeout of the check itself. After the timeout the check is killed and a CRITICAL status is triggered. This is very useful for checks that hangs and are unable to stop itself.<br/><br/>Default: 30 seconds",
      "schema.service.text.create" : "Create a new service",
      "site.wtrm.attr.password" : "Password",
      "site.wtrm.attr.text" : "Inner text",
      "schema.service.action.acknowledge_multiple" : "Acknowledge the status of the selected services",
      "schema.service.attr.status" : "Status",
      "schema.company.text.delete" : "Delete company",
      "schema.user.desc.manage_templates" : "Is the user allowed to manage host templates?",
      "schema.user.attr.allow_from" : "Allow from IP",
      "schema.host.desc.timeout" : "This is the timeout of all services of the host. If the status of a service is not updated in this time then a critical status is set for the services with the information that it seems that the Bloonix agent is not working.",
      "schema.service.attr.next_check" : "Next check",
      "schema.company.attr.max_metrics_per_chart" : "Max metrics per chart",
      "site.help.doc.contacts-and-notifications" : "Kontakte und Benachrichtigungen",
      "schema.group.text.remove_user" : "Remove user from group",
      "schema.plugin_stats.text.list" : "Metrics of plugin %s",
      "schema.service.info.active" : "The service is not active.",
      "schema.group.desc.groupname" : "This is the group name. The group name should be unique.",
      "schema.dependency.text.create" : "Create a new dependency for host <b>%s</b>",
      "site.login.want_to_login" : "Do you want to login?",
      "text.dashboard.open_dashboard" : "Open a dashboard",
      "schema.service.desc.passive_check" : "A passive check is a check which is not checked by Bloonix itself, but by a external service or script. Passive checks has no timeout and are very useful, for example, for SNMP traps. The external service has to report a critical state to the Bloonix-Agent, which in turn reports the state to the Bloonix-Server.",
      "action.cancel" : "Cancel",
      "schema.dependency.text.workflow_to_host" : "to host",
      "err-605" : "Please select at least one object!",
      "schema.host_template.desc.description" : "Set a short description for the template.",
      "schema.service.desc.multiple_check_type" : "With this option it's possible to select\nmultiple checkpoints from which the service is checked. If 3 checkpoints\nreturns a critical status then the counter of <i>attempt max</i> is increased.",
      "site.wtrm.placeholder.value" : "value",
      "text.default" : "Default",
      "err-840" : "Sorry, but you cannot create more than %s timeperiods!",
      "site.help.doc.notification-screen" : "Notification Screen",
      "err-841" : "Sorry, but you cannot create more than %s timeslices per object!",
      "action.update" : "Update",
      "schema.group.attr.company_id" : "Company ID",
      "site.wtrm.action.checkIfElementHasNotHTML" : "Check if an <b>element does <i>NOT</i></b> contain <b>HTML</b>",
      "schema.service_downtime.text.title" : "Scheduled service downtimes for host %s",
      "nav.sub.rosters" : "Rosters",
      "schema.event.attr.duration" : "Duration",
      "schema.contact.text.settings" : "Contact settings",
      "schema.chart.attr.to" : "To",
      "schema.group.text.list" : "Overview of all groups",
      "schema.user.desc.company" : "Select the company the user belongs to.",
      "site.login.sign_up" : "Sign up for a Bloonix account",
      "schema.timeslice.attr.id" : "Timeslice ID",
      "schema.dependency.text.workflow_from_host_status" : "Select the status of the host that activates the dependency flow",
      "schema.sms_send.text.list" : "Sent SMS for host %s",
      "schema.service.desc.sms_hard_interval" : "With this option you can define a hard interval for SMS notifications. Even if the status switched from CRITICAL to OK and then back to CRITICAL you will not get an notification until the interval expires.",
      "site.wtrm.action.doAuth" : "Set auth basic <b>username</b> and <b>password</b>",
      "err-600" : "The object you requested does not exist!",
      "site.wtrm.action.doSleep" : "<b>Sleep</b> a while",
      "err-802" : "Sorry, but this feature is not available!",
      "schema.chart.text.selected" : "selected",
      "schema.user_chart.text.delete" : "Delete chart",
      "site.login.follow" : "Follow Bloonix",
      "schema.company.desc.max_contactgroups" : "The maximum number of contactgroups that can be created.",
      "site.wtrm.attr.username" : "Username",
      "text.report.availability.h19" : "19:00 - 19:59",
      "schema.company.attr.address2" : "Address 2",
      "text.report.availability.EV-I" : "Number of events with status INFO.",
      "schema.company.desc.max_dashlets_per_dashboard" : "The maximum number of dashlets that can be added to a dashboard.",
      "site.help.doc.host-templates" : "Host Templates einrichten und verwalten",
      "schema.timeperiod.attr.name" : "Timeperiod",
      "schema.company.attr.name" : "Name",
      "schema.dependency.attr.on_host_id" : "Depends on host ID",
      "schema.service.text.title" : "Services",
      "schema.service.text.clone_select_host" : "Select another host",
      "schema.service.desc.rotate_check_type" : "The rotate check has no fixed checkpoint.\nInstead of that the service check rotates over the selected checkpoints. If a check\nof one checkpoint is not OK, then the check jumps immediate to the next checkpoint.\nIf the third checkpoint still returns a status that is not OK then the counter of <i>attempt max</i>\nis increased.",
      "schema.user.desc.name" : "This is the users full name.",
      "schema.service.text.list" : "Service details for all hosts",
      "schema.host.text.multiple_edit" : "Edit the configuration of multiple hosts",
      "text.report.title.total_status_duration" : "The total service status duration",
      "schema.contact.desc.sms_notifications_enabled" : "With this option it's possible to enable or disable event notifications via SMS.",
      "schema.service.action.activate_multiple" : "Activate the selected services",
      "site.wtrm.command.checkIfElementIsNotChecked" : "Check if the radio button or checkbox <b>%s</b> is <i>NOT</i> checked",
      "schema.chart.text.charts" : "Charts",
      "text.please_select_objects" : "Please select at least one object!",
      "text.min_length" : "Min length: <b>%s</b>",
      "schema.host.text.report_title" : "Report for host %s",
      "schema.service.info.inherits_from_host_template" : "This service is inherited from host template '%s'.",
      "schema.group.text.may_create_services" : "May create services",
      "schema.dependency.text.workflow_from_service_status" : "Select the status of the service that activates the dependency flow",
      "schema.company.text.create" : "Create a new company",
      "err-811" : "Sorry, but you cannot create more than %s dashboards!",
      "schema.hs_downtime.attr.id" : "ID",
      "err-417" : "You do not have enough privileges to create an object!",
      "text.report.availability.h09" : "09:00 - 09:59",
      "action.schedule" : "Schedule",
      "schema.user.attr.locked" : "Locked",
      "err-833" : "Sorry, but you cannot create more than %s services per host!",
      "schema.contactgroup.text.delete" : "Delete contact group",
      "text.last_30d" : "Last 30 days",
      "schema.service.attr.result" : "Advanced status information",
      "schema.host.desc.hw_manufacturer" : "e.g. IBM, HP, Dell, Fujitsu Siemens",
      "schema.user.desc.locked" : "Lock or unlock the user. Locked users cannot login to the monitoring interface.",
      "schema.contactgroup.attr.name" : "Name",
      "schema.company.attr.max_groups" : "Max groups",
      "err-703" : "The new password is to short (min 8 signs)!",
      "schema.service.desc.mail_warnings" : "This option enables or disables notifications if the service is in status WARNING.",
      "action.save" : "Save",
      "schema.service.text.multiple_acknowledge" : "Acknowledge or clear acknowledgements of multiple services",
      "schema.user_chart.attr.title" : "Title",
      "schema.company.attr.max_chart_views_per_user" : "Max chart views per user",
      "site.help.doc.bloonix-agent-configuration" : "Den Bloonix-Agenten konfigurieren",
      "schema.dependency.attr.on_status" : "Parent status",
      "nav.sub.templates" : "Templates",
      "text.report.availability.lt30" : "Between 15 and 30 minutes",
      "site.help.doc.add-new-host" : "Einen neuen Host anlegen",
      "err-419" : "You do not have enough privileges to delete the objects!",
      "schema.service.attr.flapping" : "Flapping",
      "text.dashboard.dashlet_select_chart" : "Select a chart",
      "text.first_failover_checkpoint" : "First failover checkpoint",
      "schema.service.desc.agent_id" : "This is the location from where the check is executed.",
      "schema.service.desc.rotate_check_type_locations" : "Your service is checked from the following checkpoints:",
      "text.dashboard.services_notification" : "Notification status of all services",
      "schema.contact.text.timeperiods" : "Contact timeperiods",
      "text.dashboard.title" : "Dashboard",
      "schema.user.text.list" : "Overview of all users",
      "schema.service.desc.mail_ok" : "This option enables or disables notifications if the service switched back to status OK.",
      "info.extended_search_syntax_for_hosts" : "<p>It's possible to filter the host list by a search query. The syntax is very simple and looks like:</p>\n<pre>key:value</pre>\n<p>The key is the table field to search for the value.</p>\n<p>Search examples:</p>\n<p>- Search for hosts in status CRITICAL or UNKNOWN</p>\n<pre>status:CRITICAL OR status:UNKNOWN</pre>\n<p>- Search for hosts in datacenter 12 with status CRITICAL</p>\n<pre>location:\"Datacenter 12\" AND status:CRITICAL</pre>\n<p>The following keys are available to search for specific fields:</p>",
      "word.Preset" : "Preset",
      "action.quicksearch" : "Quick search",
      "schema.group.attr.id" : "Group ID",
      "schema.chart.attr.id" : "Chart ID",
      "schema.company.attr.max_contactgroups" : "Max contactgroups",
      "site.wtrm.text.wtrm_workflow" : "Web Transaction Workflow",
      "text.report.availability.agent_dead" : "Agent dead",
      "schema.user_chart.text.create" : "Create a chart",
      "schema.host.text.device_class_help_link" : "Read how this feature works",
      "schema.user.text.session_expires" : "Session expires",
      "text.dashboard.top_hosts_events" : "Top events of all hosts",
      "text.report.availability.h22" : "22:00 - 22:59",
      "nav.sub.reports" : "Reports",
      "schema.service.desc.sms_warnings" : "This option enables or disables notifications if the service is in status WARNING.",
      "schema.chart.text.selected_max_reached" : "(max) selected",
      "schema.service.text.settings" : "Settings of service <b>%s</b>",
      "site.wtrm.action.checkIfElementHasValue" : "Check the <b>value</b> of an <b>input</b> field or <b>textarea</b>",
      "schema.plugin.attr.description" : "Description",
      "schema.user_chart.text.title" : "User charts",
      "site.wtrm.desc.contentType" : "Enter content type that is expeced for the URL.",
      "schema.company.desc.max_dashboards_per_user" : "The maximum number of dashboards that can be created by a user.",
      "action.no_abort" : "<b>No, abort!</b>",
      "text.from_now_to_4h" : "From now + 4 hours",
      "schema.group.attr.groupname" : "Groupname",
      "action.members" : "List members",
      "schema.host.text.multiple_activate" : "Activate or deactivate multiple hosts",
      "schema.host.attr.company_id" : "Company ID",
      "word.active" : "active",
      "schema.host.attr.comment" : "Comment",
      "schema.user.attr.comment" : "Comment",
      "schema.user.desc.allow_from" : "It's possible to set a comma separated list of ip addresses from which the user is restricted to login. With the keyword <i>all</i> the login has no restriction.",
      "schema.contact.desc.mail_notifications_enabled" : "With this option it's possible to enable or disable event notifications via email.",
      "schema.company.desc.max_services" : "The maximum number of services that can be created. Set 0 (null) if unlimited.",
      "text.locations_selected_costs" : "You have <b>%s</b> checkpoints selected. Please note that each checkpoint will be charged extra.",
      "text.report.availability.h02" : "02:00 - 02:59",
      "site.wtrm.attr.html" : "Inner HTML",
      "schema.host.text.list_device_classes" : "Device classes",
      "schema.host_template.text.delete_service" : "Delete a service from the template",
      "word.hours" : "hours",
      "schema.host_template.text.list" : "Overview of all host templates",
      "word.days" : "days",
      "schema.service.attr.is_volatile" : "Is the service volatile",
      "word.debug" : "Debug",
      "text.report.availability.LT15" : "Filter events with a status duration less than 15 minutes.",
      "schema.service.desc.acknowledged" : "This option is useful if a service is not OK and if you want to disable the notifications temporary. The notifications will be enabled again if the services switched to the status OK.",
      "nav.sub.mtr" : "MTR",
      "site.wtrm.desc.value" : "The value of the element you wish to fill or check.",
      "schema.company.attr.max_charts_per_user" : "Max charts per user",
      "site.help.doc.host-and-service-dependencies" : "Abhängigkeiten zwischen Hosts und Services",
      "schema.user_chart.text.update" : "Update a chart",
      "schema.roster.text.list" : "Overview of all rosters",
      "schema.service.text.view_wtrm_report" : "View web transaction report",
      "site.help.doc.device-classes" : "Bauklasse von Hosts",
      "schema.user.attr.manage_templates" : "Manage templates?",
      "text.dashboard.hosts_availability" : "Availability of all hosts",
      "schema.service.attr.comment" : "Comment",
      "text.last_60d" : "Last 60 days",
      "site.help.doc.host-alive-check" : "Was ist ein Host-Alive-Check?",
      "schema.contact.text.escalation_level_event.1" : "active after 1 notification",
      "schema.company.attr.company" : "Company",
      "site.wtrm.command.doUserAgent" : "Set the user agent to <b>%s</b>",
      "action.yes_delete" : "<b>Yes, delete!</b>",
      "schema.service.attr.command" : "Command",
      "action.help" : "Help",
      "schema.event.text.host_service" : "Host / Service",
      "schema.event.attr.tags" : "Tags",
      "schema.user.attr.timezone" : "Timezone",
      "site.wtrm.desc.hidden" : "Do you want to hide the value because it's a password or a secret string?",
      "schema.host_template.text.clone_title" : "Clone template %s",
      "text.report.availability.h17" : "17:00 - 17:59",
      "schema.service.attr.interval" : "Interval",
      "schema.service.text.select_location_check_type_info" : "Click on the buttons to see a short description of each type",
      "schema.user.text.delete" : "Delete user",
      "schema.service.attr.notification" : "Notifications enabled",
      "schema.service.desc.failover_check_type_title" : "Failover checkpoints",
      "text.undefined" : "Undefined",
      "word.Days" : "Days",
      "schema.service.desc.active" : "This option activates or de-activates the service check.",
      "schema.chart.text.chart_views" : "Chart views",
      "text.never" : "Never",
      "schema.service.attr.command_options" : "Check settings",
      "text.selected_objects" : "Selected objects",
      "schema.dependency.text.service_to_service" : "service to service",
      "word.Hours" : "Hours"
   },
   "de" : {
      "info.update_success" : "Das Upate war erfolgreich!",
      "schema.host_template.attr.description" : "Beschreibung",
      "schema.user.desc.timezone" : "Wähle die Zeitzone des Benutzers.",
      "schema.timeperiod.text.settings" : "Einstellungen des Zeitplans",
      "schema.plugin_stats.attr.description" : "Beschreibung",
      "schema.service.text.multiple_help" : "<h4>Diese Aktion erfordert, dass mindestens ein Service ausgewählt ist.</h4>\nUm einen einzelnen Service zu markieren, klicken Sie auf die entsprechende Zeile.\nWenn Sie mehrere Services markieren möchten, halten Sie einfach die Taste <i>STRG</i>\nauf Ihrer Tastatur gedrückt. Beim Drücken und Halten der der linken Maustaste und dem\nBewegen des Mauszeigers kann ein größerer Bereich von Hosts gewählt werden.",
      "site.login.error" : "Einloggen fehlgeschlagen! Versuchen Sie es erneut!",
      "site.login.request_success" : "Ihre Anfrage wurde erfolgreich zugestellt.<br/>\nEin Administrator wird Sie so schnell wie möglich kontaktieren.",
      "schema.dependency.text.workflow_timezone" : "Gebe eine Zeitzone für den Zeitabschnitt an",
      "schema.service.attr.message" : "Status Informationen",
      "schema.host.desc.company_id" : "Wähle ein Unternehmen zu dem der Host gehört",
      "schema.company.desc.max_contacts" : "Die maximale Anzahl an Kontakten die erstellt werden dürfen.",
      "schema.host.desc.status" : "Der Status des Hosts. Mögliche Werte sind OK, INFO, WARNING, CRITICAL oder UNKNOWN.",
      "schema.service.desc.fd_enabled" : "Diese Option aktiviert oder deaktiviert die Erkennung von zu häufigen Statuswechseln (Flap Detection). Wenn ein Service zu häufig in einem kurzen Zeitraum den Status wechselt, ohne das der Prüfzähler für die maximale Anzahl erlaubter Fehlschläge erreicht wird, so greift diese Funtion. Für die Erkennung wird die Anzahl von Statuswechseln in einem bestimmten Zeitraum gemessen. Wenn der Status in diesem Zeitraum zu häufig wechselte, wird ein kritisches Ereignis ausgelöst.",
      "schema.host.attr.os_product" : "OS Produkt",
      "info.last-year" : "Letztes Jahr",
      "action.overview" : "Übersicht",
      "text.change_the_language" : "Ändere die Sprache",
      "schema.user_chart.text.add_metric" : "Metrik hinzufügen",
      "site.wtrm.command.checkIfElementIsChecked" : "Check if the radio button or checkbox <b>%s</b> is checked",
      "text.thresholds" : "Schwellwerte",
      "text.last_180d" : "Die letzten 180 Tage",
      "schema.service.attr.last_check" : "Letzte Prüfung",
      "text.report.availability.detailed_report_onclick" : "Klicke auf einen Service für einen detaillierten Bericht",
      "nav.sub.contacts" : "Kontakte",
      "schema.service.desc.multiple_check_type_locations" : "Bitte wählen Sie mindestens 3 Messpunkte aus:",
      "word.Hosts" : "Hosts",
      "schema.host.text.multiple_notification" : "Die Benachrichtigungen für mehrere Hosts ein- oder ausschalten",
      "schema.service.desc.attempt_max" : "Diese Option kontrolliert, wann Sie eine Benachrichtiung erhalten, wenn ein Service nicht OK ist. Ein Wert von 3 bedeuted zum Beispiel, dass eine Serviceprüfung 3 Mal hintereinander fehlschlagen darf, bis Sie eine Benachrichtigung erhalten.",
      "site.help.doc.host-variables" : "Host Variablen",
      "nav.sub.downtimes" : "Wartungsarbeiten",
      "text.report.title.host_from_to" : "Bericht für Host %s von %s bis %s",
      "schema.group.text.delete" : "Die Gruppe löschen",
      "schema.host.attr.location" : "Standort",
      "schema.timeperiod.attr.id" : "Zeitplan ID",
      "schema.contact.attr.name" : "Name",
      "text.report.availability.AV-I" : "Der Zeitbereich in Prozent in dem der Service im Status INFO war.",
      "schema.user.attr.password_changed" : "Wurde das Passwort geändert?",
      "text.report.availability.lt15" : "Zwischen 0 und 15 Minuten",
      "schema.host.attr.os_manufacturer" : "OS Hersteller",
      "word.Language" : "Sprache",
      "schema.company.text.list" : "Übersicht über alle Unternehmen",
      "err-701" : "Das Passwort ist ungültig!",
      "schema.event.attr.last_status" : "Letzter Status",
      "schema.contact.text.timeperiod_type_send_only_mail" : "Nur Mails versenden",
      "schema.event.text.filter_message" : "Nachrichtenfilter",
      "site.wtrm.action.checkIfElementHasNotValue" : "Check if an <b>input</b> field or <b>textarea has <i>NOT</i></b> a specified <b>value</b>",
      "action.submit" : "Bestätigen",
      "schema.contactgroup.text.service_members" : "Services, die der Kontakgruppe angehören",
      "schema.service.attr.fd_enabled" : "Erkennung von Statuswechseln eingeschaltet",
      "schema.host.desc.max_services" : "Konfiguration der maximalen Services, die für diesen Host eingerichtet werden dürfen. 0 heißt unlimitiert.",
      "action.unselect" : "Abwählen",
      "schema.dependency.text.service" : "Service",
      "site.wtrm.desc.html" : "The inner HTML of an element you wish to check.",
      "action.remove" : "Entfernen",
      "word.Seconds" : "Sekunden",
      "schema.contactgroup.text.service_nonmembers" : "Services, die nicht der Kontaktgruppe angehören",
      "schema.user.desc.comment" : "Dieses Feld kann für interne Kommentare über den Benutzer verwendet werden.",
      "schema.service.info.notification_disabled" : "Die Benachrichtigungen sind ausgeschaltet.",
      "schema.company.attr.max_dependencies_per_host" : "Maximale Abhängigkeiten pro Host",
      "err-845" : "Sorry, aber Sie dürfen nicht mehr als %s Gruppen erstellen!",
      "schema.service.desc.default_check_type_location" : "Der Messpunkt für Standardchecks ist:",
      "site.help.doc.host-parameter" : "Host Parameter im Detail",
      "text.report.availability.h12" : "12:00 - 12:59",
      "site.wtrm.command.checkIfElementExists" : "Check if the element <b>%s</b> exists",
      "schema.service.attr.id" : "Service ID",
      "text.report.availability.EV-LT180" : "Anzahl von Ereignissen mit einer Statusdauer kleiner als 3 Stunden. ",
      "site.help.doc.service-parameter" : "Service Parameter im Detail",
      "site.wtrm.desc.element" : "The element you want to select. As example: #id, .class, name<br/><br/>\nIt's also possible to search for tags and attributes. Example:<br/><br/>\n&lt;a&gt; - get the first 'a' tag<br/><br/>\n&lt;a[5]&gt; - get the fifth 'a' tag<br/><br/>\n&lt;a a=\"hello\" b=\"world\"&gt; - search for a 'a' tag with the specified attributes and values",
      "schema.user_chart.attr.yaxis_label" : "Label der Y-Achse",
      "schema.host_template.text.setting" : "Einstellungen des Template",
      "word.Minutes" : "Minuten",
      "schema.chart.attr.from" : "Von",
      "schema.dependency.text.for_node" : "Abhängigkeiten für Knoten %s",
      "text.report.availability.EV-LT30" : "Anzahl von Ereignissen mit einer Statusdauer kleiner als 30 Minuten. ",
      "schema.dependency.text.create_from" : "Eine neue Abhängigkeit erstellen von",
      "text.report.availability.Events" : "Totale Anzahl von Ereignissen.",
      "schema.host_template.text.view_members" : "Hosts hinzufügen / entfernen",
      "site.wtrm.placeholder.status" : "200",
      "site.wtrm.text.click_for_details" : "Click on a row to get a detailed report",
      "schema.service.text.select_location_check_type" : "Wähle den Typ des Checks",
      "schema.service.desc.send_sms" : "Diese Option aktiviert oder deaktiviert das Versenden von SMS für diesen Service.",
      "err-601" : "Die angeforderten Objekte existieren nicht!",
      "schema.chart.attr.preset" : "Vorauswahl",
      "site.wtrm.command.doUrl" : "Go to URL <b>%s</b>",
      "schema.event.attr.time" : "Zeitstempel",
      "schema.host.text.create" : "Einen neuen Host erstellen",
      "schema.user_chart.attr.description" : "Beschreibung",
      "schema.contact.desc.name" : "Dies ist der volle Name des Kontakts.",
      "schema.host.action.remove_template" : "Template entfernen",
      "text.dashboard.use_mouse_wheel_to_zoom" : "Nutze das Mausrad um zu Zoomen",
      "schema.host.attr.password" : "Passwort",
      "site.wtrm.attr.hidden" : "Hide",
      "site.wtrm.action.doSubmit" : "<b>Submit</b> a form",
      "schema.roster.attr.id" : "Bereitschaftsplan ID",
      "schema.host.attr.status" : "Status",
      "schema.host.text.mtr_chart" : "MTR Chart",
      "schema.service.text.sla_requirements" : "Bitte beachten Sie das für freie Accounts nur der Standardcheck zur Verfügung steht!",
      "schema.timeslice.text.delete" : "Den Zeitabschnitt löschen",
      "schema.contact.text.timeperiod_type_exclude" : "Exkludieren",
      "nav.sub.contactgroup_service_members" : "Services in der Kontaktgruppe",
      "text.browsers_heap_size" : "Anzeige der Auslastung der Heap-size in Ihrem Browser",
      "site.help.doc.users-and-groups" : "Die Benutzer- und Gruppenverwaltung",
      "text.from_now_to_4d" : "Von jetzt + 4 Tage",
      "site.wtrm.action.doUserAgent" : "Set the <b>user agent</b> for the request",
      "schema.hs_downtime.attr.timeslice" : "Zeitraum",
      "err-810" : "Sorry, aber Sie können nicht mehr als %s Dashlets zu einem Dashboard hinzufügen!",
      "site.wtrm.placeholder.hidden" : "Hide this value?",
      "schema.service.text.multiple" : "Service Aktionen",
      "site.wtrm.command.doAuth" : "Use auth basic with username <b>%s</b> and password <b>%s</b>",
      "schema.host.text.list_templates" : "Host %s hat folgende Templates konfiguriert",
      "schema.host.text.multiple_downtimes" : "Eine geplante Wartungsarbeit für mehrere Hosts einrichten",
      "schema.host.desc.sysinfo" : "Hier können Sie einen externen Link zu Ihrer Host-Dokumentation eintragen, zum Beispiel: https://mysite.test/?id=12345.<br/><br/>Nicht erlaubte Zeichen: \"\\",
      "schema.service.attr.passive_check" : "Ist dies ein passiver Check?",
      "schema.chart.text.multiple_view" : "Chart Ansicht",
      "schema.plugin.attr.info" : "Information",
      "schema.plugin_stats.attr.datatype" : "Datentyp",
      "schema.timeperiod.text.list" : "Übersicht über alle Zeitpläne",
      "schema.plugin_stats.attr.alias" : "Name",
      "schema.service.text.clone" : "Den Service klonen",
      "nav.sub.companies" : "Unternehmen",
      "schema.user.desc.manage_contacts" : "Darf der Benutzer Kontakte verwalten?",
      "text.report.availability.lt180" : "Zwischen 1 und 3 Stunden",
      "schema.company.attr.address1" : "Adresse 1",
      "text.report.availability.lt60" : "Zwischen 30 und 60 Minuten",
      "nav.sub.events" : "Ereignisse",
      "site.wtrm.action.checkIfElementIsNotSelected" : "Check if a <b>value is <i>NOT</i> selected</b> in a selectbox",
      "schema.service.attr.last_mail_time" : "Letzte Benachrichtigung per E-Mail",
      "schema.service.desc.host_alive_check" : "Ein Host-Alive-Check ist ein Check der feststellt, ob ein Host UP oder DOWN ist. Wenn dieser Service Check einen kritischen Status liefert erhalten Sie eine besondere Nachricht. Wenn andere Services des Hosts ebenfalls in einem kritischen Status sind, während der Host-Alive-Check kritisch ist, dann werden die Benachrichtiungen anderer Services unterdrückt. Es wird empfohlen einen Ping-Check als Host-Alive-Check zu definieren.",
      "schema.host.desc.virt_product" : "z.B. VMware-Server, Virtuozzo",
      "info.new_version" : "<h4>Eine neue Version ist verfügbar</h4>\n<p>Eine neue Version der Bloonix-WebGUI ist verfügbar!</p>\n<p>Bitte laden Sie die Webseite neu!</p>",
      "schema.service.desc.multiple_check_select_concurrency" : "Wähle einen Gleichzeitigkeitsfaktor",
      "text.report.availability.fatal" : "Fatale Fehler",
      "text.sort_by_dots" : "Sortiere nach ...",
      "schema.company.attr.max_timeslices_per_object" : "Maximale Timeslices",
      "word.Services" : "Services",
      "nav.main.help" : "HELP",
      "err-415" : "Nicht authorisierter Zugriff!",
      "schema.host.desc.os_product" : "z.B. RHEL5, Debian Lenny, Windows Server 2003",
      "err-427" : "Services, die von einem Host-Template vererbt wurden, können nicht gelöscht werden!",
      "action.yes_remove" : "<b>Ja, entfernen!</b>",
      "site.wtrm.text.quick_check" : "Quick check!",
      "err-632" : "Der Parameter limit muss ein numerischer Wert sein, mindestens 0, maximal %s.",
      "schema.timeperiod.text.create" : "Einen neuen Zeitplan erstellen",
      "err-400" : "Der Login ist fehlgeschlagen. Bitte versuchen Sie es erneut!",
      "text.dashboard.remove_dashlet" : "Das Dashlet entfernen",
      "schema.company.attr.title" : "Titel",
      "schema.service.desc.multiple_check_concurrency_title" : "Konkurrierende Checks",
      "schema.contact.desc.mail_notification_level" : "Wähle die Status Level für die der Konakt eine Benachrichtigung per E-Mail erhalten soll.",
      "err-847" : "Sorry, aber Sie dürfen nicht mehr als %s Abhängigkeiten pro Host erstellen!",
      "schema.service.text.rotate_location_check_button" : "Rotierende Checks",
      "schema.host.info.sysinfo" : "Externe Informationen sind verfügbar.",
      "schema.event.attr.attempts" : "Versuche",
      "action.resize" : "Größe ändern",
      "text.report.availability.LT60" : "Filterung von Ereignissen mit einer Statusdauer kleiner als 60 Minuten.",
      "schema.service.attr.mail_warnings" : "Benachrichtigungen für Warnmeldungen per E-Mail versenden",
      "text.report.availability.EV-C" : "Anzahl von Ereignissen mit Status CRITICAL. ",
      "err-835" : "Sorry, aber Sie dürfen nicht mehr als %s Kontakte erstellen!",
      "word.seconds" : "Sekunden",
      "schema.company.attr.email" : "E-Mail",
      "text.dashboard.service_chart" : "Service-Chart",
      "action.filter" : "Filtern",
      "schema.host.text.view" : "Host %s",
      "schema.service.desc.is_volatile" : "Mit dieser Option können Sie bestimmen, ob es sich bei diesem Service um einen flüchten Services handelt. Einige Services haben die Besonderheit, dass Sie nur für einen sehr kurzen Zeitraum kritisch sind. Dies können zum Beispiel Logdateien-Checks sein, in denen nach dem Vorhandensein bestimmter Strings gesucht wird, zum Beispiel Strings wie <i>possible break-in attempt</i>. Wenn beim nächsten Logdateien Check dieser String nicht mehr vorhanden ist, würde der Service wieder in den OK Status wechseln und man würde den Einbruch-Versuch nicht bemerken. Ein Service, der dagegen als ein flüchtiger Service konfiguriert ist, bleibt solange in einem nicht-OK Status, bis der Status aufgehoben wurde.",
      "err-630" : "Ungültige Parametereinstellungen gefunden!",
      "text.report.availability.h00" : "00:00 - 00:59",
      "schema.company.desc.max_services_per_host" : "Die maximale Anzahl an sSrvices die pro Host erstellt werden dürfen.",
      "action.configure" : "Konfigurieren",
      "text.report.availability.EV-GE300" : "Anzahl von Ereignissen mit einer Statusdauer größer als 5 Stunden. ",
      "schema.host.attr.virt_manufacturer" : "Virtualisierungshersteller",
      "schema.host.attr.variables" : "Host Variablen",
      "schema.host.desc.hostname" : "Dies ist der vollständig qualifizierte Hostname.",
      "action.select" : "Auswählen",
      "text.dashboard.create_dashboard" : "Ein leeres Dashboard erstellen",
      "schema.contactgroup.text.selected_services" : "Ausgewählte Services",
      "schema.company.text.edit_variables" : "Globale Variablen",
      "schema.service.text.host_template" : "Host template",
      "nav.sub.charts" : "Charts",
      "schema.service.text.no_command_options" : "Dieser Check hat keine Einstellungen.",
      "schema.service.desc.comment" : "Dies ist ein beliebiges Kommentar zum Service.",
      "schema.chart.text.multiselect" : "Chartauswahl für mehrere Hosts",
      "schema.contact.attr.escalation_level" : "Eskalationslevel",
      "site.wtrm.action.doCheck" : "Check a <b>radio button</b> or <b>checkbox</b>",
      "schema.host.text.multiple_selection_help" : "<h4>Diese Aktion erfordert, dass mindestens ein Host ausgewählt ist.</h4>\nUm einen einzelnen Host zu markieren, klicken Sie auf die entsprechende Zeile.\nWenn Sie mehrere Hosts markieren möchten, halten Sie einfach die Taste <i>STRG</i>\nauf Ihrer Tastatur gedrückt. Beim Drücken und Halten der der linken Maustaste und dem\nBewegen des Mauszeigers kann ein größerer Bereich von Hosts gewählt werden.",
      "schema.user.desc.role" : "Welche Rolle hat der Benutzer? Benutzer mit der Rolle <i>operator</i> sind Poweruser und können Benutzeraccounts und Gruppen verwalten. Benutzer mit der Gruppe <i>user</i> haben dazu keine Berechtigung.",
      "text.report.availability.h10" : "10:00 - 10:59",
      "action.action" : "Aktion",
      "schema.group.text.group_members" : "Mitglieder der Gruppe %s",
      "schema.timeperiod.attr.description" : "Beschreibung",
      "schema.chart.attr.refresh" : "Aktualisierungsrate",
      "text.dashboard.list_top_hosts" : "Anzeigen der Top-Hosts",
      "schema.group.attr.description" : "Beschreibung",
      "err-640" : "Keine Daten verfügbar!",
      "action.timeslices" : "Zeitpläne auflisten",
      "schema.service.text.notification_settings" : "Einstellungen zur Benachrichtigung",
      "schema.host_template.attr.id" : "Template ID",
      "schema.contact.text.timeperiod_type_send_only_sms" : "Nur SMS versenden",
      "schema.company.attr.sla" : "SLA",
      "text.report.availability.h18" : "18:00 - 18:59",
      "action.reload" : "Reload",
      "text.report.availability.h06" : "06:00 - 06:59",
      "schema.user_chart.text.click_to_add_metric" : "Klicken, um die Metrik hinzuzufügen",
      "schema.timeperiod.desc.name" : "Dies ist der Name des Zeitplans.",
      "site.login.contact" : "Haben Sie Fragen?",
      "nav.sub.dependencies" : "Abhängigkeiten",
      "text.report.availability.h04" : "04:00 - 04:59",
      "word.minute" : "Minute",
      "site.wtrm.action.checkUrl" : "Check the <b>URL</b> in the address bar",
      "schema.contact.attr.company_id" : "Firmen ID",
      "info.move_with_mouse" : "Drücke und halte den linken Mausbutton während die Box runter oder hoch bewegt wird.",
      "text.report.availability.EV-O" : "Anzahl von Ereignissen mit Status OK.",
      "schema.group.text.add" : "Einen neuen Benutzer der Gruppe hinzufügen",
      "schema.company.attr.variables" : "Globale Variablen",
      "schema.dependency.text.depends_on_host" : "hängt ab von Host",
      "text.dashboard.rename_dashboard" : "Das Dashboard umbenennen",
      "schema.company.attr.sms_enabled" : "SMS Benachrichtigungen eingeschaltet",
      "schema.host.attr.max_sms" : "Maximale SMS pro Monat",
      "schema.service.attr.check_by_location" : "Prüfung von verschiedenen Standorten",
      "schema.company.desc.variables" : "In diesem Feld können globale Variablen für alle Hosts definiert werden. Diese Variablen können für Schwellwerte bei der Konfiguration von Service-Checks verwendet werden. Beispiel:<br/><br/><b>HTTP.PORT=9000</b><br/><br/>Diese Variable kann dann im Format <i>%HTTP.PORT%</i> für Schwellwerte eingesetzt werden. Bitte beachten Sie das zwei Variablen vordefiniert sind: <i>IPADDR</i> und <i>HOSTNAME</i>. Diese Variablen werden mit der IP-Adresse und dem Hostnamen ersetzt. Weitere Informationen hierzu finden Sie in der Hilfe.<br/><br/>Erlaubte Zeichen: a-z, A-Z, 0-9, Punkt und Unterstrich",
      "schema.service.desc.fd_flap_count" : "Dies ist die maximale Anzahl von Statuswelchseln, die in einem bestimmten Zeitraum auftreten dürfen.",
      "nav.sub.users" : "Benutzer",
      "site.wtrm.placeholder.username" : "Username",
      "text.report.title.status_duration_by_hour" : "Statusdauer nach Zeitbereich",
      "nav.sub.group_settings" : "Gruppeneinstellungen",
      "schema.host.desc.allow_from" : "Es ist möglich eine Komma-separierte Liste von IP-Adressen anzugeben, von denen statistische Daten für den Host geliefert werden dürfen. Das Schlüsselwort <i>all</i> heißt von überall.",
      "schema.dependency.attr.inherit" : "Vererbung",
      "site.wtrm.command.checkIfElementHasNotValue" : "Check if the input field or textarea with element <b>%s</b> does <i>NOT</i> contain <b>%s</b>",
      "schema.host.text.settings" : "Einstellungen des Hosts",
      "schema.service.attr.volatile_retain" : "Vorhaltezeit des flüchtigen Status (volatile)",
      "schema.service.attr.plugin" : "Plugin",
      "action.logout" : "Ausloggen",
      "schema.service.action.clear_volatile_multiple" : "Den flüchtigen Status aufheben",
      "text.dashboard.save_dashboard" : "Dashboard speichern",
      "text.click_to_delete_seletion" : "Klicken um die Auswahl zu löschen",
      "info.add-further-options" : "Weiter Optionen hinzufügen",
      "schema.service.text.multiple_volatile" : "Den flüchtigen Status mehrerer Services aufheben",
      "schema.host.attr.id" : "Host ID",
      "schema.service.attr.agent_id" : "Standort des Agenten",
      "schema.user_chart.text.user_chart" : "User charts",
      "schema.service.desc.default_check_type_title" : "Standard Messpunkt",
      "schema.chart.attr.subtitle" : "Chart Untertitel",
      "nav.sub.contactgroup_settings" : "Kontaktgruppen Einstellungen",
      "schema.service.text.delete" : "Den Service löschen",
      "schema.service.desc.service_name" : "Dies ist der Anzeigename des Service.",
      "text.dashboard.choose_content_box" : "Wähle ein Dashlet aus",
      "schema.company.text.view" : "Unternehmen %s",
      "schema.service.desc.mail_soft_interval" : "Dies ist der Benachrichtigungsintervall für Services. Solange der Service nicht OK ist, erhalten Sie in diesem Intervall erneut Benachrichtigungen.",
      "word.no" : "nein",
      "schema.host.desc.password" : "Dieses Passwort wird für den Bloonix Agenten benötigt. Wenn der Agent Statistiken für einen Host zum Bloonix Server senden möchte dann ist dies nur möglich wenn der Agent die Host-ID und das Passwort kennt.",
      "schema.event.text.list" : "Ereignisse von Host %s",
      "schema.host.text.delete" : "Den Host löschen",
      "schema.service.text.clone_service" : "Service %s klonen",
      "schema.dependency.text.host" : "Host",
      "action.operate_as" : "Operiere als",
      "schema.group.text.add_user" : "Den Benutzer der Gruppe hinzufügen",
      "schema.service.info.is_volatile" : "Der Service befindet sich in einem flüchtigen Status.",
      "schema.company.attr.phone" : "Telefon",
      "text.dashboard.replace_dashlet" : "Das Dashlet ersetzen",
      "text.report.availability.flapping" : "Flapping",
      "schema.service.attr.fd_time_range" : "Zeitraum zur Erkennung von Statuswechsel",
      "schema.host.desc.add_host_to_host_template" : "Der Host erbt alle Services eines Host-Templates.",
      "schema.host.text.remove_template_warning" : "Bitte beachte das alle Services des Templates von allen Hosts entfernt werden, die ihre Services aus diesem Tempalte vererbt bekommen haben!",
      "schema.host.attr.virt_product" : "Virtualisierungsprodukt",
      "word.Timeslice" : "Zeitscheibe",
      "schema.dependency.text.list" : "Abhängigkeiten für Host %s",
      "schema.service.attr.mail_soft_interval" : "Benachrichtigungsintervall für E-Mails (soft)",
      "text.fixed_checkpoint" : "Fixer Messpunkt",
      "schema.user_chart.attr.subtitle" : "Untertitel",
      "schema.contact.desc.sms_to" : "Dies ist die Mobilfunknummer des Konakts. Benachrichtigung über Ereignisse werden an diese Rufnummer per SMS gesendet.",
      "schema.group.text.host_nonmembers" : "Nicht-Mitglieder der Gruppe",
      "site.wtrm.command.doSubmit" : "Submit form <b>%s</b>",
      "schema.service.text.wtrm_result_steps" : "Web-Transaktion - Step Ergebnis",
      "schema.host.attr.description" : "Beschreibung",
      "word.minutes" : "Minuten",
      "schema.hs_downtime.text.preset" : "Voreinstellung",
      "site.wtrm.command.checkIfElementHasNotHTML" : "Check if the element <b>%s</b> does <i>NOT</i> contain <b>%s</b>",
      "schema.host.desc.location" : "z.B. Hamburg, Rechenzentrum 3, Raum 6, Schrank A29",
      "schema.user_chart.desc.title" : "Der Titel des Chart.",
      "schema.host_template.text.view" : "Template %s",
      "nav.main.administration" : "ADMINISTRATION",
      "schema.host.attr.active" : "Aktiv",
      "site.wtrm.text.service_report" : "Web-Transaktions-Report für Service %s",
      "action.list" : "Auflisten",
      "schema.group.text.selected_hosts" : "Ausgewählte Hosts",
      "schema.dependency.text.depends_on_service" : "hängt ab von Service",
      "schema.group.text.host_members" : "Mitglieder der Gruppe",
      "text.report.title.total_availability" : "Die totale Service-Verfügbarkeit",
      "schema.user_chart.desc.description" : "Beschreibung zum Chart.",
      "word.To" : "Bis",
      "schema.service.info.acknowledged" : "Der Status des Service wurde bestätigt.",
      "schema.service.text.choose_plugin" : "Wähle ein Plugin",
      "nav.sub.contactgroup_members" : "Kontakte in der Kontaktgruppe",
      "schema.chart.attr.chart_size" : "Größe",
      "schema.company.desc.max_dependencies_per_host" : "Die maximale Anzahl an Abhängigkeiten die pro Host erstellt werden dürfen.",
      "schema.user.desc.authentication_key" : "Mit diesem Schlüssel ist es möglich den Nachrichtenbildschirm ohne Passwortauthentifizierung aufzurufen. Ein Aufruf des Nachrichtenbildschirm erfolgt über den Query-String<br/><br/><b>/screen/?username=XXX;authkey=XXX</b>",
      "schema.host.desc.notification" : "Aktiere oder deaktiviere die Benachrichtigungen aller Services.",
      "err-823" : "Sorry, aber Sie dürfen nicht mehr als %s Host-Downtimes for host id %s erstellen!",
      "text.dashboard.add_new_dashlet" : "Ein neues Dashlet hinzufügen",
      "word.Filter" : "Suchfilter",
      "schema.service.attr.attempt_warn2crit" : "Wechsel von WARNING zu CRITICAL",
      "site.wtrm.action.doUrl" : "Go to <b>URL</b>",
      "schema.dependency.text.workflow_from_service" : "und von Service",
      "text.report.availability.h16" : "16:00 - 16:59",
      "schema.chart.text.user_charts" : "User charts",
      "site.login.login" : "Bitte loggen Sie sich mit Ihrem Benutzernamen und Passwort ein:",
      "schema.company.attr.zipcode" : "Postleitzahl",
      "site.wtrm.attr.status" : "HTTP-Status",
      "action.edit" : "Editieren",
      "site.login.request_failed" : "Ihre Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut.",
      "err-834" : "Sorry, aber Sie dürfen nicht mehr als %s Services für Host-ID %s erstellen!",
      "site.wtrm.attr.element" : "Element",
      "site.login.title" : "Login zum Monitoring-System",
      "site.wtrm.action.checkIfElementHasNotText" : "Check if an <b>element does <i>NOT</i></b> contain <b>text</b>",
      "schema.service.text.clone_to_the_same_host" : "Den Service zum selben Host klonen",
      "schema.host.text.add_host_to_contactgroup" : "Den Host einer Kontaktgruppe hinzufügen",
      "schema.service.desc.mail_hard_interval" : "Mit dieser Option können Sie einen harten Benachrichtigungsintervall setzen. Auch wenn der Service zu OK und dann wieder zu CRITICAL wechselt, so erhalten Sie erst nach Ablauf dieses Intervalls erneut eine Benachrichtigung.",
      "site.wtrm.desc.ms" : "This is the time in milliseconds to sleep between actions.",
      "text.dashboard.services_flapping" : "Flapping",
      "schema.service.attr.attempt_counter" : "Prüfzähler",
      "schema.contactgroup.text.create" : "Eine neue Kontaktgruppe erstellen",
      "schema.timeperiod.text.delete" : "Den Zeitplan löschen",
      "text.report.title.no_data" : "Für die folgenden Services stehen keine Daten in diesem Zeitbereich zur Verfügung",
      "schema.company.attr.alt_company_id" : "Reale Firmen ID",
      "text.from_now_to_1h" : "Von jetzt + 1 Stunde",
      "schema.contact.desc.mail_to" : "Dies ist die E-Mail Adresse des Konakts. Benachrichtigung über Ereignisse werden an diese Adresse gesendet.",
      "err-815" : "Sorry, aber Sie dürfen nicht mehr als %s Charts erstellen!",
      "schema.host.attr.device_class" : "Bauklasse",
      "schema.chart.text.service_charts" : "Service charts",
      "schema.company.attr.max_services" : "Maximale Services",
      "schema.timeperiod.examples" : "<p><b>Syntax: TAG-BEREICH ZEIT-BEREICH</b></p></br>\n<pre>\nTAG BEREICH                     BEISPIELE\n------------------------------------------------------------\nWeekday                         Monday\nWeekday - Weekday               Monday - Friday\nMonth                           Januar\nMonth - Month                   Januar - July\nMonth Day                       Januar 1\nMonth Day - Month Day           Januar 1 - July 15\nYear                            2010\nYear - Year                     2010 - 2012\nYYYY-MM-DD                      2010-01-01\nYYYY-MM-DD - YYYY-MM-DD         2010-01-01 - 2012-06-15\n</pre></br>\n<pre>\nZEIT BEREICH                    BEISPIELE\n------------------------------------------------------------\nHH:MM - HH:MM                   09:00 - 17:00\nHH:MM - HH:MM, HH:MM - HH:MM    00:00 - 08:59, 17:01 - 23:59\n</pre></br>\n<p><b>Bespiele:</b></p></br>\n<pre>\nMonday - Friday     09:00 - 17:00\nMonday - Friday     00:00 - 08:59, 17:01 - 23:59\nSaturday - Sunday   00:00 - 23:59\n</pre></br>",
      "schema.host.attr.timeout" : "Timeout",
      "info.this-year" : "Dieses Jahr",
      "schema.dependency.text.no_dependencies" : "Es sind keine Abhängigkeiten konfiguriert!",
      "schema.service.text.view_location_report" : "Standortreport einsehen",
      "text.report.availability.lt300" : "Zwischen 3 und 5 Stunden",
      "text.report.availability.h11" : "11:00 - 11:59",
      "site.wtrm.attr.parent" : "Parent ID",
      "err-832" : "Sorry, aber Sie dürfen nicht mehr als %s Services erstellen!",
      "site.login.forgot_password" : "Haben Sie Ihr Passwort vergessen?",
      "schema.service.text.command_options" : "Check Einstellungen",
      "schema.host.text.list" : "Übersicht über alle Hosts",
      "err-425" : "Ihr Session-Token ist abgelaufen!",
      "text.report.availability.h21" : "21:00 - 21:59",
      "schema.service.text.multiple_location_check_button" : "Mehrfache Checks",
      "schema.plugin.attr.plugin" : "Plugin",
      "schema.service.attr.sms_hard_interval" : "Benachrichtigungsintervall für SMS (hart)",
      "action.replace" : "Ersetzen",
      "text.dashboard.map_title" : "Globale Host Status Karte",
      "schema.chart.text.chart_information" : "Chart Informationen",
      "schema.contactgroup.text.list" : "Übersicht über alle Kontaktgruppen",
      "schema.service.desc.notification" : "Diese Option aktiviert oder deaktiviert Benachrichtigungen für den Service.",
      "schema.event.attr.status" : "Status",
      "schema.contactgroup.text.host_members" : "Hosts, die der Kontaktgruppe angehören",
      "word.day" : "Tage",
      "action.delete" : "Löschen",
      "schema.company.attr.max_downtimes_per_host" : "Maximale Downtimes pro Host",
      "action.create" : "Erstellen",
      "schema.host_template.desc.name" : "Dies ist der Name des Templates.",
      "site.wtrm.placeholder.element" : "#element-id OR .class-name OR name",
      "schema.chart.text.view" : "Charts für Host %s",
      "schema.chart.text.multiview" : "Anzeige mehrerer Charts",
      "text.dashboard.list_top_services" : "Anzeige der Top-Services",
      "schema.company.desc.max_templates" : "Die maximale Anzahl an Templates die erstellt werden dürfen.",
      "schema.group.text.settings" : "Einstellungen der Gruppe",
      "schema.host.attr.hostname" : "Hostname",
      "schema.host.attr.sysgroup" : "Systemgruppe",
      "err-821" : "Sorry, aber Sie dürfen nicht mehr als %s Host-Downtimes erstellen!",
      "schema.chart.attr.title" : "Chart Titel",
      "text.dashboard.default_dashboard_cannot_deleted" : "Das Standard-Dashboard kann nicht gelöscht werden!",
      "word.No" : "Nein",
      "site.wtrm.command.checkIfElementHasHTML" : "Check if the element <b>%s</b> contains <b>%s</b>",
      "schema.hs_downtime.text.create" : "Erstelle eine geplante Wartungsarbeit",
      "schema.company.attr.surname" : "Vorname",
      "schema.chart.text.load_view" : "Ansicht laden",
      "word.Relative" : "Relativ",
      "site.wtrm.action.doFill" : "Fill data into a <b>input</b> field or <b>textarea</b>",
      "schema.host.desc.max_sms" : "In diesem Feld kann die maximale Anzahl von SMS pro Monat für diesen Host gesetzt werden.",
      "text.dashboard.services_acknowledged" : "Bestätigt",
      "schema.company.attr.max_sms" : "Maximale SMS pro Monat",
      "site.wtrm.placeholder.html" : "<span>Loren ipsum...</span>",
      "site.wtrm.placeholder.password" : "Secret",
      "schema.service.desc.sms_soft_interval" : "Dies ist der Benachrichtigungsintervall für Services. Solange der Service nicht OK ist, erhalten Sie in diesem Intervall erneut Benachrichtigungen.",
      "schema.service.desc.description" : "Dies ist eine kurze Beschreibung zum Service.",
      "schema.contact.text.escalation_level_event.x" : "aktiv nach %s Benachrichtiungen",
      "schema.host.attr.hw_manufacturer" : "HW Hersteller",
      "schema.user.desc.phone" : "Die Rufnummer kann sehr hilfreich für Kollegen oder dem Bloonix-Support in dringenden Notfällen sein.",
      "schema.contactgroup.text.settings" : "Einstellungen der Kontaktgruppe",
      "schema.host.action.add_template" : "Template hinzufügen",
      "text.max_length" : "Maximallänge: %s",
      "schema.hs_downtime.text.delete" : "Lösche eine geplante Wartungsarbeit",
      "nav.main.report" : "REPORT",
      "schema.service.attr.timeout" : "Timeout",
      "text.report.availability.h23" : "23:00 - 23:59",
      "site.help.title" : "Die Bloonix Hilfe",
      "schema.company.attr.max_hosts" : "Maximale Hosts",
      "text.dashboard.dashlet_select_chart_title" : "Wähle einen Chart für das Dashlet",
      "schema.chart.text.really_delete_view" : "Möchten Sie wirklich die Chart Ansicht <b>%s</b> löschen?",
      "schema.dependency.attr.id" : "Dependency ID",
      "site.wtrm.command.doWaitForElementWithText" : "Wait for element <b>%s</b> with text <b>%s</b>",
      "schema.user.attr.manage_contacts" : "Verwaltung von Kontakten?",
      "site.wtrm.desc.text" : "The inner text of an element you wish to check.",
      "word.Yes" : "Ja",
      "schema.service.attr.ref_id" : "ID",
      "schema.dependency.attr.status" : "Status",
      "schema.host.text.mtr_output" : "MTR Ergebis von Host %s",
      "site.wtrm.desc.url" : "This is the full URL to request. As example: http://www.bloonix.de/",
      "schema.host.desc.comment" : "Dieses Feld kann für Kommentare verwendet werden.",
      "schema.dependency.text.workflow_to_service" : "und zu Service",
      "schema.service.attr.volatile_since" : "Seit wann ist der Status flüchtig (volatile)",
      "schema.host.text.add_host_to_group" : "Den Host einer Gruppe hinzufügen",
      "schema.host.desc.active" : "Aktiviere oder deaktiviere den Host und alle Services.",
      "schema.chart.text.alignment" : "Chartausrichtung",
      "schema.plugin.attr.categories" : "Kategorien",
      "err-704" : "Die Passwörter stimmen nicht überein!",
      "word.Absolute" : "Absolut",
      "schema.service.desc.agent_id_tooltip" : "<h4>Von welchem Standort aus soll der Check ausgeführt werden?</h4>\n<p>\nEs gibt die Optionen <i>localhost</i>, <i>intranet</i> und <i>remote</i>.\n</p>\n<h3>localhost</h3>\n<p>\nMit der Option <i>localhost</i> wird der Check lokal auf Ihrem Server ausgeführt.\nHierzu ist es notwendig, dass der Bloonxi-Agent auf Ihrem Server installiert ist.\nDiese Option ist besonders sinnvoll, wenn Sie die Systemvitals, wie zum Beispiel die\nCPU, den Hauptspeicher oder auch die Festplatten überwachen möchten.\n</p>\n<h3>intranet</h3>\n<p>\nMit der Option <i>intranet</i> ist ihr lokales Netzwerk gemeint. Hierfür ist es notwendig,\ndass Sie den Bloonix-Agenten in Ihrem lokalen Netzwerk auf einem zentralen Server installieren.\nVon diesem Server aus werden die Checks ausgeführt. Diese Option ist sinnvoll, wenn Ihre Server\nServices bereitstellen, welche nicht über eine Internetanbindung erreichbar sind, aber dennoch\nvon einem anderen Server aus überprüft werden sollen. Das können zum Beispiel Router, Switches\netc. sein.\n</p>\n<h3>remote</h3>\n<p>\nMit der Option <i>remote</i> wird der Check von einem externen Bloonix-Server ausgeführt. Dies ist besonders für\nServices sinnvoll, die Dienste für Andere bereitstellen. Zum Beispiel können Sie über einen externen Check die\nFunktionalität Ihres Webservers bzw. Ihrer Webseiten überprüfen.\n</p>",
      "err-411" : "Der Dienst ist nicht verfügbar!",
      "site.login.choose_your_language" : "Wählen Sie Ihre Sprache",
      "schema.company.attr.max_users" : "Maximale Benutzer",
      "text.from_now_to_7d" : "Von jetzt + 7 Tage",
      "schema.host_template.text.delete_service_warning" : "Bitte beachte dass dieser Service von allen Hosts gelöscht wird, die diesen Service über das Template vererbt bekommen!",
      "site.wtrm.action.checkIfElementIsChecked" : "Check if a <b>radio button</b> or <b>checkbox</b> is <b>checked</b>",
      "schema.sms_send.attr.time" : "Zeitstempel",
      "nav.sub.services" : "Services",
      "schema.service.desc.failover_check_type_locations" : "Bitte wählen Sie einen festen und zwei Failover Messpunkte aus",
      "schema.dependency.text.dependencies" : "Abhängigkeiten",
      "schema.service.attr.scheduled" : "Hat eine Downtime",
      "schema.service.desc.timeout" : "Das ist der Timeout des Service. Wenn in dieser Zeit der Status des Service nicht aktualisiert wurde, dann wird ein kritischer Status gesetzt mit der Information, dass der Bloonix-Agent wohlmöglich ausgefallen ist. Wenn kein Wert gesetzt ist, dann wird der Timeout des Hosts vererbt.",
      "schema.contactgroup.text.selected_hosts" : "Ausgewählte Hosts",
      "err-633" : "Der Parameter sort_by muss mit einem Zeichen von a-z beginnen und nur Zeichen von a-z, 0-9 und ein Unterstrich sind erlaubt. Die maximale Länge beträgt 63 Zeichen.",
      "err-825" : "Sorry, aber Sie dürfen nicht mehr als %s Host-Templates erstellen!",
      "site.wtrm.command.doWaitForElement" : "Wait for element <b>%s</b>",
      "schema.user.attr.role" : "Rolle",
      "site.login.documentation" : "Die Bloonix Dokumentation",
      "schema.chart.text.select" : "Chartauswahl für Host %s",
      "text.max_value" : "Höchstwert: %s",
      "schema.service.desc.volatile_retain" : "Mit dieser Option kann konfiguriert werden, ob der flüchtige Status eines Services nach einer bestimmten Zeit automatisch aufgehoben wird.",
      "schema.service.attr.last_sms_time" : "Letzte Benachrichtigung per SMSRNUNGEN per E-Mail versenden",
      "schema.dependency.attr.timeslice" : "Zeitabschnitt",
      "schema.timeperiod.text.examples" : "Beispiel für Zeitpläne",
      "schema.host.desc.add_host_to_contactgroup" : "Füge den Host einer Kontaktgruppe hinzu",
      "err-817" : "Sorry, aber Sie dürfen nicht mehr als %s Chart-Views erstellen!",
      "info.go-back" : "Zurück",
      "err-405" : "Ihre Session ist abgelaufen!",
      "schema.service.attr.last_event" : "Letzes Ereignis",
      "err-418" : "Sie haben nicht genügend Rechte um das Objekt zu modifizieren!",
      "schema.hs_downtime.text.select_services" : "Services<br/><small>Bitte wählen Sie keine Services aus, wenn<br/>Sie eine Downtime für den gesamten Host<br/>einrichten möchten.</small>",
      "site.wtrm.desc.username" : "This username for the auth basic authentification.",
      "text.report.availability.h14" : "14:00 - 14:59",
      "schema.contact.attr.mail_notification_level" : "Benachrichtigungslevel für E-Mails",
      "text.report.availability.ge300" : "Länger als 3 Stunden",
      "schema.service.text.multiple_notification" : "Die Benachrichtigungen für mehrere Services ein- oder ausschalten",
      "nav.sub.screen" : "Bildschirm",
      "action.view_selected_objects" : "Ausgewählte Objekte einsehen",
      "site.wtrm.command.doSelect" : "Select the value <b>%s</b> from the selectbox <b>%s</b>",
      "schema.dependency.text.workflow_to_service_status" : "Wähle den Status des übergeordneten Services, welcher die Benachrichtigung untertrückt",
      "schema.service.info.has_result" : "Dieser Service-Check hat erweiterte Statusinformationen. Klick mich :-)",
      "schema.service.info.flapping" : "Der Service wechselt zu häufig den Status.",
      "text.dashboard.services_downtimes" : "Geplante Wartungsarbeiten",
      "schema.user.text.new_password" : "Neues Passwort",
      "action.close" : "Schließen",
      "schema.roster.attr.roster" : "Bereitschaftsplan",
      "schema.user_chart.desc.yaxis_label" : "Das Label der Y-Achse.",
      "schema.host.action.deactivate_multiple" : "Selektierte Hosts deaktivieren",
      "text.report.availability.Service" : "Klicke auf den Service für einen detaillierten Bericht",
      "schema.contact.attr.id" : "Kontakt ID",
      "schema.company.desc.max_timeslices_per_object" : "Die maximale Anzahl an Timeslices die pro Timeperiod erstellt werden dürfen.",
      "nav.sub.hosts" : "Hosts",
      "nav.main.notifications" : "BENACHRICHTIGUNGEN",
      "site.help.doc.json-api" : "Die Bloonix JSON API",
      "schema.contact.attr.mail_to" : "E-Mail",
      "schema.chart.attr.preset_last" : "Vorauswahl: letzte",
      "schema.host_template.text.create" : "Ein neues Template erstellen",
      "site.help.doc.scheduled-downtimes" : "Geplante Wartungsarbeiten einrichten",
      "action.display_from_to_rows" : "Anzeige %s-%s von %s Treffern",
      "site.wtrm.placeholder.ms" : "5000",
      "schema.contactgroup.attr.description" : "Beschreibung",
      "word.inactive" : "inaktiv",
      "schema.company.attr.max_dashboards_per_user" : "Maximale Dashboards pro Benutzer",
      "site.login.welcome" : "Willkommen bei Bloonix!",
      "schema.user.text.select_language" : "Wähle deine bevorzugte Sprache aus",
      "schema.host.info.inactive" : "Der Host ist deaktiviert.",
      "schema.service.action.multiple_force_next_check" : "Erzwinge den nächsten Check des Service",
      "schema.service.info.inactive" : "Der Service ist inaktiv.",
      "site.wtrm.attr.userAgent" : "User-Agent",
      "site.wtrm.command.doFill" : "Fill element <b>%s</b> with value <b>%s</b>",
      "schema.user_chart.desc.subtitle" : "Der Untertitle des Chart.",
      "schema.service.attr.sms_soft_interval" : "Benachrichtigungsintervall für SMS (soft)",
      "schema.host.desc.coordinates" : "Der Standort des Hosts nach Länderkürzel.",
      "site.wtrm.action.checkIfElementIsSelected" : "Check if a <b>value</b> is <b>selected</b> in a selectbox",
      "info.search_syntax" : "<p><b>Syntax der Suche:</b></p>\n<p>planet <i>AND</i> mars</p>\n<p>mars <i>OR</i> pluto</p>\n<p>planet <i>AND</i> mars <i>OR</i> pluto</p>",
      "err-827" : "Sorry, aber Sie dürfen nicht mehr als %s Services für Template-ID %s erstellen!",
      "schema.user.attr.authentication_key" : "Authentication Key",
      "text.report.availability.AV-W" : "Der Zeitbereich in Prozent in dem der Service im Status WARNING war.",
      "schema.hs_downtime.attr.username" : "Erstellt von",
      "schema.service.action.deactivate_multiple" : "Selektierte Services deaktivieren",
      "site.wtrm.attr.url" : "URL",
      "site.help.doc.how-does-bloonix-checks-your-hosts-and-services" : "Wie überwacht Bloonix Hosts und Services",
      "schema.service.action.enable_notifications_multiple" : "Benachrichtigungen einschalten für die selektierten Services",
      "schema.user_chart.text.editor" : "Benutzer Chart Editor",
      "schema.host.text.templates_not_assigned" : "Nicht zugeordnete Templates",
      "word.yes" : "ja",
      "text.report.availability.timeout" : "Timeout",
      "word.From" : "Von",
      "text.from_now_to_2h" : "Von jetzt + 2 Stunden",
      "schema.chart.desc.charts" : "<b>Mehrere Charts können ausgewählt werden mittels</b><br/><br/>\n<i>STRG + Klick</i><br/>oder<br/><i>linke Maustaste drücken + halten + Mauszeiger bewegen</i>",
      "nav.main.dashboard" : "DASHBOARD",
      "schema.contact.desc.company_id" : "Wähle ein Unternehmen zu dem der Kontakt gehört",
      "schema.host.action.disable_notifications_multiple" : "Benachrichtigungen ausschalten für die selektierten Hosts",
      "text.dashboard.user_chart" : "Selbst erstellter Chart",
      "schema.company.attr.max_templates" : "Maximale Templates",
      "schema.user.attr.phone" : "Telefon",
      "schema.contactgroup.attr.id" : "Kontaktgruppen ID",
      "site.login.request_password" : "Fordern Sie ein neues Passwort an.",
      "schema.service.attr.sms_warnings" : "Benachrichtigungen für Warnmeldungen per SMS versenden",
      "schema.group.text.create" : "Eine neue Gruppe erstellen",
      "schema.contact.text.delete" : "Kontakt löschen",
      "schema.service.attr.last_sms" : "Letzte Benachrichtigung per SMS",
      "schema.host.attr.hw_product" : "HW Produkt",
      "schema.timeslice.attr.timeslice" : "Zeitabschnitt",
      "schema.dependency.text.workflow_to_host_status" : "Wähle den Status des übergeordneten Hosts, welcher die Benachrichtigung untertrückt",
      "schema.plugin_stats.attr.statkey" : "Schlüssel",
      "text.report.availability.h03" : "03:00 - 03:59",
      "site.wtrm.command.checkIfElementHasNotText" : "Check if the element <b>%s</b> does <i>NOT</i> contain <b>%s</b>",
      "schema.host_template.attr.name" : "Template Name",
      "schema.contact.text.escalation_level_event.0" : "Permanent aktiv",
      "site.wtrm.attr.contentType" : "Content-Type",
      "schema.host_downtime.text.title" : "Geplante Wartungsarbeiten für Host %s",
      "schema.sms_send.attr.message" : "Nachricht",
      "schema.company.attr.city" : "Stadt",
      "schema.dependency.text.workflow_timeslice" : "Gebe einen Zeitabschnitt an, in dem die Abhängigkeit aktiv ist",
      "schema.dependency.attr.on_service_id" : "Depends on service ID",
      "schema.dependency.text.really_delete" : "Möchten Sie wirklich die Abhängigkeit mit der ID <b>%s</b> löschen?",
      "schema.host.attr.sysinfo" : "System Informationen",
      "schema.user.text.password_update" : "Bitte gebe ein neues Passwort ein.",
      "site.wtrm.action.doUncheck" : "Uncheck a <b>radio button</b> or <b>checkbox</b>",
      "schema.timeslice.text.list" : "Übersicht über alle Zeitabschnitte",
      "schema.user_chart.text.chart_metrics" : "Chart Metriken",
      "site.wtrm.placeholder.contentType" : "text/html",
      "site.wtrm.command.checkUrl" : "Check if the URL in the address bar is <b>%s</b>",
      "schema.host.info.notification_disabled" : "Benachrichtigungen sind für diesen Host ausgeschaltet",
      "site.wtrm.command.checkIfElementIsNotSelected" : "Check if the value <b>%s</b> of the selectbox <b>%s</b> is <i>NOT</i> selected",
      "nav.sub.notifications" : "Benachrichtigungen",
      "schema.service.attr.attempt_max" : "Benachrichtigung nach X versuchen",
      "site.wtrm.attr.ms" : "Milliseconds",
      "err-500" : "Ein interner Fehler ist aufgetreten! Bitten kontaktieren Sie den Administrator!",
      "schema.contactgroup.text.host_nonmembers" : "Hosts, die der Kontaktgruppe nicht angehören",
      "site.wtrm.attr.value" : "Value",
      "schema.host.desc.interval" : "Das ist der Prüfungsintervall aller Services des Hosts.",
      "schema.service.desc.sms_ok" : "Diese Option aktiviert oder deaktiviert das Versenden von Nachrichten per SMS für Services die in den Status OK zurückwechseln.",
      "err-705" : "Das neue und alte Passwort dürfen nicht übereinstimmen!",
      "text.dashboard.reconfigure_dashlet" : "Dashlet konfigurieren",
      "schema.company.attr.active" : "Aktiv",
      "site.wtrm.action.checkIfElementHasText" : "Check if an <b>element</b> contains <b>text</b>",
      "schema.hs_downtime.attr.timezone" : "Zeitzone",
      "schema.company.desc.max_charts_per_user" : "Die maximale Anzahl an Benutzer-Charts die pro Benutzer erstellt werden dürfen.",
      "text.from_now_to_8h" : "Von jetzt + 8 Stunden",
      "schema.service.attr.mail_hard_interval" : "Benachrichtigungsintervall für E-Mails (hart)",
      "nav.sub.contactgroups" : "Kontaktgruppen",
      "action.refresh" : "Aktualisieren",
      "info.no_chart_data" : "Es sind keine Chartdaten verfügbar.",
      "schema.chart.text.chart_type" : "Wähle den Charttyp",
      "text.report.availability.EV-U" : "Anzahl von Ereignissen mit Status UNKNOWN. ",
      "bool.yesno.1" : "Ja",
      "schema.service.desc.default_check_type" : "Standard-Checks haben einen vordefinierten Messpunkt. Von diesem Messpunkt aus wird Ihr Service geprüft. Der Messpunkt für Standardchecks ist:",
      "schema.host.attr.interval" : "Intervall",
      "schema.service.text.multiple_downtimes" : "Eine geplante Wartungsarbeit für mehrere Services einrichten",
      "text.services" : "Services",
      "schema.service.desc.interval" : "Das ist der Prüfungsintervall des Service. Wenn kein Wert gesetzt ist, dann wird der Intervall des Hosts vererbt.",
      "action.view" : "Einsehen",
      "text.option_examples" : "Optionen und Beispiele",
      "schema.contact.text.create" : "Erstelle einen neuen Kontakt",
      "text.last_90d" : "Die letzten 90 Tage",
      "schema.user.desc.password_changed" : "Setzen Sie den Wert auf <i>Nein</i> wenn Sie den Benutzer auffordern möchten sein Passwort nach dem ersten Login zu ändern.",
      "schema.host.desc.add_host_to_group" : "Füge den Host einer Gruppe hinzu.",
      "schema.plugin.text.list" : "Plugins",
      "err-420" : "Die Aktion ist fehlgeschlagen!",
      "text.unlimited" : "Unbegrenzt",
      "site.wtrm.action.doClick" : "<b>Click</b> on a element",
      "text.chart_info" : "Chart Informationen",
      "schema.group.text.may_modify_services" : "Darf Services ändern",
      "schema.host.attr.data_retention" : "Daten Aufbewahrungszeit",
      "schema.service.action.disable_notifications_multiple" : "Benachrichtigungen ausschalten für die selektierten Services",
      "action.redirect" : "Umleiten",
      "schema.sms_send.attr.send_to" : "Empfänger",
      "text.dashboard.name" : "Name des Dashboards",
      "schema.timeperiod.desc.description" : "Dies ist eine kurze Beschreibung zum Zeitplan.",
      "text.report.availability.AV-C" : "Der Zeitbereich in Prozent in dem der Service im Status CRITICAL war.",
      "err-416" : "Sie haben nicht genügend Rechte für diese Operation!",
      "schema.chart.attr.charts" : "Charts",
      "schema.company.attr.country" : "Land",
      "schema.host.desc.os_manufacturer" : "z.B. Red Hat, Microsoft, CISCO",
      "site.wtrm.command.doSleep" : "Sleep <b>%s</b>ms",
      "site.wtrm.action.doSelect" : "<b>Select</b> a value from a selectbox",
      "action.abort" : "Abbrechen",
      "text.report.availability.h08" : "08:00 - 08:59",
      "action.move_box" : "Bewege die Box",
      "schema.company.attr.fax" : "Fax",
      "schema.service.desc.fd_time_range" : "Dies ist der Zeitbereich, in dem die Statuswechsel gemessen werden.",
      "action.login" : "Einloggen",
      "schema.user.text.is_logged_in" : "Ist eingeloggt",
      "schema.company.attr.max_contacts" : "Maximale Kontakte",
      "site.wtrm.desc.status" : "Enter the expected http status for the URL.",
      "schema.contact.text.timeperiod_type" : "Inkludieren / Exkludieren",
      "text.report.availability.h15" : "15:00 - 15:59",
      "nav.sub.contactgroup_host_members" : "Hosts in der Kontaktgruppe",
      "site.wtrm.placeholder.userAgent" : "User-Agent",
      "text.from_now_to_1d" : "Von jetzt + 1 Tag",
      "text.report.availability.AV-U" : "Der Zeitbereich in Prozent in dem der Service im Status UNKNOWN war.",
      "schema.host.attr.max_services" : "Maximal konfigurierbare Services",
      "schema.user.attr.password" : "Passwort",
      "text.report.availability.h07" : "07:00 - 07:59",
      "schema.host.attr.allow_from" : "Erlaubter Zugriff",
      "schema.host.desc.variables" : "In diesem Feld können Host Variablen definiert werden. Diese Variablen können für Schwellwerten bei der Konfiguration von Service-Checks verwendet werden. Beispiel:<br/><br/><b>HTTP.PORT=9000</b><br/><br/>Diese Variable kann dann im Format <i>%HTTP.PORT%</i> für Schwellwerte eingesetzt werden. Bitte beachten Sie das zwei Variablen vordefiniert sind: <i>IPADDR</i> und <i>HOSTNAME</i>. Diese Variablen werden mit der IP-Adresse und dem Hostnamen ersetzt. Weitere Informationen hierzu finden Sie in der Hilfe.<br/><br/>Erlaubte Zeichen: a-z, A-Z, 0-9, Punkt und Unterstrich",
      "schema.contact.attr.mail_notifications_enabled" : "E-Mail global aktiv",
      "schema.host_template.text.clone" : "Das Template klonen",
      "site.wtrm.placeholder.text" : "Lorem ipsum...",
      "schema.user.attr.last_login" : "Letzter Login",
      "info.create_failed" : "Das Erstellen ist fehlgeschlagen!",
      "schema.host.attr.ipaddr" : "IP-Adresse",
      "schema.service.attr.host_alive_check" : "Ist dies ein Host-Alive-Check?",
      "schema.contact.attr.sms_notifications_enabled" : "SMS global aktiv",
      "text.report.availability.EV-LT15" : "Anzahl von Ereignissen mit einer Statusdauer kleiner als 15 Minuten.",
      "action.add" : "Hinzufügen",
      "action.show_selected_objects" : "Ausgewählte Objekte anzeigen",
      "text.dashboard.dashlet_configuration" : "Dashlet Konfiguration",
      "schema.host.action.activate_multiple" : "Selektierte Hosts aktivieren",
      "text.report.availability.GE300" : "Filterung von Ereignissen mit einer Statusdauer größer als 5 Stunden.",
      "text.report.title.number_of_events_by_duration" : "Anzahl der Ereignisse nach Dauer",
      "schema.company.attr.max_timeperiods" : "Maximale Timeperiods",
      "schema.service.action.clear_acknowledgement_multiple" : "Die Bestätigung des Status der selektierten Services aufheben",
      "schema.service.attr.active" : "Aktiv",
      "schema.group.desc.description" : "Gebe eine kleine Beschreibung zum Unternehmen ein.",
      "schema.host.attr.notification" : "Benachrichtigungen aktiv",
      "schema.service.attr.mail_ok" : "Benachrichtigungen für OK Meldungen per E-Mail versenden",
      "schema.service.text.multiple_force_next_check" : "Erzwinge einen Check aller Services so bald wie möglich",
      "site.wtrm.desc.userAgent" : "This is the User-Agent to send for all requests.",
      "schema.chart.attr.from_to" : "Von %s bis %s",
      "schema.plugin.attr.command" : "Kommando",
      "text.report.availability.LT300" : "Filterung von Ereignissen mit einer Statusdauer kleiner als 5 Stunden.",
      "word.second" : "Sekunde",
      "schema.hs_downtime.attr.description" : "Beschreibung",
      "schema.service.text.host_alive_check" : "Host-Alive-Check",
      "text.filter_by_category_dots" : "Filter nach Kategorie ...",
      "schema.service.desc.multiple_check_type_title" : "Multiple Messpunkte",
      "site.wtrm.desc.parent" : "It's possible to set a parent ID. The ID, class or name is searched within the element of the parent ID.",
      "text.report.availability.h01" : "01:00 - 01:59",
      "nav.sub.timeperiods" : "Zeitplan",
      "nav.sub.groups" : "Gruppen",
      "site.wtrm.action.checkIfElementNotExists" : "Check if an <b>element does <i>NOT</i> exists</b>",
      "text.report.availability.AV-O" : "Der Zeitbereich in Prozent in dem der Service im Status OK war.",
      "err-610" : "Bitte füllen Sie die rot markierten Felder korrekt aus!",
      "text.report.availability.h05" : "05:00 - 05:59",
      "text.report.title.number_of_events" : "Die totale Anzahl von Ereignissen",
      "action.generate" : "Generieren",
      "schema.sms_send.text.search" : "Suche nach SMS",
      "site.wtrm.placeholder.parent" : "#parent-id (optional)",
      "schema.service.attr.default_location" : "Standard Standort",
      "schema.company.desc.active" : "Aktivierung oder Deaktivierung aller Objekte dieser Firma.",
      "schema.host_template.test.host_members" : "Hosts in der Gruppe",
      "schema.company.desc.max_groups" : "Die maximale Anzahl an Gruppen die erstellt werden dürfen.",
      "site.wtrm.action.checkIfElementHasHTML" : "Check if an <b>element</b> contains <b>HTML</b>",
      "schema.service.desc.multiple_check_concurrency" : "Um eine Überladung des Service zu vermeiden, können\nSie die maximale Anzahl konkurrierenden Checks bestimmen.",
      "schema.company.text.settings" : "Einstellungen des Unternehmens",
      "info.update_failed" : "Das Update ist fehlgeschlagen!",
      "site.wtrm.command.doCheck" : "Check the radio button or checkbox of element <b>%s</b> with value <b>%s</b>",
      "schema.dependency.text.workflow_inherit" : "Vererbung aktivieren",
      "schema.dependency.attr.timezone" : "Zeitzone",
      "schema.contact.text.remove_timeperiod" : "Den Zeitplan vom Konakt entfernen",
      "schema.host_template.text.selected_hosts" : "Selektierte Hosts",
      "action.clone" : "Klonen",
      "schema.user.desc.username" : "Angabe des Benutzernamens im Format <i>user@domain.test</i>.",
      "site.wtrm.command.checkIfElementIsSelected" : "Check if the value <b>%s</b> of the selectbox <b>%s</b> is selected",
      "schema.chart.text.back_to_selection" : "Zurück zur Chartauswahl",
      "schema.company.desc.max_users" : "Die maximale Anzahl an Benutzer die erstellt werden dürfen.",
      "schema.company.attr.id" : "Firmen ID",
      "schema.company.desc.max_timeperiods" : "Die maximale Anzahl an Timeperiods die erstellt werden dürfen.",
      "text.report.service_has_a_availabilty_of" : "Service %s hat eine Verfügbarkeit von",
      "schema.service.attr.acknowledged" : "Bestätigt",
      "schema.contact.text.timeperiod_type_send_to_all" : "E-Mails und SMS versenden",
      "word.hour" : "Stunde",
      "schema.host.attr.coordinates" : "Koordinaten",
      "site.help.doc.user-charts" : "Eigene Charts erstellen",
      "site.wtrm.placeholder.url" : "http://www.bloonix.de/",
      "text.second_failover_checkpoint" : "Zweiter Ausfallmesspunkt",
      "text.dashboard.services_availability" : "Verfügbarkeit aller Services",
      "schema.company.attr.max_dashlets_per_dashboard" : "Maximale Dashlets pro Dashboard",
      "schema.host.desc.description" : "Das ist eine kurze Beschreibung zum Host.",
      "schema.service.text.multiple_activate" : "Mehrere Services aktivieren oder deaktivieren",
      "text.report.availability.Availability" : "Die totale Verfügbarkeit",
      "site.login.password" : "Passwort",
      "schema.host.desc.hw_product" : "z.B. Dell Power Edge 2950",
      "nav.sub.variables" : "Variablen",
      "text.dashboard.really_delete_dashboard" : "Möchten Sie wirklich das Dashboard %s löschen?",
      "schema.contact.attr.sms_to" : "Mobilfunknummer",
      "schema.host.desc.data_retention" : "Die Aufbewahrungszeit in Tagen aller Daten des Host und der Services.",
      "err-410" : "Die angeforderte Seite wurde nicht gefunden!",
      "err-631" : "Der Parameter offset muss ein numerischer Wert sein, mindestens 0.",
      "schema.host.text.add_host_to_host_template" : "Den Host Host-Templates zuordnen.",
      "site.wtrm.desc.password" : "This password for the auth basic authentification.",
      "err-426" : "Diese Aktion erfordert ein Session-Token!",
      "action.search" : "Suchen",
      "text.range_value" : "Wertebereich: %s - %s",
      "schema.group.text.update_user" : "Die Rechte ändern",
      "site.wtrm.action.checkIfElementIsNotChecked" : "Check if a <b>radio button</b> or <b>checkbox is <i>NOT</i> checked</b>",
      "site.wtrm.text.check_it" : "Check it!",
      "schema.user.text.create" : "Einen neuen Benutzer erstellen",
      "schema.service.attr.send_sms" : "Benachrichtigungen für SMS eingeschaltet",
      "site.wtrm.command.checkIfElementHasText" : "Check if the element <b>%s</b> contains <b>%s</b>",
      "schema.chart.text.chart_id" : "Chart-ID: %s",
      "schema.chart.text.save_view" : "Ansicht speichern",
      "text.min_value" : "Mindestwert: %s",
      "text.report.availability.h20" : "20:00 - 20:59",
      "schema.service.desc.attempt_warn2crit" : "Diese Option ist hilfreich, wenn Sie möchten, dass der Status von WARNING zu CRITICAL aufgewertet wird, nach dem der Services die maximale Anzahl von fehlgeschlagenen Versuchen erreicht hat.",
      "schema.dependency.text.service_to_host" : "Service zu Host",
      "schema.host.attr.last_check" : "Letzter Check",
      "word.Timezone" : "Zeitzone",
      "action.settings" : "Einstellungen",
      "site.wtrm.command.doUncheck" : "Uncheck the radio button or checkbox <b>%s</b> with value <b>%s</b>",
      "text.from_now_to_2d" : "Von jetzt + 2 Tage",
      "schema.user_chart.attr.id" : "ID",
      "schema.dependency.text.host_to_host" : "Host zu Host",
      "schema.host_template.text.delete" : "Ein Template löschen",
      "schema.group.text.may_delete_services" : "Darf Services löschen",
      "schema.host.desc.virt_manufacturer" : "z.B. VMware, Parallels",
      "schema.company.desc.max_metrics_per_chart" : "Die maximale Anzahl an Metriken die pro Benutzer-Chart hinzugefügt werden dürfen.",
      "schema.contact.desc.escalation_level" : "Wähle ein Eskalationslevel für den Kontakt. Mit dem Eskalationslevel kann kontrolliert werden wann ein Kontakt eine Benachrichtigung erhält. Das Level <i>Permanent aktiv</i> bedeuted, dass der Konakt immer benachrichtigt wird. Das Level <i>aktiv nach 3 Benachrichtiungen</i> bedeuted, dass der Kontakt erst benachrichtigt wird, wenn für den Service bereits 3 Benachrichtigungen versendet wurden und noch immer in einem niht-OK Status ist.",
      "err-620" : "Das Objekt existiert bereits!",
      "nav.sub.user_group_settings" : "Gruppeneinstellungen für Services",
      "schema.plugin.attr.id" : "Plugin-ID",
      "schema.user.attr.username" : "Benutzername",
      "schema.chart.attr.options" : "Chart Optionen",
      "schema.company.desc.max_sms" : "Die maximale Anzahl SMS, die pro Monat versendet werden dürfen. Setze 0 (null) wenn es kein Limit gibt.",
      "site.wtrm.command.doClick" : "Click on element <b>%s</b>",
      "err-836" : "Sorry, aber Sie dürfen nicht mehr als %s Kontaktgruppen erstellen!",
      "schema.service.desc.agent_tooltip" : "<h3>Installation des Bloonix-Agenten</h3>\n<p>\nDieser Check wird direkt auf dem Server ausgeführt und erfordert die Installation des Bloonix-Agenten\nsowie das Plugin auf dem Server.\n</p>",
      "text.report.availability.security" : "Sicherheitsproblem",
      "schema.event.attr.id" : "Event ID",
      "schema.host_template.text.view_services" : "View services",
      "site.login.forgot_password_info" : "Bitte beachten Sie, dass das Paswort nicht automatisch\nzu Ihrer registrierten E-Mail Adresse gesendet wird. Ein Administrator wird Ihre Anfrage\nprüfen und Sie so schnell wie möglich kontaktieren.",
      "schema.contactgroup.text.contact_members" : "Kontakte, die der Kontaktgruppe angehören",
      "schema.contactgroup.text.group_members" : "Mitglieder der Kontaktgruppe",
      "schema.service.attr.description" : "Beschreibung",
      "text.report.availability.volatile" : "Flüchtig",
      "schema.service.attr.status_since" : "Status seit",
      "err-846" : "Sorry, aber Sie dürfen nicht mehr als %s Benutzer erstellen!",
      "schema.service.attr.agent_options.timeout" : "Globaler Check Timeout",
      "schema.user.text.repeat_password" : "Neues Passwort wiederholen",
      "bool.yesno.0" : "Nein",
      "schema.host.desc.sysgroup" : "Dies ist ein Feld das zur freien Verwendung steht.",
      "schema.service.text.default_location_check_button" : "Standard Check",
      "text.dashboard.clone_dashboard" : "Das Dashboard klonen",
      "schema.company.desc.max_downtimes_per_host" : "Die maximale Anzahl an Downtimes die pro Host erstellt werden dürfen.",
      "schema.user.attr.id" : "Benutzer ID",
      "schema.roster.attr.active" : "Aktiv",
      "schema.service.desc.failover_check_type" : "Bei Failover-Checks haben Sie die Möglichkeit,\neinen festen Messpunkt für die Serviceprüfungen auszuwählen. Zusätzlich können Sie zwei Messpunkte\nauswählen, von denen eine Prüfung vorgenommen wird, wenn die Prüfung vom festen Messpunkt\neinen Wert liefert, der nicht OK ist. Erst wenn das Resultat aller drei Messpunkte nicht OK ist,\nwird der Zähler für die maximalen Fehlversuche eines Service um eins erhöht.",
      "site.wtrm.action.doWaitForElement" : "Wait for element",
      "schema.group.desc.company" : "Wähle ein Unternehmen zu der die Gruppe gehört",
      "err-702" : "Das Passwort ist zu lang (maximal 128 Zeichen)!",
      "schema.company.attr.state" : "Staat/Bundesland",
      "schema.chart.attr.datetime" : "Datum und Uhrzeit",
      "schema.chart.text.delete_view" : "Chartansicht löschen",
      "schema.dependency.text.active_time" : "Aktive Zeit",
      "action.generate_string" : "String generieren",
      "text.report.availability.EV-W" : "Anzahl von Ereignissen mit Status WARNING. ",
      "schema.service.attr.service_name" : "Servicename",
      "schema.service.text.attempt" : "Prüfungen",
      "site.wtrm.command.checkIfElementHasValue" : "Check if the input field or textarea with element <b>%s</b> contains <b>%s</b>",
      "schema.contact.text.list" : "Übersicht über alle Kontakte",
      "text.click_me" : "Klick mich",
      "site.wtrm.command.checkUrlWithContentType" : "Check if the URL <b>%s</b> has content type %s",
      "text.report.availability.LT30" : "Filterung von Ereignissen mit einer Statusdauer kleiner als 30 Minuten.",
      "schema.dependency.text.workflow_from_host" : "Von Host",
      "text.report.availability.h13" : "13:00 - 13:59",
      "word.Settings" : "Einstellungen",
      "schema.service.desc.rotate_check_type_title" : "Rotierende Messpunkte",
      "err-700" : "Bitte ändern Sie Ihr Passwort!",
      "text.dashboard.double_click_or_mouse_wheel_to_zoom" : "Doppelklick oder nutze das Mausrad um zu Zoomen",
      "site.help.doc.web-transactions" : "Web-Transactions",
      "err-634" : "Für den Paramter sort_by sind nur die Werte \"asc\" und \"desc\" erlaubt.",
      "schema.company.desc.max_chart_views_per_user" : "Die maximale Anzahl an Chart-Views die pro Benutzer erstellt werden dürfen.",
      "err-816" : "Sorry, aber Sie dürfen nicht mehr als %s Metriken zu einem Chart hinzufügen!",
      "site.help.doc.bloonix-webgui" : "Grundlegendes zur Bloonix-WebGUI",
      "schema.service.info.notification" : "Benachrichtigungen sind ausgeschaltet.",
      "action.genstr" : "Zeichenkette generieren",
      "info.create_success" : "Das Erstellen war erfolgreich!",
      "schema.service.info.host_alive_check" : "Dies ist ein Host-Alive-Check.",
      "action.clear" : "Zurücksetzen",
      "schema.service.attr.last_mail" : "Letzte Benachrichtigung per E-Mail",
      "schema.user.desc.password" : "Geben Sie das Passwort des Benutzers ein.",
      "schema.contactgroup.desc.description" : "Gebe eine kurze Beschreibung der Gruppe an.",
      "schema.contact.desc.sms_notification_level" : "Wähle die Status Level für die der Konakt eine Benachrichtigung per SMS erhalten soll.",
      "site.help.doc.add-new-service" : "Einen neuen Service anlegen",
      "schema.hs_downtime.attr.end_time" : "Endzeit",
      "schema.host.desc.ipaddr" : "Das ist die Haupt-IP-Adresse des Hosts.",
      "text.inherited_from_host" : "Vererbt vom Host",
      "schema.contactgroup.desc.name" : "Dies ist der Name der Kontaktgruppe. Der Name sollte einzigartig sein.",
      "schema.service.attr.volatile_status" : "Der aktuelle flüchtige Status (volatile)",
      "schema.company.desc.max_hosts" : "Die maximale Anzahl an Hosts die erstellt werden dürfen. Setze 0 (null) wenn es kein Limit gibt.",
      "schema.user.text.current_password" : "Aktuelles Passwort",
      "err-826" : "Sorry, aber Sie dürfen nicht mehr als %s Services pro Template erstellen!",
      "schema.host.text.multiple_edit_info" : "Leere Felder werden ignoriert!",
      "schema.company.attr.comment" : "Kommentar",
      "nav.main.monitoring" : "MONITORING",
      "schema.user.text.view" : "Benutzer %s",
      "schema.host.action.enable_notifications_multiple" : "Benachrichtigungen einschalten für die selektierten Hosts",
      "schema.user.attr.name" : "Name",
      "schema.dependency.text.host_to_service" : "Host zu Service",
      "text.report.availability.EV-LT60" : "Anzahl von Ereignissen mit einer Statusdauer kleiner als 60 Minuten. ",
      "schema.service.text.services" : "Services",
      "text.report.availability.LT180" : "Filterung von Ereignissen mit einer Statusdauer kleiner als 3 Stunden.",
      "text.report.title.number_of_events_by_tags" : "Anzahl der Ereignisse nach Tags",
      "text.report.availability.EV-LT300" : "Anzahl von Ereignissen mit einer Statusdauer kleiner als 5 Stunden.",
      "schema.service.attr.fd_flap_count" : "Maximale Anzahl von Statuswechsel",
      "site.wtrm.command.checkIfElementNotExists" : "Check if the element <b>%s</b> does <i>NOT</i> exists",
      "text.dashboard.delete_dashboard" : "Das Dashboard löschen",
      "schema.service.text.failover_location_check_button" : "Ausfall Checks",
      "text.change_your_password" : "Ändere dein Passwort",
      "text.plugin_info" : "Plugin Informationen",
      "schema.service.attr.sms_ok" : "Benachrichtigungen für OK Meldungen per SMS versenden",
      "schema.host_template.test.host_nonmembers" : "Hosts nicht in der Gruppe",
      "site.help.doc.bloonix-agent-installation" : "Den Bloonix-Agenten installieren",
      "schema.roster.attr.description" : "Beschreibung",
      "nav.sub.host_group_settings" : "Gruppeneinstellungen für Hosts",
      "schema.host.desc.device_class" : "z.B.<br/>/Server/Linux/Debian<br/>/Server/Windows/Windows 2008<br/>/Network/Router<br/>/Network/Switch<br/>/Printer",
      "action.extsearch" : "Erweiterte Suche",
      "schema.company.attr.max_services_per_host" : "Maximale Services pro Host",
      "site.wtrm.action.checkIfElementExists" : "Check if an <b>element exists</b>",
      "schema.user.desc.select_language" : "Bitte beachten Sie das die WebGUI nach der Auswahl neu geladen wird und Sie zum Dashboard umgeleitet werden!",
      "site.login.username" : "E-Mail Adresse",
      "schema.contact.attr.sms_notification_level" : "Benachrichtigungslevel für SMS",
      "schema.hs_downtime.attr.begin_time" : "Anfangszeit",
      "err-831" : "Sorry, aber Sie dürfen nicht mehr als %s Hosts erstellen!",
      "schema.service.desc.agent_options.timeout" : "Das ist der globale Timeout zur Ausführung des Checks. Nach dem Timeout wird der Check hart beendet und der Status des Servcice auf CRITICAL gesetzt. Dies kann sehr sinnvoll für Checks sein die hängen und sich selbst nicht mehr beenden können.<br/><br/>Standard: 30 Sekunden",
      "schema.service.text.create" : "Einen neuen Service erstellen",
      "site.wtrm.attr.password" : "Password",
      "site.wtrm.attr.text" : "Inner text",
      "schema.service.action.acknowledge_multiple" : "Den Status der selektierten Services bestätigen",
      "schema.service.attr.status" : "Status",
      "schema.company.text.delete" : "Unternehmen löschen",
      "schema.user.desc.manage_templates" : "Darf der Benutzer Host-Templates verwalten?",
      "schema.user.attr.allow_from" : "Erlaubter IP-Zugriff",
      "schema.host.desc.timeout" : "Das ist der Timeout aller Services des Hosts. Wenn in dieser Zeit der Status eines Service nicht aktualisiert wurde, dann wird ein kritischer Status gesetzt mit der Information, dass der Bloonix-Agent wohlmöglich ausgefallen ist.",
      "schema.service.attr.next_check" : "Nächste Prüfung",
      "schema.company.attr.max_metrics_per_chart" : "Maximale Metriken pro Chart",
      "site.help.doc.contacts-and-notifications" : "Kontakte und Benachrichtigungen",
      "schema.group.text.remove_user" : "Den Benutzer aus der Gruppe entfernen",
      "schema.plugin_stats.text.list" : "Metriken von Plugin %s",
      "schema.service.info.active" : "Der Service ist deaktiviert.",
      "schema.group.desc.groupname" : "Das ist der Name der Gruppe. Der Name sollte einzigartig sein.",
      "schema.dependency.text.create" : "Eine neue Abhängigkeit für Host %s erstellen",
      "site.login.want_to_login" : "Möchten Sie sich einloggen?",
      "text.dashboard.open_dashboard" : "Ein Dashboard öffnen",
      "schema.service.desc.passive_check" : "Ein passiver Check ist ein Check, der nicht von Bloonix selbst geprüft wird, sondern von einem externen Service oder Skriptund haben keinen Timeout. Passive Checks eignen sich zum Beispiel für SNMP Traps. Dabei meldet ein externer Service einen kritischen Status an den Bloonix-Agenten, dieser wiederrum meldet den Status an den Bloonix-Server.",
      "action.cancel" : "Abbrechen",
      "schema.dependency.text.workflow_to_host" : "zu Host",
      "err-605" : "Bitte wählen Sie mindestens ein Objekt aus!",
      "schema.host_template.desc.description" : "Gebe eine kurze Beschreibung zum Template an.",
      "schema.service.desc.multiple_check_type" : "Mit den Multiplen-Checks haben Sie die Möglichkeit, verschiedene Messpunkte auszuwählen, von denen eine Service-Prüfung gleichzeitig ausgeführt\nwird. Erst wenn von drei Messpunkten ein kritisches Resultat geliefert wird, wird der Zähler\nvon für die maximalen Fehlversuche eines Service um eins erhöht.<br/><br/>\nUm Ihren Service nicht zu überlasten, werden maximal\n3 Messpunktprüfungen gleichzeitig ausgeführt, es findet jedoch immer eine Prüfung\nvon allen Messpunkten aus statt, auch wenn mehr als 3 Prüfungen kritisch sind.",
      "site.wtrm.placeholder.value" : "value",
      "text.default" : "Standard",
      "err-840" : "Sorry, aber Sie dürfen nicht mehr als %s Timeperiods erstellen!",
      "site.help.doc.notification-screen" : "Notification Screen",
      "err-841" : "Sorry, aber Sie dürfen nicht mehr als %s Timeslices per objec erstellent!",
      "action.update" : "Aktualisieren",
      "schema.group.attr.company_id" : "Firmen ID",
      "site.wtrm.action.checkIfElementHasNotHTML" : "Check if an <b>element does <i>NOT</i></b> contain <b>HTML</b>",
      "schema.service_downtime.text.title" : "Geplante Service-Wartungsarbeiten für Host %s",
      "nav.sub.rosters" : "Bereitschaftsplan",
      "schema.event.attr.duration" : "Dauer",
      "schema.contact.text.settings" : "Einstellungen des Kontakts",
      "schema.chart.attr.to" : "Bis",
      "schema.group.text.list" : "Übersicht über alle Gruppen",
      "schema.user.desc.company" : "Wähle ein Unternehmen zu dem der Benutzer gehört.",
      "site.login.sign_up" : "Registrieren Sie sich für einen Bloonix Account",
      "schema.timeslice.attr.id" : "ID",
      "schema.dependency.text.workflow_from_host_status" : "Wähle den Status des Hosts, welcher den Abhängigkeitsfluss aktiviert",
      "schema.sms_send.text.list" : "Gesendete SMS für Host %s",
      "schema.service.desc.sms_hard_interval" : "Mit dieser Option können Sie einen harten Benachrichtigungsintervall setzen. Auch wenn der Service zu OK und dann wieder zu CRITICAL wechselt, so erhalten Sie erst nach Ablauf dieses Intervalls erneut eine Benachrichtigung.",
      "site.wtrm.action.doAuth" : "Set auth basic <b>username</b> and <b>password</b>",
      "err-600" : "Das angeforderte Objekt existiert nicht!",
      "site.wtrm.action.doSleep" : "<b>Sleep</b> a while",
      "err-802" : "Sorry, aber diese Funktion ist nicht verfügbar!",
      "schema.chart.text.selected" : "selektiert",
      "schema.user_chart.text.delete" : "Chart löschen",
      "site.login.follow" : "Folgen Sie Bloonix",
      "schema.company.desc.max_contactgroups" : "Die maximale Anzahl an Kontaktgruppen die erstellt werden dürfen.",
      "site.wtrm.attr.username" : "Username",
      "text.report.availability.h19" : "19:00 - 19:59",
      "schema.company.attr.address2" : "Adresse 2",
      "text.report.availability.EV-I" : "Anzahl von Ereignissen mit Status INFO. ",
      "schema.company.desc.max_dashlets_per_dashboard" : "Die maximale Anzahl an Dashlets die pro Dashboard hinzugefügt werden dürfen.",
      "site.help.doc.host-templates" : "Host Templates einrichten und verwalten",
      "schema.timeperiod.attr.name" : "Zeitplan",
      "schema.company.attr.name" : "Name",
      "schema.dependency.attr.on_host_id" : "Depends on host ID",
      "schema.service.text.title" : "Services",
      "schema.service.text.clone_select_host" : "Einen anderen Host auswählen",
      "schema.service.desc.rotate_check_type" : "Die Rotate-Checks haben keinen festen Messpunkt.\nStattdessen rotieren die Services-Prüfungen über die ausgewählten Messpunkte.\nSollte die Prüfung von einem Messpunkt nicht OK sein, wird sofort zum nächsten Messpunkt\ngesprungen. Sollte auch der dritte Messpunkt ein Resultat liefern, welcher nicht OK ist, so wird\nder Zähler für die maximalen Fehlversuche eines Service um eins erhöht.",
      "schema.user.desc.name" : "Das ist der Name des Benutzers.",
      "schema.service.text.list" : "Übersicht über alle Services",
      "schema.host.text.multiple_edit" : "Die Konfiguration mehrerer Hosts editieren",
      "text.report.title.total_status_duration" : "Die Dauer der Ereignisse nach Status",
      "schema.contact.desc.sms_notifications_enabled" : "Mit dieser Option ist es möglich die Benachrichtigung per SMS ein- oder auszuschalten.",
      "schema.service.action.activate_multiple" : "Selektierte Services aktivieren",
      "site.wtrm.command.checkIfElementIsNotChecked" : "Check if the radio button or checkbox <b>%s</b> is <i>NOT</i> checked",
      "schema.chart.text.charts" : "Charts",
      "text.please_select_objects" : "Bitte selektieren Sie mindestens ein Objekt!",
      "text.min_length" : "Mindestlänge: %s",
      "schema.host.text.report_title" : "Bericht für Host %s",
      "schema.service.info.inherits_from_host_template" : "Dieser Service wird von Host Template '%s' vererbt.",
      "schema.group.text.may_create_services" : "Darf Services erstellen",
      "schema.dependency.text.workflow_from_service_status" : "Wähle den Status des Services, welcher den Abhängigkeitsfluss aktiviert",
      "schema.company.text.create" : "Erstelle ein Unternehmen",
      "err-811" : "Sorry, aber Sie dürfen nicht mehr als %s Dashboards erstellen!",
      "schema.hs_downtime.attr.id" : "ID",
      "err-417" : "Sie haben nicht genügend Rechte um ein Objekt zu erstellen!",
      "text.report.availability.h09" : "09:00 - 09:59",
      "action.schedule" : "Planen",
      "schema.user.attr.locked" : "Gesperrt",
      "err-833" : "Sorry, aber Sie dürfen nicht mehr als %s Services pro Host erstellen!",
      "schema.contactgroup.text.delete" : "Die Kontaktgruppe löschen",
      "text.last_30d" : "Die letzten 30 Tage",
      "schema.service.attr.result" : "Erweiterte Status Information",
      "schema.host.desc.hw_manufacturer" : "z.B. IBM, HP, Dell, Fujitsu Siemens",
      "schema.user.desc.locked" : "Darf sich der Benutzer einloggen?",
      "schema.contactgroup.attr.name" : "Name",
      "schema.company.attr.max_groups" : "Maximale Gruppen",
      "err-703" : "Das Passwort ist zu kurz (minimum 8 Zeichen)!",
      "schema.service.desc.mail_warnings" : "Diese Option aktiviert oder deaktiviert das Versenden von Nachrichten per E-Mail für Services im Status WARNING.",
      "action.save" : "Speichern",
      "schema.service.text.multiple_acknowledge" : "Den Status mehrerer Services bestätigen",
      "schema.user_chart.attr.title" : "Titel",
      "schema.company.attr.max_chart_views_per_user" : "Maximale Chart-Views pro User",
      "site.help.doc.bloonix-agent-configuration" : "Den Bloonix-Agenten konfigurieren",
      "schema.dependency.attr.on_status" : "Übergeordneter Status",
      "nav.sub.templates" : "Templates",
      "text.report.availability.lt30" : "Zwischen 15 und 30 Minuten",
      "site.help.doc.add-new-host" : "Einen neuen Host anlegen",
      "err-419" : "Sie haben nicht genügend Rechte um das Objekt zu löschen!",
      "schema.service.attr.flapping" : "Flapping",
      "text.dashboard.dashlet_select_chart" : "Wähle einen Chart",
      "text.first_failover_checkpoint" : "Erster Ausfallmesspunkt",
      "schema.service.desc.agent_id" : "Standort der Prüfung",
      "schema.service.desc.rotate_check_type_locations" : "Ihr Service wird von folgenden Messpunkten überprüft:",
      "text.dashboard.services_notification" : "Benachrichtigungsstatus aller Services",
      "schema.contact.text.timeperiods" : "Zeitpläne des Kontakts",
      "text.dashboard.title" : "Dashboard",
      "schema.user.text.list" : "Übersicht über alle Benutzer",
      "schema.service.desc.mail_ok" : "Diese Option aktiviert oder deaktiviert das Versenden von Nachrichten per E-Mail für Services die in den Status OK zurückwechseln.",
      "info.extended_search_syntax_for_hosts" : "<p>Es ist möglich die Hostliste durch eine Suchabfrage zu filtern. Die Syntax ist sehr einfach und sieht wie folgt aus::</p>\n<pre>Schlüssel:Wert</pre>\n<p>Der Schlüssel ist das Tabellenfeld, in dem nach dem Wert gesucht werden solll.</p>\n<p>Suchbeispiele:</p>\n<p>- Suche nach Hosts mit Status CRITICAL oder UNKNOWN</p>\n<pre>status:CRITICAL OR status:UNKNOWN</pre>\n<p>- Suche nach Hosts im Datacenter 12 mit Status CRITICAL</p>\n<pre>location:\"Datacenter 12\" AND status:CRITICAL</pre>\n<p>Die folgenden Schlüssel sind für die spezifische Suche verfügbar:</p>",
      "word.Preset" : "Voreinstellung",
      "action.quicksearch" : "Schnellsuche",
      "schema.group.attr.id" : "Gruppen ID",
      "schema.chart.attr.id" : "Chart ID",
      "schema.company.attr.max_contactgroups" : "Maximale Kontaktgruppen",
      "site.wtrm.text.wtrm_workflow" : "Web Transaction Workflow",
      "text.report.availability.agent_dead" : "Agent tot",
      "schema.user_chart.text.create" : "Einen Chart erstellen",
      "schema.host.text.device_class_help_link" : "Lesen Sie wie dieses Feature funktioniert",
      "schema.user.text.session_expires" : "Session läuft ab",
      "text.dashboard.top_hosts_events" : "Anzeige der Top-Events aller Hosts",
      "text.report.availability.h22" : "22:00 - 22:59",
      "nav.sub.reports" : "Berichte",
      "schema.service.desc.sms_warnings" : "Diese Option aktiviert oder deaktiviert das Versenden von Nachrichten per SMS für Services im Status WARNING.",
      "schema.chart.text.selected_max_reached" : "(max) selektiert",
      "schema.service.text.settings" : "Einstellung des Service %s",
      "site.wtrm.action.checkIfElementHasValue" : "Check the <b>value</b> of an <b>input</b> field or <b>textarea</b>",
      "schema.plugin.attr.description" : "Beschreibung",
      "schema.user_chart.text.title" : "Benutzer Charts",
      "site.wtrm.desc.contentType" : "Enter content type that is expeced for the URL.",
      "schema.company.desc.max_dashboards_per_user" : "Die maximale Anzahl an Dashboards die pro Benutzer erstellt werden dürfen.",
      "action.no_abort" : "<b>Nein, abbrechen!</b>",
      "text.from_now_to_4h" : "Von jetzt + 4 Stunden",
      "schema.group.attr.groupname" : "Gruppenname",
      "action.members" : "Mitglieder auflisten",
      "schema.host.text.multiple_activate" : "Mehrere Hosts aktivieren oder deaktivieren",
      "schema.host.attr.company_id" : "Firmen ID",
      "word.active" : "aktiv",
      "schema.host.attr.comment" : "Kommentar",
      "schema.user.attr.comment" : "Kommentar",
      "schema.user.desc.allow_from" : "Es ist möglich eine Komma-separierte Liste von IP-Adressen anzugeben, von denen sich der Benutzer einloggen darf. Das Schlüsselwort <i>all</i> heißt von überall.",
      "schema.contact.desc.mail_notifications_enabled" : "Mit dieser Option ist es möglich die Benachrichtigung per E-Mail ein- oder auszuschalten.",
      "schema.company.desc.max_services" : "Die maximale Anzahl an Services die überwacht werden dürfen. Setze 0 (null) wenn es kein Limit gibt.",
      "text.locations_selected_costs" : "Sie haben %s Messpunkte ausgewählt. Bitte beachten Sie, dass jeder Kontrollpunkt extra berechnet wird.",
      "text.report.availability.h02" : "02:00 - 02:59",
      "site.wtrm.attr.html" : "Inner HTML",
      "schema.host.text.list_device_classes" : "Device Klassen",
      "schema.host_template.text.delete_service" : "Einen Service aus dem Template löschen",
      "word.hours" : "Stunden",
      "schema.host_template.text.list" : "Übersicht über alle Host-Templates",
      "word.days" : "Tage",
      "schema.service.attr.is_volatile" : "Ist der Service flüchtig (volatile)",
      "word.debug" : "Debug",
      "text.report.availability.LT15" : "Filterung von Ereignissen mit einer Statusdauer kleiner als 15 Minuten.",
      "schema.service.desc.acknowledged" : "Diese Option ist hilfreich wenn ein Service nicht OK ist und Sie das Benachrichtiungen temporär ausschalten möchten. Die Benachrichtigungen werden automatisch wieder eingeschaltet, wenn der Service in den Status OK gewechselt ist.",
      "nav.sub.mtr" : "MTR",
      "site.wtrm.desc.value" : "The value of the element you wish to fill or check.",
      "schema.company.attr.max_charts_per_user" : "Maximale Charts pro Benutzer",
      "site.help.doc.host-and-service-dependencies" : "Abhängigkeiten zwischen Hosts und Services",
      "schema.user_chart.text.update" : "Einen Chart aktualisieren",
      "schema.roster.text.list" : "Übersicht über alle Bereitschaftspläne",
      "schema.service.text.view_wtrm_report" : "Web-Transaktionsreport einsehen",
      "site.help.doc.device-classes" : "Bauklasse von Hosts",
      "schema.user.attr.manage_templates" : "Verwaltung von Vorlagen?",
      "text.dashboard.hosts_availability" : "Verfügbarkeit aller Hosts",
      "schema.service.attr.comment" : "Kommentar",
      "text.last_60d" : "Die letzten 60 Tage",
      "site.help.doc.host-alive-check" : "Was ist ein Host-Alive-Check?",
      "schema.contact.text.escalation_level_event.1" : "aktiv nach 1er Benachrichtiung",
      "schema.company.attr.company" : "Firma",
      "site.wtrm.command.doUserAgent" : "Set the user agent to <b>%s</b>",
      "action.yes_delete" : "<b>Ja, löschen!</b>",
      "schema.service.attr.command" : "Kommando",
      "action.help" : "Hilfe",
      "schema.event.text.host_service" : "Host / Service",
      "schema.event.attr.tags" : "Hinweise",
      "schema.user.attr.timezone" : "Zeitzone",
      "site.wtrm.desc.hidden" : "Do you want to hide the value because it's a password or a secret string?",
      "schema.host_template.text.clone_title" : "Das Template %s klonen",
      "text.report.availability.h17" : "17:00 - 17:59",
      "schema.service.attr.interval" : "Intervall",
      "schema.user.text.delete" : "Den Benutzer löschen",
      "schema.service.text.select_location_check_type_info" : "Klicke auf die Buttons um eine kurze Beschreibung zu jedem Typ zu erhalten",
      "schema.service.attr.notification" : "Benachrichtigungen eingeschaltet",
      "schema.service.desc.failover_check_type_title" : "Failover Messpunkt",
      "text.undefined" : "Nicht definiert",
      "word.Days" : "Tage",
      "schema.service.desc.active" : "Diese Option aktiviert oder deaktiviert den Service.",
      "schema.chart.text.chart_views" : "Chart Ansichten",
      "text.never" : "Niemals",
      "schema.service.attr.command_options" : "Check Einstellungen",
      "text.selected_objects" : "Ausgewählte Objekte",
      "schema.dependency.text.service_to_service" : "Service zu Service",
      "word.Hours" : "Stunden"
   }
};// Init lang.
var Timezones = function() {
    return [
       {
          "value" : "Africa/Abidjan",
          "name" : "Africa/Abidjan"
       },
       {
          "value" : "Africa/Accra",
          "name" : "Africa/Accra"
       },
       {
          "value" : "Africa/Addis_Ababa",
          "name" : "Africa/Addis Ababa"
       },
       {
          "value" : "Africa/Algiers",
          "name" : "Africa/Algiers"
       },
       {
          "value" : "Africa/Asmara",
          "name" : "Africa/Asmara"
       },
       {
          "value" : "Africa/Bamako",
          "name" : "Africa/Bamako"
       },
       {
          "value" : "Africa/Bangui",
          "name" : "Africa/Bangui"
       },
       {
          "value" : "Africa/Banjul",
          "name" : "Africa/Banjul"
       },
       {
          "value" : "Africa/Bissau",
          "name" : "Africa/Bissau"
       },
       {
          "value" : "Africa/Blantyre",
          "name" : "Africa/Blantyre"
       },
       {
          "value" : "Africa/Brazzaville",
          "name" : "Africa/Brazzaville"
       },
       {
          "value" : "Africa/Bujumbura",
          "name" : "Africa/Bujumbura"
       },
       {
          "value" : "Africa/Cairo",
          "name" : "Africa/Cairo"
       },
       {
          "value" : "Africa/Casablanca",
          "name" : "Africa/Casablanca"
       },
       {
          "value" : "Africa/Ceuta",
          "name" : "Africa/Ceuta"
       },
       {
          "value" : "Africa/Conakry",
          "name" : "Africa/Conakry"
       },
       {
          "value" : "Africa/Dakar",
          "name" : "Africa/Dakar"
       },
       {
          "value" : "Africa/Dar_es_Salaam",
          "name" : "Africa/Dar es Salaam"
       },
       {
          "value" : "Africa/Djibouti",
          "name" : "Africa/Djibouti"
       },
       {
          "value" : "Africa/Douala",
          "name" : "Africa/Douala"
       },
       {
          "value" : "Africa/El_Aaiun",
          "name" : "Africa/El Aaiun"
       },
       {
          "value" : "Africa/Freetown",
          "name" : "Africa/Freetown"
       },
       {
          "value" : "Africa/Gaborone",
          "name" : "Africa/Gaborone"
       },
       {
          "value" : "Africa/Harare",
          "name" : "Africa/Harare"
       },
       {
          "value" : "Africa/Johannesburg",
          "name" : "Africa/Johannesburg"
       },
       {
          "value" : "Africa/Kampala",
          "name" : "Africa/Kampala"
       },
       {
          "value" : "Africa/Khartoum",
          "name" : "Africa/Khartoum"
       },
       {
          "value" : "Africa/Kigali",
          "name" : "Africa/Kigali"
       },
       {
          "value" : "Africa/Kinshasa",
          "name" : "Africa/Kinshasa"
       },
       {
          "value" : "Africa/Lagos",
          "name" : "Africa/Lagos"
       },
       {
          "value" : "Africa/Libreville",
          "name" : "Africa/Libreville"
       },
       {
          "value" : "Africa/Lome",
          "name" : "Africa/Lome"
       },
       {
          "value" : "Africa/Luanda",
          "name" : "Africa/Luanda"
       },
       {
          "value" : "Africa/Lubumbashi",
          "name" : "Africa/Lubumbashi"
       },
       {
          "value" : "Africa/Lusaka",
          "name" : "Africa/Lusaka"
       },
       {
          "value" : "Africa/Malabo",
          "name" : "Africa/Malabo"
       },
       {
          "value" : "Africa/Maputo",
          "name" : "Africa/Maputo"
       },
       {
          "value" : "Africa/Maseru",
          "name" : "Africa/Maseru"
       },
       {
          "value" : "Africa/Mbabane",
          "name" : "Africa/Mbabane"
       },
       {
          "value" : "Africa/Mogadishu",
          "name" : "Africa/Mogadishu"
       },
       {
          "value" : "Africa/Monrovia",
          "name" : "Africa/Monrovia"
       },
       {
          "value" : "Africa/Nairobi",
          "name" : "Africa/Nairobi"
       },
       {
          "value" : "Africa/Ndjamena",
          "name" : "Africa/Ndjamena"
       },
       {
          "value" : "Africa/Niamey",
          "name" : "Africa/Niamey"
       },
       {
          "value" : "Africa/Nouakchott",
          "name" : "Africa/Nouakchott"
       },
       {
          "value" : "Africa/Ouagadougou",
          "name" : "Africa/Ouagadougou"
       },
       {
          "value" : "Africa/Porto-Novo",
          "name" : "Africa/Porto-Novo"
       },
       {
          "value" : "Africa/Sao_Tome",
          "name" : "Africa/Sao Tome"
       },
       {
          "value" : "Africa/Tripoli",
          "name" : "Africa/Tripoli"
       },
       {
          "value" : "Africa/Tunis",
          "name" : "Africa/Tunis"
       },
       {
          "value" : "Africa/Windhoek",
          "name" : "Africa/Windhoek"
       },
       {
          "value" : "America/Adak",
          "name" : "America/Adak"
       },
       {
          "value" : "America/Anchorage",
          "name" : "America/Anchorage"
       },
       {
          "value" : "America/Anguilla",
          "name" : "America/Anguilla"
       },
       {
          "value" : "America/Antigua",
          "name" : "America/Antigua"
       },
       {
          "value" : "America/Araguaina",
          "name" : "America/Araguaina"
       },
       {
          "value" : "America/Argentina/Buenos_Aires",
          "name" : "America/Argentina/Buenos Aires"
       },
       {
          "value" : "America/Argentina/Catamarca",
          "name" : "America/Argentina/Catamarca"
       },
       {
          "value" : "America/Argentina/Cordoba",
          "name" : "America/Argentina/Cordoba"
       },
       {
          "value" : "America/Argentina/Jujuy",
          "name" : "America/Argentina/Jujuy"
       },
       {
          "value" : "America/Argentina/La_Rioja",
          "name" : "America/Argentina/La Rioja"
       },
       {
          "value" : "America/Argentina/Mendoza",
          "name" : "America/Argentina/Mendoza"
       },
       {
          "value" : "America/Argentina/Rio_Gallegos",
          "name" : "America/Argentina/Rio Gallegos"
       },
       {
          "value" : "America/Argentina/Salta",
          "name" : "America/Argentina/Salta"
       },
       {
          "value" : "America/Argentina/San_Juan",
          "name" : "America/Argentina/San Juan"
       },
       {
          "value" : "America/Argentina/San_Luis",
          "name" : "America/Argentina/San Luis"
       },
       {
          "value" : "America/Argentina/Tucuman",
          "name" : "America/Argentina/Tucuman"
       },
       {
          "value" : "America/Argentina/Ushuaia",
          "name" : "America/Argentina/Ushuaia"
       },
       {
          "value" : "America/Aruba",
          "name" : "America/Aruba"
       },
       {
          "value" : "America/Asuncion",
          "name" : "America/Asuncion"
       },
       {
          "value" : "America/Atikokan",
          "name" : "America/Atikokan"
       },
       {
          "value" : "America/Bahia",
          "name" : "America/Bahia"
       },
       {
          "value" : "America/Bahia_Banderas",
          "name" : "America/Bahia Banderas"
       },
       {
          "value" : "America/Barbados",
          "name" : "America/Barbados"
       },
       {
          "value" : "America/Belem",
          "name" : "America/Belem"
       },
       {
          "value" : "America/Belize",
          "name" : "America/Belize"
       },
       {
          "value" : "America/Blanc-Sablon",
          "name" : "America/Blanc-Sablon"
       },
       {
          "value" : "America/Boa_Vista",
          "name" : "America/Boa Vista"
       },
       {
          "value" : "America/Bogota",
          "name" : "America/Bogota"
       },
       {
          "value" : "America/Boise",
          "name" : "America/Boise"
       },
       {
          "value" : "America/Cambridge_Bay",
          "name" : "America/Cambridge Bay"
       },
       {
          "value" : "America/Campo_Grande",
          "name" : "America/Campo Grande"
       },
       {
          "value" : "America/Cancun",
          "name" : "America/Cancun"
       },
       {
          "value" : "America/Caracas",
          "name" : "America/Caracas"
       },
       {
          "value" : "America/Cayenne",
          "name" : "America/Cayenne"
       },
       {
          "value" : "America/Cayman",
          "name" : "America/Cayman"
       },
       {
          "value" : "America/Chicago",
          "name" : "America/Chicago"
       },
       {
          "value" : "America/Chihuahua",
          "name" : "America/Chihuahua"
       },
       {
          "value" : "America/Costa_Rica",
          "name" : "America/Costa Rica"
       },
       {
          "value" : "America/Cuiaba",
          "name" : "America/Cuiaba"
       },
       {
          "value" : "America/Curacao",
          "name" : "America/Curacao"
       },
       {
          "value" : "America/Danmarkshavn",
          "name" : "America/Danmarkshavn"
       },
       {
          "value" : "America/Dawson",
          "name" : "America/Dawson"
       },
       {
          "value" : "America/Dawson_Creek",
          "name" : "America/Dawson Creek"
       },
       {
          "value" : "America/Denver",
          "name" : "America/Denver"
       },
       {
          "value" : "America/Detroit",
          "name" : "America/Detroit"
       },
       {
          "value" : "America/Dominica",
          "name" : "America/Dominica"
       },
       {
          "value" : "America/Edmonton",
          "name" : "America/Edmonton"
       },
       {
          "value" : "America/Eirunepe",
          "name" : "America/Eirunepe"
       },
       {
          "value" : "America/El_Salvador",
          "name" : "America/El Salvador"
       },
       {
          "value" : "America/Fortaleza",
          "name" : "America/Fortaleza"
       },
       {
          "value" : "America/Glace_Bay",
          "name" : "America/Glace Bay"
       },
       {
          "value" : "America/Godthab",
          "name" : "America/Godthab"
       },
       {
          "value" : "America/Goose_Bay",
          "name" : "America/Goose Bay"
       },
       {
          "value" : "America/Grand_Turk",
          "name" : "America/Grand Turk"
       },
       {
          "value" : "America/Grenada",
          "name" : "America/Grenada"
       },
       {
          "value" : "America/Guadeloupe",
          "name" : "America/Guadeloupe"
       },
       {
          "value" : "America/Guatemala",
          "name" : "America/Guatemala"
       },
       {
          "value" : "America/Guayaquil",
          "name" : "America/Guayaquil"
       },
       {
          "value" : "America/Guyana",
          "name" : "America/Guyana"
       },
       {
          "value" : "America/Halifax",
          "name" : "America/Halifax"
       },
       {
          "value" : "America/Havana",
          "name" : "America/Havana"
       },
       {
          "value" : "America/Hermosillo",
          "name" : "America/Hermosillo"
       },
       {
          "value" : "America/Indiana/Indianapolis",
          "name" : "America/Indiana/Indianapolis"
       },
       {
          "value" : "America/Indiana/Knox",
          "name" : "America/Indiana/Knox"
       },
       {
          "value" : "America/Indiana/Marengo",
          "name" : "America/Indiana/Marengo"
       },
       {
          "value" : "America/Indiana/Petersburg",
          "name" : "America/Indiana/Petersburg"
       },
       {
          "value" : "America/Indiana/Tell_City",
          "name" : "America/Indiana/Tell City"
       },
       {
          "value" : "America/Indiana/Vevay",
          "name" : "America/Indiana/Vevay"
       },
       {
          "value" : "America/Indiana/Vincennes",
          "name" : "America/Indiana/Vincennes"
       },
       {
          "value" : "America/Indiana/Winamac",
          "name" : "America/Indiana/Winamac"
       },
       {
          "value" : "America/Inuvik",
          "name" : "America/Inuvik"
       },
       {
          "value" : "America/Iqaluit",
          "name" : "America/Iqaluit"
       },
       {
          "value" : "America/Jamaica",
          "name" : "America/Jamaica"
       },
       {
          "value" : "America/Juneau",
          "name" : "America/Juneau"
       },
       {
          "value" : "America/Kentucky/Louisville",
          "name" : "America/Kentucky/Louisville"
       },
       {
          "value" : "America/Kentucky/Monticello",
          "name" : "America/Kentucky/Monticello"
       },
       {
          "value" : "America/Kralendijk",
          "name" : "America/Kralendijk"
       },
       {
          "value" : "America/La_Paz",
          "name" : "America/La Paz"
       },
       {
          "value" : "America/Lima",
          "name" : "America/Lima"
       },
       {
          "value" : "America/Los_Angeles",
          "name" : "America/Los Angeles"
       },
       {
          "value" : "America/Lower_Princes",
          "name" : "America/Lower Princes"
       },
       {
          "value" : "America/Maceio",
          "name" : "America/Maceio"
       },
       {
          "value" : "America/Managua",
          "name" : "America/Managua"
       },
       {
          "value" : "America/Manaus",
          "name" : "America/Manaus"
       },
       {
          "value" : "America/Marigot",
          "name" : "America/Marigot"
       },
       {
          "value" : "America/Martinique",
          "name" : "America/Martinique"
       },
       {
          "value" : "America/Matamoros",
          "name" : "America/Matamoros"
       },
       {
          "value" : "America/Mazatlan",
          "name" : "America/Mazatlan"
       },
       {
          "value" : "America/Menominee",
          "name" : "America/Menominee"
       },
       {
          "value" : "America/Merida",
          "name" : "America/Merida"
       },
       {
          "value" : "America/Metlakatla",
          "name" : "America/Metlakatla"
       },
       {
          "value" : "America/Mexico_City",
          "name" : "America/Mexico City"
       },
       {
          "value" : "America/Miquelon",
          "name" : "America/Miquelon"
       },
       {
          "value" : "America/Moncton",
          "name" : "America/Moncton"
       },
       {
          "value" : "America/Monterrey",
          "name" : "America/Monterrey"
       },
       {
          "value" : "America/Montevideo",
          "name" : "America/Montevideo"
       },
       {
          "value" : "America/Montreal",
          "name" : "America/Montreal"
       },
       {
          "value" : "America/Montserrat",
          "name" : "America/Montserrat"
       },
       {
          "value" : "America/Nassau",
          "name" : "America/Nassau"
       },
       {
          "value" : "America/New_York",
          "name" : "America/New York"
       },
       {
          "value" : "America/Nipigon",
          "name" : "America/Nipigon"
       },
       {
          "value" : "America/Nome",
          "name" : "America/Nome"
       },
       {
          "value" : "America/Noronha",
          "name" : "America/Noronha"
       },
       {
          "value" : "America/North_Dakota/Beulah",
          "name" : "America/North Dakota/Beulah"
       },
       {
          "value" : "America/North_Dakota/Center",
          "name" : "America/North Dakota/Center"
       },
       {
          "value" : "America/North_Dakota/New_Salem",
          "name" : "America/North Dakota/New Salem"
       },
       {
          "value" : "America/Ojinaga",
          "name" : "America/Ojinaga"
       },
       {
          "value" : "America/Panama",
          "name" : "America/Panama"
       },
       {
          "value" : "America/Pangnirtung",
          "name" : "America/Pangnirtung"
       },
       {
          "value" : "America/Paramaribo",
          "name" : "America/Paramaribo"
       },
       {
          "value" : "America/Phoenix",
          "name" : "America/Phoenix"
       },
       {
          "value" : "America/Port-au-Prince",
          "name" : "America/Port-au-Prince"
       },
       {
          "value" : "America/Port_of_Spain",
          "name" : "America/Port of Spain"
       },
       {
          "value" : "America/Porto_Velho",
          "name" : "America/Porto Velho"
       },
       {
          "value" : "America/Puerto_Rico",
          "name" : "America/Puerto Rico"
       },
       {
          "value" : "America/Rainy_River",
          "name" : "America/Rainy River"
       },
       {
          "value" : "America/Rankin_Inlet",
          "name" : "America/Rankin Inlet"
       },
       {
          "value" : "America/Recife",
          "name" : "America/Recife"
       },
       {
          "value" : "America/Regina",
          "name" : "America/Regina"
       },
       {
          "value" : "America/Resolute",
          "name" : "America/Resolute"
       },
       {
          "value" : "America/Rio_Branco",
          "name" : "America/Rio Branco"
       },
       {
          "value" : "America/Santa_Isabel",
          "name" : "America/Santa Isabel"
       },
       {
          "value" : "America/Santarem",
          "name" : "America/Santarem"
       },
       {
          "value" : "America/Santiago",
          "name" : "America/Santiago"
       },
       {
          "value" : "America/Santo_Domingo",
          "name" : "America/Santo Domingo"
       },
       {
          "value" : "America/Sao_Paulo",
          "name" : "America/Sao Paulo"
       },
       {
          "value" : "America/Scoresbysund",
          "name" : "America/Scoresbysund"
       },
       {
          "value" : "America/Shiprock",
          "name" : "America/Shiprock"
       },
       {
          "value" : "America/Sitka",
          "name" : "America/Sitka"
       },
       {
          "value" : "America/St_Barthelemy",
          "name" : "America/St Barthelemy"
       },
       {
          "value" : "America/St_Johns",
          "name" : "America/St Johns"
       },
       {
          "value" : "America/St_Kitts",
          "name" : "America/St Kitts"
       },
       {
          "value" : "America/St_Lucia",
          "name" : "America/St Lucia"
       },
       {
          "value" : "America/St_Thomas",
          "name" : "America/St Thomas"
       },
       {
          "value" : "America/St_Vincent",
          "name" : "America/St Vincent"
       },
       {
          "value" : "America/Swift_Current",
          "name" : "America/Swift Current"
       },
       {
          "value" : "America/Tegucigalpa",
          "name" : "America/Tegucigalpa"
       },
       {
          "value" : "America/Thule",
          "name" : "America/Thule"
       },
       {
          "value" : "America/Thunder_Bay",
          "name" : "America/Thunder Bay"
       },
       {
          "value" : "America/Tijuana",
          "name" : "America/Tijuana"
       },
       {
          "value" : "America/Toronto",
          "name" : "America/Toronto"
       },
       {
          "value" : "America/Tortola",
          "name" : "America/Tortola"
       },
       {
          "value" : "America/Vancouver",
          "name" : "America/Vancouver"
       },
       {
          "value" : "America/Whitehorse",
          "name" : "America/Whitehorse"
       },
       {
          "value" : "America/Winnipeg",
          "name" : "America/Winnipeg"
       },
       {
          "value" : "America/Yakutat",
          "name" : "America/Yakutat"
       },
       {
          "value" : "America/Yellowknife",
          "name" : "America/Yellowknife"
       },
       {
          "value" : "Antarctica/Casey",
          "name" : "Antarctica/Casey"
       },
       {
          "value" : "Antarctica/Davis",
          "name" : "Antarctica/Davis"
       },
       {
          "value" : "Antarctica/DumontDUrville",
          "name" : "Antarctica/DumontDUrville"
       },
       {
          "value" : "Antarctica/Macquarie",
          "name" : "Antarctica/Macquarie"
       },
       {
          "value" : "Antarctica/Mawson",
          "name" : "Antarctica/Mawson"
       },
       {
          "value" : "Antarctica/McMurdo",
          "name" : "Antarctica/McMurdo"
       },
       {
          "value" : "Antarctica/Palmer",
          "name" : "Antarctica/Palmer"
       },
       {
          "value" : "Antarctica/Rothera",
          "name" : "Antarctica/Rothera"
       },
       {
          "value" : "Antarctica/South_Pole",
          "name" : "Antarctica/South Pole"
       },
       {
          "value" : "Antarctica/Syowa",
          "name" : "Antarctica/Syowa"
       },
       {
          "value" : "Antarctica/Vostok",
          "name" : "Antarctica/Vostok"
       },
       {
          "value" : "Arctic/Longyearbyen",
          "name" : "Arctic/Longyearbyen"
       },
       {
          "value" : "Asia/Aden",
          "name" : "Asia/Aden"
       },
       {
          "value" : "Asia/Almaty",
          "name" : "Asia/Almaty"
       },
       {
          "value" : "Asia/Amman",
          "name" : "Asia/Amman"
       },
       {
          "value" : "Asia/Anadyr",
          "name" : "Asia/Anadyr"
       },
       {
          "value" : "Asia/Aqtau",
          "name" : "Asia/Aqtau"
       },
       {
          "value" : "Asia/Aqtobe",
          "name" : "Asia/Aqtobe"
       },
       {
          "value" : "Asia/Ashgabat",
          "name" : "Asia/Ashgabat"
       },
       {
          "value" : "Asia/Baghdad",
          "name" : "Asia/Baghdad"
       },
       {
          "value" : "Asia/Bahrain",
          "name" : "Asia/Bahrain"
       },
       {
          "value" : "Asia/Baku",
          "name" : "Asia/Baku"
       },
       {
          "value" : "Asia/Bangkok",
          "name" : "Asia/Bangkok"
       },
       {
          "value" : "Asia/Beirut",
          "name" : "Asia/Beirut"
       },
       {
          "value" : "Asia/Bishkek",
          "name" : "Asia/Bishkek"
       },
       {
          "value" : "Asia/Brunei",
          "name" : "Asia/Brunei"
       },
       {
          "value" : "Asia/Choibalsan",
          "name" : "Asia/Choibalsan"
       },
       {
          "value" : "Asia/Chongqing",
          "name" : "Asia/Chongqing"
       },
       {
          "value" : "Asia/Colombo",
          "name" : "Asia/Colombo"
       },
       {
          "value" : "Asia/Damascus",
          "name" : "Asia/Damascus"
       },
       {
          "value" : "Asia/Dhaka",
          "name" : "Asia/Dhaka"
       },
       {
          "value" : "Asia/Dili",
          "name" : "Asia/Dili"
       },
       {
          "value" : "Asia/Dubai",
          "name" : "Asia/Dubai"
       },
       {
          "value" : "Asia/Dushanbe",
          "name" : "Asia/Dushanbe"
       },
       {
          "value" : "Asia/Gaza",
          "name" : "Asia/Gaza"
       },
       {
          "value" : "Asia/Harbin",
          "name" : "Asia/Harbin"
       },
       {
          "value" : "Asia/Ho_Chi_Minh",
          "name" : "Asia/Ho Chi Minh"
       },
       {
          "value" : "Asia/Hong_Kong",
          "name" : "Asia/Hong Kong"
       },
       {
          "value" : "Asia/Hovd",
          "name" : "Asia/Hovd"
       },
       {
          "value" : "Asia/Irkutsk",
          "name" : "Asia/Irkutsk"
       },
       {
          "value" : "Asia/Jakarta",
          "name" : "Asia/Jakarta"
       },
       {
          "value" : "Asia/Jayapura",
          "name" : "Asia/Jayapura"
       },
       {
          "value" : "Asia/Jerusalem",
          "name" : "Asia/Jerusalem"
       },
       {
          "value" : "Asia/Kabul",
          "name" : "Asia/Kabul"
       },
       {
          "value" : "Asia/Kamchatka",
          "name" : "Asia/Kamchatka"
       },
       {
          "value" : "Asia/Karachi",
          "name" : "Asia/Karachi"
       },
       {
          "value" : "Asia/Kashgar",
          "name" : "Asia/Kashgar"
       },
       {
          "value" : "Asia/Kathmandu",
          "name" : "Asia/Kathmandu"
       },
       {
          "value" : "Asia/Kolkata",
          "name" : "Asia/Kolkata"
       },
       {
          "value" : "Asia/Krasnoyarsk",
          "name" : "Asia/Krasnoyarsk"
       },
       {
          "value" : "Asia/Kuala_Lumpur",
          "name" : "Asia/Kuala Lumpur"
       },
       {
          "value" : "Asia/Kuching",
          "name" : "Asia/Kuching"
       },
       {
          "value" : "Asia/Kuwait",
          "name" : "Asia/Kuwait"
       },
       {
          "value" : "Asia/Macau",
          "name" : "Asia/Macau"
       },
       {
          "value" : "Asia/Magadan",
          "name" : "Asia/Magadan"
       },
       {
          "value" : "Asia/Makassar",
          "name" : "Asia/Makassar"
       },
       {
          "value" : "Asia/Manila",
          "name" : "Asia/Manila"
       },
       {
          "value" : "Asia/Muscat",
          "name" : "Asia/Muscat"
       },
       {
          "value" : "Asia/Nicosia",
          "name" : "Asia/Nicosia"
       },
       {
          "value" : "Asia/Novokuznetsk",
          "name" : "Asia/Novokuznetsk"
       },
       {
          "value" : "Asia/Novosibirsk",
          "name" : "Asia/Novosibirsk"
       },
       {
          "value" : "Asia/Omsk",
          "name" : "Asia/Omsk"
       },
       {
          "value" : "Asia/Oral",
          "name" : "Asia/Oral"
       },
       {
          "value" : "Asia/Phnom_Penh",
          "name" : "Asia/Phnom Penh"
       },
       {
          "value" : "Asia/Pontianak",
          "name" : "Asia/Pontianak"
       },
       {
          "value" : "Asia/Pyongyang",
          "name" : "Asia/Pyongyang"
       },
       {
          "value" : "Asia/Qatar",
          "name" : "Asia/Qatar"
       },
       {
          "value" : "Asia/Qyzylorda",
          "name" : "Asia/Qyzylorda"
       },
       {
          "value" : "Asia/Rangoon",
          "name" : "Asia/Rangoon"
       },
       {
          "value" : "Asia/Riyadh",
          "name" : "Asia/Riyadh"
       },
       {
          "value" : "Asia/Sakhalin",
          "name" : "Asia/Sakhalin"
       },
       {
          "value" : "Asia/Samarkand",
          "name" : "Asia/Samarkand"
       },
       {
          "value" : "Asia/Seoul",
          "name" : "Asia/Seoul"
       },
       {
          "value" : "Asia/Shanghai",
          "name" : "Asia/Shanghai"
       },
       {
          "value" : "Asia/Singapore",
          "name" : "Asia/Singapore"
       },
       {
          "value" : "Asia/Taipei",
          "name" : "Asia/Taipei"
       },
       {
          "value" : "Asia/Tashkent",
          "name" : "Asia/Tashkent"
       },
       {
          "value" : "Asia/Tbilisi",
          "name" : "Asia/Tbilisi"
       },
       {
          "value" : "Asia/Tehran",
          "name" : "Asia/Tehran"
       },
       {
          "value" : "Asia/Thimphu",
          "name" : "Asia/Thimphu"
       },
       {
          "value" : "Asia/Tokyo",
          "name" : "Asia/Tokyo"
       },
       {
          "value" : "Asia/Ulaanbaatar",
          "name" : "Asia/Ulaanbaatar"
       },
       {
          "value" : "Asia/Urumqi",
          "name" : "Asia/Urumqi"
       },
       {
          "value" : "Asia/Vientiane",
          "name" : "Asia/Vientiane"
       },
       {
          "value" : "Asia/Vladivostok",
          "name" : "Asia/Vladivostok"
       },
       {
          "value" : "Asia/Yakutsk",
          "name" : "Asia/Yakutsk"
       },
       {
          "value" : "Asia/Yekaterinburg",
          "name" : "Asia/Yekaterinburg"
       },
       {
          "value" : "Asia/Yerevan",
          "name" : "Asia/Yerevan"
       },
       {
          "value" : "Atlantic/Azores",
          "name" : "Atlantic/Azores"
       },
       {
          "value" : "Atlantic/Bermuda",
          "name" : "Atlantic/Bermuda"
       },
       {
          "value" : "Atlantic/Canary",
          "name" : "Atlantic/Canary"
       },
       {
          "value" : "Atlantic/Cape_Verde",
          "name" : "Atlantic/Cape Verde"
       },
       {
          "value" : "Atlantic/Faroe",
          "name" : "Atlantic/Faroe"
       },
       {
          "value" : "Atlantic/Madeira",
          "name" : "Atlantic/Madeira"
       },
       {
          "value" : "Atlantic/Reykjavik",
          "name" : "Atlantic/Reykjavik"
       },
       {
          "value" : "Atlantic/South_Georgia",
          "name" : "Atlantic/South Georgia"
       },
       {
          "value" : "Atlantic/St_Helena",
          "name" : "Atlantic/St Helena"
       },
       {
          "value" : "Atlantic/Stanley",
          "name" : "Atlantic/Stanley"
       },
       {
          "value" : "Australia/Adelaide",
          "name" : "Australia/Adelaide"
       },
       {
          "value" : "Australia/Brisbane",
          "name" : "Australia/Brisbane"
       },
       {
          "value" : "Australia/Broken_Hill",
          "name" : "Australia/Broken Hill"
       },
       {
          "value" : "Australia/Currie",
          "name" : "Australia/Currie"
       },
       {
          "value" : "Australia/Darwin",
          "name" : "Australia/Darwin"
       },
       {
          "value" : "Australia/Eucla",
          "name" : "Australia/Eucla"
       },
       {
          "value" : "Australia/Hobart",
          "name" : "Australia/Hobart"
       },
       {
          "value" : "Australia/Lindeman",
          "name" : "Australia/Lindeman"
       },
       {
          "value" : "Australia/Lord_Howe",
          "name" : "Australia/Lord Howe"
       },
       {
          "value" : "Australia/Melbourne",
          "name" : "Australia/Melbourne"
       },
       {
          "value" : "Australia/Perth",
          "name" : "Australia/Perth"
       },
       {
          "value" : "Australia/Sydney",
          "name" : "Australia/Sydney"
       },
       {
          "value" : "Europe/Amsterdam",
          "name" : "Europe/Amsterdam"
       },
       {
          "value" : "Europe/Andorra",
          "name" : "Europe/Andorra"
       },
       {
          "value" : "Europe/Athens",
          "name" : "Europe/Athens"
       },
       {
          "value" : "Europe/Belgrade",
          "name" : "Europe/Belgrade"
       },
       {
          "value" : "Europe/Berlin",
          "name" : "Europe/Berlin"
       },
       {
          "value" : "Europe/Bratislava",
          "name" : "Europe/Bratislava"
       },
       {
          "value" : "Europe/Brussels",
          "name" : "Europe/Brussels"
       },
       {
          "value" : "Europe/Bucharest",
          "name" : "Europe/Bucharest"
       },
       {
          "value" : "Europe/Budapest",
          "name" : "Europe/Budapest"
       },
       {
          "value" : "Europe/Chisinau",
          "name" : "Europe/Chisinau"
       },
       {
          "value" : "Europe/Copenhagen",
          "name" : "Europe/Copenhagen"
       },
       {
          "value" : "Europe/Dublin",
          "name" : "Europe/Dublin"
       },
       {
          "value" : "Europe/Gibraltar",
          "name" : "Europe/Gibraltar"
       },
       {
          "value" : "Europe/Guernsey",
          "name" : "Europe/Guernsey"
       },
       {
          "value" : "Europe/Helsinki",
          "name" : "Europe/Helsinki"
       },
       {
          "value" : "Europe/Isle_of_Man",
          "name" : "Europe/Isle of Man"
       },
       {
          "value" : "Europe/Istanbul",
          "name" : "Europe/Istanbul"
       },
       {
          "value" : "Europe/Jersey",
          "name" : "Europe/Jersey"
       },
       {
          "value" : "Europe/Kaliningrad",
          "name" : "Europe/Kaliningrad"
       },
       {
          "value" : "Europe/Kiev",
          "name" : "Europe/Kiev"
       },
       {
          "value" : "Europe/Lisbon",
          "name" : "Europe/Lisbon"
       },
       {
          "value" : "Europe/Ljubljana",
          "name" : "Europe/Ljubljana"
       },
       {
          "value" : "Europe/London",
          "name" : "Europe/London"
       },
       {
          "value" : "Europe/Luxembourg",
          "name" : "Europe/Luxembourg"
       },
       {
          "value" : "Europe/Madrid",
          "name" : "Europe/Madrid"
       },
       {
          "value" : "Europe/Malta",
          "name" : "Europe/Malta"
       },
       {
          "value" : "Europe/Mariehamn",
          "name" : "Europe/Mariehamn"
       },
       {
          "value" : "Europe/Minsk",
          "name" : "Europe/Minsk"
       },
       {
          "value" : "Europe/Monaco",
          "name" : "Europe/Monaco"
       },
       {
          "value" : "Europe/Moscow",
          "name" : "Europe/Moscow"
       },
       {
          "value" : "Europe/Oslo",
          "name" : "Europe/Oslo"
       },
       {
          "value" : "Europe/Paris",
          "name" : "Europe/Paris"
       },
       {
          "value" : "Europe/Podgorica",
          "name" : "Europe/Podgorica"
       },
       {
          "value" : "Europe/Prague",
          "name" : "Europe/Prague"
       },
       {
          "value" : "Europe/Riga",
          "name" : "Europe/Riga"
       },
       {
          "value" : "Europe/Rome",
          "name" : "Europe/Rome"
       },
       {
          "value" : "Europe/Samara",
          "name" : "Europe/Samara"
       },
       {
          "value" : "Europe/San_Marino",
          "name" : "Europe/San Marino"
       },
       {
          "value" : "Europe/Sarajevo",
          "name" : "Europe/Sarajevo"
       },
       {
          "value" : "Europe/Simferopol",
          "name" : "Europe/Simferopol"
       },
       {
          "value" : "Europe/Skopje",
          "name" : "Europe/Skopje"
       },
       {
          "value" : "Europe/Sofia",
          "name" : "Europe/Sofia"
       },
       {
          "value" : "Europe/Stockholm",
          "name" : "Europe/Stockholm"
       },
       {
          "value" : "Europe/Tallinn",
          "name" : "Europe/Tallinn"
       },
       {
          "value" : "Europe/Tirane",
          "name" : "Europe/Tirane"
       },
       {
          "value" : "Europe/Uzhgorod",
          "name" : "Europe/Uzhgorod"
       },
       {
          "value" : "Europe/Vaduz",
          "name" : "Europe/Vaduz"
       },
       {
          "value" : "Europe/Vatican",
          "name" : "Europe/Vatican"
       },
       {
          "value" : "Europe/Vienna",
          "name" : "Europe/Vienna"
       },
       {
          "value" : "Europe/Vilnius",
          "name" : "Europe/Vilnius"
       },
       {
          "value" : "Europe/Volgograd",
          "name" : "Europe/Volgograd"
       },
       {
          "value" : "Europe/Warsaw",
          "name" : "Europe/Warsaw"
       },
       {
          "value" : "Europe/Zagreb",
          "name" : "Europe/Zagreb"
       },
       {
          "value" : "Europe/Zaporozhye",
          "name" : "Europe/Zaporozhye"
       },
       {
          "value" : "Europe/Zurich",
          "name" : "Europe/Zurich"
       },
       {
          "value" : "Indian/Antananarivo",
          "name" : "Indian/Antananarivo"
       },
       {
          "value" : "Indian/Chagos",
          "name" : "Indian/Chagos"
       },
       {
          "value" : "Indian/Christmas",
          "name" : "Indian/Christmas"
       },
       {
          "value" : "Indian/Cocos",
          "name" : "Indian/Cocos"
       },
       {
          "value" : "Indian/Comoro",
          "name" : "Indian/Comoro"
       },
       {
          "value" : "Indian/Kerguelen",
          "name" : "Indian/Kerguelen"
       },
       {
          "value" : "Indian/Mahe",
          "name" : "Indian/Mahe"
       },
       {
          "value" : "Indian/Maldives",
          "name" : "Indian/Maldives"
       },
       {
          "value" : "Indian/Mauritius",
          "name" : "Indian/Mauritius"
       },
       {
          "value" : "Indian/Mayotte",
          "name" : "Indian/Mayotte"
       },
       {
          "value" : "Indian/Reunion",
          "name" : "Indian/Reunion"
       },
       {
          "value" : "Pacific/Apia",
          "name" : "Pacific/Apia"
       },
       {
          "value" : "Pacific/Auckland",
          "name" : "Pacific/Auckland"
       },
       {
          "value" : "Pacific/Chatham",
          "name" : "Pacific/Chatham"
       },
       {
          "value" : "Pacific/Chuuk",
          "name" : "Pacific/Chuuk"
       },
       {
          "value" : "Pacific/Easter",
          "name" : "Pacific/Easter"
       },
       {
          "value" : "Pacific/Efate",
          "name" : "Pacific/Efate"
       },
       {
          "value" : "Pacific/Enderbury",
          "name" : "Pacific/Enderbury"
       },
       {
          "value" : "Pacific/Fakaofo",
          "name" : "Pacific/Fakaofo"
       },
       {
          "value" : "Pacific/Fiji",
          "name" : "Pacific/Fiji"
       },
       {
          "value" : "Pacific/Funafuti",
          "name" : "Pacific/Funafuti"
       },
       {
          "value" : "Pacific/Galapagos",
          "name" : "Pacific/Galapagos"
       },
       {
          "value" : "Pacific/Gambier",
          "name" : "Pacific/Gambier"
       },
       {
          "value" : "Pacific/Guadalcanal",
          "name" : "Pacific/Guadalcanal"
       },
       {
          "value" : "Pacific/Guam",
          "name" : "Pacific/Guam"
       },
       {
          "value" : "Pacific/Honolulu",
          "name" : "Pacific/Honolulu"
       },
       {
          "value" : "Pacific/Johnston",
          "name" : "Pacific/Johnston"
       },
       {
          "value" : "Pacific/Kiritimati",
          "name" : "Pacific/Kiritimati"
       },
       {
          "value" : "Pacific/Kosrae",
          "name" : "Pacific/Kosrae"
       },
       {
          "value" : "Pacific/Kwajalein",
          "name" : "Pacific/Kwajalein"
       },
       {
          "value" : "Pacific/Majuro",
          "name" : "Pacific/Majuro"
       },
       {
          "value" : "Pacific/Marquesas",
          "name" : "Pacific/Marquesas"
       },
       {
          "value" : "Pacific/Midway",
          "name" : "Pacific/Midway"
       },
       {
          "value" : "Pacific/Nauru",
          "name" : "Pacific/Nauru"
       },
       {
          "value" : "Pacific/Niue",
          "name" : "Pacific/Niue"
       },
       {
          "value" : "Pacific/Norfolk",
          "name" : "Pacific/Norfolk"
       },
       {
          "value" : "Pacific/Noumea",
          "name" : "Pacific/Noumea"
       },
       {
          "value" : "Pacific/Pago_Pago",
          "name" : "Pacific/Pago Pago"
       },
       {
          "value" : "Pacific/Palau",
          "name" : "Pacific/Palau"
       },
       {
          "value" : "Pacific/Pitcairn",
          "name" : "Pacific/Pitcairn"
       },
       {
          "value" : "Pacific/Pohnpei",
          "name" : "Pacific/Pohnpei"
       },
       {
          "value" : "Pacific/Port_Moresby",
          "name" : "Pacific/Port Moresby"
       },
       {
          "value" : "Pacific/Rarotonga",
          "name" : "Pacific/Rarotonga"
       },
       {
          "value" : "Pacific/Saipan",
          "name" : "Pacific/Saipan"
       },
       {
          "value" : "Pacific/Tahiti",
          "name" : "Pacific/Tahiti"
       },
       {
          "value" : "Pacific/Tarawa",
          "name" : "Pacific/Tarawa"
       },
       {
          "value" : "Pacific/Tongatapu",
          "name" : "Pacific/Tongatapu"
       },
       {
          "value" : "Pacific/Wake",
          "name" : "Pacific/Wake"
       },
       {
          "value" : "Pacific/Wallis",
          "name" : "Pacific/Wallis"
       }
    ];
};
var Text = function() {};

Text.lang = document.documentElement.lang
    ? document.documentElement.lang
    : "en";

Text.get = function(key, value, wrap) {
    var text = Lang[Text.lang][key];

    if (typeof text == "undefined") {
        Log.error("Text.get("+ key +") does not exists");
        return "";
    }

    if (typeof value == "undefined") {
        return text;
    }

    if (wrap == undefined) {
        if (typeof value != "object") {
            return text.replace(/%s/, value);
        }

        $.each(value, function(index, string) {
            text = text.replace(/%s/, string);
        });
    } else {
        if (typeof value != "object") {
            value = [ value ];
        }

        var parts = text.split(/(%s)/);
        text = Utils.create("span");

        $.each(parts, function(i, t) {
            if (t == "%s") {
                Utils.create("span")
                    .addClass("cit")
                    .html(value.shift())
                    .appendTo(text);
            } else if (t != "") {
                Utils.create("span")
                    .html(t)
                    .appendTo(text);
            }
        });
    }

    return text;
};

Text.dateFormat = {
    en: {
        dayNames: [
            "So", "Mo", "Di", "Mi", "Do", "Fr", "Sa",
            "Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"
        ],
        monthNames: [
            "Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez",
            "Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"
        ]
    },
    de: {
        dayNames: [
          "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
            "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
        ],
        monthNames: [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
            "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
        ]
    }
};
var Form = function(o) {
    this.byKey = {};
    this.values = {};
    this.elements = [];
    Utils.extend(this, o);
};

Form.prototype = {
    autocomplete: false,
    format: "tall",
    appendTo: "#content",
    showButton: true,
    buttonText: false,
    action: false,
    // url: { submit: "/submit/url/", options: "/options/url/" }
    url: false,
    // onSuccess: function(result) {}
    onSuccess: false,
    // hasData is only for internal usage!
    hasData: false,
    // classes
    titleClass: "form-title",
    subtitleClass: "form-subtitle",
    errorClass: "form-error",
    successClass: "form-success",
    infoClass: "form-info",
    warningClass: "form-warning",
    tableClass: "form-table",
    formClass: false,
    createTable: false
};

Form.prototype.init = function() {
    this.container = Utils.create("div");
    this.msgbox();

    this.form = Utils.create("form")
        .appendTo(this.container);

    if (this.preventDefault) {
        this.form.submit(function(e) {
            e.preventDefault();
        });
    }

    if (this.formClass) {
        this.form.addClass(this.formClass);
    }

    if (this.appendTo) {
        this.container.appendTo(this.appendTo);
    }

    if (this.createTable === true) {
        this.table = new Table({
            type: "form",
            appendTo: this.form
        }).init().getTable();
    }

    return this;
};

Form.prototype.getContainer = function() {
    return this.form;
};

/*
    new Form().input({
        id: "id",
        type: "tel",
        name: "foo",
        value: "bar"
    });
*/
Form.prototype.input = function(o) {
    var object = Utils.extend({
        id: false,
        type: "text",
        readonly: false,
        required: false,
        placeholder: false,
        minlength: false,
        maxlength: false,
        minvalue: false,
        maxvalue: false,
        pattern: false,
        autocomplete: false,
        name: "not-available",
        value: undefined,
        appendTo: false,
        inputClass: false,
        bubbleOuterClass: false,
        bubbleClass: false,
        bubbleCloseIconClass: "hicons-gray hicons remove close-x",
        bubbleAlignment: "center right",
        bubbleWidth: false,
        genStrIconClass: "gicons-gray gicons refresh gicons-input-icon-default",
        format: this.format,
        form: this,
        width: false
    }, o);

    object.getBubbleOuterClass = function() {
        var align = this.getBubbleAlignment();
        return this.bubbleOuterClass || "i-bubble-"+ this.format +"-"+ align +"-outer";
    };

    object.getBubbleClass = function() {
        var align = this.getBubbleAlignment();
        return this.bubbleClass || "i-bubble-base i-bubble-"+ this.format +"-"+ align;
    };

    object.getClass = function() {
        return this.inputClass || "input input-"+ this.format;
    };

    object.getValue = function() {
        return this.input.val();
    };

    object.setValue = function(value) {
        return this.input.val(value);
    };

    object.clear = function() {
        this.input.val("");
    };

    object.getContainer = function() {
        return this.container;
    };

    object.getBubbleAlignment = function() {
        var align;
        if (!this.bubbleAlignment || this.bubbleAlignment == "center right") {
            align = "cr";
        } else if (this.bubbleAlignment == "bottom left") {
            align = "bl";
        }
        return align;
    };

    object.create = function() {
        var self = this;

        this.container = Utils.create("div")
            .css({ position: "relative", display: "inline-block" });

        this.input = Utils.create("input")
            .attr("type", this.type)
            .attr("name", this.name)
            .attr("data-name", this.name)
            .addClass(this.getClass())
            .appendTo(this.container);

        if (this.width) {
            this.input.css({ width: this.width });
        }

        if (this.autocomplete && this.autocomplete[this.name]) {
            new Autocomplete({
                format: this.format,
                source: this.autocomplete[this.name],
                container: this.container,
                input: this.input,
                start: 0
            }).create();
        }

        $.each(["id","placeholder","minlength","maxlength","minvalue","maxvalue","pattern"], function(i, key) {
            if (self[key] != false) {
                self.input.attr(key, self[key]);
            }
        });

        this.form.addInputValidator(this, "input", "val");

        $.each(["readonly","required"], function(i, key) {
            if (self[key] != false) {
                self.input.attr(key, key);
            }
        });

        if (this.genString) {
            Utils.create("span")
                .attr("title", Text.get("action.generate_string"))
                .tooltip()
                .addClass(this.genStrIconClass)
                .appendTo(this.container)
                .click(function(){ self.input.val(Utils.genRandStr(self.genString)) });
        }

        if (this.type == "password" && this.value) {
            this.input.attr("value", "************");
        } else if (this.value != undefined) {
            this.input.attr("value", this.value);
        }

        if (this.appendTo != false) {
            this.container.appendTo(this.appendTo);
        }
    };

    object.create();
    return object;
};

/*
    new Form().textarea({
        id: "id",
        name: "foo",
        value: "bar"
    });
*/
Form.prototype.textarea = function(o) {
    var object = Utils.extend({
        id: false,
        type: "text",
        readonly: false,
        required: false,
        placeholder: false,
        minlength: false,
        maxlength: false,
        name: "not-available",
        value: false,
        appendTo: false,
        textareaClass: false,
        bubbleOuterClass: false,
        bubbleClass: false,
        bubbleCloseIconClass: "i-bubble-close-button",
        bubbleCloseText: "x",
        format: this.format,
        form: this,
        css: false
    }, o);

    object.getBubbleOuterClass = function() {
        return this.bubbleOuterClass || "i-bubble-"+ this.format +"-cr-outer";
    };

    object.getBubbleClass = function() {
        return this.bubbleClass || "i-bubble-base i-bubble-"+ this.format +"-cr";
    };

    object.getClass = function() {
        return this.textareaClass || "textarea textarea-"+ this.format;
    };

    object.getValue = function() {
        this.textarea.text();
    };

    object.getContainer = function() {
        return this.container;
    };

    object.create = function() {
        var self = this;

        this.container = Utils.create("div")
            .css({ position: "relative", display: "inline-block" });

        this.textarea = Utils.create("textarea")
            .attr("name", this.name)
            .attr("data-name", this.name)
            .addClass(this.getClass())
            .text(this.value)
            .appendTo(this.container);

        if (this.css !== false) {
            this.textarea.css(this.css);
        }

        $.each(["id","placeholder","minlength","maxlength","minvalue","maxvalue"], function(i, key) {
            if (self[key] != false) {
                self.textarea.attr(key, self[key]);
            }
        });

        $.each(["readonly","required"], function(i, key) {
            if (self[key] != false) {
                self.textarea.attr(key, key);
            }
        });

        this.form.addInputValidator(this, "textarea", "html");

        if (this.appendTo != false) {
            this.container.appendTo(this.appendTo);
        }
    };

    object.create();
    return object;
};

/*
    +-------------------------------------------------------------+
    |  (div) select-container                                     | 
    |                                                             |
    |  +-------------------------------------------------------+  |
    |  | (input) hidden input field                            |  |
    |  +-------------------------------------------------------+  |
    |                                                             |
    |  +-------------------------------------------------------+  |
    |  | (div) select                                          |  |
    |  |                                                       |  |
    |  | +------------------------+ +------------------------+ |  |
    |  | | (span) select-selected | | (span) select-caret    | |  |
    |  | +------------------------+ +------------------------+ |  |
    |  +-------------------------------------------------------+  |
    |                                                             |
    |  +-------------------------------------------------------+  |
    |  | (ul) select-list                                      |  |
    |  |                                                       |  |
    |  |                                                       |  |
    |  |                                                       |  |
    |  +-------------------------------------------------------+  |
    +-------------------------------------------------------------+

    select-container    - The container to place all elements.
    hidden input        - To save the selected item from the select list (has no class).
                          The input field is useable for jQuery.serializeArray().
    select              - The select drop down box.
    select-selected     - The selected item from the select list (has no class).
    select-caret        - A drop down image.
    select-list         - The item list that is opened on click.

    new Form().select({
        id: "id",
        placeholder: "This field is required",
        selected: "bar",
        appendTo: "xxx",
        options: [
            { name: "foo", value: "foo" },
            { name: "bar", value: "bar" },
            { name: "baz", value: "baz" }
        ]
    });

    A selected item can be marked with
        selected: "value"

    or with
        options: [
            { name: "foo", value: "foo", selected: true }
        ]
*/
Form.prototype.select = function(o) {
    var object = Utils.extend({
        id: false,
        appendTo: false,
        placeholder: "-",
        format: this.format,
        form: this,
        name: false,
        values: false,
        selected: false,
        callback: false,
        required: false,
        passNameValue: false,
        containerClass: false,
        dropDownClass: false,
        selectedClass: false,
        caretClass: false,
        listClass: false,
        getValueName: false,
        requiredMarkerClass: "rwb",
        short: false,
        width: false,
        fontSize: false,
        readOnly: false,
        store: false
    }, o);

    object.getContainerClass = function() {
        return this.containerClass || "select-container";
    };

    object.getDropDownClass = function() {
        return this.mainClass || "select select-"+ this.format;
    };

    object.getCaretClass = function() {
        return this.caretClass || "select-caret";
    };

    object.getListClass = function() {
        return this.listClass || "select-list-"+ this.format
    };

    object.getSelected = function() {
        return { option: this.selectSelected.text(), value: this.hiddenInput.val() };
    };

    object.getSelectedOption = function() {
        return this.selected.data("value");
    };

    object.getSelectedValue = function() {
        return this.hiddenInput.val();
    };

    object.destroy = function() {
        this.container.remove();
    };

    object.toggle = function() {
        if (this.selectList.is(":hidden")) {
            this.selectList.show();
        } else {
            this.selectList.hide();
        }
    };

    object.getContainer = function() {
        return this.container;
    };

    object.create = function() {
        var self = this;

        this.container = Utils.create("div")
            .addClass(this.getContainerClass())
            .click(function() { self.toggle() });

        if (this.id != false) {
            this.container.attr("id", this.id);
        }

        this.hiddenInput = Utils.create("input")
            .attr("type", "hidden")
            .attr("name", this.name)
            .appendTo(this.container);

        if (this.selected != false) {
            this.hiddenInput.attr("value", this.selected);
        }

        this.selectDropDown = Utils.create("div")
            .attr("data-name", this.name)
            .addClass(this.getDropDownClass())
            .appendTo(this.container);

        if (this.title) {
            this.selectDropDown.attr("title", this.title).tooltip();
        }

        if (self.required == true) {
            this.selectDropDown.addClass(this.requiredMarkerClass);
        }

        this.selectSelected = Utils.create("span")
            .html(this.placeholder)
            .appendTo(this.selectDropDown);

        this.selectCaret = Utils.create("span")
            .addClass(this.getCaretClass())
            .appendTo(this.selectDropDown);

        this.selectList = Utils.create("ul")
            .addClass(this.getListClass())
            .appendTo(this.container);

        if (this.short) {
            this.selectDropDown.css({ width: "130px" });
            this.selectList.css({ "min-width": "130px" });
        }

        if (this.width) {
            this.selectDropDown.css({ width: this.width });
            this.selectList.css({ "min-width": this.width });
        }

        if (this.maxHeight) {
            this.selectList.css({ "max-height": this.maxHeight });
        }

        if (this.options) {
            if (this.secondsToFormValues == true) {
                this.addOptions(
                    Utils.secondsToFormValues(this.options, this.nullString)
                );
            } else {
                this.addOptions(this.options);
            }
        }

        if (this.appendTo) {
            this.container.appendTo(this.appendTo);
        };
    };

    object.addOptions = function(options) {
        var self = this;

        $.each(options, function(i, item) {
            var name, value, raw, addClass;

            if (typeof item == "object") {
                name = item.name || item.label || item.option || item.key;
                value = item.value;
                addClass = item.addClass;
            } else {
                name = value = item;
            }

            if (self.getValueName) {
                name = self.getValueName(value);
            }

            var onClick = function() {
                if (self.store) {
                    self.store.to[self.store.as] = value;
                }

                if (self.readOnly == false) {
                    self.hiddenInput.val(value);
                    self.selectSelected.html(name);
                    self.selectList.find("li").removeAttr("selected");
                    $(this).attr("selected", "selected");
                    if (self.required == true && self.hiddenInput.val() != undefined) {
                        self.selectDropDown.removeClass(self.requiredMarkerClass);
                    }
                }
                if (self.callback) {
                    if (self.passNameValue == true) {
                        self.callback(name, value);
                    } else {
                        self.callback(value);
                    }
                }
            };

            var option = Utils.create("li")
                .attr("data-value", value)
                .html(name)
                .click(onClick)
                .appendTo(self.selectList);

            if (self.showValue === true) {
                Utils.create("span")
                    .text(" ("+ value +")")
                    .appendTo(option);
            }

            if (addClass) {
                option.addClass(addClass);
            }

            if (value == self.selected) {
                self.hiddenInput.val(value);
                self.selectSelected.html(name);
                self.selected = option;
                option.attr("selected", "selected");
                if (self.hiddenInput.val() != undefined) {
                    self.selectDropDown.removeClass(self.requiredMarkerClass);
                }
                if (self.store) {
                    self.store.to[self.store.as] = value;
                }
            }
        });
    };

    object.replaceOptions = function(o) {
        this.selectList.html("");
        this.hiddenInput.val("");
        if (!o.selected) {
            this.selectSelected.html(this.placeholder);
        }
        this.selected = o.selected;
        this.options = o.options;
        this.addOptions(o.options);
    };

    object.create();
    return object;
};

Form.prototype.multiselect = function(o) {
    var object = Utils.extend({
        id: false,
        appendTo: false,
        format: this.format,
        form: this,
        size: 5,
        name: false,
        values: false,
        selected: false,
        callback: false,
        required: false,
        listClass: false,
        getValueName: false
    }, o);

    object.getContainer = function() {
        return this.container;
    };

    object.getListClass = function() {
        return this.listClass || "input input-"+ this.format
    };

    object.create = function() {
        var self = this;

        this.container = Utils.create("div");

        this.hiddenInput = Utils.create("input")
            .attr("type", "hidden")
            .attr("name", this.name)
            .attr("value", "")
            .appendTo(this.container);

        this.selectList = Utils.create("select")
            .attr("name", this.name)
            .attr("data-name", this.name)
            .attr("multiple", "multiple")
            .attr("size", this.size)
            .addClass(this.getListClass())
            .appendTo(this.container);

        if (this.id) {
            this.container.attr("id", this.id);
        }

        if (this.selected) {
            if (this.selected && typeof this.selected == "string") {
                this.selected = this.selected.split(",");
            }
            var selected = this.selected;
            this.selected = {};
            $.each(selected, function(i, x) {
                this.selected[x] = true;
            });
        } else {
            this.selected = {};
        }

        $.each(this.options, function(i, item) {
            var name, value, raw;

            if (typeof item == "object") {
                name = item.name || item.label || item.option || item.key;
                value = item.value;
            } else {
                name = value = item;
            }

            if (self.getValueName) {
                name = self.getValueName(value);
            }

            var option = Utils.create("option")
                .attr("value", value)
                .html(name)
                .appendTo(self.selectList);

            if (self.selected[value]) {
                option.attr("selected", "selected");
            }
        });

        if (this.appendTo) {
            this.container.appendTo(this.appendTo);
        }
    };

    object.create();
    return object;
};

/*
    new Form().radio({
        id: "id",
        checked: "bar",
        appendTo: "xxx",
        options: [
            { label: "foo", value: "foo" },
            { label: "bar", value: "bar" },
            { label: "baz", value: "baz" }
        ]
    });

    A checked radio button can be marked with
        checked: "value"

    or with
        options: [
            { label: "foo", value: "foo", checked: true }
        ]
*/
Form.prototype.radio = function(o) {
    var object = Utils.extend({
        id: false,
        appendTo: false,
        format: this.format,
        form: this,
        name: false,
        options: false,
        checked: false,
        callback: false,
        onClick: false,
        passNameValue: false,
        containerClass: false,
        radioClass: false,
        itemsPerRow: false,
        bool: false
    }, o);

    object.getClass = function() {
        return this.radioClass || "radio radio-"+ this.format;
    };

    object.getContainer = function() {
        return this.container;
    };

    object.create = function() {
        var self = this;

        this.container = Utils.create("div")
            .addClass(this.getClass());

        if (this.id) {
            this.container.attr("id", this.id);
        }

        if (this.bool) {
            this.options = [
                { value: 0, label: Text.get("bool.yesno.0"), checked: self.checked == "0" ? true : false },
                { value: 1, label: Text.get("bool.yesno.1"), checked: self.checked == "1" ? true : false }
            ];
        }

        var itemCounter = 0;

        $.each(this.options, function(i, item) {
            itemCounter++;

            var attrID = "radio-"+ self.name + i,
                label, value, checked;

            if (typeof item == "object") {
                label = item.label || item.name || item.option || item.key;
                value = item.value;
                checked = item.checked;
            } else {
                label = value = item;
                checked = this.checked == name ? true : false;
            }

            var radio = Utils.create("input")
                .attr("type", "radio")
                .attr("id", attrID)
                .attr("name", self.name)
                .attr("value", value)
                .appendTo(self.container);

            if (item.checked || self.checked == value) {
                radio.attr("checked", "checked");
                if (self.callback) {
                    self.callback(value);
                }
            }

            if (self.callback) {
                radio.click(function() { self.callback(value) });
            }

            if (self.store) {
                radio.click(function() {
                    self.store.to[self.store.as] = value;
                });
            }

            if (self.onClick) {
                radio.click(function() { self.onClick(value) });
            }

            var label = Utils.create("label")
                .attr("for", attrID)
                .text(label)
                .appendTo(self.container);

            if (item.title) {
                label.attr("title", item.title).tooltip();
            } else if (self.title && self.bool && value == 1) {
                label.attr("title", self.title).tooltip();
            }

            if (self.itemsPerRow) {
                label.css({ width: "26px", "padding-top": "6px", "padding-bottom": "6px" });
                if (itemCounter == self.itemsPerRow) {
                    itemCounter = 0;
                    Utils.create("br").appendTo(self.container);
                }
            }
        });

        if (this.appendTo) {
            this.container.appendTo(this.appendTo);
        }
    };

    object.create();
    return object;
};

/*
    new Form().checkbox({
        name: "status",
        options: [ "OK", "WARNING", "CRITICAL", "UNNKOWN", "INFO" ],
        checked: "OK,CRITICAL",
        commaSeparatedList: true
    });
*/
Form.prototype.checkbox = function(o) {
    var object = Utils.extend({
        id: false,
        appendTo: false,
        format: this.format,
        form: this,
        name: false,
        options: false,
        checked: false,
        callback: false,
        passNameValue: false,
        checkboxClass: false,
        commaSeparatedList: false
    }, o);

    object.getClass = function() {
        return this.checkboxClass || "checkbox checkbox-"+ this.format;
    };

    object.getCheckedValues = function() {
        var checkedValues = [];
        this.container.find("input:checked").each(function() {
            checkedValues.push($(this).val());
        });
        return checkedValues;
    };

    object.getContainer = function() {
        return this.container;
    };

    object.create = function() {
        var self = this,
            checked = {};

        if (this.commaSeparatedList == true) {
            if (this.checked) {
                this.checked = this.checked.split(",");
            } else {
                this.checked = [];
            }
        }

        if ($.isArray(this.checked)) {
            $.each(this.checked, function(i, key) {
                checked[key] = true;
            });
        }

        this.container = Utils.create("div")
            .attr("data-name", this.name)
            .addClass(this.getClass());

        /*
            How to handle checkboxes: If no checkbox is checked in a form
            then the browser send nothing, but sometimes we want an empty
            list instead. For this reason an empty input hidden field is
            added. The server should remove the first element if this
            is empty.

                foo=""
                foo=1
                foo=2
                foo=3

            The result is foo=[1,2,3].

                foo=""

            This would be an empty list and the result is foo=[].
        */

        Utils.create("input")
            .attr("type", "hidden")
            .attr("name", self.name)
            .attr("value", "")
            .appendTo(this.container);

        $.each(this.options, function(i, option) {
            var attrID = "int-"+ self.name + i;

            if (typeof option == "string" || typeof option == "number") {
                option = {
                    label: option,
                    value: option,
                    checked: checked[option]
                };
            }

            var checkbox = Utils.create("input")
                .attr("id", attrID)
                .attr("type", "checkbox")
                .attr("name", self.name)
                .attr("value", option.value)
                .appendTo(self.container);

            if (option.checked) {
                checkbox.attr("checked", "checked");
            }

            if (self.store) {
                checkbox.click(function() {
                    self.store.to[self.store.as] = self.getCheckedValues();
                });
            }

            var label = Utils.create("label")
                .attr("for", attrID)
                .appendTo(self.container);

            if (self.emptyLabel != true) {
                label.html(option.label || option.value);
            }

            if (option.title) {
                label.attr("title", option.title).tooltip();
            }
        });

        if (this.store) {
            this.store.to[this.store.as] = this.getCheckedValues();
        }

        if (this.appendTo) {
            this.container.appendTo(this.appendTo);
        }
    };

    object.create();
    return object;
};

Form.prototype.slider = function(o) {
    var object = Utils.extend({}, o);

    object.getContainer = function() {
        return this.container;
    };

    object.create = function() {
        var self = this,
            max = -1,
            val = 0,
            options = this.options;

        this.container = Utils.create("div")
            .attr("data-name", this.name)
            .addClass("option-slider-container");

        this.slideContainer = Utils.create("div")
            .addClass("option-slider")
            .appendTo(this.container);

        this.labelContainer = Utils.create("div")
            .addClass("option-slider-label")
            .appendTo(this.container);

        this.input = Utils.create("input")
            .attr("type", "hidden")
            .attr("name", this.name)
            .attr("value", "")
            .appendTo(this.container);

        if (this.secondsToFormValues == true) {
            options = Utils.secondsToFormValues(options, this.nullString)
        }

        this.options = [];
        $.each(options, function(i, option) {
            var label, value, checked;

            if (typeof option == "string" || typeof option == "number") {
                value = label = option;
                checked = self.checked == value ? true : false;
            } else {
                value = option.value;
                label = option.label || option.name || option.option || option.key;
                checked = self.checked == value ? true : option.checked;
            }

            if (self.getValueName) {
                label = self.getValueName(value);
            }

            self.options.push({ label: label, value: value });
            max += 1;

            if (checked == true) {
                val = max;
                self.select(val);
            }
        });

        this.slideContainer.slider({
            min: 0,
            max: max,
            value: val,
            slide: function(event, ui) { self.select(ui.value) }
        });

        if (this.appendTo) {
            this.container.appendTo(this.appendTo);
        }
    };

    object.select = function(pos) {
        var option = this.options[pos];
        this.input.val(option.value);
        this.labelContainer.html(option.label);
    };

    object.create();
    return object;
};

Form.prototype.iconList = function(o) {
    var object = Utils.extend({
        checked: false,
        items: false,
        even: false,
        multiple: false,
        buttonsPerRow: undefined,
        callback: false,
        css: false
    }, o);

    object.create = function() {
        var self = this,
            buttonsPerRow = this.buttonsPerRow;
        this.cache = [];
        this.container = Utils.create("div");

        // items = [ { name: "This is Foo", value: "foo", checked: true } ]
        $.each(this.options, function(i, item) {
            var name, value, checked, title;

            if (typeof item == "object") {
                if (item.icon) {
                    name = Utils.create("span").addClass(item.icon);
                } else {
                    name = item.label || item.name || item.option || item.key || item.value;
                }
                value = item.value;
                checked = self.checked == value ? true : item.checked;
                title = item.title;
            } else {
                name = value = item;
                checked = self.checked == name ? true : value;
            }

            var button = Utils.create("div")
                .addClass("btn btn-white")
                .html(name)
                .appendTo(self.container)
                .click(function() {
                    self.switchItem(value);
                    if (self.callback) {
                        self.callback(value);
                    }
                });

            if (self.css) {
                button.css(self.css);
            }

            if (item.icon) {
                button.addClass("btn-icon-unselected");
            }

            if (self.even == true) {
                button.addClass("btn-icon-even");
            }

            if (title) {
                button.attr("title", title).tooltip();
            }

            if (buttonsPerRow != undefined) {
                buttonsPerRow = buttonsPerRow - 1
                if (buttonsPerRow == 0) {
                    buttonsPerRow = self.buttonsPerRow;
                    Utils.create("br").appendTo(self.container);
                }
            }

            self.cache.push({
                value: value,
                button: button,
                input: false,
                icon: item.icon ? true : false
            });

            if (checked == true) {
                self.switchItem(value);
            }
        });

        if (this.appendTo) {
            this.container.appendTo(this.appendTo);
        }
    };

    object.switchItem = object.switchTo = function(value) {
        if (this.multiple) {
            this.switchMultipleItems(value);
        } else {
            this.switchSingleItem(value);
        }
    };

    object.switchMultipleItems = function(value) {
        var self = this;
        $.each(this.cache, function(i, item) {
            if (item.value == value) {
                if (item.input) {
                    item.input.remove();
                    item.input = false;
                    if (item.icon) {
                        item.button.addClass("btn-icon-unselected");
                    } else {
                        item.button.removeClass("btn-selected");
                    }
                } else {
                    item.input = self.createInput(value);
                    if (item.icon) {
                        item.button.removeClass("btn-icon-unselected");
                    } else {
                        item.button.addClass("btn-selected");
                    }
                }
            }
        });
    };

    object.switchSingleItem = function(value) {
        var self = this;
        $.each(this.cache, function(i, item) {
            if (item.value == value && item.input == false) {
                item.input = self.createInput(value);
                if (item.icon) {
                    item.button.removeClass("btn-icon-unselected");
                } else {
                    item.button.addClass("btn-selected");
                }
            } else if (item.value != value && item.input) {
                item.input.remove();
                item.input = false;
                if (item.icon) {
                    item.button.addClass("btn-icon-unselected");
                } else {
                    item.button.removeClass("btn-selected");
                }
            }
        });
    };

    object.createInput = function(value) {
        return Utils.create("input")
            .attr("type", "hidden")
            .attr("name", this.name)
            .attr("value", value)
            .appendTo(this.container);
    };

    object.create();
    return object;
};

Form.prototype.button = function(o) {
    var object = Utils.extend({
        id: false,
        appendTo: false,
        format: this.format,
        form: this,
        name: false,
        value: false,
        text: Text.get("action.submit"),
        callback: false,
        css: false,
        buttonClass: false
    }, o);

    object.getClass = function() {
        return this.buttonClass || "btn btn-white btn-"+ this.format;
    };

    object.getContainer = function() {
        return this.button;
    };

    object.create = function() {
        var self = this;

        this.button = Utils.create("div")
            .addClass(this.getClass())
            .html(this.text)
            .click(function(){
                if (self.callback) {
                    self.callback();
                } else {
                    self.form.submit();
                }
            });

        if (this.css) {
            this.button.css(this.css);
        }

        $.each([ "id", "name", "value" ], function(i, key) {
            if (this[key]) {
                this.button.attr(key, this[key]);
            }
        });

        if (this.appendTo) {
            this.button.appendTo(this.appendTo);
        }
    };

    object.create();
    return object;
};

Form.prototype.datetime = function(o) {
    var object = Utils.extend({
        id: false,
        name: false,
        placeholder: false,
        value: false,
        addClass: false,
        appendTo: false,
        format: this.format,
        readonly: false,
        zIndex: 3,
        maxlength: 17,
        ampm: false,
        timeFormat: "hh:mm:ss",
        dateFormat: "yy-mm-dd",
        stepMinute: 15
    }, o);

    object.getClass = function() {
        return this.addClass || "input input-"+ this.format;
    };

    object.clear = function() {
        this.input.val("");
    };

    object.setValue = function(value) {
        this.input.val(value);
    };

    object.create = function() {
        this.input = Utils.create("input")
            .attr("type", "text")
            .attr("maxlength", this.maxlength)
            .addClass(this.getClass())
            .css({ "z-index": this.zIndex });

        if (this.id) {
            this.input.attr("id", this.id);
        }
        if (this.readonly) {
            this.input.attr("readonly", "readonly");
        }
        if (this.name) {
            this.input.attr("name", this.name);
            this.input.attr("data-name", this.name);
        }
        if (this.placeholder) {
            this.input.attr("placeholder", this.placeholder);
        }
        if (this.value != false) {
            this.input.attr("value", this.value);
        }
        if (this.appendTo) {
            this.input.appendTo(this.appendTo);
        }

        this.input.datetimepicker({
            ampm: this.ampm,
            timeFormat: this.timeFormat,
            dateFormat: this.dateFormat,
            stepMinute: this.stepMinute
        });
    };

    object.create();
    return object;
};

/*
    Here we are to create full automatic a form
    that is pressed into a 2-column-table.
*/
Form.prototype.create = function() {
    Log.debug("create a new form");

    var self = this;
    this.container = this.appendTo;

    if (this.url && this.url.options && this.hasData == false) {
        return this.getOptions();
    }

    if (this.values == undefined) {
        this.values = {};
    }

    if (this.options == undefined) {
        this.options = {};
    }

    if (this.title) {
        Utils.create("div")
            .addClass(this.titleClass)
            .html(this.title)
            .appendTo(this.container);
    }

    if (this.subtitle) {
        Utils.create("div")
            .addClass(this.subtitleClass)
            .html(this.subtitle)
            .appendTo(this.container);
    }

    this.msgbox();

    this.form = Utils.create("form")
        .appendTo(this.container);

    this.table = Utils.create("table")
        .addClass(this.tableClass)
        .appendTo(this.form);

    if (this.action) {
        this.buttonText = Text.get("action."+ this.action);
    }

    if (this.showButton == true) {
        this.button({
            appendTo: this.form,
            buttonText: this.buttonText
        }).button.css({ "margin-bottom": "20px" });
    }

    $.each(this.elements, function(i, e) {
        self.byKey[e.name] = e;
        self.createElement(e);
    });

    return this;
};

Form.prototype.createElement = function(e) {
    var table = e.table || this.table,
        tr = Utils.create("tr").appendTo(table),
        th = Utils.create("th").appendTo(tr),
        td = Utils.create("td").appendTo(tr),
        value = e.value == undefined ? this.values[e.name] : e.value;

    if (e.text) {
        th.html(Utils.escape(e.text));
    }

    if (e.element == "multiselect" || e.element == "textarea") {
        th.css({ "vertical-align": "top", "padding-top": "12px" });
    }

    if (e.required == true) {
        Utils.create("span").html(" * ").appendTo(th);
    }

    var hasDesc = false,
        descBox = Utils.create("div");

    Utils.create("h2")
        .html(e.text)
        .appendTo(descBox);

    if (e.desc) {
        hasDesc = true;
        Utils.create("p")
            .html(e.desc)
            .appendTo(descBox);
    }

    if (e.minlength != undefined || e.maxlength != undefined || e.minvalue != undefined || e.maxvalue != undefined) {
        hasDesc = true;
        var small = Utils.create("small")
            .appendTo(descBox);

        if (e.minlength != undefined) {
            Utils.create("div")
                .html(Text.get("text.min_length", e.minlength))
                .appendTo(small);
        }
        if (e.maxlength != undefined) {
            Utils.create("div")
                .html(Text.get("text.max_length", e.maxlength))
                .appendTo(small);
        }
        if (e.minvalue != undefined && e.maxvalue != undefined) {
            Utils.create("div")
                .html(Text.get("text.range_value", [ e.minvalue, e.maxvalue ]))
                .appendTo(small);
        } else if (e.minvalue != undefined) {
            Utils.create("div")
                .html(Text.get("text.min_value", e.minvalue))
                .appendTo(small);
        } else if (e.maxvalue != undefined) {
            Utils.create("div")
                .html(Text.get("text.max_value", e.maxvalue))
                .appendTo(small);
        }
    }

    if (hasDesc == true) {
        new iButton({ text: descBox, width: e.descBoxWidth, css: e.descBoxCss }).appendTo(th);
    }

    var copy = Utils.extend({}, e);
    delete copy.element;
    copy.appendTo = td;

    if (e.element == "radio-yes-no") {
        copy.bool = true;
        copy.checked =  this.getCheckedValue(e);
        this.radio(copy);
    } else if (e.element == "radio") {
        copy.options = e.options || this.options[e.name];
        copy.checked = this.getCheckedValue(e);
        this.radio(copy);
    } else if (e.element == "input") {
        copy.value = value;
        copy.autocomplete = this.autocomplete;
        this.input(copy);
    } else if (e.element == "textarea") {
        copy.value = value;
        this.textarea(copy);
    } else if (e.element == "checkbox") {
        copy.options = e.options || this.options[e.name];
        copy.checked = this.getCheckedValue(e);
        this.checkbox(copy);
    } else if (e.element == "select" || e.element == "multiselect") {
        copy.options = e.options || this.options[e.name];
        copy.selected = this.getCheckedValue(e);
        this[e.element](copy);
    } else if (e.element == "slider") {
        copy.options = e.options || this.options[e.name];
        copy.checked = this.getCheckedValue(e);
        this.slider(copy);
    }
};

Form.prototype.getCheckedValue = function(e) {
    if (e.selected != undefined) {
        return e.selected;
    }
    if (e.checked != undefined) {
        return e.checked;
    }
    if (this.values[e.name] != undefined) {
        return this.values[e.name];
    }
};

Form.prototype.submit = function() {
    var self = this,
        data = this.getData();

    this.messageContainer.hide();
    this.messageContainer.removeClass(this.errorClass);
    this.messageContainer.removeClass(this.successClass);

    if (this.submitCallback) {
        this.submitCallback(data);
        return false;
    }

    Ajax.post({
        url: this.url.submit,
        data: data,
        async: false,
        token: true,
        success: function(result) {
            if (result.status == "ok") {
                if (self.onSuccess) {
                    self.onSuccess(result.data);
                } else {
                    self.messageContainer.addClass(self.successClass);
                    self.messageContainer.html(
                        self.action === "create"
                            ? Text.get("info.create_success")
                            : Text.get("info.update_success")
                    );
                    self.messageContainer.fadeIn(400);
                    $("#content-outer").scrollTop(0);
                    setTimeout(function() { self.messageContainer.fadeOut(400) }, 3000);
                }
            } else {
                self.messageContainer.addClass(self.errorClass);
                self.messageContainer.html(Utils.escape(result.data.message));
                self.messageContainer.fadeIn(400);
                if (result.data.failed) {
                    self.markErrors(result.data.failed);
                }
                //$.each(result.data.failed, function(i, item) {
                //    Log.debug("[data-name='" + item + "']");
                //    var object = self.form.find("[data-name='" + item + "']").addClass("rwb");
                //});
                $("#content-outer").scrollTop(0);
            }
        }
    });
};

Form.prototype.msgbox = function(o) {
    if (!o) {
        o = { appendTo: this.container };
    }
    this.messageContainer = Utils.create("div")
        .hide()
        .appendTo(o.appendTo || this.container || this.appendTo);
};

Form.prototype.markErrors = function(names) {
    var self = this;
    $.each(names, function(i, name) {
        Log.debug("[data-name='" + name + "']");
        var object = self.form.find("[data-name='" + name + "']").addClass("rwb");
    });
};

Form.prototype.removeErrors = function() {
    this.form.find(".rwb").removeClass("rwb");
};

Form.prototype.table = function() {
    return new Table({ type: "form" }).init();
};

Form.prototype.getData = function() {
    var self = this,
        formData = this.form.serializeArray(),
        data = {};

    this.removeErrors();

    $.each(formData, function(i, e) {
        var keyOpts = self.byKey[e.name];

        // The token is not in list... so skip undefined options
        if (keyOpts != undefined && (keyOpts.element == "checkbox" || keyOpts.element == "multiselect" || keyOpts.forceArray == true)) {
            if (data[e.name] == undefined) {
                data[e.name] = [ ];
                // If the first value is empty then it's from
                // the hidden input field to force an array.
                if (e.value == undefined || e.value == "") {
                    return true;
                }
            }
            data[e.name].push(e.value);
        } else if (data[e.name] == undefined) {
            data[e.name] = e.value;
        } else {
            if (typeof data[e.name] != "object") {
                data[e.name] = [ data[e.name] ];
            }
            data[e.name].push(e.value);
        }
    });

    if (this.postpareDataCallback) {
        this.postpareDataCallback(data);
    }
    if (this.overwriteDataCallback) {
        data = this.overwriteDataCallback(data);
    }

    if (this.splice) {
        $.each(this.splice, function(i, str) {
            data[str] = {};
            $.each(data, function(key, value) {
                // option:warning
                var parts = key.split(":"),
                    spliceKey = parts.shift(),
                    inputName = parts.join(":");

                if (spliceKey == str && inputName) {
                    data[spliceKey][inputName] = value;
                    delete data[key];
                }
            });
        });
    }

    return data;
};

Form.prototype.setOption = function(opt, key, value) {
    if (!this.byKey[opt]) {
        this.byKey[opt] = {};
    }
    this.byKey[opt][key] = value;
};

Form.prototype.getOptions = function() {
    var self = this;
    this.hasData = true;

    Ajax.post({
        url: this.url.options,
        async: false,
        success: function(result) {
            self.options = result.data.options;
            self.values = result.data.values;
            self.create();
        }
    });
};

/*
    +------------------------------------------------------------------------------------+
    | this.container                                                                     |
    | +--------------------------------------------------------------------------------+ |
    | | this.titleContainer                                                            | |
    | | +----------------------------------------------------------------------------+ | |
    | | | this.title                                                                 | | |
    | | +----------------------------------------------------------------------------+ | |
    | | +----------------------------------------------------------------------------+ | |
    | | | this.subtitle                                                              | | |
    | | +----------------------------------------------------------------------------+ | |
    | +--------------------------------------------------------------------------------+ |
    | +-------------------------+ +------------------------+ +-------------------------+ |
    | | this.left.container     | | this.button.container  | | this.right.container    | |
    | | +---------------------+ | | +--------------------+ | | +---------------------+ | |
    | | | this.left.title     | | | | this.button.add    | | | | this.right.title    | | |
    | | +---------------------+ | | | this.button.remove | | | +---------------------+ | |
    | | +---------------------+ | | |                    | | | +---------------------+ | |
    | | | this.left.search    | | | |                    | | | | this.right.search   | | |
    | | | this.left.selected  | | | |                    | | | | this.right.selected | | |
    | | +---------------------+ | | |                    | | | +---------------------+ | |
    | | +---------------------+ | | |                    | | | +---------------------+ | |
    | | | this.left.table     | | | |                    | | | | this.right.table    | | |
    | | |                     | | | |                    | | | |                     | | |
    | | |                     | | | |                    | | | |                     | | |
    | | |                     | | | |                    | | | |                     | | |
    | | |                     | | | |                    | | | |                     | | |
    | | |                     | | | |                    | | | |                     | | |
    | | +---------------------+ | | |                    | | | +---------------------+ | |
    | | +---------------------+ | | |                    | | | +---------------------+ | |
    | | | this.left.pager     | | | |                    | | | | this.right.pager    | | |
    | | +---------------------+ | | |                    | | | +---------------------+ | |
    | +-------------------------+ +------------------------+ +-------------------------+ |
    +------------------------------------------------------------------------------------+

    Each Id consists of a prefix, the keyword 'int' and a postfix.

        #prefix-int-postfix

    The prefix is the parent Id of the hole group container.
    The postfix is the usage of a inner container like title, button and so on.

    new Form().group({
        title: "Title",
        subtitle: "Subtitle",
        left: {
            title:
            listURL:
            searchURL:
            updateURL:
        },
        right: {
            title:
            listURL:
            searchURL:
            updateURL:
        },
        columns: [
            {
                name: "id",
                text: Text.get("schema.host.attr.id")
            },{
                name: "hostname",
                text: Text.get("schema.host.attr.hostname")
            },{
                name: "ipaddr",
                text: Text.get("schema.host.attr.ipaddr")
            }
        ]
    });
*/
Form.prototype.group = function(o) {
    var object = Utils.extend({
        appendTo: false,
        boxWidth: "500px",
        titleClass: "form-title",
        subtitleClass: "form-subtitle",
        cache: { selected: { left: {}, right: {} } },
        button: {},
        form: this
    }, o);

    object.create = function() {
        this.createMainBox();
        this.createBox(this.left);
        this.createButtonBox();
        this.createBox(this.right);
        this.createTable(this.left);
        this.createTable(this.right);
    };

    object.createMainBox = function() {
        this.container = Utils.create("div");

        if (this.appendTo) {
            this.container.appendTo(this.appendTo);
        }

        this.messageContainer = Utils.create("div")
            .appendTo(this.container);

        this.titleContainer = Utils.create("div")
            .appendTo(this.container);

        if (this.title) {
            this.title = Utils.create("div")
                .addClass(this.titleClass)
                .html(this.title)
                .appendTo(this.titleContainer);
        }

        if (this.subtitle) {
            this.subtitle = Utils.create("div")
                .addClass(this.subtitleClass)
                .html(this.subtitle)
                .appendTo(this.titleContainer);
        }
    };

    object.createBox = function(o) {
        o.container = Utils.create("div")
            .css({ width: this.boxWidth, display: "inline-block", "vertical-align": "top" })
            .appendTo(this.container);

        o.titleContainer = Utils.create("div")
            .appendTo(o.container);

        o.title = Utils.create("h3")
            .addClass("h3")
            .html(o.title || "")
            .appendTo(o.container);

        o.counterContainer = Utils.create("div")
            .css({ float: "right", "margin-left": "6px", "margin-top": "5px" })
            .appendTo(o.container);

        o.searchContainer = Utils.create("div")
            .css({ float: "right", "margin-left": "6px" })
            .appendTo(o.container);

        Utils.create("div")
            .addClass("clear")
            .appendTo(o.container);

        o.selected = Utils.create("div")
            .attr("title", Text.get("action.show_selected_objects"))
            .addClass("btn btn-white btn-small")
            .html("0")
            .appendTo(o.counterContainer)
            .tooltip();

        o.tableContainer = Utils.create("div")
            .appendTo(o.container);

        o.pagerContainer = Utils.create("div")
            .appendTo(o.container);
    };

    object.createButtonBox = function() {
        var self = this;

        // button container
        this.button.container = Utils.create("div")
            .css({ width: "40px", padding: "0 13px", display: "inline-block", "vertical-align": "top" })
            .appendTo(this.container);

        // remove button
        this.button.add = Utils.create("span")
            .attr("title", Text.get("action.remove"))
            .css({ "margin-top": "92px" })
            .addClass("btn btn-white btn-icon")
            .html(Utils.create("span").addClass("hicons hicons-gray chevron-right"))
            .appendTo(this.button.container)
            .tooltip()
            .click(function() { self.addOrRemove("add") });

        // add button
        this.button.remove = Utils.create("span")
            .attr("title", Text.get("action.add"))
            .addClass("btn btn-white btn-icon")
            .html(Utils.create("span").addClass("hicons hicons-gray chevron-left"))
            .appendTo(this.button.container)
            .tooltip()
            .click(function() { self.addOrRemove("remove") });
    };

    object.createTable = function(o) {
        o.table = new Table({
            url: o.listURL,
            postdata: { offset: 0, limit: 10 },
            appendTo: o.tableContainer,
            selectable: {
                key: this.selectable.key,
                title: this.selectable.title,
                result: this.selectable.result,
                counter: { update: o.selected, hideIfNull: false }
            },
            searchable: {
                url: o.searchURL,
                result: this.searchable.result,
                resultWidth: "400px",
                appendTo: o.searchContainer
            },
            pager: {
                appendTo: o.pagerContainer
            },
            columns: this.columns
        }).create();
    };

    object.addOrRemove = function(action) {
        var self = this,
            postdata = {},
            o = action == "add" ? this.left : this.right;

        postdata[this.selectable.key] = o.table.getSelectedIds();

        if (postdata[this.selectable.key].length === 0) {
            this.showError605();
            return false;
        }

        Ajax.post({
            url: o.updateMember,
            data: postdata,
            token: true,
            success: function(result) {
                if (result.status == "ok") {
                    self.left.table.clearSelectedRows();
                    self.left.table.getData();
                    self.right.table.clearSelectedRows();
                    self.right.table.getData();
                } else if (result.status == "err-605") {
                    self.showError605();
                }
            }
        });
    };

    object.showError605 = function() {
        var self = this;

        var message = Utils.create("div")
            .addClass(this.form.errorClass)
            .html(Text.get("text.please_select_objects"))
            .appendTo(this.messageContainer);

        setTimeout(function() {
            message.fadeOut(400);
            setTimeout(function() {
                message.remove();
            }, 400);
        }, 3000);
    };

    object.create();
    return object;
};

Form.prototype.addInputValidator = function(object, type, getValue) {
    return;

    var bubble = Utils.create("div")
        .addClass(object.getBubbleOuterClass())
        .hide()
        .appendTo(object.container);

    var innerBubble = Utils.create("div")
        .addClass(object.getBubbleClass())
        .appendTo(bubble);

    var textBox = Utils.create("p")
        .html("0")
        .appendTo(innerBubble);

    if (object.bubbleWidth) {
        innerBubble.css({ "max-width": object.bubbleWidth });
    }

    var validate = function() {
        var len = object[type][getValue]().length,
            text = "";

        if ((object.minlength && len < object.minlength) || (object.maxlength && len > object.maxlength)) {
            bubble.fadeIn(300);
            if (object.minlength != undefined) {
                text += "Min length: "+ object.minlength + "<br/>";
            }
            if (object.maxlength != undefined) {
                text += "Max length: "+ object.maxlength + "<br/>";
            }
            text += "Current length: "+ len;
        } else {
            bubble.fadeOut(100);
        }

        textBox.html(text);
    };

    object[type].blur(function() { bubble.fadeOut(100) });
    object[type].focus(validate);
    object[type].keyup(validate);
};

/*
    desc({
        title: "Foo",
        desc: "This is foo",
        note: "Max length: 100"
    });

    desc({
        text: "<h2>Foo</h2><p>This is foo</p><small>Max length: 100</small>"
    });
*/
Form.prototype.desc = function(o) {
    var descBox = Utils.create("div");

    if (o.title) {
        Utils.create("h2")
            .html(o.title)
            .appendTo(descBox);
    }

    if (o.desc) {
        Utils.create("p")
            .html(o.desc)
            .appendTo(descBox);
    }

    if (o.note) {
        Utils.create("small")
            .html(o.note)
            .appendTo(descBox);
    }

    if (o.text) {
        descBox.append(o.text);
    }

    var button = new iButton({ text: descBox, width: o.width });

    if (o.appendTo) {
        button.appendTo(o.appendTo);
    }

    return button;
};
var Table = function(o) {
    this.postdata = {
        offset: 0,
        limit: 50
    };

    Utils.extend(this, o);

    Utils.append(this.selectable, {
        max: 0,
        name: "id",
        filter: "tr",
        cancel: "a,span,:input,option,ul",
        autoRefresh: true,
        resultTitle: Text.get("text.selected_objects")
    });

    Utils.append(this.searchable, {
        postdata: {
            offset: 0,
            limit: 10
        }
    });

    if (this.selectable) {
        if (this.selectable.counter == undefined) {
            this.selectable.counter = {};
        }
        Utils.append(this.selectable.counter, {
            hideIfNull: true,
            appendTo: "#selected-counter",
            addClass: "counter-button",
            title: Text.get("action.view_selected_objects")
        });
    }

    this.cache = { data: {}, selected: {} };
};

Table.prototype = {
    width: "full",
    addClass: false,
    iconsClass: "table-icons-column",
    appendTo: "#content",
    appendPagerTo: false,
    type: "default",
    columnSwitcher: false,
    values: false,
    header: false,
    headerObject: false,
    url: false,
    postdata: false,
    columns: false,
    linkMenuClass: "link-onclick-menu",
    postdataCallback: false
};

Table.prototype.init = function() {
    this.container = Utils.create("div");
    this.table = Utils.create("table").appendTo(this.container);
 
    if (this.type == "default") {
        this.table.addClass(this.addClass || "maintab");
        if (this.width == "full") {
            this.width = "100%";
        }
        if (this.width == "inline" || this.width == "none") {
            this.width = false;
        }
        if (this.width) {
            this.table.css({ width: this.width });
        }
        this.thead = Utils.create("thead").appendTo(this.table);
        this.thRow = Utils.create("tr").appendTo(this.thead);
        this.tbody = Utils.create("tbody").appendTo(this.table);
    } else if (this.type == "form") {
        this.table.addClass(this.addClass || "form-table");
        this.tbody = Utils.create("tbody").appendTo(this.table);
    } else if (this.type == "vtable") {
        this.table.addClass(this.addClass || "vtable");
        this.thead = Utils.create("thead").appendTo(this.table);
        this.thRow = Utils.create("tr").appendTo(this.thead);
        this.tbody = Utils.create("tbody").appendTo(this.table);
    } else if (this.type == "simple") {
        if (this.addClass) {
            this.table.addClass(this.addClass);
        }
        this.tbody = Utils.create("tbody").appendTo(this.table);
    } else {
        if (this.addClass) {
            this.table.addClass(this.addClass);
        }
        this.thead = Utils.create("thead").appendTo(this.table);
        this.thRow = Utils.create("tr").appendTo(this.thead);
        this.tbody = Utils.create("tbody").appendTo(this.table);
    }

    if (this.css) {
        this.table.css(this.css);
    }

    if (this.id) {
        this.table.attr("id", this.id);
    }

    if (this.appendTo) {
        this.container.appendTo(this.appendTo);
    }

    return this;
};

Table.prototype.getContainer = function() {
    return this.container;
};

Table.prototype.getTable = function() {
    return this.table;
};

Table.prototype.create = function() {
    Log.debug("create a new table");
    var self = this;

    this.colsByKey = { };

    $.each(this.columns, function(i, col) {
        self.colsByKey[col.name] = col;
    });

    this.createHeader();
    this.createStruct();
    this.createColumnSwitcher();

    if (this.values) {
        this.loading.hide();
        this.createRows(this.values);
        this.addSelectEvents();
    } else if (this.url) {
        this.getData();
    }

    if (this.searchable) {
        this.addSearchEvents();
    }

    if (this.searchButton) {
        $(this.searchButton)
            .click(function() { self.getData() });
    }

    return this;
};

Table.prototype.hide = function(o) {
    this.table.hide(o);
};

Table.prototype.show = function(o) {
    this.table.show(o);
};

Table.prototype.createHeader = function() {
    var self = this;

    if (this.headerObject) {
        this.header = this.headerObject;
    } else if (this.header) {
        if (this.reloadable === true) {
            this.reloadable = {};
        }
        if (this.reloadable) {
            if (this.header.icons === undefined) {
                this.header.icons = [];
            }
            if (this.reloadable.callback === undefined) {
                this.reloadable.callback = function() {
                    if (self.reloadable.before) {
                        self.reloadable.before();
                    }
                    self.getData();
                };
            }

            this.header.icons.push({
                type: "reload",
                callback: this.reloadable.callback,
                title: Text.get("action.reload")
            });
        }
        this.header = new Header(this.header);
        this.header.create();
    }
};

Table.prototype.createStruct = function() {
    var self = this;
    this.init();

    if (this.addAttr) {
        $.each(this.addAttr, function(id, value) {
            self.table.attr(id, value);
        }); 
    }   

    $.each(this.columns, function(i, col) {
        if (col.icons) {
            Utils.create("th").appendTo(self.thRow);
            return true;
        }

        var th = Utils.create("th")
            .attr("data-col", col.name)
            .text(col.text)
            .appendTo(self.thRow);

        if (self.sortable === true && col.sortable !== false) {
            th.css({ cursor: "pointer" });
            th.click(function() {
                self.postdata.sort_type = self.sortedType = self.sortedType === "asc" ? "desc" : "asc";
                self.postdata.sort_by = col.name;
                self.postdata.offset = 0;
                self.getData();
            });
        }

        if (col.hide == true) {
            th.hide();
        }
    });

    if (this.deletable != undefined || self.rowHoverIcons) {
        Utils.create("th")
            .appendTo(this.thRow)
            .css({ "width": "20px" });
    }

    this.loading = Utils.create("div")
        .addClass("loading")
        .appendTo(this.container);
};

Table.prototype.createColumnSwitcher = function() {
    var self = this;

    if (!this.columnSwitcher) {
        return false;
    }

    var container = Utils.create("div")
        .addClass("column-switcher")
        .appendTo(this.header.rbox);

    var icon = Utils.create("div")
        .addClass("gicons-gray gicons cogwheels")
        .appendTo(container);

    var result = Utils.create("div")
        .addClass("result")
        .hide()
        .appendTo(container);

    var infobox = Utils.create("div")
        .addClass("arrow-box-white")
        .appendTo(result);

    container.hover(
        function() { $(result).fadeIn(300) },
        function() { $(result).fadeOut(100) }
    );

    var table = Utils.create("table")
        .addClass("table-column-switcher")
        .appendTo(infobox);

    $.each(this.columns, function(i, col) {
        if (col.icons) {
            return true;
        }

        var tr = Utils.create("tr")
            .appendTo(table);

        var th = Utils.create("th")
            .text(col.text)
            .appendTo(tr);

        var td = Utils.create("td")
            .appendTo(tr);

        var input = Utils.create("input")
            .attr("type", "checkbox")
            .attr("name", col.name)
            .appendTo(td);

        if (col.hide != true) {
            input.attr("checked", "checked");
        }

        input.click(function() {
            if (this.checked == true) {
                self.table.find("[data-col='"+ col.name +"']").fadeIn();
                self.colsByKey[col.name].hide = false;
            } else {
                self.table.find("[data-col='"+ col.name +"']").fadeOut();
                self.colsByKey[col.name].hide = true;
            }
        });
    });
};

Table.prototype.getData = function(o) {
    var self = this,
        postdata = this.postdata;

    this.loading.show();
    this.tbody.hide();

    if (this.postdataCallback) {
        postdata = this.postdataCallback(postdata);
    }

    if (this.bindForm) {
        postdata = Utils.extend({}, postdata);
        Utils.extend(postdata, this.bindForm.getData());
    }

    if (o) {
        if (o.resetOffset) {
            postdata.offset = 0;
        }
        if (o.search !== undefined) {
            this.search.set(o.search);
            postdata.query = o.search;
        }
    }

    Ajax.post({
        url: this.url,
        data: postdata,
        success: function(result) {
            self.loading.hide();

            if (self.bindForm && (result.status == "err-610" || result.status == "err-620")) {
                self.tbody.fadeIn(300);
                self.bindForm.markErrors(result.data.failed);
                return false;
            }

            self.tbody.html("");

            if (self.pager || self.header) {
                var appendPagerTo = self.pager
                    ? self.pager.appendTo
                    : self.header.pager;

                self.pagerObject = new Pager({
                    data: result,
                    postdata: postdata,
                    appendTo: appendPagerTo,
                    callback: function(req) {
                        self.postdata = req.postdata;
                        self.getData();
                    }
                }).create();
            }

            self.createRows(result.data);
            self.tbody.fadeIn(300);
            self.addSelectEvents();
        }
    });
};

Table.prototype.createRows = function(rows) {
    var self = this;

    $.each(rows, function(x, row) {
        var tr = Utils.create("tr")
            .appendTo(self.tbody);

        if (self.selectable && self.selectable.name) {
            var id = self.selectable.getUniqueId
                ? self.selectable.getUniqueId(row)
                : row[self.selectable.name];

            tr.attr("data-id", id);

            if (self.cache.selected[id]) {
                tr.addClass("ui-selected");
            }

            self.cache.data[id] = row;

            if (self.cache.selected[id]) {
                tr.addClass("ui-selected");
            }
        }

        if (self.onClick) {
            tr.css({ cursor: "pointer" });
            tr.click(function() { self.onClick(row) });
        }

        if (self.click) {
            tr.css({ cursor: "pointer" });
            tr.click(function() { self.click.callback(row) });
            tr.attr("title", self.click.title);
            tr.tooltip({ track: true });
        }

        if (self.tooltip) {
            tr.tooltip({
                items: tr,
                track: true,
                content: self.tooltip(row)
            });
        }

        $.each(self.columns, function(y, col) {
            var td = self.createColumn(tr, row, col);

            if (col.hide == true) {
                td.hide();
            }
        });

        var rowHoverIcons, rowHoverIconsWidth = 0;

        if (self.deletable !== undefined || self.rowHoverIcons) {
            rowHoverIcons = Utils.create("td")
                .css({ "vertical-align": "middle", padding: "3px 0 0 0", "white-space": "nowrap" })
                .appendTo(tr);
        }

        if (self.deletable !== undefined) {
            var addDeletableObject = true,
                icon = "";

            if (self.deletable.check) {
                addDeletableObject = self.deletable.check(row);
            }

            if (addDeletableObject === true) {
                var icon = Utils.create("a")
                    .attr("title", self.deletable.title)
                    .tooltip()
                    .addClass("hicons-btn")
                    .html(Utils.create("span").addClass("hicons remove").css({ margin: "0" }))
                    .click(function() { self.createDeleteOverlay(row, self.deletable) })
                    .hide();

                tr.hover(
                    function() { icon.show() },
                    function() { icon.hide() }
                );

                rowHoverIconsWidth = rowHoverIconsWidth + 20;
                rowHoverIcons.css({ width: rowHoverIconsWidth });
                icon.appendTo(rowHoverIcons);
            }
        }

        if (self.rowHoverIcons) {
            $.each(self.rowHoverIcons, function(i, iconOpts) {
                var icon = Utils.create("a")
                    .attr("title", iconOpts.title)
                    .tooltip()
                    .addClass("hicons-btn")
                    .html(Utils.create("span").addClass("hicons "+ iconOpts.icon).css({ margin: "0" }))
                    .click(function() { iconOpts.onClick(row, iconOpts) })
                    .hide()
                    .appendTo(rowHoverIcons);

                tr.hover(
                    function() { icon.show() },
                    function() { icon.hide() }
                );

                rowHoverIconsWidth = rowHoverIconsWidth + 20;
                rowHoverIcons.css({ width: rowHoverIconsWidth });
            });
        }
    });
};

Table.prototype.createRow = function(columns) {
    var row = Utils.create("tr").appendTo(this.tbody);

    if (columns) {
        if (this.type == "default") {
            $.each(columns, function(i, column) {
                Utils.create("td").html(column).appendTo(row);
            });
        } else {
            if (columns[0]) {
                Utils.create("th").html(columns[0]).appendTo(row);
            }
            if (columns[1]) {
                Utils.create("td").html(columns[1]).appendTo(row);
            }
        }
    }

    return row;
};

Table.prototype.createSimpleRow = function(columns) {
    var row = Utils.create("tr").appendTo(this.tbody);

    $.each(columns, function(i, column) {
        Utils.create("td")
            .html(column)
            .appendTo(row);
    });

    return row;
};

Table.prototype.createFormRow = function(thText, tdText) {
    var tr = Utils.create("tr").appendTo(this.tbody),
        th = Utils.create("th").appendTo(tr),
        td = Utils.create("td").appendTo(tr);

    if (thText) {
        th.html(thText);
    }

    if (tdText) {
        td.html(tdText);
    }

    return { tr: tr, th: th, td: td };
};

Table.prototype.addHeadColumn = function(column) {
    return Utils.create("th").html(column).appendTo(this.thRow);
};

Table.prototype.createDeleteOverlay = function(row, o) {
    var self = this;

    if (o == undefined) {
        o = this.deletable;
    }

    var url = typeof o.url === "function"
        ? o.url(row)
        : Utils.replacePattern(o.url, row);

    var content = Utils.create("div");

    if (o.warning) {
        Utils.create("div")
            .addClass("text-warn")
            .css({ width: "500px", margin: "15px", "text-align": "center" })
            .html(o.warning)
            .appendTo(content);
    }

    var table = Utils.create("table").addClass("vtable").appendTo(content),
        tbody = Utils.create("tbody").appendTo(table),
        buttonText = o.buttonText != undefined
            ? o.buttonText
            : Text.get("action.delete");

    $.each(o.result, function(i, name) {
        var thRow = Utils.create("tr").appendTo(tbody),
            value = row[name];

        Utils.create("th")
            .html(self.colsByKey[name].text)
            .appendTo(thRow);

        if (self.colsByKey[name].bool != undefined) {
            if (self.colsByKey[name].bool == "yn") {
                value = value == "0" ? Text.get("word.No") : Text.get("word.Yes");
            } else if (col.bool == "tf") {
                value = value == "0" ? Text.get("word.False") : Text.get("word.True");
            }
        }

        Utils.create("td")
            .text(value)
            .appendTo(thRow);
    });

    new Overlay({
        title: o.title,
        content: content,
        width: o.width || "default",
        buttons: [{
            content: buttonText,
            callback: function() {
                Ajax.post({
                    url: url,
                    data: row,
                    async: false,
                    token: true,
                    success: function(result) {
                        if (result.status == "ok") {
                            if (o.successCallback != undefined) {
                                o.successCallback();
                            } else {
                                self.getData();
                            }
                        }
                    }
                });
            }
        }]
    }).create();
};

Table.prototype.createColumn = function(tr, row, col) {
    if (col.icons) {
        var td = Utils.create("td")
            .addClass(this.iconsClass)
            .appendTo(tr);

        $.each(col.icons, function(i, obj) {
            if (obj.check == undefined || obj.check(row) == true) {
                var icon = Utils.create("span").addClass(obj.icon)

                if (obj.link) {
                    var link = Utils.replacePattern(obj.link, row, row.username);
                    icon = Utils.create("a").attr("href", link).html(icon);
                    if (obj.blank == true) {
                        icon.attr("target", "_blank");
                    }
                } else if (obj.call) {
                    icon = obj.call(row);
                } else if (obj.onClick) {
                    icon.click(function() { obj.onClick(row) });
                    icon.css({ cursor: "pointer" });
                } else {
                    icon.css({ cursor: "default" });
                }

                if (obj.title) {
                    if (typeof obj.title == "function") {
                        var t = obj.title(row);
                        icon.attr("title", t);
                    } else {
                        icon.attr("title", Utils.escape(obj.title));
                    }
                    icon.tooltip();
                }

                icon.appendTo(td);
            }
        });

        return td;
    }

    var value;

    if (col.value) {
        value = typeof col.value == "function" ? col.value(row) : value;
    } else if (col.notNull && row[col.name] === undefined) {
        value = col.notNull;
    } else if (col.empty && row[col.name] === "") {
        value = col.empty;
    } else if (typeof row[col.name] !== "object") {
        value = Utils.escape(row[col.name]);
    }

    if (col.bool != undefined) {
        if (col.bool == "yn") {
            value = value == "0" ? Text.get("word.No") : Text.get("word.Yes");
        } else if (col.bool == "tf") {
            value = value == "0" ? Text.get("word.False") : Text.get("word.True");
        }
    }

    if (col.link || col.call) {
        var str = col.link ? col.link : col.call;
        str = Utils.replacePattern(str, row);

        if (col.link) {
            value = Utils.create("a")
                .attr("href", Utils.escape(str))
                .html(value);
        } else {
            value = col.call(row);
        }
    }

    if (col.activeFlag) {
        var addClass = value ? "is-active" : "is-not-active",
            value = value ? Text.get("word.active") : Text.get("word.inactive");
        value = Utils.create("span")
            .addClass(addClass)
            .html(value);
    }

    if (col.menu) {
        var menuContainer = Utils.create("div")
            .addClass(this.linkMenuClass);

        var link = Utils.create("a")
            .html(value)
            .appendTo(menuContainer);

        var listContainer = Utils.create("ul")
            .hide()
            .appendTo(menuContainer);

        Utils.create("div")
            .addClass("hicons-gray hicons remove close-x")
            .appendTo(listContainer)
            .click(function() { listContainer.fadeOut(200) });

        link.click(function() { listContainer.fadeIn(400) });
        value = menuContainer;

        $.each(col.menu, function(i, item) {
            var li = Utils.create("li").appendTo(listContainer);

            if (item.deletable) {
                var text = item.text || Text.get("action.delete");
                text = typeof text == "function"
                    ? text(row)
                    : text;
                li.html(text).click(function() {
                    listContainer.fadeOut(400);
                    self.createDeleteOverlay(row, item.deletable);
                });
            } else {
                var text = typeof item.text == "function"
                    ? item.text(row)
                    : item.text;
                li.html(text).click(function() {
                    listContainer.fadeOut(400);
                    item.callback(row);
                });
            }
        });
    }

    if (col.aTag) {
        value = Utils.create("a").html(value);
    }

    if (col.callback) {
        value = Utils.create("span").html(value);
        value.click(function(){ col.callback(row) });
    }

    if (col.convertFromUnixTime === true) {
        var date = new Date(value * 1000);
        value = DateFormat(date, DateFormat.masks.bloonix);
    }

    if (col.convertToTimeString === true) {
        value = Utils.secondsToStringShortReadable(value);
    }

    if (col.wrapIconClass === true) {
        value = Bloonix.createInfoIcon({ type: value });
    }

    if (col.wrapValueClass === true) {
        value = Utils.create("div")
            .addClass("status-base status-"+ value)
            .html(value);
    }

    if (col.wrapNameValueClass === true) {
        value = Utils.create("div")
            .addClass("status-base status-"+ col.name +"-"+ value)
            .html(value);
    }

    if (typeof(value) != "object") {
        value = Utils.create("span").html(value);
    }

    if (col.prefix) {
        value.html(col.prefix +" "+ value.text());
    }

    if (col.onClick) {
        value.click(col.onClick);
        value.css({ cursor: "pointer" });

        if (col.link == undefined && col.call == undefined) {
            value.hover(
                function() { $(this).css({ "text-decoration": "underline" }) },
                function() { $(this).css({ "text-decoration": "none" }) }
            );
        }
    }

    if (col.linkCallback) {
        value = Utils.create("a")
            .html(value)
            .click(function() { col.linkCallback(row) });
    }

    if (col.title) {
        if (typeof col.title === "function") {
            var content = col.title(row);

            if (content.length) {
                value.tooltip({
                    items: value,
                    track: true,
                    content: col.title(row)
                });
            }
        } else {
            value.attr("title", Utils.escape(col.title));
            value.tooltip({ track: true });
        }
    }

    var td = Utils.create("td")
        .attr("data-col", col.name)
        .html(value)
        .appendTo(tr);

    if (col.nowrap == true) {
        td.css({ "white-space": "nowrap" });
    }

    if (col.centered == true) {
        td.css({ "text-align": "center" });
    } else if (col.rightAlign == true) {
        td.css({ "text-align": "right" });
    }

    return td;
};

Table.prototype.addColumn = function(o) {
    var td = Utils.create("td");

    if (o.addClass) {
        td.addClass(o.addClass);
    }

    if (o.html) {
        td.html(o.html);
    }

    td.appendTo(this.tbody);

    return td;
};

Table.prototype.addSelectEvents = function() {
    if (!this.selectable) {
        return;
    }

    var self = this,
        selectedCache = this.cache.selected,
        dataCache = this.cache.data;

    if (this.selectable.counter) {
        this.addSelectedCounter();
    }

    // jQuery.selectable()
    this.tbody.selectable({
        filter: this.selectable.filter,
        cancel: this.selectable.cancel,
        autoRefresh: this.selectable.autoRefresh,
        selected: function(event, ui) {
            var selID = $(ui.selected).data("id");

            if (selectedCache[selID] == undefined) {
                if (self.selectable.max == 0 || Utils.objectSize(selectedCache) < self.selectable.max) {
                    selectedCache[selID] = dataCache[selID];
                } else {
                    $(ui.selected).removeClass("ui-selected");
                }
            }

            if (self.selectable.counter) {
                self.updateSelectedCounter();
            }
        },
        unselected: function(event, ui) {
            var selID = $(ui.unselected).find("[data-col='"+ self.selectable.name +"']").find("span").text();
            delete selectedCache[selID];

            if (self.selectable.counter) {
                self.updateSelectedCounter();
            }
        }
    });
};

Table.prototype.addSelectedCounter = function() {
    var self = this,
        counter = this.selectable.counter;

    if (counter.update) {
        counter.update = $(counter.update);
    } else {
        counter.update = Utils.create("span")
            .attr("title", counter.title)
            .tooltip()
            .addClass(counter.addClass);

        if (counter.hideIfNull) {
            counter.update.hide();
        }

        if (counter.appendTo) {
            $(counter.appendTo).html(counter.update);
        }
    }

    this.updateSelectedCounter();

    $(counter.update).click(
        function() {
            var table = Utils.create("table").addClass("maintab");
            var thead = Utils.create("thead").appendTo(table);
            var thRow = Utils.create("tr").appendTo(thead);
            var tbody = Utils.create("tbody").appendTo(table);

            $.each(self.selectable.result, function(i, name) {
                Utils.create("th")
                    .html(self.colsByKey[name].text)
                    .appendTo(thRow);
            });

            Utils.create("th")
                .html("")
                .appendTo(thRow);

            $.each(self.cache.selected, function(id, row) {
                var tdRow = Utils.create("tr").appendTo(tbody);

                $.each(self.selectable.result, function(y, col) {
                    Utils.create("td")
                        .html(row[col])
                        .appendTo(tdRow);
                });

                Utils.create("span")
                    .attr("title", Text.get("action.unselect"))
                    .addClass("btn btn-white btn-small-icon")
                    .html(Utils.create("span").addClass("hicons-gray hicons remove"))
                    .appendTo(Utils.create("td").appendTo(tdRow))
                    .click(function(){
                        delete self.cache.selected[id];
                        tdRow.remove();
                        self.updateSelectedCounter();
                        self.table.find(".ui-selected").each(function() {
                            var value = $(this).data("id");
                            if (self.cache.selected[value] == undefined) {
                                $(this).removeClass("ui-selected");
                            }
                        });
                    }).tooltip();
            });

            var buttons = [ ];

            if (self.selectable.deletable) {
                buttons.push({
                    content: Text.get("action.delete"),
                    callback: function(overlayContent) {
                        var ids = self.getSelectedIds(),
                            failed = ids.length,
                            done = 0;

                        $.each(ids, function(i, id) {
                            var url = Utils.replacePattern(self.selectable.deletable.url, { id: id });

                            Ajax.post({
                                url: url,
                                token: true,
                                async: false,
                                success: function(result) {
                                    if (result.status == "ok") {
                                        --failed;
                                    }
                                }
                            });

                            done++;
                        });

                        self.cache.selected = {};
                        self.getData();
                        self.updateSelectedCounter();
                    }
                });
            }

            new Overlay({
                title: self.selectable.resultTitle,
                content: table,
                buttons: buttons
            }).create();
        }
    );
};

Table.prototype.updateSelectedCounter = function() {
    if (this.selectable && this.selectable.counter) {
        var size = Utils.objectSize(this.cache.selected);

        if (this.selectable.counter.descriptive) {
            if (size > 1 && size == this.selectable.max) {
                this.selectable.counter.update.html(size +" "+ Text.get("schema.chart.text.selected_max_reached"));
                this.selectable.counter.update.addClass("rwt");
            } else {
                this.selectable.counter.update.html(size +" "+ Text.get("schema.chart.text.selected"));
                this.selectable.counter.update.removeClass("rwt");
            }
        } else {
            this.selectable.counter.update.html(size);
        }

        if (size == 0 && this.selectable.counter.hideIfNull == true) {
            this.selectable.counter.update.hide();
        } else {
            this.selectable.counter.update.show();
        }
    }
};

Table.prototype.getSelectedIds = function() {
    var rows = this.getSelectedRows(),
        ids = [ ];
    $.each(rows, function(i, row) {
        ids.push(row.id);
    });
    return ids;
};

Table.prototype.getSelectedRows = function() {
    var rows = {};

    if (this.cache.selected) {
        $.each(this.cache.selected, function(key, val) {
            rows[key] = val;
        });
    }

    return rows;
};

Table.prototype.clearSelectedRows = function() {
    this.cache.selected = { };
    this.tbody.find(".ui-selected").removeClass("ui-selected");
    this.tbody.selectable("destroy");
    this.addSelectEvents();
};

Table.prototype.refreshSelectedRows = function(ids) {
    var self = this;
    this.clearSelectedRows();

    $.each(ids, function(id, obj) {
        var tr = self.table.find("[data-id='"+ id +"']");

        if (tr) {
            tr.addClass("ui-selected");
            self.cache.selected[id] = obj;
        }

        if (self.selectable.counter) {
            self.updateSelectedCounter();
        }
    });
};

Table.prototype.addSearchEvents = function() {
    var self = this,
        searchable = this.searchable;

    searchable.columns = [];

    if (searchable.appendTo) {
        searchable.appendTo = $(searchable.appendTo);
    } else if (this.header) {
        searchable.appendTo = this.header.search;
    }

    $.each(searchable.result, function(i, col) {
        searchable.columns.push(self.colsByKey[col]);
    });

    this.search = new Search({
        url: searchable.url,
        appendTo: searchable.appendTo,
        postdata: searchable.postdata,
        searchValue: searchable.value,
        resultWidth: searchable.resultWidth,
        searchCallback: function(result) {
            var table = new Table();
            table.init();

            $.each(searchable.columns, function(i, col) {
                table.addHeadColumn(col.text);
            });

            $.each(result.data, function(i, row) {
                var tr = table.createRow();

                $.each(searchable.columns, function(i, col) {
                    table.createColumn(tr, row, col);
                });
            });

            return table.table;
        },
        submitCallback: function(query) {
            self.postdata.query = query;
            self.postdata.offset = 0;
            self.getData();
        }
    }).create();
};

Table.createShell = function(addClass) {
    if (addClass == undefined) {
        addClass = "maintab";
    }
    var table = { };
    table.table = Utils.create("table").addClass(addClass);
    table.thead = Utils.create("thead").appendTo(table.obj);
    table.tbody = Utils.create("tbody").appendTo(table.obj);
    table.hrow = Utils.create("tr").appendTo(table.thead);
    return table;
};
var Search = function(o) {
    this.postdata = {};
    this.cache = { lastSearchStringLength: 0 };
    Utils.extend(this, o);
};

Search.prototype = {
    format: "small",
    helpText: Text.get("info.search_syntax"),
    searchValue: "",
    searchKeyLength: 3,
    searchCallback: false,
    submitCallback: false,
    placeholder: Text.get("action.search"),
    inputClass: false,
    resultClass: "search-result",
    resultWidth: false,
    helpClass: "search-help",
    loadingClass: "loading-small",
    appendTo: false
};

Search.prototype.getInputClass = function() {
    return this.inputClass || "input input-"+ this.format;
};

Search.prototype.create = function() {
    var self = this;

    this.appendTo = $(this.appendTo);

    this.appendTo
        .addClass("search");

    this.formContainer = Utils.create("form")
        .appendTo(this.appendTo);

    this.inputContainer = Utils.create("input")
        .attr("placeholder", this.placeholder)
        .attr("value", this.searchValue)
        .addClass(this.getInputClass())
        .appendTo(this.formContainer);

    this.resultContainer = Utils.create("div")
        .addClass(this.resultClass)
        .appendTo(this.appendTo);

    if (this.resultWidth) {
        this.resultContainer.css({ width: this.resultWidth });
    }

    this.resultBubbleContainer = Utils.create("div")
        .addClass("arrow-box-white")
        .html("")
        .appendTo(this.resultContainer);

    this.helpContainer = Utils.create("div")
        .addClass(this.helpClass)
        .appendTo(this.appendTo);

    Utils.create("div")
        .addClass("arrow-box-white")
        .html(this.helpText)
        .appendTo(this.helpContainer);

    Utils.create("div")
        .addClass("clear")
        .appendTo(this.appendTo);

    this.appendTo.hover(
        function(){
            self.inputContainer.addClass("int-is-hover");
            if (self.cache.hasData != 1) {
                self.helpContainer.fadeIn(400);
            }
        },
        function(){
            self.inputContainer.removeClass("int-is-hover");
            if (!self.inputContainer.is(":focus")) {
                self.resultContainer.hide();
            }
            self.helpContainer.hide();
        }
    );

    this.inputContainer.focus(
        function(){
            if (self.cache.hasData == 1) {
                self.resultContainer.show(400);
            } else if (self.inputContainer.val().length == 0) {
                self.helpContainer.fadeIn(400);
            }
        }
    );

    this.inputContainer.blur(
        function(){
            self.helpContainer.hide(400);
            if (!self.inputContainer.hasClass("int-is-hover")) {
                self.resultContainer.hide(400);
            }
        }
    );

    this.inputContainer.keyup(
        function() {
            self.doSearch(false);
        }
    );

    if (this.submitCallback) {
        this.formContainer.submit(function(event) {
            var value = self.inputContainer.val();
            event.preventDefault();
            self.submitCallback(value);
            self.resultContainer.hide();
        });
    }

    return this;
};

Search.prototype.doSearch = function(force) {
    var self = this;

    $(this.helpContainer).hide();

    var cache = this.cache;
    var value = $(this.inputContainer).val();

    if (value == cache.value) {
        return false;
    }

    if (value.length == 0) {
        $(this.resultContainer).find("div").html("");
        $(this.resultContainer).hide();
        $(this.helpContainer).fadeIn(400);
        cache.value = "";
        cache.hasData = 0;
        cache.lastSearchStringLength = 0;
        return false;
    }

    var strFloorLength = Math.floor(value.length/this.searchKeyLength);

    if (strFloorLength == cache.lastSearchStringLength - 1) {
        cache.lastSearchStringLength = strFloorLength;
        return false;
    }

    if (strFloorLength > cache.lastSearchStringLength || force == true) {
        cache.lastSearchStringLength = strFloorLength;
        cache.value = value;
        this.postdata.query = value;
        this.inputContainer.addClass(this.loadingClass);

        Ajax.post({
            url: this.url,
            data: this.postdata,
            success: function(result) {
                var html = self.searchCallback(result);
                $(self.resultBubbleContainer).html(html);
                Utils.create("span")
                    .addClass("hicons-gray hicons remove result-close-x")
                    .click(function() { self.resultContainer.hide() })
                    .appendTo(self.resultBubbleContainer);
                self.inputContainer.removeClass(self.loadingClass);
                $(self.resultContainer).show(400);
                cache.hasData = 1;
            }
        });
    }
};

Search.prototype.set = function(str) {
    $(this.inputContainer).val(str);
};
var Autocomplete = function(o) {
    Utils.extend(this, o);
};

Autocomplete.prototype = {
    placeholder: "",
    requiredMarkerClass: "rwb",
    required: false,
    containerClass: "select-container",
    inputClass: false,
    listClass: false,
    loadingClass: "loading-small",
    format: "default",
    url: false,
    source: false,
    postdata: false,
    appendTo: false,
    callback: false,
    onClick: false,
    onKeyUp: false,
    start: 0
};

Autocomplete.prototype.getContainerClass = function() {
    return this.containerClass;
};

Autocomplete.prototype.getInputClass = function() {
    return this.inputClass || "input input-"+ this.format;
};

Autocomplete.prototype.getListClass = function() {
    return this.listClass || "select-list-"+ this.format;
};

Autocomplete.prototype.getBorderMarkerClass = function() {
    return this.requiredMarkerClass;
};

Autocomplete.prototype.getLoadingClass = function() {
    return this.loadingClass;
};

Autocomplete.prototype.create = function() {
    var self = this;

    if (this.input == undefined) {
        this.selectContainer = Utils.create("div")
            .addClass(this.getContainerClass());

        if (this.appendTo != undefined) {
            this.selectContainer.appendTo(this.appendTo);
        }

        this.input = Utils.create("input")
            .attr("placeholder", this.placeholder)
            .addClass(this.getInputClass())
            .appendTo(this.selectContainer);
    } else if (this.container) {
        this.selectContainer = this.container;
        this.container.addClass(this.getContainerClass());
    }

    if (this.required == true) {
        this.input.addClass(this.getBorderMarkerClass());
    }

    this.result = Utils.create("ul")
        .addClass(this.getListClass())
        .appendTo(this.selectContainer);

    $(this.input).blur(
        function(){
            setTimeout(function() { $(self.result).fadeOut(200) }, 200);
        }
    );

    $(this.input).focus(
        function() {
            if (self.input.val().length > self.start) {
                self.showResult();
            } else if (self.input.val().length == 0 && self.start == 0) {
                self.search();
            }
        }
    );

    $(this.input).keyup(
        function() {
            if (self.selected != undefined && self.selected != self.input.val()) {
                self.input.attr("data-value", "");
                delete self.selected;
                if (self.required == true) {
                    self.input.addClass(self.getBorderMarkerClass());
                }
            }
            if (self.input.val().length > self.start && self.input.val() != self.selected) {
                if (self.onKeyUp) {
                    self.onKeyUp(self.input.val());
                }
                self.search();
            }
        }
    );
};

Autocomplete.prototype.search = function() {
    if (this.url) {
        this.filterRequest();
    } else if (this.source) {
        this.filterSource();
    }
};

Autocomplete.prototype.filterRequest = function() {
    var self = this;

    if (this.postdata == undefined) {
        this.postdata = { };
    }

    this.postdata.search = this.input.val();
    this.input.addClass(this.getLoadingClass());

    Ajax.post({
        url: this.url,
        data: this.postdata,
        success: function(data) {
            self.input.removeClass(self.getLoadingClass());
            self.result.html("");
            $.each(data.data, function(i, elem) {
                var li = self.callback(elem);
                var name = li.data("name");
                var value = li.data("value");
                if (name == undefined) {
                    name = value;
                }
                self.addOnClickEvent(li, name, value);
                li.appendTo(self.result);
            });
            self.showResult();
        }
    });
};

Autocomplete.prototype.filterSource = function() {
    var self = this;

    var search = this.input.val() || "";
    var regex = new RegExp(search);
    self.result.html("");

    $.each(this.source, function(i, str) {
        if (regex.test(str)) {
            var li = Utils.create("li").text(str).appendTo(self.result);
            self.addOnClickEvent(li, str, str);
        }
    });

    this.showResult();
};

Autocomplete.prototype.addOnClickEvent = function(li, name, value) {
    var self = this;

    li.click(function() {
        self.result.fadeOut(200);
        self.input.val(name);
        self.input.attr("data-value", value);
        self.selected = value;
        if (self.required == true) {
            self.input.removeClass(self.getBorderMarkerClass());
        }
        if (self.onClick) {
            self.onClick(name, value);
        }
    });

    li.css({ cursor: "pointer" });
};

Autocomplete.prototype.showResult = function() {
    if (this.result.find("li").length > 0) {
        this.result.fadeIn(400);
    }
};
var Menu = function(o) {
    Utils.extend(this, o);
};

Menu.prototype = {
    title: false,
    titleClass: "menu-title",
    content: false,
    appendTo: false,
    iconBaseClass: "hicons-gray hicons",
    iconUpClass: "chevron-up",
    iconDownClass: "chevron-down",
    showDelay: 500,
    hideDelay: 500,
    hide: true
};

Menu.prototype.create = function() {
    var self = this;

    this.outerContainer = Utils.create("div");

    this.titleContainer = Utils.create("div")
        .addClass(this.titleClass)
        .appendTo(this.outerContainer);

    this.contentContainer = Utils.create("div")
        .html(this.content)
        .appendTo(this.outerContainer);

    this.icon = Utils.create("div")
        .addClass(this.iconBaseClass)
        .appendTo(this.titleContainer);

    this.title = Utils.create("span")
        .css({ display: "inline-block", padding: "0 0 0 6px" })
        .html(this.title)
        .appendTo(this.titleContainer);

    this.title.click(function() {
        if (self.hide == true) {
            self.contentContainer.show(self.showDelay);
            self.hide = false;
            self.icon.addClass(self.iconUpClass);
            self.icon.removeClass(self.iconDownClass);
        } else {
            self.contentContainer.hide(self.hideDelay);
            self.hide = true;
            self.icon.addClass(self.iconDownClass);
            self.icon.removeClass(self.iconUpClass);
        }
    });

    if (this.hide == true) {
        this.icon.addClass(this.iconDownClass);
        this.contentContainer.hide();
    } else {
        this.icon.addClass(this.iconUpClass);
    }

    if (this.appendTo) {
        this.outerContainer.appendTo(this.appendTo);
    }
};

var SimpleMenu = function(o) {
    Utils.extend(this, o);
    this.links = {};
    this.boxes = {};
    this.active = false;
};

SimpleMenu.prototype = {
    baseClass: "simple-menu",
    linkClass: "simple-menu-link",
    activeClass: "simple-menu-active",
    separatorClass: "simple-menu-separator",
    appendTo: false,
    callback: false,
    store: false
};

SimpleMenu.prototype.create = function() {
    var self = this;
    this.container = Utils.create("div")
        .addClass(this.baseClass);

    if (this.appendTo) {
        this.container.appendTo(this.appendTo);
    }

    if (this.items) {
        $.each(items, function(i, item) {
            self.add(item);
        });
    }

    return this;
};

SimpleMenu.prototype.add = function(item) {
    var self = this;

    if (Utils.objectSize(this.boxes) > 0) {
        Utils.create("span")
            .addClass(this.separatorClass)
            .text("|")
            .appendTo(this.container);
    }

    var link = Utils.create("span")
        .addClass(this.linkClass)
        .html(item.text)
        .appendTo(this.container)
        .click(function() { self.switchItem(item.value) });

    if (item.show == true) {
        item.container.show();
        this.active = item.value;
        link.addClass(this.activeClass);
        if (this.store) {
            this.store.to[this.store.as] = item.value;
        }
    } else {
        item.container.hide();
    }

    this.links[item.value] = link;
    this.boxes[item.value] = item.container;
};

SimpleMenu.prototype.switchItem = SimpleMenu.prototype.switchTo = function(value) {
    if (this.active == value) {
        return;
    }
    this.boxes[this.active].hide(200);
    this.links[this.active].removeClass(this.activeClass);
    this.links[value].addClass(this.activeClass);
    this.boxes[value].show(200);
    this.active = value;
    if (this.store) {
        this.store.to[this.store.as] = value;
    }
    if (this.callback) {
        this.callback(value);
    }
};
var Pager = function(o) {
    Utils.extend(this, o);
};

Pager.prototype = {
    appendTo: false,
    format: "default",
    stopIconClass: false,
    backIconClass: false,
    forwardIconClass: false,
    pagerClass: "pager",
    pagerTextClass: false,
    data: false,
    postdata: false
};

Pager.prototype.getPagerTextClass = function() {
    return this.pagerTextClass || "pager-text-"+ this.format;
};

Pager.prototype.getStopIconClass = function() {
    if (this.stopIconClass) {
        return this.stopIconClass;
    }
    return this.format == "default"
        ? "gicons-gray gicons stop"
        : "hicons-gray hicons stop";
};

Pager.prototype.getBackIconClass = function() {
    if (this.backIconClass) {
        return this.backIconClass;
    }
    return this.format == "default"
        ? "gicons-gray gicons chevron-left"
        : "gicons-gray gicons chevron-right";
};

Pager.prototype.getForwardIconClass = function() {
    if (this.forwardIconClass) {
        return this.forwardIconClass;
    }
    return this.format == "default"
        ? "gicons-gray gicons chevron-right"
        : "hicons-gray hicons chevron-right";
};

/*
    <div class="pager">
        <div class="gicons-gray gicons stop"></div>
        <div class="pager-text-default">Displaying 0-9 of 9 hits</div>
        <div class="gicons-gray gicons stop"></div>
    </div>
*/

Pager.prototype.create = function() {
    var postdata = this.postdata;

    var self = this,
        offset = postdata.offset,
        limit = postdata.limit,
        size = this.data.size,
        total = this.data.total;

    var prev = (parseInt(offset) - parseInt(limit)),
        next = (parseInt(offset) + parseInt(limit)),
        to = (parseInt(offset) + parseInt(size)),
        html;

    if (prev < 0) {
        prev = 0;
    }

    var container = $(this.appendTo)
        .addClass(this.pagerClass)
        .html("");

    if (offset > 0) {
        Utils.create("div")
            .addClass(this.getBackIconClass())
            .appendTo(container)
            .css({ cursor: "pointer" })
            .click(function() {
                postdata.offset = prev;
                postdata.size = self.data.size;
                self.callback({ postdata: postdata });
            });
    } else {
        Utils.create("div")
            .addClass(this.getStopIconClass())
            .appendTo(container);
    }

    Utils.create("div")
        .addClass(this.getPagerTextClass())
        .html(Text.get("action.display_from_to_rows", [ offset, to, total ]))
        .appendTo(container);

    if (next < total) {
        Utils.create("div")
            .addClass(this.getForwardIconClass())
            .appendTo(container)
            .css({ cursor: "pointer" })
            .click(function() {
                postdata.offset = next;
                postdata.size = self.data.size;
                self.callback({ postdata: postdata });
            });
    } else {
        Utils.create("div")
            .addClass(this.getStopIconClass())
            .appendTo(container);
    }
};
var Tabs = function(o) {
    this.cache = {};
    Utils.extend(this, o);
};

Tabs.prototype = {
    activeClass: "nav-sub-active",
    appendNavTo: "#nav-sub",
    appendContentTo: "#content",
    tabs: false
};

/*
    <nav id="nav-sub" style="display: block;">
        <nav>
            <ul>
                <li class="nav-sub-active"><a style="cursor: pointer;">Group settings</a></li>
                <li><a style="cursor: pointer;">Host group settings </a></li>
                <li><a style="cursor: pointer;">User group settings</a></li>
            </ul>
            <div class="clear"></div>
        </nav>
    </nav>
*/

Tabs.prototype.create = function() {
    $(this.appendNavTo).html("");

    var self = this,
        list = Utils.create("ul").appendTo(this.appendNavTo);

    Utils.create("div")
        .addClass("clear")
        .appendTo(this.appendNavTo);

    $.each(this.tabs, function(i, tab) {
        var link = Utils.create("a")
            .html(tab.text)
            .css({ cursor: "pointer" });

        var li = Utils.create("li")
            .html(link)
            .appendTo(list)
            .click(function() { self.switchTab(i) });

        var content = Utils.create("div")
            .hide()
            .html(self.content)
            .appendTo(self.appendContentTo);

        if (tab.id) {
            content.attr("id", tab.id);
        }

        self.cache[i] = { li: li, content: content };
    });

    this.switchTab(0);
};

Tabs.prototype.switchTab = function(i) {
    if (this.activeTab != undefined) {
        this.cache[this.activeTab].content.hide();
        this.cache[this.activeTab].li.removeClass(this.activeClass);
    }
    this.cache[i].content.fadeIn(200);
    this.cache[i].li.addClass(this.activeClass)
    this.activeTab = i;
};
/*
 * Original from http://blog.stevenlevithan.com/archives/date-time-format
 * 
 * Changes by Bloonix:
 *
 *   - added language support
 *   - add dateFormat to B
 */

/*
 * Date Format 1.2.3
 * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
 * MIT license
 *
 * Includes enhancements by Scott Trenda <scott.trenda.net>
 * and Kris Kowal <cixar.com/~kris.kowal/>
 *
 * Accepts a date, a mask, or a date and a mask.
 * Returns a formatted version of the given date.
 * The date defaults to the current date/time.
 * The mask defaults to dateFormat.masks.default.
 */

var DateFormat = function () {
    var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
        timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
        timezoneClip = /[^-+\dA-Z]/g,
        pad = function (val, len) {
            val = String(val);
            len = len || 2;
            while (val.length < len) val = "0" + val;
            return val;
        };

    // Regexes and supporting functions are cached through closure
    return function (date, mask, utc) {
        var dF = DateFormat;
        dF.i18n = Text.dateFormat[Text.lang];

        // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
        if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
            mask = date;
            date = undefined;
        }

        // Passing date through Date applies Date.parse, if necessary
        date = date ? new Date(date) : new Date;
        if (isNaN(date)) throw SyntaxError("invalid date");

        mask = String(dF.masks[mask] || mask || dF.masks["default"]);

        // Allow setting the utc argument via the mask
        if (mask.slice(0, 4) == "UTC:") {
            mask = mask.slice(4);
            utc = true;
        }

        var _ = utc ? "getUTC" : "get",
            d = date[_ + "Date"](),
            D = date[_ + "Day"](),
            m = date[_ + "Month"](),
            y = date[_ + "FullYear"](),
            H = date[_ + "Hours"](),
            M = date[_ + "Minutes"](),
            s = date[_ + "Seconds"](),
            L = date[_ + "Milliseconds"](),
            o = utc ? 0 : date.getTimezoneOffset(),
            flags = {
                d:    d,
                dd:   pad(d),
                ddd:  dF.i18n.dayNames[D],
                dddd: dF.i18n.dayNames[D + 7],
                m:    m + 1,
                mm:   pad(m + 1),
                mmm:  dF.i18n.monthNames[m],
                mmmm: dF.i18n.monthNames[m + 12],
                yy:   String(y).slice(2),
                yyyy: y,
                h:    H % 12 || 12,
                hh:   pad(H % 12 || 12),
                H:    H,
                HH:   pad(H),
                M:    M,
                MM:   pad(M),
                s:    s,
                ss:   pad(s),
                l:    pad(L, 3),
                L:    pad(L > 99 ? Math.round(L / 10) : L),
                t:    H < 12 ? "a"  : "p",
                tt:   H < 12 ? "am" : "pm",
                T:    H < 12 ? "A"  : "P",
                TT:   H < 12 ? "AM" : "PM",
                Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
                o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
                S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
            };

        return mask.replace(token, function ($0) {
            return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
        });
    };
}();

// Some common format strings
DateFormat.masks = {
    "default":      "ddd mmm dd yyyy HH:MM:ss",
    shortDate:      "m/d/yy",
    mediumDate:     "mmm d, yyyy",
    longDate:       "mmmm d, yyyy",
    fullDate:       "dddd, mmmm d, yyyy",
    shortTime:      "h:MM TT",
    mediumTime:     "h:MM:ss TT",
    longTime:       "h:MM:ss TT Z",
    isoDate:        "yyyy-mm-dd",
    isoTime:        "HH:MM:ss",
    isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
    isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'",
    bloonix:        "yyyy-mm-dd HH:MM:ss",
    bloonixNoHour:  "yyyy-mm-dd HH:MM",
    bloonixDate:    "yyyy-mm-dd",
    bloonixTime:    "HH:MM:ss",
    timePlusMs:     "HH:MM:ss.l"
};

// Internationalization strings
DateFormat.i18n = Text.dateFormat[Text.lang];

// For convenience...
Date.prototype.format = function (mask, utc) {
    return DateFormat(this, mask, utc);
};
var Overlay = function(o) {
    Utils.extend(this, o);
};

Overlay.prototype = {
    outerClass: "overlay-outer",
    innerClass: "overlay-inner",
    titleClass: "overlay-title",
    contentClass: "overlay-content",
    buttonsClass: "overlay-buttons",
    buttonClass: "btn btn-white btn-medium",
    title: false,
    content: false,
    buttons: false,
    buttonsByAlias: {},
    closeText: Text.get("action.close"),
    showCloseButton: true,
    width: false,
    height: false,
    visible: false
};

Overlay.prototype.create = function() {
    if ($("#overlay").length) {
        $("#overlay").remove();
    }

    var self = this;

    this.outerContainer = Utils.create("div")
        .attr("id", "overlay")
        .addClass(this.outerClass);

    this.innerContainer = Utils.create("div")
        .addClass(this.innerClass)
        .appendTo(this.outerContainer);

    if (this.width) {
        this.innerContainer.css({ width: this.width });
    }
    if (this.height) {
        this.innerContainer.css({ height: this.height });
    }

    this.titleContainer = Utils.create("div")
        .addClass(this.titleClass)
        .appendTo(this.innerContainer);

    if (this.title) {
        this.titleContainer.html(this.title)
    }

    var contentContainer = Utils.create("div")
        .addClass(this.contentClass)
        .html(this.content)
        .appendTo(this.innerContainer);

    if (this.visible) {
        contentContainer.css({ overflow: "visible" });
    }

    var buttonContainer = Utils.create("div")
        .addClass(this.buttonsClass)
        .appendTo(this.innerContainer);

    if (this.buttons) {
        $.each(this.buttons, function(i, item) {
            var button = Utils.create("div")
                .addClass(self.buttonClass)
                .html(item.content)
                .click(function() {
                    if (item.callback) {
                        item.callback(item.content, self);
                    }
                    if (item.close !== false) {
                        self.close();
                    }
                });

            if (item.hide === true) {
                button.hide();
            }

            button.appendTo(buttonContainer);

            if (item.alias) {
                self.buttonsByAlias[item.alias] = button;
            }
        });
    }

    if (this.closeText == undefined) {
        this.closeText = Text.get("action.close");
    }

    if (this.showCloseButton) {
        var closeButton = Utils.create("div")
            .addClass(this.buttonClass)
            .html(this.closeText)
            .appendTo(buttonContainer);
    
        closeButton.click(function(){
            self.close();
        })
    }

    this.outerContainer.appendTo("body");
    this.outerContainer.fadeIn(400);
    this.innerContainer.fadeIn(400);
    return this;
};

Overlay.prototype.getButton = function(alias) {
    return this.buttonsByAlias[alias];
};

Overlay.prototype.getButtons = function() {
    return this.buttonsByAlias;
};

Overlay.prototype.setWidth = function(width) {
    this.innerContainer.css({ width: width });
};

Overlay.prototype.setHeight = function(height) {
    this.innerContainer.css({ height: height });
};

Overlay.prototype.close = function() {
    var self = this;
    this.innerContainer.fadeOut(400);
    this.outerContainer.fadeOut(400);
    setTimeout(function() { self.outerContainer.remove() }, 400);
    if (self.closeCallback) {
        self.closeCallback();
    }
};
var Header = function(o) {
    Utils.extend(this, o);
};

Header.prototype = {
    appendTo: "#content",
    title: false,
    sidetitle: false,
    subtitle: false,
    notice: false,
    pager: false,
    search: false,
    border: false,
    headerClass: "header",
    sidetitleClass: "sidetitle",
    pagerClass: "pager",
    css: false,
    rbox: true,
    replace: false
};

Header.prototype.create = function() {
    var self = this;

    if (this.replace === true) {
        $(this.appendTo).html("");
    }

    this.outer = Utils.create("div")
        .addClass(this.headerClass)
        .appendTo(this.appendTo);

    if (this.css) {
        this.outer.css(this.css);
    }

    //if (this.border) {
    //    this.outer.addClass("border");
    //}

    if (this.title) {
        var title = this.title;
        this.title = Utils.create("h1").appendTo(this.outer);

        if (typeof title == "object") {
            this.title.html( $(title).clone() );
        } else {
            this.title.html(title);
        }
    }

    if (this.smallSubTitle) {
        Utils.create("br").appendTo(this.title);
        Utils.create("small").html(this.smallSubTitle).appendTo(this.title);
    }

    if (this.sidetitle) {
        var sidetitle = Utils.create("span").appendTo(this.title);
        Utils.create("span").html(" (").appendTo(sidetitle);
        Utils.create("span").html(this.sidetitle).appendTo(sidetitle);
        Utils.create("span").html(")").appendTo(sidetitle);
        this.sidetitle = sidetitle;
    }

    if (this.pager == true) {
        this.pager = Utils.create("div")
            .addClass("pager")
            .css({ width: "34%", float: "left" })
            .appendTo(this.outer);
    }

    if (this.rbox === true) {
        this.rbox = Utils.create("div")
            .addClass("rbox")
            .appendTo(this.outer);
    } else {
        // correction for sideBySideBoxes if no buttons exists in the right box
        this.outer.css({ "padding-bottom": "3px" });
    }

    if (typeof this.pager == "object") {
        this.title.css({ width: "33%" });
        this.pager.css({ width: "34%" });
        this.rbox.css({ width: "33%" });
    } else if (this.rbox === true) {
        this.title.css({ width: "60%" });
        this.rbox.css({ width: "40%" });
    }

    if (this.search) {
        this.search = Utils.create("div")
            .addClass("search")
            .appendTo(this.rbox);
    }

    if (this.icons) {
        $.each(this.icons, function(i, e) {
            var icon = Utils.create("span")
                .css({ float: "right", cursor: "pointer", "margin-top": "2px" });

            if (e.type == "create") {
                icon.addClass("gicons-gray gicons circle-plus");
            } else if (e.type == "configure") {
                icon.addClass("gicons-gray gicons cogwheels");
            } else if (e.type == "go-back") {
                icon.addClass("gicons-gray gicons left-arrow");
            } else if (e.type == "help") {
                icon.addClass("gicons-gray gicons circle-question-mark");
            } else if (e.type == "reload") {
                icon.addClass("gicons-gray gicons refresh");
            }

            if (e.title != undefined) {
                icon.attr("title", e.title);
                icon.tooltip();
            }

            if (e.url) {
                Utils.create("a")
                    .attr("href", e.url)
                    .html(icon)
                    .appendTo(self.rbox);
            } else if (e.callback) {
                icon.click(e.callback);
                icon.appendTo(self.rbox);
            }
        });
    }

    if (this.counter) {
        this.counterObject = Utils.create("div")
            .attr("title", Text.get("action.show_selected_objects"))
            .addClass("btn btn-white btn-small")
            .html("0")
            .appendTo(this.rbox)
            .tooltip();
    }

    Utils.create("div")
        .addClass("clear")
        .appendTo(this.outer);

    if (this.subtitle) {
        this.subtitle = Utils.create("h3")
            .html(this.subtitle)
            .appendTo(this.outer);
    }

    if (this.notice) {
        this.notice = Utils.create("h4")
            .html(this.notice)
            .appendTo(this.outer);
    }

    return this;
};

Header.prototype.setTitle = function(title) {
    this.title.html(title);
};

Header.prototype.setSidetitle = function(title) {
    this.sidetitle.html(title);
};

Header.prototype.setSubtitle = function(title) {
    this.subtitle.html(title);
};

Header.prototype.setNotice = function(title) {
    this.notice.html(title);
};
var Workflow = function(o) {
    Utils.extend(this, o);
    this.steps = {};
};

Workflow.prototype = {};

/*
    workflow.onError(
        function(step) { throw new Error() }
    );

    workflow.add({
        alias: "start",
        callback: function() { },
        nextStep: "foo"
    };
*/

Workflow.prototype.add = function(o) {
    this.stepsByAlias[o.alias] = o;
};

Workflow.prototype.start = function(alias, args) {
    var step = this.stepsByAlias[alias];
    var ret = step.callback(args);

    if (ret) {
        if (step.nextStep) {
            this.start(nextStep, ret);
        }
    } else if (this.errorStep) {
        this.errorStep(alias, args);
    }
};
var iButton = function(o) {
    Utils.extend(this, o);

    var self = this;

    this.outer = Utils.create("div")
        .addClass("hicons-btn");

    this.icon = Utils.create("div")
        .addClass("hicons info-sign")
        .appendTo(this.outer);

    this.bubble = Utils.create("div")
        .addClass("hicons-bubble")
        .hide()
        .appendTo(this.outer);

    if (this.title) {
        Utils.create("h2")
            .html(this.title)
            .appendTo(this.bubble);
    }

    if (this.desc) {
        Utils.create("p")
            .html(this.desc)
            .appendTo(this.bubble);
    }

    if (this.note) {
        Utils.create("small")
            .html(this.note)
            .appendTo(this.bubble);
    }

    if (this.text) {
        this.bubble.html(this.text);
    }

    if (o.width) {
        this.bubble.css({ width: o.width });
    }

    if (o.css) {
        this.bubble.css(o.css);
    }

    this.bubbleIsVisible = false;

    this.outer.click(function() {
        if (self.bubbleIsVisible == true) {
            self.bubbleIsVisible = false;
            self.bubble.hide();
            self.icon.removeClass("remove");
            self.icon.addClass("info-sign");
        } else {
            self.bubbleIsVisible = true;
            self.bubble.show();
            self.icon.removeClass("info-sign");
            self.icon.addClass("remove");
        }
    });
};

iButton.prototype.appendTo = function(o) {
    this.outer.appendTo(o);
};
// Define encapsulated variables.
var Bloonix = {

    // Pre-defined status colors.
    defaultStatusColor: {
        OK: "#5ec15e",
        INFO: "#339ab8",
        //WARNING: "#edc951",
        WARNING: "#e4af00",
        CRITICAL: "#cc333f",
        UNKNOWN: "#eb6841"
    },

    areaStatusColors: [
        "#4b9768", // ok
        "#2f96b4", // info
        "#f89406", // warning
        "#ca2146", // critical 
        "#eb582a"  // unknown
    ],

    // Store all interval and timeout objects.
    intervalObjects: [],
    timeoutObjects: [],

    // Store ajax objects.
    xhrPool: [],

    // How many rows to request by default.
    requestSize: 50,
    searchSize: 10,

    // The default interval to reload charts and content
    // and the maximum count of selected charts.
    chartReloadInterval: 30000,
    chartMaxSelected: 100,

    // Store ajax postdata from different functions.
    postdata: {},

    // Global caching for different purposes.
    cache: {
        // The chart data must be cached to destroy the
        // highcharts object or the container. So each
        // highcharts object is stored by the id of the
        // div container:
        //
        //      charts = {
        //          "#id": {
        //              chart: new Highcharts.Chart(...),
        //              intervalObject: setInterval(...),
        //          }
        //      }
        charts: {}
    },

    // Store different statistics. As example global
    // host and service statistics to display them
    // in the footer.
    stats: {
        hosts: {
            unknown: 0,
            critical: 0,
            warning: 0,
            info: 0,
            ok: 0
        },
        services: {
            unknown: 0,
            critical: 0,
            warning: 0,
            info: 0,
            ok: 0
        }
    },

    // Store objects like #ids for a faster access.
    objects: {},

    // Destroy function that is called every time
    // the page is switched.
    destroy: undefined,

    // The default plot library for charts and maps to use.
    plotChartsWith: "other",
    //plotChartsWith: "highcharts",

// End
};
// Create bar charts.
Bloonix.barChart = function(o) {
    Bloonix[Bloonix.plotChartsWith].barChart(o);
};

// Create pie charts.
Bloonix.pieChart = function(o) {
    Bloonix[Bloonix.plotChartsWith].pieChart(o);
};

// Create area and line charts.
Bloonix.plotChart = function(o) {
    Bloonix[Bloonix.plotChartsWith].plotChart(o);
};

// Create map charts like worldmap.
Bloonix.mapChart = function(o) {
    Bloonix[Bloonix.plotChartsWith].mapChart(o);
};

// Create chart for MTR
Bloonix.createChartForMTR = function(o) {
    Bloonix[Bloonix.plotChartsWith].createChartForMTR(o);
};

// Create chart for WTRM
Bloonix.createChartForWTRM = function(o) {
    Bloonix[Bloonix.plotChartsWith].createChartForWTRM(o);
};

// The default time format for the Highcharts tooltip.
DateFormat.masks.highchartsTooltip = "ddd mmm dd yyyy HH:MM:ss";

// This function is used by default to create and cache
// chart objects. On this way it's easy to destroy the
// objects later with the destroyChart* functions.
Bloonix.createOrReplaceChart = function(o) {
    var chart = Bloonix.getChartObject(o.container);
    var cache = Bloonix.cache.charts;

    if (typeof chart == "object") {
        chart.destroy();
    }

    chart = new Highcharts[o.type](o.chartOpts, o.chartFunction);
    cache[o.container] = chart;
};

// Destroy all cached chart objects.
Bloonix.destroyChartObjects = function(cache) {
    var cache = Bloonix.cache.charts;

    $.each(cache, function(container, obj) {
        if (cache[container] != undefined) {
            if (typeof cache[container].chart == "object") {
                cache[container].chart.destroy();
            }

            cache[container] = undefined;
        }

        if ($(container).length > 0) {
            $(container).remove();
        }
    });
};

// Check if a chart object already exists.
// All charts are stored by the id attribute
// of the container.
Bloonix.getChartObject = function(container) {
    var cache = Bloonix.cache.charts;

    if (cache[container] != undefined && typeof cache[container].chart == "object") {
        return cache[container];
    }

    return false;
};

Bloonix.convertBytesToStr = function(unit, value, sep) {
    var negative = 0;

    if (value === undefined || value === null) {
        return null;
    }

    value = parseFloat(value);

    if (unit === "bytes_to_bits") {
        value = value * 8;
        value = Bloonix.convertUnitsToStr("", value, sep);
        value += "b";
        return value;
    }

    if (/bits/.test(unit)) {
        unit.replace(/bits/, "bytes");
        value = value / 8;
    }

    // cal back to positive number
    if (value < 0) {
        negative = 1;
        value = value * -1;
    }

    // cal back to bytes
    if (unit == "kilobytes") {
        value = value * 1024;
    } else if (unit == "megabytes") {
        value = value * 1048576;
    } else if (unit == "gigabytes") {
        value = value * 1073741824;
    } else if (unit == "terabytes") {
        value = value * 1099511627776;
    } else if (unit == "petabytes") {
        value = value * 1125899906842624;
    } else if (unit == "exabytes") {
        value = value * 1152921504606846976;
    } else if (unit == "zettabytes") {
        value = value * 1180591620717411303424;
    } else if (unit == "yottabytes") {
        value = value * 1208925819614629174706176;
    }

    // check which unit to use
    if (value >= 1208925819614629174706176) {
        value = value / 1208925819614629174706176;
        unit = "YB";
    } else if (value >= 1180591620717411303424) {
        value = value / 1180591620717411303424;
        unit = "ZB"
    } else if (value >= 1152921504606846976) {
        value = value / 1152921504606846976;
        unit = "EB";
    } else if (value >= 1125899906842624) {
        value = value / 1125899906842624;
        unit = "PB";
    } else if (value >= 1099511627776) {
        value = value / 1099511627776;
        unit = "TB";
    } else if (value >= 1073741824) {
        value = value / 1073741824;
        unit = "GB";
    } else if (value >= 1048576) {
        value = value / 1048576;
        unit = "MB";
    } else if (value >= 1024) {
        value = value / 1024;
        unit = "KB";
    } else {
        unit = "";
    }

    // cal back to negative number
    if (negative == 1) {
        value = value * -1;
    }

    if (sep == true) {
        return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + unit;
    }

    return value.toFixed(1) + unit;
};

Bloonix.convertUnitsToStr = function(unit, value, sep) {
    if (value === undefined || value === null) {
        return null;
    }

    value = parseFloat(value);

    if (unit == "null") {
        var x = value.toString();
        if (/\./.test(x)) {
            value = value.toFixed(2);
        }
        return value;
    }

    var negative = 0;

    if (value < 0) {
        negative = 1;
        value = value * -1;
    }

    if (unit == "kilo") {
        value = value * 1000;
    } else if (unit == "mega") {
        value = value * 1000000;
    } else if (unit == "giga") {
        value = value * 1000000000;
    } else if (unit == "tera") {
        value = value * 1000000000000;
    } else if (unit == "peta") {
        value = value * 1000000000000000;
    } else if (unit == "exa") {
        value = value * 1000000000000000000;
    } else if (unit == "zetta") {
        value = value * 1000000000000000000000;
    } else if (unit == "yotta") {
        value = value * 1000000000000000000000000;
    } else if (unit == "chema") {
        value = value * 1000000000000000000000000000;
    }

    if (value >= 1000000000000000000000000000) {
        value = value / 1000000000000000000000000000;
        unit = "C";
    } else if (value >= 1000000000000000000000000) {
        value = value / 1000000000000000000000000;
        unit = "Y";
    } else if (value >= 1000000000000000000000) {
        value = value / 1000000000000000000000;
        unit = "Z";
    } else if (value >= 1000000000000000000) {
        value = value / 1000000000000000000;
        unit = "E";
    } else if (value >= 1000000000000000) {
        value = value / 1000000000000000;
        unit = "P";
    } else if (value >= 1000000000000) {
        value = value / 1000000000000;
        unit = "T";
    } else if (value >= 1000000000) {
        value = value / 1000000000;
        unit = "G";
    } else if (value >= 1000000) {
        value = value / 1000000;
        unit = "M";
    } else if (value >= 1000) {
        value = value / 1000;
        unit = "K";
    } else {
        unit = "";
    }

    if (negative == 1) {
        value = value * -1;
    }

    if (sep == true) {
        return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + unit;
    }

    return value.toFixed(1) + unit;
};

Bloonix.noChartData = function(container) {
    $(container).html("");

    var outer = Utils.create("div")
        .addClass("no-chart-data")
        .appendTo(container);

    var inner = Utils.create("p")
        .appendTo(outer);

    Utils.create("b")
        .text(Text.get("info.no_chart_data"))
        .appendTo(inner);
};

Bloonix.checkEmptyChartData = function(o) {
    if (o.series.length == 0) {
        var id = "#"+ o.chart.container;
        $(id).addClass("chart-load-info").html("");

        Utils.create("p").html(
            Utils.create("i").text(o.chart.title)
        ).appendTo(id);

        if (o.chart.subtitle) {
            Utils.create("p").html(
                Utils.create("i").text(o.chart.subtitle)
            ).appendTo(id);
        }

        Utils.create("p").html(
            Utils.create("b").text(Text.get("info.no_chart_data"))
        ).appendTo(id);

        return true;
    }

    return false;
};
// setTitle sets the title in the html header
// and returns a copy of the title, because
// html is not valid in the title="" header.
Bloonix.setTitle = function(key, toReplace, flag) {
    var title;
    if (toReplace != undefined) {
        $("title").html(Text.get(key, toReplace));
        title = Text.get(key, toReplace, flag);
    } else {
        $("title").html(Text.get(key));
        title = Text.get(key);
    }
    return title;
};

Bloonix.setMetaTitle = function(title) {
    $("title").html(title);
};

// Clear all active interval objects.
Bloonix.clearIntervalObjects = function() {
    if (Bloonix.intervalObjects.length) {
        var object = Bloonix.intervalObjects.shift();
        clearInterval(object);
        Bloonix.clearIntervalObjects();
    }
};

// Clear all active timeout objects.
Bloonix.clearTimeoutObjects = function() {
    if (Bloonix.timeoutObjects.length) {
        var object = Bloonix.timeoutObjects.shift();
        clearTimeout(object);
        Bloonix.clearTimeoutObjects();
    }
};

// Clear the content.
Bloonix.clearHTML = function() {
    $("#content").html("");
    $("#footer-left").html("");
    if ( $("#header-title").length ) {
        $("#header-title").remove();
    }
};

// Clear all.
Bloonix.clearAll = function() {
    Ajax.abortXHRs();
    Bloonix.clearIntervalObjects();
    Bloonix.destroyChartObjects(Bloonix.cache.charts);
    Bloonix.clearHTML();
    if (Bloonix.destroy != undefined) {
        Bloonix.destroy();
        Bloonix.destroy = undefined;
    }
};

Bloonix.dropDownToggle = function(caller) {
    var ul = $(caller).find("ul");

    if (ul.is(":hidden")) {
        $(caller).tooltip({ disabled: true });
        ul.show();
    } else {
        ul.hide();
        $(caller).tooltip({ disabled: false });
    }
};

Bloonix.createInfoIcon = function(o) {
    var span = Utils.create("span"),
        icon = Utils.create("span")
            .addClass("hicons-white hicons")
            .appendTo(span);

    if (o.type == "OK") {
        span.addClass("circle green");
        icon.addClass("ok");
    } else if (o.type == "INFO") {
        span.addClass("circle blue");
        icon.addClass("info-sign");
    } else if (o.type == "WARNING") {
        span.addClass("circle yellow");
        icon.addClass("warning-sign");
    } else if (o.type == "CRITICAL") {
        span.addClass("circle red");
        icon.addClass("fire");
    } else if (o.type == "UNKNOWN") {
        span.addClass("circle orange");
        icon.addClass("question-sign");
    }

    if (o.size === "small") {
        span.addClass("circle-small");
    }

    return span;
};

Bloonix.redirect = function(path) {
    Log.debug("redirect()");
    window.location.href = "/#"+ path;
    Bloonix.route.to(path);
};

Bloonix.call = function(link, text) {
    if (typeof text == "string") {
        text = Utils.escape(text);
    }
    return Utils.create("a")
        .attr("href", "#"+ link)
        .html(text)
        .mouseup(function(e){
            if (e.which == 1) {
                window.location.href = "#"+ link;
                Bloonix.route.to(this);
            }
            return true;
        });
};

Bloonix.switchDebug = function() {
    Log.level = Log.level == "debug"
        ? "info"
        : "debug";
    console.log("switch log level to "+ Log.level);
};

Bloonix.logIntervalObjectCount = function() {
    var global = Bloonix.intervalObjects.length;
    var charts = 0;

    $.each(Bloonix.cache.charts, function(key, obj) {
        if (obj != undefined) {
            if (obj.intervalObject) {
                charts += 1;
            }
        }
    });

    var total = global + charts;
    //Log.debug("intervalObjects: global("+ global + ") charts(" + charts +") total("+ total +")");
};

Bloonix.logXhrObjectCount = function() {
    //Log.debug("jqXhrObjects: "+ Bloonix.xhrPool.length);
};

Bloonix.createHoverBoxIcons = function(o) {
    var chartBoxIcons = Utils.create("div")
        .addClass("hover-box-icons")
        .appendTo(o.container);

    if (o.addClass) {
        chartBoxIcons.addClass(o.addClass);
    }

    $.each(o.icons, function(i, icon) {
        var box = Utils.create("span")
            .addClass("hicons-btn")
            .appendTo(chartBoxIcons);

        var hicon = Utils.create("span")
            .appendTo(box);

        if (icon.type === "colorpicker") {
            if (icon.color) {
                hicon.css({ "background-color": icon.color });
                hicon.data("color", icon.color);
            } else {
                hicon.data("color", null);
            }
            hicon.addClass("color-picker-icon");
            hicon.hexColorPicker({
                colorModel: "hex",
                submitCallback: function(color) { hicon.data("color", color) }
            });
        } else {
            hicon.addClass("hicons "+ icon.type);
        }

        if (icon.title) {
            hicon.attr("title", icon.title).tooltip();
        }

        if (icon.addClass) {
            box.addClass(icon.addClass);
        }

        if (icon.callback) {
            hicon.click(function() { icon.callback(icon.data) });
        } else if (icon.route) {
            hicon.click(function() { Bloonix.route.to(icon.route) });
        }
    });

    o.destroy = function() {
        chartBoxIcons.remove();
    };

    return o;
};

Bloonix.get = function(url, data) {
    var object;

    Ajax.post({
        url: url,
        async: false,
        data: data,
        success: function(result) {
            object = result.data;
        }
    });

    return object;
};

Bloonix.notImplemented = function() {
    $("#content").html(
        Utils.create("div")
            .addClass("info-err")
            .text("This feature is not implemented yet!")
    );
};

Bloonix.createIcon = function(type) {
    var icon = Utils.create("span")
        .attr("title", Text.get("action."+ type))
        .addClass("btn btn-white btn-small-icon")
        .html(Utils.create("span").addClass("hicons-gray hicons "+ type))
        .tooltip();
    return icon;
};

/*
    In this example the value is stored to o.cache.selected.preset.

    Bloonix.createIconList({
        items: [
            { name: "30d",  value: "30d",  title: "30d", default: true },
            { name: "60d",  value: "60d",  title: "60d" },
            { name: "90d",  value: "90d",  title: "90d" },
            { name: "180d", value: "180d", title: "180d" }
        ],
        store: { to: o.cache.selected, as: "preset" },
        callback: function() { o.tableOpts.getData() },
        appendTo: dataRelativeTime
    });
*/
Bloonix.createIconList = function(o) {
    var self = this;

    o.container = Utils.create("div");
    o.getContainer = function() {
        return this.container;
    };

    if (o.appendTo) {
        o.container.appendTo(o.appendTo);
    }

    o.cache = { };

    if (o.multiple == true) {
        o.switchTo = function(value, noCallback) {
            var self = this;

            if (this.cache[value].enabled == true) {
                this.cache[value].object.removeClass("btn-selected");
                this.cache[value].enabled = false;
            } else {
                this.cache[value].object.addClass("btn-selected");
                this.cache[value].enabled = true;
            }

            var values = [ ];
            $.each(this.cache, function(key, btn) {
                if (self.cache[key].enabled == true) {
                    values.push(key);
                }
            });

            if (this.store) {
                this.store.to[this.store.as] = values;
            }

            if (this.callback && noCallback == undefined) {
                this.callback(values);
            }
        };
    } else {
        o.switchTo = function(value, noCallback) {
            $.each(this.cache, function(key, btn) {
                if (btn.enabled == true) {
                    btn.enabled = false;

                    if (btn.icon == undefined) {
                        btn.object.removeClass("btn-selected");
                    } else {
                        btn.icon.removeClass("btn-icon-selected");
                        btn.icon.addClass("btn-icon-unselected");
                    }
                }
            });

            this.cache[value].enabled = true;

            if (this.cache[value].icon == undefined) {
                this.cache[value].object.addClass("btn-selected");
            } else {
                this.cache[value].icon.removeClass("btn-icon-unselected");
                this.cache[value].icon.addClass("btn-icon-selected");
            }

            if (this.store) {
                this.store.to[this.store.as] = value;
            }

            if (this.callback && noCallback == undefined) {
                this.callback(value);
            }
        };
    }

    $.each(o.items, function(i, item) {
        var elem = Utils.create("div")
            .attr("data-value", item.value)
            .appendTo(o.container)
            .tooltip();

        o.cache[item.value] = {
            object: elem,
            enabled: false
        };

        if (item.name) {
            elem.html(item.name);
        } else if (item.icon) {
            o.cache[item.value].icon = Utils.create("div")
                .addClass(item.icon)
                .addClass("btn-icon-unselected")
                .appendTo(elem);
        }

        if (item.title != undefined) {
            elem.attr("title", item.title)
        }

        elem.click(function() { o.switchTo(item.value) });

        if (o.button != false) {
            if (o.format == undefined) {
                elem.addClass("btn btn-white btn-icon-even")
            } else {
                elem.addClass("btn btn-white btn-"+ o.format)
            }
        } else {
            if (o.display == undefined) {
                o.display = "block";
            }
            elem.css({
                display: o.display,
                padding: "4px",
                "font-size": "14px",
                cursor: "pointer"
            });
            elem.hover(
                function() { elem.addClass("btn-hovered") },
                function() { elem.removeClass("btn-hovered") }
            );
        }

        if (item.default == true) {
            o.switchTo(item.value, true);
        }
    });

    return o;
};

// Some date time validations
// Validate timestamps "from time" - "to time", where the "to" timestamp
// must be higher than the "from" timestamp. The expected format of the
// timestamps is as example: 2000-10-10 01:00:00
Bloonix.validateFromToDateTime = function(from, to) {
    if (from == undefined || to == undefined) {
        return false;
    }

    var resultFrom = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})$/.exec(from);
    var resultTo = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})$/.exec(to);

    if (resultFrom == null || resultTo == null) {
        return false;
    }

    if (Bloonix.validateDate(resultFrom[1]) == false || Bloonix.validateDate(resultTo[1]) == false) {
        return false;
    }

    if (Bloonix.validateTime(resultFrom[2]) == false || Bloonix.validateTime(resultTo[2]) == false) {
        return false;
    }

    var numFrom = Math.floor(from.replace(/[-:\s]/g, "")),
        numTo = Math.floor(to.replace(/[-:\s]/g, ""));

    if (numFrom >= numTo) {
        return false;
    }

    return true;
};

// Validate "from" - "to" timestamps, but without seconds. The expected
// timestamp format is: 2000-10-10 01:00
Bloonix.validateFromToDateHourMin = function(from, to) {
    if (from == undefined || to == undefined) {
        return false;
    }

    from += ":00";
    to += ":00";

    return Bloonix.validateFromToDateTime(from, to);
};

// Validate the date part of a timestamp. The expected format is 2010-10-10.
Bloonix.validateDate = function(date) {
    if (date == undefined) {
        return false;
    }

    var result = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

    if (result == null) {
        return false;
    }

    var year = Math.floor(result[1]),
        month = Math.floor(result[2]),
        day = Math.floor(result[3]);

    if (month > 12) {
        return false;
    }

    if (month == 4 || month == 6 || month == 9 || month == 11) {
        if (day > 30) {
            return false;
        }
    } else if (month == 2) {
        var febdays = year % 100 && year % 4 ? 28 : 29;
        if (day > febdays) {
            return false;
        }
    } else if (day > 31) {
        return false;
    }

    return true;
};

// Validate the time part of a timestamp. The expected format is 00:00:00.
Bloonix.validateTime = function(time) {
    if (time == undefined) {
        return false;
    }

    var result = /^(\d{2}):(\d{2}):(\d{2})$/.exec(time);

    if (result == null) {
        return false;
    }

    var hour = Math.floor(result[1]),
        min = Math.floor(result[2]),
        sec = Math.floor(result[3]);

    if (hour > 23 || min > 59 || sec > 59) {
        return false;
    }

    return true;
};

Bloonix.createNoteBox = function(o) {
    var object = Utils.extend({
        id: "int-footnote",
        timeout: 2000,
        fadeOutAfter: 400,
        autoClose: false,
        baseClass: "footnote",
        infoClass: "info-simple",
        closeIconClass: "hicons-gray hicons remove close-x",
        text: "not available"
    }, o);

    object.create = function() {
        var self = this;

        if ($("#"+ this.id).length) {
            $("#"+ this.id).remove();
        }

        this.outerContainer = Utils.create("div")
            .attr("id", this.id)
            .addClass(this.baseClass)
            .hide()
            .appendTo("body")
            .fadeIn(400);

        this.bubbleContainer = Utils.create("div")
            .addClass(this.infoClass)
            .html(this.text)
            .appendTo(this.outerContainer);

        Utils.create("span")
            .addClass(this.closeIconClass)
            .click(function() { self.close() })
            .appendTo(this.bubbleContainer);

        if (this.autoClose === true) {
            setTimeout( function() { self.close() }, self.timeout);
        }
    };

    object.close = function() {
        this.outerContainer.fadeOut(self.fadeOutAfter).remove();
    };

    object.create();
    return object;
};

Bloonix.hostServiceAction = function(url, data, text) {
    Ajax.post({
        url: url,
        data: data,
        token: true,
        success: function(result) {
            if (result.status == "ok") {
                Bloonix.createNoteBox({
                    infoClass: "info-ok",
                    text: Utils.create("p").html(Text.get("info.update_success")),
                    autoClose: true,
                    timeout: 4000
                });
            }
        }
    });
};

Bloonix.noAuth = function() {
    $("#content").html(
        Utils.create("div")
            .addClass("info-err")
            .html(Text.get("err-415"))
    ); 
};

Bloonix.flag = function(countryCode, text) {
    countryCode = countryCode.toLowerCase();

    var span = Utils.create("span")
        .addClass("f32");

    Utils.create("span")
        .addClass("flag "+ countryCode)
        .appendTo(span);

    if (text) {
        var outer = Utils.create("span")
            .html(span);
        Utils.create("span")
            .css({ "margin-left": "10px" })
            .text(text)
            .appendTo(outer);
        span = outer;
    }

    return span;
};

Bloonix.showScrollbarAtHover = function(container) {
    $(container)
        .css({ "overflow-x": "hidden", "overflow-y": "hidden" })
        .hover(
            function() { $(this).css({ "overflow-y": "auto" }) },
            function() { $(this).css({ "overflow-y": "hidden" }) }
        );
};

Bloonix.checkIfObject = function(value) {
    if (value === null || value === undefined || value === false || typeof value !== "object") {
        return false;
    }
    return true;
};

Bloonix.getContentSize = function(o) {
    var opt = Utils.extend({
        content: "#content",
        footer: "#footer"
    }, o);

    var width = $(opt.content).width();
    var height = $(window).height() - $(opt.content).offset().top;

    if ($(opt.footer).length) {
        height -= $(opt.footer).outerHeight();
    }

    return { width: width, height: height };
};

Bloonix.sortObject = function(o) {
    var a = [];
    $.each(o, function(i, r) {
        a.push(i);
    });
    return a.sort();
};

Bloonix.addLoading = function(container) {
    Utils.create("div")
        .addClass("loading")
        .show()
        .appendTo(container);
};

Bloonix.replaceWithLoading = function(container) {
    $(container).html(
        Utils.create("div")
            .addClass("loading")
            .show()
    );
};

Bloonix.removeLoading = function(container) {
    $(container).find(".loading").remove();
};

Bloonix.enableLoading = function(container) {
    $(container).find(".loading").show();
};

Bloonix.disableLoading = function(container) {
    $(container).find(".loading").hide();
};

Bloonix.createFooterIcon = function(o) {
    var span = Utils.create("span")
        .addClass("footer-button");

    if (o.title) {
        span.attr("title", o.title);
        span.tooltip();
    }

    if (o.icon) {
        Utils.create("div")
            .addClass("hicons-white hicons "+ o.icon)
            .appendTo(span);
    }

    if (o.click) {
        span.click(o.click);
    }

    span.appendTo("#footer-left")

    return span;
};
Bloonix.init = function(o) {
    Bloonix.initAjax();
    Bloonix.version = o.version;
    if (o) {
        if (o.chartLibrary) {
            Bloonix.plotChartsWith = o.chartLibrary;
        }
        if (o.screen) {
            Bloonix.forceScreen = 1;
            Bloonix.viewScreen(o);
            return;
        }
    }
    Bloonix.initUser();
    Bloonix.initRoutes();
    Bloonix.initHeader();
    Bloonix.initFooter();
    Bloonix.initContent();
    Bloonix.getStats();
    Bloonix.initNavigation();
    Bloonix.route.to();
};
Bloonix.initRoutes = function() {
    var route = Bloonix.route = new Route();
    route.log = Log.debug;

    route.defaultRoute("dashboard", function(req) {
        window.location.hash = "dashboard";
        Bloonix.dashboard();
    });
    route.add("dashboard", function(req) {
        Bloonix.dashboard(req);
    });
    route.add("dashboard/:name", function(req) {
        Bloonix.dashboard(req);
    });
    route.add("wtrm", function(req) {
        Bloonix.WTRM(req);
    });
    route.add("monitoring/hosts", function(req) {
        Bloonix.listHosts(req);
    });
    route.add("monitoring/hosts/:id", function(req) {
        Bloonix.viewHostDashboard(req);
    });
    route.add("monitoring/hosts/create", function(req) {
        Bloonix.createHost(req);
    });
    route.add("monitoring/hosts/:id/edit", function(req) {
        Bloonix.editHost(req);
    });
    route.add("monitoring/hosts/:id/events", function(req) {
        Bloonix.listHostEvents(req);
    });
    route.add("monitoring/hosts/:id/charts", function(req) {
        Bloonix.listCharts(req);
    });
    route.add("monitoring/hosts/:id/reports", function(req) {
        Bloonix.viewHostReport(req);
    });
    route.add("monitoring/hosts/:id/dependencies", function(req) {
        Bloonix.viewHostDependencies(req);
    });
    route.add("monitoring/hosts/:id/templates", function(req) {
        Bloonix.editHostTemplates(req);
    });
    route.add("monitoring/hosts/:id/downtimes", function(req) {
        Bloonix.viewHostDowntimes(req);
    });
    route.add("monitoring/hosts/:id/mtr", function(req) {
        Bloonix.viewMtrResult(req);
    });
    route.add("monitoring/hosts/:id/notifications", function(req) {
        Bloonix.viewHostNotifications(req);
    });
    route.add("monitoring/hosts/:id/services/create", function(req) {
        Bloonix.createService(req);
    });
    route.add("monitoring/hosts/:id/services/:service_id/edit", function(req) {
        Bloonix.editService(req);
    });
    route.add("monitoring/hosts/:id/services/:service_id/clone-to/:clone_to", function(req) {
        Bloonix.cloneService(req);
    });
    route.add("monitoring/hosts/:id/services/:service_id/report", function(req) {
        Bloonix.viewServiceLocationReport(req);
    });
    route.add("monitoring/hosts/:id/services/:service_id/wtrm-report", function(req) {
        Bloonix.viewServiceWtrmReport(req);
    });
    route.add("monitoring/services", function(req) {
        Bloonix.listServices(req);
    });
    route.add("monitoring/charts", function(req) {
        Bloonix.listCharts(req);
    });
    route.add("monitoring/charts/editor", function(req) {
        Bloonix.listUserCharts(req);
    });
    route.add("monitoring/charts/editor/create", function(req) {
        Bloonix.createUserChart(req);
    });
    route.add("monitoring/charts/editor/:id/update", function(req) {
        Bloonix.createUserChart(req);
    });
    route.add("monitoring/templates", function(req) {
        Bloonix.listHostTemplates(req);
    });
    route.add("monitoring/templates/:id", function(req) {
        Bloonix.editHostTemplate(req);
    });
    route.add("monitoring/templates/:id/members", function(req) {
        Bloonix.listHostTemplateMembers(req);
    });
    route.add("monitoring/templates/:id/services", function(req) {
        Bloonix.hideNavSubElement();
        Bloonix.listHostTemplateServices(req);
    });
    route.add("monitoring/templates/:id/services/create", function(req) {
        Bloonix.createService({ id: req.id, template: true });
    });
    route.add("monitoring/templates/:id/services/:ref_id/edit", function(req) {
        Bloonix.editService({ id: req.id, refId: req.ref_id, template: true });
    });
    route.add("monitoring/templates/create", function(req) {
        Bloonix.createHostTemplate(req);
    });
    route.add("monitoring/screen", function(req) {
        Bloonix.viewScreen(
            Utils.extend({ dashboard: true }, req)
        );
    });
    route.add("notification/contacts", function(req) {
        Bloonix.listContacts(req);
    });
    route.add("notification/contacts/:id/edit", function(req) {
        Bloonix.editContact(req);
    });
    route.add("notification/contacts/create", function(req) {
        Bloonix.createContact(req);
    });
    route.add("notification/contactgroups", function(req) {
        Bloonix.listContactgroups(req);
    });
    route.add("notification/contactgroups/:id/edit", function(req) {
        Bloonix.editContactgroup(req);
    });
    route.add("notification/contactgroups/create", function(req) {
        Bloonix.createContactgroup(req);
    });
    route.add("notification/timeperiods", function(req) {
        Bloonix.listTimeperiods(req);
    });
    route.add("notification/timeperiods/:id/edit", function(req) {
        Bloonix.editTimeperiod(req);
    });
    route.add("notification/timeperiods/create", function(req) {
        Bloonix.createTimeperiod(req);
    });
    route.add("notification/rosters", function(req) {
        Bloonix.listRosters(req);
    });
    route.add("notification/rosters/:id/edit", function(req) {
        Bloonix.notImplemented(req);
    });
    route.add("notification/rosters/create", function(req) {
        Bloonix.notImplemented(req);
    });
    route.add("administration/companies", function(req) {
        Bloonix.listCompanies();
    });
    route.add("administration/companies/:id/edit", function(req) {
        new Bloonix.editCompany(req);
    });
    route.add("administration/companies/create", function(req) {
        new Bloonix.createCompany();
    });
    route.add("administration/variables", function(req) {
        new Bloonix.editCompanyVariables();
    });
    route.add("administration/users", function(req) {
        Bloonix.listUsers(req);
    });
    route.add("administration/users/:id/edit", function(req) {
        Bloonix.editUser(req);
    });
    route.add("administration/users/create", function(req) {
        Bloonix.createUser(req);
    });
    route.add("administration/groups", function(req) {
        Bloonix.listGroups(req);
    });
    route.add("administration/groups/:id/edit", function(req) {
        Bloonix.editGroup(req);
    });
    route.add("administration/groups/create", function(req) {
        Bloonix.createGroup(req);
    });
    route.add("help", function(req) {
        Bloonix.helpIndex(req);
    });
    route.add("help/:doc", function(req) {
        Bloonix.helpIndex(req);
    });

    route.setPreRoutingCallback(function() {
        if (Bloonix.user && Bloonix.user.change_password == "0") {
            Bloonix.changeUserPassword({ force: true });
        }
    });

    route.setPreCallback(function(route, args) {
        var path = route.split("/");

        Bloonix.clearAll();
        $("#content").html("");
        Bloonix.showNavigation(route, args);
        Bloonix.resizeContent();

        if (path[0] == "administration" && Bloonix.user.role == "user") {
            Bloonix.noAuth();
            return false;
        }
        if (path[0] == "notification" && Bloonix.user.manage_contacts == false) {
            Bloonix.noAuth();
            return false;
        }
        if (path[0] == "monitoring" && path[1] == "templates" && Bloonix.user.manage_templates == false) {
            Bloonix.noAuth();
            return false;
        }

        return true;
    });
};
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
        "err-705": true,
        "err-802": true
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
Bloonix.initNavigation = function(site) {
    Log.debug("initNavigation()");

    // Init the static top navigation.
    Bloonix.createNavigation({
        into: "#nav-top",
        items: [{
            link: "dashboard",
            icon: "gicons-white gicons tablet",
            text: Text.get("nav.main.dashboard")
        },{
            data: "monitoring",
            link: "monitoring/hosts",
            icon: "gicons-white gicons sampler",
            text: Text.get("nav.main.monitoring")
        },{
            data: "notification",
            link: "notification/contacts",
            icon: "gicons-white gicons bullhorn",
            text: Text.get("nav.main.notifications")
        },{
            data: "administration",
            link: "administration/users",
            icon: "gicons-white gicons cogwheels",
            text: Text.get("nav.main.administration")
        },{
            link: "help",
            icon: "gicons-white gicons circle-question-mark",
            text: Text.get("nav.main.help")
        }]
    });

    // Dynamic navigations.
    Bloonix.navigation = { };
    Bloonix.activeNavigationMain = "";
    Bloonix.activeNavigationSub = "";

    Bloonix.navigation["nav-main"] = {
        monitoring: {
            items: [{
                link: "monitoring/hosts",
                icon: "hicons hdd",
                text: Text.get("nav.sub.hosts")
            },{
                link: "monitoring/services",
                icon: "hicons th-list",
                text: Text.get("nav.sub.services")
            },{
                link: "monitoring/charts",
                icon: "hicons signal",
                text: Text.get("nav.sub.charts" )
            },{
                link: "monitoring/templates",
                icon: "hicons list-alt",
                text: Text.get("nav.sub.templates")
            },{
                link: "monitoring/screen",
                icon: "hicons tasks",
                text: Text.get("nav.sub.screen")
            }]
        },
        notification: {
            items: [{
                link: "notification/contacts",
                icon: "hicons user",
                text: Text.get("nav.sub.contacts")
            },{
                link: "notification/contactgroups",
                icon: "hicons groups",
                text: Text.get("nav.sub.contactgroups")
            },{
                link: "notification/timeperiods",
                icon: "hicons time",
                text: Text.get("nav.sub.timeperiods")
            }]
        },
        administration: {
            items: Bloonix.getAdministrativeNavigationItems()
        }
    };
};

Bloonix.getAdministrativeNavigationItems = function() {
    var administrationItems = [
        {
            link: "administration/users",
            icon: "hicons user",
            text: Text.get("nav.sub.users")
        },{
            link: "administration/groups",
            icon: "hicons group",
            text: Text.get("nav.sub.groups")
        },{
            link: "administration/variables",
            icon: "hicons wrench",
            text: Text.get("nav.sub.variables")
        }
    ];

    if (Bloonix.user.role === "admin") {
        administrationItems.splice(2, 0, {
            link: "administration/companies",
            icon: "hicons company",
            text: Text.get("nav.sub.companies")
        });
    }

    return administrationItems;
};

Bloonix.showHostSubNavigation = function(active, id, hostname) {
    Log.debug("showHostSubNavigation()");
    $("#nav-sub").html("");

    Bloonix.createNavigation({
        activeClass: "nav-sub-active",
        active: active,
        into: "#nav-sub",
        items: [
            {
                link: "monitoring/hosts/" +id,
                text: Utils.escape(hostname),
                activeKey: "host",
            },{
                link: "monitoring/hosts/"+ id +"/events",
                text: Text.get("nav.sub.events"),
                activeKey: "events"
            },{
                link: "monitoring/hosts/"+ id +"/charts",
                text: Text.get("nav.sub.charts"),
                activeKey: "charts"
            },{
                link: "monitoring/hosts/"+ id +"/reports",
                text: Text.get("nav.sub.reports"),
                activeKey: "reports"
            },{
                link: "monitoring/hosts/"+ id +"/dependencies",
                text: Text.get("nav.sub.dependencies"),
                activeKey: "dependencies"
            },{
                link: "monitoring/hosts/"+ id +"/downtimes",
                text: Text.get("nav.sub.downtimes"),
                activeKey: "downtimes"
            },{
                link: "monitoring/hosts/"+ id +"/templates",
                text: Text.get("nav.sub.templates"),
                activeKey: "templates"
            },{
                link: "monitoring/hosts/"+ id +"/mtr",
                text: Text.get("nav.sub.mtr"),
                activeKey: "mtr"
            },{
                link: "monitoring/hosts/" + id +"/notifications",
                text: Text.get("nav.sub.notifications"),
                activeKey: "notifications"
            }
        ]
    });

    $("#nav-sub").show(400);
    Bloonix.resizeContent();
};

Bloonix.showChartsSubNavigation = function(active, id) {
    Log.debug("showGroupSubNavigation()");
    $("#nav-sub").html("");

    Bloonix.createNavigation({
        activeClass: "nav-sub-active",
        active: active,
        into: "#nav-sub",
        items: [
            {
                link: "monitoring/charts",
                text: Text.get("schema.chart.text.charts"),
                activeKey: "service-charts"
            },{
                link: "monitoring/charts/editor",
                text: Text.get("schema.user_chart.text.editor"),
                activeKey: "user-charts"
            }
        ]
    });

    $("#nav-sub").show(400);
    Bloonix.resizeContent();
};

Bloonix.showGroupSubNavigation = function() {
    Log.debug("showGroupSubNavigation()");
    $("#nav-sub").html("");

    new Tabs({
        tabs: [
            {
                id: "int-group-form",
                text: Text.get("nav.sub.group_settings")
            },{
                id: "int-host-form",
                text: Text.get("nav.sub.host_group_settings")
            },{
                id: "int-user-form",
                text: Text.get("nav.sub.user_group_settings")
            }
        ]
    }).create();

    $("#nav-sub").show(400);
    Bloonix.resizeContent();
};

Bloonix.showContactgroupSubNavigation = function() {
    Log.debug("showGroupSubNavigation()");
    $("#nav-sub").html("");

    new Tabs({
        tabs: [
            {
                id: "int-contactgroup-form",
                text: Text.get("nav.sub.contactgroup_settings")
            },{
                id: "int-contact-form",
                text: Text.get("nav.sub.contactgroup_members")
            },{
                id: "int-host-form",
                text: Text.get("nav.sub.contactgroup_host_members")
            },{
                id: "int-service-form",
                text: Text.get("nav.sub.contactgroup_service_members")
            }
        ]
    }).create();

    $("#nav-sub").show(400);
    Bloonix.resizeContent();
};

Bloonix.showTemplateSubNavigation = function(active, id) {
    Log.debug("showTemplateSubNavigation()");
    $("#nav-sub").html("");

    Bloonix.createNavigation({
        activeClass: "nav-sub-active",
        active: active,
        into: "#nav-sub",
        items: [
            {
                link: "monitoring/templates/"+ id,
                text: Text.get("schema.host_template.text.setting"),
                activeKey: "settings"
            },{
                link: "monitoring/templates/"+ id +"/members",
                text: Text.get("schema.host_template.text.view_members"),
                activeKey: "members"
            },{
                link: "monitoring/templates/"+ id +"/services",
                text: Text.get("schema.host_template.text.view_services"),
                activeKey: "services"
            }
        ]
    });

    $("#nav-sub").show(400);
    Bloonix.resizeContent();
};

Bloonix.showNavigation = function(site, args) {
    Log.debug("showNavigation()");
    var nav = site.split("/");
    var navTop = nav[0];
    var navMain = nav[1];
    var navSub = nav[2];

    var navTopElem = $("#nav-top");
    var navMainElem = $("#nav-main");
    var navSubElem = $("#nav-sub");

    navTopElem.find("ul li").removeClass("nav-top-active");
    navTopElem.find("ul").find("[data-path='"+ navTop  +"']").addClass("nav-top-active");

    if (navMain == undefined || !Bloonix.navigation["nav-main"][navTop]) {
        navSubElem.hide();
        navMainElem.hide();
        return false;
    }

    var navMainElem = $("#nav-main");
    var mainDataPath = navTop +"/"+ navMain;

    if (Bloonix.activeNavigationMain != mainDataPath) {
        Bloonix.activeNavigationMain = mainDataPath;
        Bloonix.createNavigation({
            into: "#nav-main",
            items: Bloonix.navigation["nav-main"][navTop].items
        });
    }

    navMainElem.find("ul li").removeClass("nav-main-active");
    navMainElem.find("ul [data-path='"+ mainDataPath +"']").addClass("nav-main-active");
    navMainElem.show(400);

    if (navSub == undefined) {
        navSubElem.hide();
        return false;
    }
};

Bloonix.hideNavSubElement = function() {
    $("#nav-sub").hide();
};

Bloonix.createNavigation = function(o) {
    Log.debug("createNavigation()");
    var list = Utils.create("ul");

    if (o.id) {
        list.attr("id", o.id);
    }

    $.each(o.items, function(i, item) {
        var link;
        var icon = Utils.create("div").addClass(item.icon);

        if (item.extern == true) {
            link = Utils.create("a")
                .attr("href", item.link)
                .attr("target", "_blank")
                .html(icon);
        } else {
            link = Bloonix.call(item.link, icon);
        }

        var dataPath = item.data
            ? item.data
            : item.link;

        link.append(item.text);
        var li = Utils.create("li")
            .attr("data-path", dataPath)
            .html(link)
            .appendTo(list);

        if (item.activeKey && item.activeKey == o.active) {
            li.addClass(o.activeClass);
        } else if (o.active && o.active == dataPath) {
            li.addClass(o.activeClass);
        }
    });

    $(o.into)
        .html(list)
        .fadeIn(200)
        .append(Utils.create("div")
        .addClass("clear"));

    return list;
};
Bloonix.initHeader = function() {
    Log.debug("initHeader()");

    var body = $("body");

    var headerWrapper = Utils.create("div")
        .attr("id", "header-wrapper")
        .appendTo(body);

    var header = Utils.create("div")
        .attr("id", "header")
        .appendTo(headerWrapper);

    Utils.create("div")
        .attr("id", "logo")
        .appendTo(header)
        .html(
            Utils.create("img")
                .attr("src", "/public/img/bloonix-logo.png")
        );

    Utils.create("nav")
        .attr("id", "nav-top")
        .appendTo(header);

    var box = Utils.create("div")
        .attr("id", "headerbox")
        .appendTo(header);

    Utils.create("div")
        .addClass("clear")
        .appendTo(header);

    var btnGroup = Utils.create("div")
        .addClass("btn-group")
        .appendTo(box);

    Utils.create("a")
        .attr("href", "#language")
        .attr("title", Text.get("text.change_the_language"))
        .addClass("btn btn-dark btn-medium")
        .html(Utils.create("span").addClass("hicons-white hicons flag"))
        .appendTo(btnGroup)
        .click(Bloonix.changeUserLanguage)
        .tooltip();

    Utils.create("a")
        .attr("href", "#settings")
        .attr("title", Text.get("text.change_your_password"))
        .addClass("btn btn-dark btn-medium")
        .html(Utils.create("span").addClass("hicons-white hicons cog"))
        .appendTo(btnGroup)
        .click(Bloonix.changeUserSettings)
        .tooltip();

    Utils.create("a")
        .attr("href", "/logout/")
        .attr("title", Text.get("action.logout"))
        .addClass("btn btn-dark btn-medium")
        .html(Utils.create("span").addClass("hicons-white hicons off"))
        .appendTo(btnGroup)
        .tooltip();

    Utils.create("div")
        .addClass("clear")
        .appendTo(box);

    Utils.create("nav")
        .attr("id", "nav-main")
        .appendTo(headerWrapper);

    Utils.create("nav")
        .attr("id", "nav-sub")
        .appendTo(headerWrapper);

    Utils.create("div")
        .addClass("clear")
        .appendTo(headerWrapper);
};

Bloonix.initContent = function() {
    Log.debug("initContent()");

    var outer = Utils.create("div")
        .attr("id", "content-outer")
        .appendTo("body");

    var inner = Utils.create("div")
        .attr("id", "content")
        .appendTo(outer);

    Utils.create("div")
        .addClass("clear")
        .appendTo(outer);

    $(window).resize(Bloonix.resizeContent);
    Bloonix.resizeContent();
};

Bloonix.resizeContent = function() {
    if ($("#content-outer").length > 0) {
        $("#content-outer").height(
            $(window).height() 
                - $("#content-outer").offset().top 
                - 40
        );
    }
};

Bloonix.initFooter = function() {
    Log.debug("initFooter()");
    var body = $("body");

    Bloonix.objects.footerStats = { };

    // Outer footer element
    var footer = Utils.create("div")
        .attr("id", "footer")
        .appendTo(body);

    // Left footer
    var footerLeft = Utils.create("div")
        .attr("id", "footer-left")
        .appendTo(footer);

    Utils.create("div")
        .attr("id", "selected-counter")
        .appendTo(footerLeft);

    // Center footer
    var footerMiddle = Utils.create("div")
        .attr("id", "footer-middle")
        .appendTo(footer);

    // Outer stats element
    var statsCounter = Utils.create("div")
        .addClass("stats-counter")
        .appendTo(footerMiddle);

    // UNKNOWN
    var u = Utils.create("div")
        .addClass("unknown-counter")
        .appendTo(statsCounter)
        .click(function(){ Bloonix.route.to("monitoring/hosts", { query: "status:UNKNOWN" }) });

    Utils.create("span")
        .addClass("hicons-white hicons question-sign")
        .appendTo(u);

    Bloonix.objects.footerStats.UNKNOWN = Utils.create("span")
        .text("0/0")
        .appendTo(u);

    // CRITICAL
    var c = Utils.create("div")
        .addClass("critical-counter")
        .appendTo(statsCounter)
        .click(function(){ Bloonix.route.to("monitoring/hosts", { query: "status:CRITICAL" }) });

    Utils.create("span")
        .addClass("hicons-white hicons fire")
        .appendTo(c);

    Bloonix.objects.footerStats.CRITICAL = Utils.create("span")
        .text("0/0")
        .appendTo(c);

    // WARNING
    var w = Utils.create("div")
        .addClass("warning-counter")
        .appendTo(statsCounter)
        .click(function(){ Bloonix.route.to("monitoring/hosts", { query: "status:WARNING" }) });

    Utils.create("span")
        .addClass("hicons-white hicons warning-sign")
        .appendTo(w);

    Bloonix.objects.footerStats.WARNING = Utils.create("span")
        .text("0/0")
        .appendTo(w);

    // INFO
    var i = Utils.create("div")
        .addClass("info-counter")
        .appendTo(statsCounter)
        .click(function(){ Bloonix.route.to("monitoring/hosts", { query: "status:INFO" }) });

    Utils.create("span")
        .addClass("hicons-white hicons info-sign")
        .appendTo(i);

    Bloonix.objects.footerStats.INFO = Utils.create("span")
        .text("0/0")
        .appendTo(i);

    // OK
    var o = Utils.create("div")
        .addClass("ok-counter")
        .appendTo(statsCounter)
        .click(function(){ Bloonix.route.to("monitoring/hosts", { query: "status:OK" }) });

    Utils.create("span")
        .addClass("hicons-white hicons ok")
        .appendTo(o);

    Bloonix.objects.footerStats.OK = Utils.create("span")
        .text("0/0")
        .appendTo(o);

    // Right footer
    var t = Utils.create("div")
        .attr("id", "footer-right")
        .appendTo(footer);

    Bloonix.objects.footerStats.Browser = Utils.create("span")
        .attr("title", Text.get("text.browsers_heap_size"))
        .html("")
        .hide()
        .tooltip()
        .appendTo(t);

    Bloonix.objects.footerStats.Time = Utils.create("span")
        .attr("title", "Time")
        .html(DateFormat(new Date, DateFormat.masks.bloonixNoHour))
        .tooltip()
        .appendTo(t);

    Bloonix.objects.footerStats.Alerts = Utils.create("span")
        .attr("title", "Alerts")
        .addClass("pointer")
        .text("!!!")
        .tooltip()
        .appendTo(t);

    if (Bloonix.user && Bloonix.user.username !== "admin") {
        Bloonix.objects.footerStats.Alerts.hide();
    }

    Bloonix.objects.footerStats.Alerts.click(function() {
        if ($("#logbox-error-messages").length) {
            $("#logbox-error-messages").remove();
            return;
        }
        var box = Utils.create("div")
            .attr("id", "logbox-error-messages")
            .addClass("info-err")
            .appendTo("body")
            .css({ position: "fixed", bottom: "28px", right: "8px" });
        if (Log.cache.length) {
            var table = Utils.create("table")
                .addClass("error-box-table")
                .appendTo(box);
            $.each(Log.cache, function(i, row) {
                var tr = Utils.create("tr").appendTo(table);
                Utils.create("th").text(row.level).appendTo(tr);
                Utils.create("td").text(row.message).appendTo(tr);
            });
        } else {
            Utils.create("span")
                .text("No warnings found.")
                .appendTo(box);
        }
    });

    // Clear floats
    Utils.create("div")
        .addClass("clear")
        .appendTo(body);
};

Bloonix.createSideBySideBoxes = function(o) {
    var object = {};

    object.header = Utils.create("div");

    object.left = Utils.create("div")
        .addClass("b2x-left")
        .css({ width: o.width });

    object.right = Utils.create("div")
        .addClass("b2x-right")
        .css({ "margin-left": o.marginLeft });

    if (o.container) {
        object.header.appendTo(o.container);
        object.left.appendTo(o.container);
        object.right.appendTo(o.container);
    }

    return object;
};
/*
    +----------------------------------------------------------+
    | #chart-box-outer                                         |
    | +----------------+ +----------------+ +----------------+ |
    | | #chart-box-1   | | #chart-box-2   | | #chart-box-3   | |
    | | .chart-box     | | .chart-box     | | .chart-box     | |
    | |                | |                | |                | |
    | |                | |                | |                | |
    | +----------------+ +----------------+ +----------------+ |
    | +----------------+ +----------------+ +----------------+ |
    | | #chart-box-4   | | #chart-box-5   | | #chart-box-6   | |
    | | .chart-box     | | .chart-box     | | .chart-box     | |
    | |                | |                | |                | |
    | |                | |                | |                | |
    | +----------------+ +----------------+ +----------------+ |
    +----------------------------------------------------------+

    Inside of each .chart-box are two elements:

        For the title
            #chart-box-header-N .chart-box-header

        For the data
            #chart-box-content-N .chart-box-content

*/

Bloonix.dashboard = function(o) {
    var object = Utils.extend({
        container: $("#content"),
        interval: Bloonix.chartReloadInterval,
        chartBoxMargin: 10,
        chartBoxPadding: 2,
        chartBoxBorderWidth: 1,
        dashletCounter: 1,
        name: false
    }, o);

    object.create = function() {
        this.dashletOptions = { animation: true };
        this.setTitle();
        this.createNavigation();
        this.getDashboardConfig();
        this.createDashletOuterBoxes();
        this.loadDashboard();
        this.addSortableEvents();
        this.resizeDashlets();
        this.setResizeEvent();
        this.setInterval();
        this.dashletOptions.animation = false;
        if (this.saveInitialDashboard === true) {
            this.saveDashboard();
        }
    };

    object.createDashboard = function(clone) {
        var self = this,
            content = Utils.create("div");

        var overlay = new Overlay({
            title: clone === true
                ? Text.get("text.dashboard.clone_dashboard")
                : Text.get("text.dashboard.create_dashboard"),
            content: content
        }).create();

        var form = Utils.create("form")
            .appendTo(content);

        var nameInput = Utils.create("input")
            .attr("placeholder", Text.get("text.dashboard.name"))
            .addClass("input input-medium")
            .appendTo(form);

        Utils.create("br")
            .appendTo(form);

        /*
        var scaleInput = Utils.create("input")
            .attr("value", 0.35)
            .addClass("input input-medium")
            .appendTo(form)
            .hide();

        Utils.create("br")
            .appendTo(form);
        */

        var button = Utils.create("div")
            .addClass("btn btn-white btn-medium")
            .html(Text.get("action.create"))
            .appendTo(form);

        button.click(function() {
            var name = nameInput.val(),
                scale = 0.35; // scaleInput.val();

            if (name === undefined || name.length === 0 || /^\s+$/.test(name)) {
                nameInput.addClass("rwb");
                return;
            }

            /*
            if (scale === undefined || !/^([1-9]|[0-9]\.[0-9]{1,2})$/.test(scale) || parseFloat(scale) < 0.1) {
                scaleInput.addClass("rwb");
                return;
            }
            */

            // Check if the dashboard name already exists. This check
            // is only on client side! The server does not check this!
            var stash = Bloonix.get("/user/config/stash");
            if (typeof stash === "object" && typeof stash.dashboard === "object" && stash.dashboard[name] !== undefined) {
                nameInput.addClass("rwb");
                return;
            }

            overlay.close();

            if (clone === true) {
                self.saveDashboard(name);
            } else {
                Bloonix.saveUserConfig("dashboard", {
                    name: name,
                    scale: scale,
                    dashlets: [],
                    count: "12x12"
                });
            }

            Bloonix.saveUserConfig("last_open_dashboard", name);
            Bloonix.route.to("dashboard", { name: name });
        });
    };

    object.addNewDashlet = function() {
        this.createDashletSelectOverlay();
    };

    object.createNavigation = function() {
        var self = this;

        Bloonix.createFooterIcon({
            title: Text.get("text.dashboard.add_new_dashlet"),
            icon: "plus-sign",
            click: function() { self.addNewDashlet() }
        });

        Bloonix.createFooterIcon({
            title: Text.get("text.dashboard.create_dashboard"),
            icon: "th",
            click: function() { self.createDashboard() }
        });

        Bloonix.createFooterIcon({
            title: Text.get("text.dashboard.open_dashboard"),
            icon: "folder-open",
            click: function() { self.openDashboard() }
        });

        Bloonix.createFooterIcon({
            title: Text.get("text.dashboard.delete_dashboard"),
            icon: "trash",
            click: function() { self.deleteDashboard() }
        });

        Bloonix.createFooterIcon({
            title: Text.get("text.dashboard.rename_dashboard"),
            icon: "edit",
            click: function() { self.renameDashboard() }
        });

        Bloonix.createFooterIcon({
            title: Text.get("text.dashboard.clone_dashboard"),
            icon: "share",
            click: function() { self.createDashboard(true) }
        });
    };

    object.renameDashboard = function() {
        var self = this,
            content = Utils.create("div");

        var overlay = new Overlay({
            title: Text.get("text.dashboard.rename_dashboard"),
            content: content
        }).create();

        var form = Utils.create("form")
            .appendTo(content);

        var input = Utils.create("input")
            .attr("placeholder", Text.get("text.dashboard.name"))
            .addClass("input input-medium")
            .appendTo(form);

        Utils.create("br")
            .appendTo(form);

        var button = Utils.create("div")
            .addClass("btn btn-white btn-medium")
            .html(Text.get("action.update"))
            .appendTo(form);

        button.click(function() {
            var name = input.val();

            if (name === undefined || name.length === 0 || /^\s+$/.test(name)) {
                input.addClass("rwb");
                return;
            }

            overlay.close();

            Bloonix.saveUserConfig("rename-dashboard", {
                "new": name,
                "old": self.dashboardName
            });

            Bloonix.saveUserConfig("last_open_dashboard", name);
            Bloonix.route.to("dashboard", { name: name });
        });
    };

    object.openDashboard = function() {
        var content = Utils.create("div");

        var overlay = new Overlay({
            title: Text.get("text.dashboard.open_dashboard"),
            content: content
        });

        var table = new Table({
            type: "vtable",
            appendTo: content
        }).init();

        $.each(this.dashboards, function(name, obj) {
            var row = table.createSimpleRow([ Utils.escape(name) ]);
            row.css({ cursor: "pointer" });
            row.click(function() {
                overlay.close();
                Bloonix.saveUserConfig("last_open_dashboard", name);
                Bloonix.route.to("dashboard", { name: name });
            });
        });

        overlay.create();
    };

    object.deleteDashboard = function() {
        var self = this,
            content = Utils.create("div");

        var overlay = new Overlay({
            title: Text.get("text.dashboard.delete_dashboard"),
            content: content
        });

        Utils.create("p")
            .html(Text.get("text.dashboard.really_delete_dashboard", Utils.escape(this.dashboardName), true))
            .css({ "margin-bottom": "20px" })
            .appendTo(content);

        Utils.create("div")
            .addClass("btn btn-white btn-medium")
            .html(Text.get("action.yes_delete"))
            .appendTo(overlay.content)
            .click(function() {
                Bloonix.saveUserConfig("delete-dashboard", { name: self.dashboardName });
                overlay.close();
                Bloonix.route.to("dashboard");
            });

        Utils.create("div")
            .addClass("btn btn-white btn-medium")
            .html(Text.get("action.no_abort"))
            .appendTo(overlay.content)
            .click(function() { overlay.close() });

        overlay.create();
    };

    object.loadDashboard = function() {
        var self = this,
            dashlets = this.dashlets;

        $.each(this.config.dashlets, function(i, c) {
            var pos = c.pos > 3 ? c.pos - 3 : c.pos;
            self.createDashlet(pos, c.name, c.width, c.height, c.opts);
        });
    };

    object.reloadDashboard = function() {
        var self = this,
            dashlets = this.dashlets;

        $.each(this.reload, function(i, dashlet) {
            dashlets[dashlet.name].callback(dashlet, self.dashletOptions);
        });
    };

    object.addLoadingBox = function(box) {
        box.html(
            Utils.create("div")
                .addClass("loading")
        );
    };

    object.setTitle = function() {
        Bloonix.setTitle("text.dashboard.title");

        this.dashboardTitleBox = Utils.create("div")
            .attr("id", "header-title")
            .appendTo("#header-wrapper");

        this.dashboardTitle = Utils.create("span")
            .appendTo(this.dashboardTitleBox)
            .text("Dashboard: Default");

        this.dashboardTitleSize = Utils.create("span")
            .appendTo(this.dashboardTitleBox);

        this.updateDashboardTitleSize();
    };

    object.setDashboardTitle = function(text) {
        this.dashboardTitle.text(text);
    };

    object.updateDashboardTitleSize = function() {
        //var size = Bloonix.getContentSize();
        //this.dashboardTitleSize.text("("+ size.width +"x"+ size.height +")");
    };

    object.getDashboardConfig = function() {
        var userConfig = Bloonix.get("/user/config/stash"),
            defaultConfig = this.getDefaultConfig();

        if (userConfig && userConfig.dashboard && Utils.objectSize(userConfig.dashboard)) {
            this.dashboards = userConfig.dashboard;
            if (!this.dashboards.Default) {
                this.dashboards.Default = defaultConfig.Default;
                this.saveInitialDashboard = true;
            }
        } else {
            this.dashboards = defaultConfig;
            this.saveInitialDashboard = true;
        }

        if (this.name !== false) {
            if (this.dashboards[this.name]) {
                this.config = this.dashboards[this.name];
                this.dashboardName = this.name;
            } else {
                $("#content").html(
                    Utils.create("div")
                        .addClass("info-err")
                        .html(Text.get("err-600"))
                );
                throw new Error();
            }
        } else if (userConfig.last_open_dashboard !== undefined && this.dashboards[userConfig.last_open_dashboard]) {
            this.config = this.dashboards[userConfig.last_open_dashboard];
            this.dashboardName = userConfig.last_open_dashboard;
        } else {
            this.config = this.dashboards.Default;
            this.dashboardName = "Default";
        }

        this.migrateDashboardConfig();
        this.setDashboardTitle(Text.get("text.dashboard.title") +": "+ this.dashboardName);
    };

    object.getDefaultConfig = function() {
        var width = 4,
            height = 6,
            scale = 0.35,
            count = "12x12"; // width x height

        return {
            Default: {
                dashlets: [
                    { pos: "1", name: "hostAvailStatus", width: width, height: height },
                    { pos: "1", name: "hostStatusMap", width: width, height: height },
                    { pos: "1", name: "hostTopStatus", width: width, height: height },
                    { pos: "2", name: "serviceAvailStatus", width: width, height: height },
                    { pos: "2", name: "serviceNoteStatus", width: width, height: height },
                    { pos: "2", name: "serviceTopStatus", width: width, height: height }
                ],
                scale: scale,
                count: count
            }
        };
    };

    object.createDashletOuterBoxes = function() {
        var self = this;

        this.dashletContainer = Utils.create("div")
            .attr("id", "chart-box-outer")
            .appendTo(this.container);

        this.columns = [];
        this.boxes = [];
        this.reload = {};

        for (var i=1; i <= 10; i++) {
            Utils.create("div")
                .attr("id", "dashlet-outer-"+ i)
                .data("pos", i)
                .addClass("dashlet-outer")
                .appendTo(self.dashletContainer);
        }
    };

    object.createDashlet = function(pos, name, width, height, opts) {
        var self = this,
            id = "chart-box-content-"+ self.dashletCounter,
            dashlet = { id: id, name: name },
            dashlets = this.dashlets;

        if (width === undefined) {
            width = 3;
        } else {
            width = parseInt(width);
        }

        if (height === undefined) {
            height = 3;
        } else {
            height = parseInt(height);
        }

        self.dashletCounter++;

        dashlet.outer = Utils.create("div")
            .data("name", name)
            .data("opts", opts)
            .data("width", width)
            .data("height", height)
            .addClass("chart-box dashlet")
            .appendTo("#dashlet-outer-"+ pos);

        dashlet.header = Utils.create("div")
            .addClass("chart-box-header")
            .appendTo(dashlet.outer);

        dashlet.content = Utils.create("div")
            .attr("id", dashlet.id) // for highcharts
            .addClass("chart-box-content")
            .appendTo(dashlet.outer);

        this.addLoadingBox(dashlet.content);
        this.addDashletOptions(dashlet, name);
        this.resizeDashlets(dashlet);
        this.boxes.push(dashlet);
        this.reload[id] = dashlet;
        dashlets[name].callback(dashlet, { animation: true });
        return dashlet;
    };

    object.addDashletOptions = function(dashlet, name) {
        var self = this,
            dashlets = this.dashlets;

        var icons = [
            {
                type: "cog",
                title: Text.get("text.dashboard.replace_dashlet"),
                callback: function() { self.createDashletSelectOverlay(dashlet) }
            },{
                type: "remove",
                title: Text.get("text.dashboard.remove_dashlet"),
                callback: function() { self.removeDashlet(dashlet) }
            },{
                type: "fullscreen",
                title: Text.get("action.resize"),
                callback: function() { self.resizeDashlet(dashlet) }
            },{
                type: "move",
                title: Text.get("action.move_box"),
                addClass: "dashlet-portlet"
            }
        ];

        if (/^(hostTopStatus|serviceTopStatus|topHostsEvents|serviceChart|userChart)$/.test(name)) {
            icons.unshift({
                type: "wrench",
                title: Text.get("text.dashboard.reconfigure_dashlet"),
                callback: function() {
                    dashlets[name].click(self, dashlet, name, "configure");
                    dashlets[name].callback(dashlet, self.dashletOptions);
                }
            });
        }

        dashlet.hoverBoxIcons = Bloonix.createHoverBoxIcons({
            container: dashlet.outer,
            icons: icons
        });
    };

    object.resizeDashlet = function(dashlet) {
        var self = this,
            content = Utils.create("div");

        var overlay = new Overlay({
            title: "Resize dashlet",
            content: content
        });

        var form = new Form({
            format: "default",
            appendTo: content
        }).init();

        var table = new Table({
            type: "form",
            appendTo: form.form
        }).init();

        form.table = table.getTable();

        form.createElement({
            element: "radio",
            name: "width",
            text: "Dashlet width",
            checked: dashlet.outer.data("width"),
            options: [
                { label:  "1/12", value:  1 },
                { label:  "2/12", value:  2 },
                { label:  "3/12", value:  3 },
                { label:  "4/12", value:  4 },
                { label:  "5/12", value:  5 },
                { label:  "6/12", value:  6 },
                { label:  "7/12", value:  7 },
                { label:  "8/12", value:  8 },
                { label:  "9/12", value:  9 },
                { label: "10/12", value: 10 },
                { label: "11/12", value: 11 },
                { label: "12/12", value: 12 }
            ]
        });

        form.createElement({
            element: "radio",
            name: "height",
            text: "Dashlet height",
            checked: dashlet.outer.data("height"),
            options: [
                { label:  "1/12", value:  1 },
                { label:  "2/12", value:  2 },
                { label:  "3/12", value:  3 },
                { label:  "4/12", value:  4 },
                { label:  "5/12", value:  5 },
                { label:  "6/12", value:  6 },
                { label:  "7/12", value:  7 },
                { label:  "8/12", value:  8 },
                { label:  "9/12", value:  9 },
                { label: "10/12", value: 10 },
                { label: "11/12", value: 11 },
                { label: "12/12", value: 12 }
            ]
        });

        form.button({
            name: "submit",
            text: "Resize",
            appendTo: form.form,
            callback: function() {
                overlay.close();
                var data = form.getData();
                dashlet.outer.data("width", data.width);
                dashlet.outer.data("height", data.height);
                self.resizeDashlets();
                self.saveDashboard();
                $(window).trigger("resize");
            }
        });

        overlay.create();
    };

    object.resizeDashlets = function(box) {
        var size = Bloonix.getContentSize();
        size.height = size.height - $("#dashboard-title").outerHeight() - 10;

        var scaleFactor = parseFloat(this.config.scale || 0.35);

        var optimalHeight = parseInt(size.width - (size.width * scaleFactor));

        if (size.height > optimalHeight) {
            size.height = optimalHeight;
        }

        if (size.height < 600) {
            size.height = 600;
        }

        $(".dashlet-outer").css({ "min-width": size.width - 10, "margin-bottom": "2px" });

        var chartBoxMargin = this.chartBoxMargin,
            chartBoxPadding = this.chartBoxPadding,
            chartBoxBorderWidth = this.chartBoxBorderWidth,
            chartBoxWidth = chartBoxWidth - 2, // dashlet-outer border
            chartBoxHeight = chartBoxHeight - 2, // dashlet-outer border
            chartBoxWidth = Math.floor(size.width / 12) - 2, // -2px because of an unknown bug with tooltip()
            chartBoxHeight = Math.floor(size.height / 12);

        var boxes = box ? [ box ] : this.boxes;

        $.each(boxes, function(i, dashlet) {
            var width = dashlet.outer.data("width"),
                height = dashlet.outer.data("height");

            dashlet.outer.css({
                width: (chartBoxWidth * width) - (chartBoxMargin * 2) - (chartBoxBorderWidth * 2),
                height: (chartBoxHeight * height) - (chartBoxMargin * 2) - (chartBoxBorderWidth * 2),
                margin: chartBoxMargin
            });

            dashlet.content.height(dashlet.outer.height() - dashlet.header.outerHeight() - (chartBoxPadding * 2));
            dashlet.content.css({ padding: chartBoxPadding });
        });
    };

    object.setResizeEvent = function() {
        var self = this;
        $(window).resize(function() {
            self.updateDashboardTitleSize();
            self.resizeDashlets();
        });
    };

    object.removeDashlet = function(dashlet) {
        var self = this,
            content = Utils.create("div");

        var overlay = new Overlay({
            title: Text.get("text.dashboard.remove_dashlet"),
            content: content
        });

        Utils.create("div")
            .addClass("btn btn-white btn-medium")
            .html(Text.get("action.yes_remove"))
            .appendTo(overlay.content)
            .click(function() {
                overlay.close();
                delete self.reload[dashlet.id];
                dashlet.outer.remove();
                self.saveDashboard();
            });

        Utils.create("div")
            .addClass("btn btn-white btn-medium")
            .html(Text.get("action.no_abort"))
            .appendTo(overlay.content)
            .click(function() { overlay.close() });

        overlay.create();
    };

    object.createDashletSelectOverlay = function(box) {
        var self = this;

        var overlay = new Overlay({
            title: Text.get("text.dashboard.choose_content_box"),
            closeText: Text.get("action.abort")
        });

        var content = Utils.create("form").attr("id", "choose-dashboard-box"),
            table = Utils.create("table").appendTo(content),
            i = 0,
            row;

        $.each(this.dashlets, function(name, dashlet) {
            i = i == 0 ? 1 : 0;

            if (i == 1) {
                row = Utils.create("tr")
                    .appendTo(table);
            }

            var image = Utils.create("div")
                .html(Utils.create("img").attr("src", dashlet.image))
                .addClass("dashlet-image");

            image.click(function() {
                if (dashlet.click) {
                    overlay.close();
                    dashlet.click(self, box, name);
                } else {
                    overlay.close();
                    self.replaceOrAddDashlet(box, name);
                }
            });

            Utils.create("td")
                .html(image)
                .appendTo(row);

            Utils.create("td")
                .text(dashlet.title)
                .appendTo(row);
        })

        if (i == 1) {
            Utils.create("td").appendTo(row);
            Utils.create("td").appendTo(row);
        }

        overlay.content = content;
        overlay.create();
    };

    object.replaceOrAddDashlet = function(box, name, opts) {
        if (box) {
            var dashlet = this.dashlets[name];
            box.outer.data("name", name);
            // jQuery does not overwrite data if undefined.
            // For this reason the data must be removed.
            box.outer.removeData("opts");
            // opts will only be set if the variable is not undefined.
            box.outer.data("opts", opts);
            box.outer.find(".chart-infobox").remove();
            box.header.html(Utils.create("h3").text(dashlet.title));
            dashlet.box = box;
            dashlet.callback(box, this.dashletOptions);
            this.saveDashboard();
            box.hoverBoxIcons.destroy();
            this.addDashletOptions(box, name);
        } else {
            this.createDashlet(1, name, 4, 6, opts);
            this.resizeDashlets();
            this.saveDashboard();
        }
    };

    object.addSortableEvents = function() {
        var self = this;

        $(".dashlet-outer").sortable({
            start: function() { self.startSortOrResizeDashlets() },
            stop: function() { self.stopSortOrResizeDashlets() },
            connectWith: ".dashlet-outer",
            handle: ".dashlet-portlet",
            forcePlaceholderSize: true,
            tolerance: "pointer"
        }).disableSelection();
    };

    object.saveDashboard = function(dashboardName) {
        var self = this;

        if (dashboardName === undefined) {
            dashboardName = this.dashboardName;
        }

        var config = {
            name: dashboardName,
            scale: this.config.scale,
            dashlets: [],
            count: this.config.count
        };

        $(".dashlet-outer").each(function() {
            var pos = $(this).data("pos");

            $(this).find(".dashlet").each(function() {
                var opts = $(this).data("opts");

                var dashlet = {
                    pos: pos,
                    name: $(this).data("name"),
                    width: $(this).data("width"),
                    height: $(this).data("height")
                };

                if (opts) {
                    dashlet.opts = opts;
                }

                config.dashlets.push(dashlet);
            });
        });

        this.dashboardName = config.name;
        this.config.dashlets = config.dashlets;
        Bloonix.saveUserConfig("dashboard", config);
    };

    object.migrateDashboardConfig = function()  {
        var saveConfig = false;

        // very old config
        if ($.isArray(this.config)) {
            saveConfig = true;

            var config = {
                name: this.dashboardName,
                scale: 0.35,
                dashlets: this.config
            };

            this.config = {
                dashlets: config.dashlets,
                scale: config.scale
            };
        }

        // deprecated dashboard size
        if (!this.config.count || this.config.count === "9x6") {
            saveConfig = true;
            this.config.count = "12x12";

            var width = {
                "x1": "1",   "x2": "2",    "x3": "4",
                "x4": "5",   "x5": "6",    "x6": "8",
                "x7": "9",   "x8": "10",   "x9": "12"
            };

            var height = {
                "x1": "2",   "x2": "4",    "x3": "6",
                "x4": "8",   "x5": "10",   "x6": "12"
            };

            $.each(this.config.dashlets, function(i, dashlet) {
                dashlet.width = width["x"+ dashlet.width];
                dashlet.height = height["x"+ dashlet.height];
            });
        }

        if (saveConfig === true) {
            console.log("migrate dashboard to", this.config);
            Bloonix.saveUserConfig("dashboard", {
                name: this.dashboardName,
                scale: this.config.scale,
                dashlets: this.config.dashlets,
                count: this.config.count
            });
        }
    };

    object.startSortOrResizeDashlets = function() {
        $(".dashlet-outer").css({ "border": "1px dashed #c1c1c1" });
        $(".dashlet").css({ "border": "1px dashed #444444" });
    };

    object.stopSortOrResizeDashlets = function() {
        this.saveDashboard();
        $(".dashlet-outer").css({ "border": "1px solid transparent" });
        $(".dashlet").css({ "border": "1px solid transparent" });
    };

    object.setInterval = function() {
        var self = this;
        Bloonix.intervalObjects.push(
            setInterval(
                function() { self.reloadDashboard() },
                this.interval
            )
        );
    };

    object.selectHosts = function(box, name) {
        var self = this,
            content = Utils.create("div"),
            value;

        if (box) {
            var curName = box.outer.data("name"),
                opts = box.outer.data("opts");

            if (name === curName && opts !== undefined && name !== "serviceChart" && name !== "userChart") {
                value = opts.query;
            }
        }

        var overlay = new Overlay({
            title: Text.get("text.dashboard.dashlet_configuration"),
            content: content,
            width: "600px"
        });

        var form = new Form({
            format: "medium",
            appendTo: content,
            createTable: true
        }).init();

        form.createElement({
            element: "textarea",
            name: "query",
            value: value,
            text: Text.get("action.search"),
            placeholder: Text.get("action.search")
        });

        var help = Utils.create("div")
            .addClass("help-text")
            .html(Text.get("info.extended_search_syntax_for_hosts"))
            .appendTo(content);

        var table = new Table({
            type: "none",
            addClass: "help-text-table",
            appendTo: help
        }).init();

        $.each([ "hostname", "ipaddr", "status", "sysgroup", "location", "coordinates", "device_class" ], function(i, key) {
            table.createSimpleRow([
                key,
                Text.get("schema.host.desc."+ key)
            ]);
        });

        form.button({
            appendTo: form.form,
            text: Text.get("action.save"),
            callback: function() {
                var data = form.getData();
                overlay.close();
                self.replaceOrAddDashlet(box, name, data);
            }
        });

        overlay.create();
    };

    object.selectChart = function(box, name, type, action) {
        var self = this,
            content = Utils.create("div"),
            opts, onClick;

        var overlay = new Overlay({
            title: Text.get("text.dashboard.dashlet_select_chart_title"),
            content: content,
            width: action === "configure" ? "500px" : "1000px"
        });

        var form = new Form({
            appendTo: content,
            createTable: true
        }).init();

        if (action === "configure") {
            opts = box.outer.data("opts"),
            onClick = function(value) {
                overlay.close();
                self.replaceOrAddDashlet(box, name, {
                    chart_id: opts.chart_id,
                    service_id: opts.service_id,
                    preset: value
                });
            };
        } else {
            opts = { preset: "3h" };
        }

        form.createElement({
            element: "radio",
            name: "preset",
            text: "Preset",
            checked: opts.preset,
            options: [ "3h", "6h", "12h", "18h", "1d" ],
            onClick: onClick
        });

        if (action === "configure") {
            overlay.create();
            return;
        }

        if (type === "service") {
            new Table({
                url: "/hosts/charts",
                header: {
                    title: Text.get("text.dashboard.dashlet_select_chart"),
                    pager: true,
                    search: true,
                    appendTo: content
                },
                postdata: {
                    offset: 0,
                    limit: 15,
                },
                searchable: {
                    url: "/hosts/charts/search",
                    result: [ "hostname", "service_name", "title" ],
                    resultWidth: "600px"
                },
                columns: [
                    {
                        name: "id",
                        hide: true,
                        value: function(row) { return row.service_id +":"+ row.chart_id }
                    },{
                        name: "hostname",
                        text: Text.get("schema.host.attr.hostname")
                    },{
                        name: "service_name",
                        text: Text.get("schema.service.attr.service_name")
                    },{
                        name: "title",
                        text: Text.get("schema.chart.attr.title")
                    }
                ],
                appendTo: content,
                onClick: function(row) {
                    overlay.close();
                    var data = form.getData();
                    self.replaceOrAddDashlet(box, name, {
                        chart_id: row.chart_id,
                        service_id: row.service_id,
                        preset: data.preset
                    });
                }
            }).create();
        } else {
            new Table({
                url: "/user/charts",
                header: {
                    title: Text.get("text.dashboard.dashlet_select_chart"),
                    pager: true,
                    search: true,
                    appendTo: content
                },   
                postdata: {
                    offset: 0,
                    limit: 15,
                },   
                searchable: {
                    url: "/user/charts/search",
                    result: [ "title", "subtitle", "description" ],
                    resultWidth: "600px"
                },   
                columns: [
                    {    
                        name: "id",
                        hide: true
                    },{  
                        name: "title",
                        text: Text.get("schema.user_chart.attr.title")
                    },{  
                        name: "subtitle",
                        text: Text.get("schema.user_chart.attr.subtitle")
                    },{  
                        name: "description",
                        text: Text.get("schema.user_chart.attr.description")
                    }    
                ],   
                appendTo: content,
                onClick: function(row) {
                    overlay.close();
                    var data = form.getData();
                    self.replaceOrAddDashlet(box, name, {
                        chart_id: row.id,
                        preset: data.preset
                    });  
                }    
            }).create();
        }

        overlay.create();
    };

    object.dashlets = {
        hostAvailStatus: {
            title: Text.get("text.dashboard.hosts_availability"),
            image: "/public/img/dashlet-availability-of-all-hosts.png",
            callback: function(dashlet, options) {
                dashlet.header.html("");

                Utils.create("h3")
                    .html(Text.get("text.dashboard.hosts_availability"))
                    .appendTo(dashlet.header);

                Ajax.post({
                    url: "/hosts/stats/status/",
                    success: function(result) {
                        dashlet.content.find(".loading").remove();

                        if (result.data.TOTAL == 0) {
                            Bloonix.noChartData(dashlet.content);
                            return false;
                        }

                        Bloonix.pieChart({
                            chart: {
                                title: null,
                                container: dashlet.id
                            },
                            plotOptions: { animation: options.animation },
                            colors: Bloonix.areaStatusColors,
                            data: [
                                { name: "OK",       y: parseFloat(result.data.OK)       },
                                { name: "INFO",     y: parseFloat(result.data.INFO)     },
                                { name: "WARNING",  y: parseFloat(result.data.WARNING)  },
                                { name: "CRITICAL", y: parseFloat(result.data.CRITICAL) },
                                { name: "UNKNOWN",  y: parseFloat(result.data.UNKNOWN)  }
                            ],
                            onClick: function(name) { Bloonix.searchHosts("status:"+ name) }
                        });
                    }
                });
            }
        },
        serviceAvailStatus: {
            title: Text.get("text.dashboard.services_availability"),
            image: "/public/img/dashlet-availability-of-all-services.png",
            callback: function(dashlet, options) {
                dashlet.header.html("");

                Utils.create("h3")
                    .html(Text.get("text.dashboard.services_availability"))
                    .appendTo(dashlet.header);

                Ajax.post({
                    url: "/services/stats/status/",
                    success: function(result) {
                        dashlet.content.find(".loading").remove();

                        if (result.data.TOTAL == 0) {
                            Bloonix.noChartData(dashlet.content);
                            return false;
                        }

                        Bloonix.pieChart({
                            chart: {
                                title: null,
                                container: dashlet.id
                            },
                            plotOptions: { animation: options.animation },
                            colors: Bloonix.areaStatusColors,
                            data: [
                                { name: "OK",       y: parseFloat(result.data.OK)       },
                                { name: "INFO",     y: parseFloat(result.data.INFO)     },
                                { name: "WARNING",  y: parseFloat(result.data.WARNING)  },
                                { name: "CRITICAL", y: parseFloat(result.data.CRITICAL) },
                                { name: "UNKNOWN",  y: parseFloat(result.data.UNKNOWN)  }
                            ],
                            onClick: function(name) { Bloonix.searchHosts("status:"+ name) }
                        });
                    }
                });
            }
        },
        serviceNoteStatus: {
            title: Text.get("text.dashboard.services_notification"),
            image: "/public/img/dashlet-notification-status-of-all-services.png",
            callback: function(dashlet, options) {
                dashlet.header.html("");

                Utils.create("h3")
                    .html(Text.get("text.dashboard.services_notification"))
                    .appendTo(dashlet.header);

                Ajax.post({
                    url: "/services/stats/notes/",
                    success: function(result) {
                        dashlet.content.find(".loading").remove();

                        if (result.data.total == 0) {
                            Bloonix.noChartData(dashlet.content);
                            return false;
                        }

                        Bloonix.barChart({
                            chart: {
                                title: null,
                                container: dashlet.id
                            },
                            plotOptions: { animation: options.animation },
                            categories: [
                                Text.get("text.dashboard.services_flapping"),
                                Text.get("text.dashboard.services_acknowledged"),
                                Text.get("text.dashboard.services_downtimes")
                            ],
                            series: [
                                { name: "yes", color: "#cc333f", data: [
                                    parseFloat(result.data.flapping.yes),
                                    parseFloat(result.data.acknowledged.yes),
                                    parseFloat(result.data.scheduled.yes) ]
                                },
                                { name: "no", color: "#2291b1", data: [
                                    parseFloat(result.data.flapping.no),
                                    parseFloat(result.data.acknowledged.no),
                                    parseFloat(result.data.scheduled.no) ]
                                }
                            ]
                        });
                    }
                });
            }
        },
        hostStatusMap: {
            title: Text.get("text.dashboard.map_title"),
            image: "/public/img/dashlet-global-host-status-map.png",
            callback: function(dashlet, options) {
                dashlet.header.html("");

                Utils.create("h3")
                    .html(Text.get("text.dashboard.map_title"))
                    .appendTo(dashlet.header);

                Ajax.post({
                    url: "/hosts/stats/country/",
                    success: function(result) {
                        dashlet.content.find(".loading").remove();

                        Bloonix.mapChart({
                            chart: {
                                title: null,
                                subtitle: null,
                                container: dashlet.id
                            },
                            plotOptions: { animation: options.animation },
                            data: result.data
                        });
                    }
                });

                if ($(dashlet.outer).find(".chart-infobox").length == 0 && Bloonix.plotChartsWith == "highcharts") {
                    var infoBox = Utils.create("div")
                        .addClass("chart-infobox")
                        .html(Text.get("text.dashboard.use_mouse_wheel_to_zoom"))
                        .hide()
                        .appendTo(dashlet.outer);

                    $(dashlet.outer).hover(
                        function() { infoBox.show() },
                        function() { infoBox.fadeOut(500) }
                    );
                }
            }
        },
        hostTopStatus: {
            title: Text.get("text.dashboard.list_top_hosts"),
            image: "/public/img/dashlet-overview-of-the-top-hosts.png",
            click: function(self, box, name) {
                self.selectHosts(box, name);
            },
            callback: function(dashlet, options) {
                dashlet.header.html("");

                Utils.create("h3")
                    .html(Text.get("text.dashboard.list_top_hosts"))
                    .appendTo(dashlet.header);

                Bloonix.showScrollbarAtHover(dashlet.content);

                var opts = dashlet.outer.data("opts");

                Ajax.post({
                    url: "/hosts/top/",
                    data: { query: opts ? opts.query : null },
                    success: function(result) {
                        $(dashlet.content).html("");

                        var table = new Table({ appendTo: dashlet.content });
                        table.init();

                        $.each([ 
                            "schema.host.attr.hostname",
                            "schema.host.attr.ipaddr",
                            "schema.host.attr.status",
                            "schema.host.attr.last_check"
                        ], function(index, key) {
                            table.addHeadColumn(Utils.escape(Text.get(key)));
                        });

                        $.each(result.data, function(index, row) {
                            var tr = table.createRow([
                                Bloonix.call("monitoring/hosts/"+ row.id, row.hostname),
                                row.ipaddr,
                                Bloonix.createInfoIcon({ type: row.status }),
                                Utils.escape(row.last_check)
                            ]);

                            var text = '';

                            $.each(row.services, function(i, r) {
                                if (r.status !== "OK") {
                                    text += '<p>'+ Utils.escape(r.service_name) +': <b style="color:'
                                        + Bloonix.defaultStatusColor[r.status] +';">'+ r.status +'</b></p>';
                                }
                            });

                            if (text.length) {
                                tr.tooltip({
                                    items: tr,  
                                    track: true,
                                    content: text
                                });
                            }
                        });
                    }
                });
            }
        },
        serviceTopStatus: {
            title: Text.get("text.dashboard.list_top_services"),
            image: "/public/img/dashlet-overview-of-the-top-services.png",
            click: function(self, box, name) {
                self.selectHosts(box, name);
            },
            callback: function(dashlet, options) {
                dashlet.header.html("");

                Utils.create("h3")
                    .html(Text.get("text.dashboard.list_top_services"))
                    .appendTo(dashlet.header);

                Bloonix.showScrollbarAtHover(dashlet.content);

                var opts = dashlet.outer.data("opts");

                Ajax.post({
                    url: "/services/top/",
                    data: { query: opts ? opts.query : null },
                    success: function(result) {
                        $(dashlet.content).html("");

                        var table = new Table({ appendTo: dashlet.content });
                        table.init();

                        $.each([
                            "schema.host.attr.hostname",
                            "schema.service.attr.service_name",
                            "schema.service.attr.status",
                            "schema.service.attr.last_check"
                        ], function(index, key) {
                            table.addHeadColumn(Text.get(key));
                        });

                        $.each(result.data, function(index, item) {
                            table.createRow([
                                Bloonix.call("monitoring/hosts/"+ item.host_id, item.hostname),
                                item.service_name,
                                Bloonix.createInfoIcon({ type: item.status }),
                                Utils.escape(item.last_check)
                            ]).attr("title", Utils.escape(item.message)).tooltip({ track: true });
                        });
                    }
                });
            }
        },
        topHostsEvents: {
            title: Text.get("text.dashboard.top_hosts_events"),
            image: "/public/img/dashlet-top-hosts-events.png",
            click: function(self, box, name) {
                self.selectHosts(box, name);
            },
            callback: function(dashlet, options) {
                dashlet.header.html("");

                Utils.create("h3")
                    .html(Text.get("text.dashboard.top_hosts_events"))
                    .appendTo(dashlet.header);

                Bloonix.showScrollbarAtHover(dashlet.content);

                var opts = dashlet.outer.data("opts");

                Ajax.post({
                    url: "/events/top",
                    data: { query: opts ? opts.query : null },
                    success: function(result) {
                        $(dashlet.content).html("");

                        var table = new Table({ appendTo: dashlet.content });
                        table.init();
                        table.addHeadColumn(Text.get("schema.event.attr.time"));
                        table.addHeadColumn("");
                        table.addHeadColumn(Text.get("schema.host.attr.hostname"));
                        table.addHeadColumn(Text.get("schema.service.attr.service_name"));

                        $.each(result.data, function(index, item) {
                            table.createRow([
                                item.time,
                                Bloonix.createInfoIcon({ type: item.status }),
                                Bloonix.call("monitoring/hosts/"+ item.host_id, item.hostname),
                                item.service_name
                            ]).attr("title", Utils.escape(item.message)).tooltip({ track: true });
                        });
                    }
                });
            }
        },
        serviceChart: {
            title: Text.get("text.dashboard.service_chart"),
            image: "/public/img/dashlet-service-chart.png",
            click: function(self, box, name, action) {
                self.selectChart(box, name, "service", action);
            },
            callback: function(dashlet, options) {
                var header = Utils.create("h3")
                    .html(Text.get("text.dashboard.service_chart"));

                var data = Utils.extend({
                   avg: $(dashlet.outer).width() +"p"
                }, dashlet.outer.data("opts"));

                Ajax.post({
                    url: "/hosts/charts/data",
                    data: data,
                    success: function(result) {
                        var service = result.data.service,
                            stats = result.data.stats,
                            title = service.hostname +" :: "+ service.title,
                            subtitle = service.service_name,
                            chartType = "line";

                        if (service.subkey && service.subkey != "0") {
                            subtitle += " ("+ service.subkey +")";
                        }

                        if (service.options["chart-type"]) {
                            chartType = service.options["chart-type"];
                        }

                        dashlet.header.html(header.text(title));

                        var plotOptions = {
                            chart: {
                                container: dashlet.id,
                                title: subtitle,
                                ylabel: service.options.ylabel,
                                xlabel: service.options.xlabel,
                                units: service.options.units,
                                type: chartType
                            },
                            plotOptions: { animation: options.animation },
                            series: [ ],
                            colors: { },
                            units: { },
                            hasNegativeValues: service.options.negative === "true" ? true : false
                        };

                        $.each(service.options.series, function(index, item) {
                            if (item.opposite == "true") {
                                plotOptions.hasNegativeValues = true;
                            }

                            if (stats[item.name]) {
                                var name = item.alias ? item.alias : item.name;
                                plotOptions.colors[name] = item.color;
                                plotOptions.units[name] = item.units;

                                plotOptions.series.push({
                                    data: stats[item.name],
                                    name: name,
                                    description: item.description,
                                    yAxis: 0,
                                    color: "rgba("+ Utils.hexToRGB(item.color).join(",") +",0.8)"
                                });
                            }
                        });

                        $(dashlet.content).html("");
                        Bloonix.plotChart(plotOptions);
                    }
                });
            }
        },
        userChart: {
            title: Text.get("text.dashboard.user_chart"),
            image: "/public/img/dashlet-service-chart.png",
            click: function(self, box, name, action) {
                self.selectChart(box, name, "user", action);
            },
            callback: function(dashlet, options) {
                var header = Utils.create("h3")
                    .html(Text.get("text.dashboard.user_chart"));

                var data = Utils.extend({
                   avg: $(dashlet.outer).width() +"p"
                }, dashlet.outer.data("opts"));

                Ajax.post({
                    url: "/user/charts/"+ data.chart_id,
                    ignoreErrors: { "err-600": true },
                    success: function(result) {
                        if (result.status === "err-600") {
                            var info = Utils.create("div")
                                .addClass("dashlet-info-box")
                                .html(Text.get(result.status));
                            dashlet.header.html(header.text(result.status));
                            dashlet.content.html(info);
                            return false;
                        }

                        var chartOpts = result.data;

                        Ajax.post({
                            url: "/hosts/charts/data",
                            data: data,
                            success: function(result) {
                                var services = result.data.service,
                                    stats = result.data.stats,
                                    title = chartOpts.title,
                                    subtitle = chartOpts.subtitle;

                                dashlet.header.html(header.text(title));

                                var plotOptions = {
                                    chart: {
                                        container: dashlet.id,
                                        title: subtitle,
                                        ylabel: chartOpts.yaxis_label,
                                        xlabel: chartOpts.xaxis_label,
                                        type: "area"
                                    },
                                    plotOptions: { animation: options.animation },
                                    series: [ ],
                                    colors: { },
                                    units: { },
                                    legend: {
                                        enabled: false
                                    },
                                    hasNegativeValues: false
                                };
        
                                $.each(chartOpts.options, function(i, item) {
                                    var service = services[item.service_id],
                                        alias = item.statkey_options.alias || item.statkey,
                                        name = '['+ alias +'] '+ service.hostname +' - '+ service.service_name;

                                    plotOptions.colors[name] = item.color;
                                    plotOptions.units[name] = item.statkey_options.units;

                                    var s = {
                                        data: stats[ item.service_id +':'+ item.statkey ],
                                        name: name,
                                        description: item.statkey,
                                        yAxis: 0
                                    };

                                    if (item.color) {
                                        s.color = "rgba("+ Utils.hexToRGB(item.color).join(",") +",0.8)"
                                    }

                                    plotOptions.series.push(s);
                                });
        
                                $(dashlet.content).html("");
                                Bloonix.plotChart(plotOptions);
                            }
                        });
                    }
                });
            }
        }
    };

    object.create();
    return object;
};
Bloonix.helpIndex = function(o) {
    var object = Utils.extend({
        appendTo: "#content",
        doc: false
    }, o);

    object.create = function() {
        this.createHeader();
        this.createBoxes();
        this.getIndex();
        this.createIndex();
    };

    object.createHeader = function() {
        this.header = new Header({
            title: Text.get("site.help.title"),
            border: true
        }).create();
    };

    object.createBoxes = function() {
        this.boxes = Bloonix.createSideBySideBoxes({
            container: this.appendTo,
            width: "350px",
            marginLeft: "360px"
        });

        this.indexContainer = this.boxes.left;
        this.documentContainer = Utils.create("div")
            .addClass("help")
            .appendTo(this.boxes.right);
        this.loading = Utils.create("div")
            .addClass("loading")
            .hide()
            .appendTo(this.boxes.right);
    };

    object.getIndex = function() {
        this.index = Bloonix.get("/help");
    };

    object.createIndex = function() {
        var self = this,
            items = [];

        if (!this.doc) {
            this.doc = this.index[0];
        }

        $.each(this.index, function(i, item) {
            items.push({
                name: Text.get("site.help.doc."+ item),
                value: item,
                default: item == self.doc ? true : false
            });
        });

        this.iconList = Bloonix.createIconList({
            items: items,
            appendTo: this.indexContainer,
            button: false,
            callback: function(value) { self.showDocument(value) }
        });

        this.showDocument(this.doc);
    };

    object.showDocument = function(doc) {
        this.documentContainer.hide();
        this.loading.show();
        var html = Bloonix.get("/help/"+ doc);
        this.documentContainer.html(html);
        this.loading.hide();
        $("#content-outer").scrollTop(0);
        this.documentContainer.fadeIn(300);
        this.addClickEventToLinks();
        location.hash = "#help/"+ doc;
    };

    object.addClickEventToLinks = function() {
        var self = this;
        this.documentContainer.find("a").each(function() {
            var id = $(this).data("id");
            $(this).click(function() { self.iconList.switchTo(id) });
        });
    };

    object.create();
    return object;
};
Bloonix.listHosts = function(o) {
    var object = Utils.extend({
        postdata: {
            offset: 0,
            limit: Bloonix.requestSize
        },
        appendTo: "#content",
        hideItems: {}
    }, o);

    if (object.query) {
        object.postdata.query = object.query;
    }

    object.action = function(action) {
        var self = this,
            selectedIds = this.table.getSelectedIds();

        if (selectedIds.length == 0) {
            Bloonix.createNoteBox({ text: Text.get("schema.host.text.multiple_selection_help") });
            return;
        }

        var overlay = this.overlay = new Overlay();
        overlay.content = Utils.create("div"); //.css({ "text-align": "center" });

        if (action === 0) {
            overlay.title = Text.get("schema.host.text.multiple_downtimes");
            overlay.visible = true;
            var form = Bloonix.createScheduledDowntime({
                url: "/hosts/create-downtime/",
                data: { host_id: selectedIds },
                callback: function(result) { self.table.getData(); overlay.close() }
            });
            form.container.appendTo(overlay.content);
        } else if (action === 1) {
            overlay.title = Text.get("schema.host.text.multiple_notification");

            Utils.create("div")
                .addClass("btn btn-white btn-medium")
                .html(Text.get("schema.host.action.disable_notifications_multiple"))
                .appendTo(overlay.content)
                .click(function() {
                    Bloonix.hostServiceAction(
                        "/hosts/disable-notification/",
                        { host_id: selectedIds }
                    );
                    self.table.getData();
                    overlay.close();
                });

            Utils.create("div")
                .addClass("btn btn-white btn-medium")
                .html(Text.get("schema.host.action.enable_notifications_multiple"))
                .appendTo(overlay.content)
                .click(function() {
                    Bloonix.hostServiceAction(
                        "/hosts/enable-notification/",
                        { host_id: selectedIds }
                    );
                    self.table.getData();
                    overlay.close();
                });
        } else if (action === 2) {
            overlay.title = Text.get("schema.host.text.multiple_activate");

            Utils.create("div")
                .addClass("btn btn-white btn-medium")
                .html(Text.get("schema.host.action.deactivate_multiple"))
                .appendTo(overlay.content)
                .click(function() {
                    Bloonix.hostServiceAction(
                        "/hosts/deactivate/",
                        { host_id: selectedIds }
                    );
                    self.table.getData();
                    overlay.close();
                });

            Utils.create("div")
                .addClass("btn btn-white btn-medium")
                .html(Text.get("schema.host.action.activate_multiple"))
                .appendTo(overlay.content)
                .click(function() {
                    Bloonix.hostServiceAction(
                        "/hosts/activate/",
                        { host_id: selectedIds }
                    );
                    self.table.getData();
                    overlay.close();
                });
        } else if (action === 3) {
            var formOuter = Utils.create("div").css({ padding: "0 20px" }),
                elements = [];

            Utils.create("div")
                .addClass("text-warn")
                .css({ "text-align": "center", "padding-bottom": "20px" })
                .html(Text.get("schema.host.text.multiple_edit_info"))
                .appendTo(formOuter);

            $.each(Bloonix.getHostFormElements(), function(i, e) {
                if (
                    e.name === "description" ||
                    e.name === "comment" ||
                    e.name === "sysinfo" ||
                    e.name === "sysgroup" ||
                    e.name === "device_class" ||
                    e.name === "hw_manufacturer" ||
                    e.name === "hw_product" ||
                    e.name === "os_manufacturer" ||
                    e.name === "os_product" ||
                    e.name === "virt_manufacturer" ||
                    e.name === "virt_product" ||
                    e.name === "location" ||
                    e.name === "allow_from"
                ) {
                    elements.push(e);
                    e.required = false;
                }
            });

            var form = new Form({
                format: "medium",
                url: { submit: "/hosts/update-multiple" },
                onSuccess: function() { overlay.close() },
                action: "update",
                elements: elements,
                autocomplete: Bloonix.get("/hosts/cats"),
                appendTo: formOuter,
                showButton: false,
                overwriteDataCallback: function(data) {
                    var newData = { host_id: selectedIds };
                    $.each(data, function(key, value) {
                        if (value !== undefined && value.length) {
                            newData[key] = value;
                        }
                    });
                    return newData;
                }
            }).create();

            overlay.content = formOuter;
            overlay.title = Text.get("schema.host.text.multiple_edit");
            overlay.buttons = [{
                content: Text.get("action.update"),
                callback: function() { form.submit() },
                close: false
            }];
        }

        overlay.create();
    };

    object.create = function() {
        this.createBoxes();
        this.listDeviceClasses();
        this.listHosts();
    };

    object.createBoxes = function() {
        this.headerContainer = Utils.create("div")
            .appendTo(this.appendTo);

        this.contentContainer = Utils.create("div")
            .appendTo(this.appendTo);

        this.boxes = Bloonix.createSideBySideBoxes({
            container: this.contentContainer,
            width: "250px",
            marginLeft: "260px"
        });
    };

    object.listDeviceClasses = function() {
        var self = this;

        Bloonix.replaceWithLoading(this.boxes.left);

        Ajax.post({
            url: "/hosts/devices",
            success: function(result) {
                self.deviceClasses = result.data;
                Bloonix.removeLoading(self.boxes.left);

                var ul = Utils.create("ul")
                    .addClass("device-class-listing")
                    .appendTo(self.boxes.left);

                self.listDeviceStructure(ul, self.deviceClasses, "", false);
            }
        });
    };

    object.listDeviceStructure = function(ul, data, path, hide) {
        var self = this;

        $.each(Bloonix.sortObject(data), function(i, className) {
            var obj = data[className],
                currentPath,
                totalObjects = parseInt(obj.total),
                statusColor = "OK",
                statusCount = 0;

            if (hide === false && className === "All") {
                currentPath = "";
            } else {
                currentPath = path +"/"+ className;
            }

            if (self.hideItems[currentPath] === undefined) {
                self.hideItems[currentPath] = hide;
            } else {
                hide = self.hideItems[currentPath];
            }

            $.each([ "UNKNOWN", "CRITICAL", "WARNING", "INFO" ], function(i, s) {
                statusCount += parseInt(obj.status[s]);
            });

            $.each([ "UNKNOWN", "CRITICAL", "WARNING", "INFO", "OK" ], function(i, s) {
                if (obj.status[s] > 0) {
                    statusColor = s;
                    return false;
                }
            });

            var li = Utils.create("li")
                .appendTo(ul);

            Bloonix.createInfoIcon({ type: statusColor, size: "small" })
                .appendTo(li);

            var statusString = statusColor === "OK"
                ? totalObjects
                : statusCount +"/"+ totalObjects;

            var span = Utils.create("span")
                .attr("data-path", currentPath)
                .addClass("device-class-listing-hover")
                .addClass("device-class-path")
                .text(className +" ("+ statusString +")")
                .appendTo(li);

            span.click(function() {
                var search = currentPath === ""
                    ? { search: currentPath }
                    : { search: "d:"+ currentPath };

                self.table.getData(search);
            });

            if (currentPath === "") {
                Utils.create("a")
                    .attr("href", "#help/device-classes")
                    .attr("target", "_blank")
                    .attr("title", Text.get("schema.host.text.device_class_help_link"))
                    .addClass("hicons-btn")
                    .css({ "margin-left": "15px" })
                    .html(Utils.create("span").addClass("hicons info-sign"))
                    .appendTo(li)
                    .tooltip();
            }

            if (Utils.objectSize(obj.classes)) {
                var newUl = Utils.create("ul")
                    .addClass("device-class-listing")
                    .appendTo(li);

                if (hide === true) {
                    newUl.hide();
                }

                span.click(function() {
                    if (self.hideItems[currentPath] === true) {
                        self.hideItems[currentPath] = false;
                        newUl.show(200);
                    } else {
                        self.hideItems[currentPath] = true;
                        newUl.find("ul").hide();
                        newUl.find(".device-class-path").each(function() {
                            self.hideItems[ $(this).data("path") ] = true;
                        });
                        newUl.hide(200);
                    }
                });

                self.listDeviceStructure(newUl, obj.classes, currentPath, true);
            }
        });
    };

    object.listHosts = function() {
        var self = this;

        Bloonix.setTitle("schema.host.text.list");

        Utils.create("span")
            .attr("title", Text.get("schema.host.text.multiple_downtimes"))
            .tooltip()
            .addClass("footer-button")
            .html(Utils.create("div").addClass("hicons-white hicons time"))
            .appendTo("#footer-left")
            .click(function() { self.action(0) });

        Utils.create("span")
            .attr("title", Text.get("schema.host.text.multiple_notification"))
            .tooltip()
            .addClass("footer-button")
            .html(Utils.create("div").addClass("hicons-white hicons envelope"))
            .appendTo("#footer-left")
            .click(function() { self.action(1) });

        Utils.create("span")
            .attr("title", Text.get("schema.host.text.multiple_activate"))
            .tooltip()
            .addClass("footer-button")
            .html(Utils.create("div").addClass("hicons-white hicons remove-sign"))
            .appendTo("#footer-left")
            .click(function() { self.action(2) });

        if (Bloonix.user.role !== "user") {
            Utils.create("span")
                .attr("title", Text.get("schema.host.text.multiple_edit"))
                .tooltip()
                .addClass("footer-button")
                .html(Utils.create("div").addClass("hicons-white hicons wrench"))
                .appendTo("#footer-left")
                .click(function() { self.action(3) });
        }

        var counterButton = Utils.create("span")
            .attr("title", Text.get("text.selected_objects"))
            .tooltip()
            .addClass("footer-button")
            .text("0")
            .hide()
            .appendTo("#footer-left");

        var icons;

        if (Bloonix.user.role != "user") {
            icons = [
                {
                    type: "help",
                    callback: function() { Utils.open("/#help/add-new-host") },
                    title: Text.get("site.help.doc.add-new-host")
                },{
                    type: "create",
                    callback: function() { Bloonix.route.to("monitoring/hosts/create") },
                    title: Text.get("schema.host.text.create")
                }
            ];
        }

        this.table = new Table({
            url: "/hosts",
            postdata: this.postdata,
            appendTo: this.boxes.right,
            sortable: true,
            header: {
                title: Text.get("schema.host.text.list"),
                pager: true,
                search: true,
                icons: icons,
                appendTo: this.headerContainer,
                replace: true
            },
            selectable: {
                result: [ "id", "hostname", "ipaddr", "description" ],
                counter: { update: counterButton }
            },
            searchable: {
                url: "/hosts/search/",
                result: [ "id", "hostname", "ipaddr", "description", "status", "sysgroup", "location", "coordinates" ],
                value: this.postdata.query
            },
            reloadable: {
                before: function() { self.listDeviceClasses() }
            },
            deletable: {
                title: Text.get("schema.host.text.delete"),
                url: "/administration/hosts/:id/delete",
                result: [ "id", "hostname", "ipaddr" ]
            },
            tooltip: function(row) {
                var text = '';

                $.each(row.services, function(i, r) {
                    if (r.status !== "OK") {
                        text += '<p>'+ Utils.escape(r.service_name) +': <b style="color:'
                            + Bloonix.defaultStatusColor[r.status] +';">'+ r.status +'</b></p>';
                    }
                });

                return text;
            },
            columnSwitcher: true,
            columns: [
                {
                    name: "id",
                    text: Text.get("schema.host.attr.id"),
                    hide: true
                },{
                    name: "hostname",
                    text: Text.get("schema.host.attr.hostname"),
                    call: function(row) { return Bloonix.call("monitoring/hosts/"+ row.id, row.hostname) }
                },{
                    icons: [
                        {
                            check: function(row) { return row.notification == "0" ? true : false },
                            icon: "cicons mute",
                            title: Text.get("schema.host.info.notification_disabled")
                        },{
                            check: function(row) { return row.active == "0" ? true : false },
                            icon: "cicons disabled",
                            title: Text.get("schema.host.info.inactive")
                        },{
                            check: function(row) { return row.sysinfo ? true : false },
                            icon: "cicons arrow-right-orange",
                            link: ":sysinfo",
                            blank: true,
                            title: Text.get("schema.host.info.sysinfo")
                        }
                    ]
                },{
                    name: "ipaddr",
                    text:  Text.get("schema.host.attr.ipaddr")
                },{
                    name: "company",
                    text: Text.get("schema.company.attr.company"),
                    hide: Bloonix.user.role == "admin" ? false : true
                },{
                    name: "description",
                    text: Text.get("schema.host.attr.description")
                },{
                    name: "comment",
                    text: Text.get("schema.host.attr.comment"),
                    hide: true
                },{
                    name: "status",
                    text: Text.get("schema.host.attr.status"),
                    wrapValueClass: true
                },{
                    name: "last_check",
                    text: Text.get("schema.host.attr.last_check"),
                    convertFromUnixTime: true
                },{
                    name: "sysgroup",
                    text: Text.get("schema.host.attr.sysgroup")
                },{
                    name: "sysinfo",
                    text: Text.get("schema.host.attr.sysinfo"),
                    hide: true
                },{
                    name: "device_class",
                    text: Text.get("schema.host.attr.device_class")
                },{
                    name: "hw_manufacturer",
                    text: Text.get("schema.host.attr.hw_manufacturer"),
                    hide: true
                },{
                    name: "hw_product",
                    text: Text.get("schema.host.attr.hw_product"),
                    hide: true
                },{
                    name: "os_manufacturer",
                    text: Text.get("schema.host.attr.os_manufacturer"),
                    hide: true
                },{
                    name: "os_product",
                    text: Text.get("schema.host.attr.os_product")
                },{
                    name: "virt_manufacturer",
                    text: Text.get("schema.host.attr.virt_manufacturer"),
                    hide: true
                },{
                    name: "virt_product",
                    text: Text.get("schema.host.attr.virt_product"),
                    hide: true
                },{
                    name: "location",
                    text: Text.get("schema.host.attr.location")
                },{
                    name: "coordinates",
                    text: Text.get("schema.host.attr.coordinates"),
                    hide: true
                },{
                    name: "interval",
                    text: Text.get("schema.host.attr.interval"),
                    hide: true
                },{
                    name: "data_retention",
                    text: Text.get("schema.host.attr.data_retention"),
                    hide: true
                }
            ]
        }).create();
    };

    object.create();
    return object;
};

Bloonix.editHost = function(o) {
    var host = Bloonix.get("/administration/hosts/"+ o.id +"/options/");

    Bloonix.setTitle("schema.host.text.settings");

    new Header({
        title: Text.get("schema.host.text.settings"),
        icons: Bloonix.getHostAddEditIcons()
    }).create();

    new Form({
        url: { submit: "/administration/hosts/"+ o.id +"/update/" },
        title: "Host-Key: "+ o.id +"."+ host.values.password,
        action: "update",
        options: host.options,
        values: host.values,
        elements: Bloonix.getHostFormElements(),
        autocomplete: Bloonix.get("/hosts/cats")
    }).create();
};

Bloonix.createHost = function() {
    var host = Bloonix.get("/administration/hosts/options");

    Bloonix.setTitle("schema.host.text.create");
    new Header({
        title: Text.get("schema.host.text.create"),
        icons: Bloonix.getHostAddEditIcons()
    }).create();

    var elements = Bloonix.getHostFormElements(),
        groups = Bloonix.get("/administration/groups"),
        contactgroups = Bloonix.get("/contactgroups");

    elements.splice(1, 0, {
        element: "multiselect",
        name: "group_id",
        text: Text.get("schema.host.text.add_host_to_group"),
        desc: Text.get("schema.host.desc.add_host_to_group"),
        required: true
    });

    elements.splice(2, 0, {
        element: "multiselect",
        name: "contactgroup_id",
        text: Text.get("schema.host.text.add_host_to_contactgroup"),
        desc: Text.get("schema.host.desc.add_host_to_contactgroup")
    });

    elements.splice(3, 0, {
        element: "multiselect",
        name: "host_template_id",
        text: Text.get("schema.host.text.add_host_to_host_template"),
        desc: Text.get("schema.host.desc.add_host_to_host_template")
    });

    host.values.password = Utils.genRandStr(30);

    var form = new Form({
        url: { submit: "/administration/hosts/create/" },
        onSuccess: function(result) { Bloonix.route.to("monitoring/hosts/"+ result.id) },
        action: "create",
        options: host.options,
        values: host.values,
        elements: elements,
        autocomplete: Bloonix.get("/hosts/cats")
    }).create();
};

Bloonix.getHostFormElements = function() {
    return [
        {
            element: "select",
            name: "company_id",
            text: Text.get("schema.company.attr.company"),
            desc: Text.get("schema.host.desc.company_id"),
            required: true
        },{
            element: "input",
            type: "text",
            name: "hostname",
            text: Text.get("schema.host.attr.hostname"),
            desc: Text.get("schema.host.desc.hostname"),
            maxlength: 64,
            required: true
        },{
            element: "input",
            type: "text",
            name: "ipaddr",
            text: Text.get("schema.host.attr.ipaddr"),
            desc: Text.get("schema.host.desc.ipaddr"),
            maxlength: 39,
            required: true
        },{
            element: "input",
            type: "text",
            name: "description",
            text: Text.get("schema.host.attr.description"),
            desc: Text.get("schema.host.desc.description"),
            maxlength: 100,
            required: true
        },{
            element: "input",
            type: "text",
            name: "comment",
            text: Text.get("schema.host.attr.comment"),
            desc: Text.get("schema.host.desc.comment"),
            maxlength: 100
        },{
            element: "input",
            type: "text",
            name: "password",
            text: Text.get("schema.host.attr.password"),
            desc: Text.get("schema.host.desc.password"),
            minlength: 30,
            maxlength: 128,
            genString: 30,
            required: true
        },{
            element: "input",
            type: "text",
            name: "sysinfo",
            text: Text.get("schema.host.attr.sysinfo"),
            desc: Text.get("schema.host.desc.sysinfo"),
            maxlength: 200
        },{
            element: "input",
            type: "text",
            name: "sysgroup",
            text: Text.get("schema.host.attr.sysgroup"),
            desc: Text.get("schema.host.desc.sysgroup"),
            maxlength: 50
        },{
            element: "input",
            type: "text",
            name: "device_class",
            text: Text.get("schema.host.attr.device_class"),
            desc: Text.get("schema.host.desc.device_class"),
            maxlength: 100
        },{
            element: "input",
            type: "text",
            name: "hw_manufacturer",
            text: Text.get("schema.host.attr.hw_manufacturer"),
            desc: Text.get("schema.host.desc.hw_manufacturer"),
            maxlength: 50
        },{
            element: "input",
            type: "text",
            name: "hw_product",
            text: Text.get("schema.host.attr.hw_product"),
            desc: Text.get("schema.host.desc.hw_product"),
            maxlength: 50
        },{
            element: "input",
            type: "text",
            name: "os_manufacturer",
            text: Text.get("schema.host.attr.os_manufacturer"),
            desc: Text.get("schema.host.desc.os_manufacturer"),
            maxlength: 50
        },{
            element: "input",
            type: "text",
            name: "os_product",
            text: Text.get("schema.host.attr.os_product"),
            desc: Text.get("schema.host.desc.os_product"),
            maxlength: 50
        },{
            element: "input",
            type: "text",
            name: "virt_manufacturer",
            text: Text.get("schema.host.attr.virt_manufacturer"),
            desc: Text.get("schema.host.desc.virt_manufacturer"),
            maxlength: 50
        },{
            element: "input",
            type: "text",
            name: "virt_product",
            text: Text.get("schema.host.attr.virt_product"),
            desc: Text.get("schema.host.desc.virt_product"),
            maxlength: 50
        },{
            element: "input",
            type: "text",
            name: "location",
            text: Text.get("schema.host.attr.location"),
            desc: Text.get("schema.host.desc.location"),
            maxlength: 100
        },{
            element: "select",
            name: "coordinates",
            text: Text.get("schema.host.attr.coordinates"),
            desc: Text.get("schema.host.desc.coordinates"),
            required: true
        },{
            element: "radio-yes-no",
            name: "active",
            text: Text.get("schema.host.attr.active"),
            desc: Text.get("schema.host.desc.active"),
            required: true
        },{
            element: "radio-yes-no",
            name: "notification",
            text: Text.get("schema.host.attr.notification"),
            desc: Text.get("schema.host.desc.notification"),
            required: true
        },{
            element: "input",
            type: "text",
            name: "allow_from",
            text: Text.get("schema.host.attr.allow_from"),
            desc: Text.get("schema.host.desc.allow_from"),
            maxlength: 100,
            required: true
        },{
            element: "slider",
            name: "interval",
            text: Text.get("schema.host.attr.interval"),
            desc: Text.get("schema.host.desc.interval"),
            secondsToFormValues: true,
            nullString: Text.get("text.inherited_from_host")
        },{
            element: "slider",
            name: "timeout",
            text: Text.get("schema.host.attr.timeout"),
            desc: Text.get("schema.host.desc.timeout"),
            secondsToFormValues: true,
            nullString: Text.get("text.inherited_from_host")
        },{
            element: "input",
            type: "text",
            name: "data_retention",
            text: Text.get("schema.host.attr.data_retention"),
            desc: Text.get("schema.host.desc.data_retention"),
            minValue: 0,
            maxValue: 32767,
            required: true
        },{
            element: "input",
            type: "text",
            name: "max_services",
            text: Text.get("schema.host.attr.max_services"),
            desc: Text.get("schema.host.desc.max_services"),
            minValue: 0,
            maxValue: 9999,
            required: true
        },{
            element: "input",
            type: "text",
            name: "max_sms",
            text: Text.get("schema.host.attr.max_sms"),
            desc: Text.get("schema.host.desc.max_sms"),
            minValue: 0,
            maxValue: 99999,
            required: true
        },{
            element: "textarea",
            name: "variables",
            text: Text.get("schema.host.attr.variables"),
            desc: Text.get("schema.host.desc.variables")
        }
    ];
};

Bloonix.searchHosts = function(query) {
    Bloonix.route.to("monitoring/hosts", { query: query });
};

Bloonix.getHost = function(id) {
    return Bloonix.get("/hosts/"+ id);
};

Bloonix.getHostAddEditIcons = function() {
    return [
        {   
            type: "help",
            callback: function() { Utils.open("/#help/host-parameter") },
            title: Text.get("site.help.doc.host-parameter")
        }   
    ]
};
Bloonix.viewHostDependencies = function(o) {
    var dependency = Utils.extend({}, o);

    dependency.init = function() {
        this.cache = { selected: {} };
        this.container = $("#content");
        this.host = Bloonix.getHost(this.id);

        Bloonix.showHostSubNavigation(
            "dependencies",
            this.host.id,
            this.host.hostname
        );

        Bloonix.setTitle(
            "schema.dependency.text.list",
            this.host.hostname
        );

        new Header({
            title: Text.get(
                "schema.dependency.text.list",
                this.host.hostname,
                true
            ),
            icons: [
                {
                    type: "help",
                    callback: function() { Utils.open("/#help/host-and-service-dependencies") },
                    title: Text.get("site.help.doc.host-and-service-dependencies")
                }
            ]
        }).create();

        this.boxes = Bloonix.createSideBySideBoxes({
            container: this.container,
            width: "350px",
            marginLeft: "360px"
        });

        this.optionBox = this.boxes.left;
        this.dependencyBox = this.boxes.right;

        this.infovisBox = Utils.create("div")
            .attr("id", "infovis")
            .appendTo(this.dependencyBox);

        this.dependencyBox = Utils.create("div")
            .attr("id", "dependencies")
            .appendTo(this.dependencyBox);

        this.listOptions();
        this.getDependencies();
    };

    dependency.listOptions = function() {
        var self = this;

        Bloonix.createIconList({
            items: [
                {
                    icon: "hicons radial",
                    value: "radialGraph",
                    title: "Radial graph",
                    default: true
                },{
                    icon: "hicons asterisk",
                    value: "hyperTree",
                    title: "Hypertree"
                }
            ],
            store: { to: this.cache.selected, as: "graphType" },
            callback: function(type) { self.createDependencyGraph(type) },
            appendTo: this.boxes.left
        });

        Utils.create("h3")
            .addClass("h3")
            .html(Text.get("schema.dependency.text.create_from"))
            .appendTo(this.optionBox);

        var list = Utils.create("ul")
            .addClass("form-link-list")
            .appendTo(this.optionBox);

        $.each([ "host_to_host", "host_to_service", "service_to_host", "service_to_service" ], function(i, key) {
            Utils.create("li")
                .html(Text.get("schema.dependency.text."+ key))
                .click(function() {
                    self.createDependencyForm(key);
                    self.cache.selected.type = key;
                }).appendTo(list);
        });
    };

    dependency.getDependencies = function() {
        var self = this;

        Ajax.post({
            url: "/hosts/"+ this.host.id + "/dependencies/",
            success: function(result) {
                self.dependencies = result.data;
                self.generateDependenices();
            }
        });
    };

    dependency.generateDependenices = function() {
        var data = {
            host_id: this.host.id,
            hostname: this.host.hostname,
            ipaddr: this.host.ipaddr,
            dependencies: this.dependencies,
            "$color": Bloonix.defaultStatusColor[this.host.status]
        };

        this.graphData = {
            id: 0,
            name: this.host.hostname,
            data: data,
            children: [ ]
        };

        this.processChildren(this.dependencies, this.graphData.children);
        this.createDependencyGraph("radialGraph")
    };

    dependency.processChildren = function(dependencies, children) {
        var self = this;
        $.each(dependencies, function(i, row) {
            row["$color"] = row.service_status
                ? Bloonix.defaultStatusColor[row.service_status]
                : Bloonix.defaultStatusColor[row.host_status];

            var graphData = {
                id: row.id,
                name: row.on_hostname,
                data: row,
                children: [ ]
            };

            children.push(graphData);
            self.processChildren(row.dependencies, graphData.children);
        });
    };

    dependency.createDependencyGraph = function(type) {
        var self = this;
        Bloonix.createInfovisGraph({
            data: this.graphData,
            type: type,
            container: "infovis",
            onClick: this.createDependencyDescription
        });
        this.createDependencyDescription(this.graphData.data);
    };

    dependency.createDependencyDescription = function(o) {
        var self = this,
            box = $("#dependencies").html("");

        Utils.create("h2")
            .addClass("h2")
            .html(Text.get("schema.dependency.text.for_node", Utils.escape(o.hostname), true))
            .appendTo(box);

        if (o.dependencies.length == 0) {
            Utils.create("div")
                .addClass("info-simple")
                .html(Text.get("schema.dependency.text.no_dependencies"))
                .appendTo(box);

            return false;
        }

        var table = new Table({
            appendTo: box,
            selectable: false,
            searchable: false
        });

        table.init();
        table.table.css({ width: "800px" });

        $.each([
            "schema.dependency.text.dependencies", "schema.dependency.attr.status",
            "schema.dependency.attr.on_status", "schema.dependency.attr.inherit",
            "schema.dependency.text.active_time", "action.action"
        ], function(i, key) {
            table.addHeadColumn(Text.get(key));
        });

        $.each(o.dependencies, function(i, row) {
            var tr = table.createRow();

            var dependencyColumn = Utils.create("td")
                .appendTo(tr);

            var text = Utils.create("b")
                .appendTo(dependencyColumn);

            var object = Utils.create("span")
                .appendTo(dependencyColumn);

            Utils.create("br")
                .appendTo(dependencyColumn);

            var onText = Utils.create("b")
                .appendTo(dependencyColumn);

            var onObject = Utils.create("span")
                .appendTo(dependencyColumn);

            if (row.service_id == undefined) {
                text.html(Text.get("schema.dependency.text.host"));
                object.text(" "+ row.hostname);
            } else {
                text.html(Text.get("schema.dependency.text.service"));
                object.text(" "+ row.hostname +" - "+ row.service_name);
            }

            if (row.on_service_id == undefined) {
                onText.html(Text.get("schema.dependency.text.depends_on_host"));
                onObject.text(" "+ row.on_hostname);
            } else {
                onText.html(Text.get("schema.dependency.text.depends_on_service"));
                onObject.text(" "+ row.on_hostname +" - "+ row.on_service_name);
            }

            $.each([ row.status, row.on_status ], function(x, obj) {
                var tdStatus = Utils.create("td").appendTo(tr);

                $.each(obj.split(","), function(y, s) {
                    Bloonix.createInfoIcon({ type: s })
                        .css({ "margin-right": "1px" })
                        .attr("title", s)
                        .tooltip({ track: true })
                        .appendTo(tdStatus);
                });
            });

            Utils.create("td")
                .html(Text.get("bool.yesno."+ row.inherit))
                .appendTo(tr);

            Utils.create("td")
                .css({ "white-space": "nowrap" })
                .html(row.timeslice +"<br/>"+ row.timezone)
                .appendTo(tr);

            var actionColumn = Utils.create("td")
                .appendTo(tr);

            Bloonix.createIcon("remove")
                .click(function() { self.deleteDependency(row) })
                .appendTo(actionColumn);
        });
    };

    dependency.deleteDependency = function(dependency, force) {
        var self = this;

        if (force == true) {
            Ajax.post({
                url: "/hosts/"+ dependency.host_id +"/dependencies/"+ dependency.id +"/delete/",
                success: function(result) {
                    Log.debug(result);
                    Bloonix.route.to("monitoring/hosts/"+ dependency.host_id +"/dependencies")
                }
            });
        } else {
            new Overlay({
                title: "Delete a dependency",
                closeText: Text.get("action.abort"),
                content: Utils.create("div").html(Text.get("schema.dependency.text.really_delete", dependency.id, true)),
                buttons: [{
                    content: Text.get("action.yes_delete"),
                    callback: function() { self.deleteDependency(dependency, true) }
                }]
            }).create();
        }
    };

    dependency.clearSelectedCache = function() {
        delete this.cache.selected.on_host_id;
        delete this.cache.selected.on_hostname;
        delete this.cache.selected.on_service_id;
    };

    dependency.showOrHideTableRows = function(opt) {
        opt = opt == 0 ? "fadeOut" : "fadeIn";
        var time = opt == 0 ? 0 : 200;
        this.tr.fromStatus[opt](time);
        this.tr.toStatus[opt](time);
        this.tr.inherit[opt](time);
        this.tr.timezone[opt](time);
        this.tr.timeslice[opt](time);
        this.buttonContainer[opt](time);
    };

    dependency.createDependencyForm = function(type) {
        var self = this;

        this.type = type;
        this.container.html("");

        this.header = new Header({
            title: Text.get(
                "schema.dependency.text.create",
                this.host.hostname,
                true
            ),
            icons: [{
                type: "go-back",
                callback: function() { Bloonix.route.to("monitoring/hosts/"+ self.host.id +"/dependencies") }
            }]
        }).create();

        this.form = new Form({
            format: "default",
            appendTo: this.container
        }).init();

        this.table = Utils.create("table")
            .addClass("dependency-table")
            .appendTo(this.form.getContainer());

        this.buttonContainer = Utils.create("div")
            .hide()
            .appendTo(this.form.getContainer());

        this.tr = {};
        this.th = {};
        this.td = {};

        $.each([
            "fromHost", "fromService", "toHost", "toService",
            "fromStatus", "toStatus", "inherit", "timezone",
            "timeslice"
        ], function(i, key) {
            self.tr[key] = Utils.create("tr").appendTo(self.table).hide();
            self.th[key] = Utils.create("th").appendTo(self.tr[key]);
            self.td[key] = Utils.create("td").appendTo(self.tr[key]);
        });

        this.tr.fromHost.show();

        Utils.create("th")
            .html(Text.get("schema.dependency.text.workflow_from_host"))
            .appendTo(this.th.fromHost);

        Utils.create("th")
            .html(Text.get("schema.dependency.text.workflow_from_service"))
            .appendTo(this.th.fromService);

        this.tr.toHost.show();

        Utils.create("th")
            .html("to host")
            .appendTo(this.th.toHost);

        Utils.create("th")
            .html(Text.get("schema.dependency.text.workflow_to_service"))
            .appendTo(this.th.toService);

        Utils.create("th")
            .html(
                this.type == "service_to_host" || this.type == "service_to_service"
                    ? Text.get("schema.dependency.text.workflow_from_service_status")
                    : Text.get("schema.dependency.text.workflow_from_host_status")
            ).appendTo(this.th.fromStatus);

        Utils.create("th")
            .html(
                this.type == "host_to_service" || this.type == "service_to_service"
                    ?  Text.get("schema.dependency.text.workflow_to_service_status")
                    :  Text.get("schema.dependency.text.workflow_to_host_status")
            ).appendTo(this.th.toStatus);

        Utils.create("th")
            .html(Text.get("schema.dependency.text.workflow_inherit"))
            .appendTo(this.th.inherit);

        Utils.create("th")
            .html(Text.get("schema.dependency.text.workflow_timezone"))
            .appendTo(this.th.timezone);

        Utils.create("th")
            .html(Text.get("schema.dependency.text.workflow_timeslice"))
            .appendTo(this.th.timeslice);

        this.td.fromHost.text(this.host.hostname);

        if (this.type == "service_to_host" || this.type == "service_to_service") {
            this.tr.fromService.show();

            this.fromServiceSearchInput = this.form.select({
                placeholder: "From service",
                options: Bloonix.getServicesForSelection(this.host.id),
                appendTo: this.td.fromService,
                required: true,
                callback: function(value) {
                    self.cache.selected.service_id = value;
                }
            });
        }

        var autocomplete = new Autocomplete({
            url: "/hosts/search/",
            postdata: { simple: 1 },
            format: "default",
            placeholder: "Enter the hostname",
            appendTo: this.td.toHost,
            required: true,
            callback: function(row) {
                return Utils.create("li")
                    .attr("data-name", row.hostname)
                    .attr("data-value", row.id)
                    .text(row.hostname);
            },
            onClick: function(name, value) {
                self.cache.selected.on_host_id = value;
                self.cache.selected.on_hostname = name;

                if (self.type == "host_to_service" || self.type == "service_to_service") {
                    self.tr.toService.show();
                    if (self.toServiceSearchInput != undefined) {
                        self.toServiceSearchInput.destroy();
                    }
                    self.toServiceSearchInput = self.form.select({
                        selectClass: "select-default rwb",
                        optionClass: "list-default",
                        placeholder: "To service",
                        required: true,
                        options: Bloonix.getServicesForSelection(value),
                        appendTo: self.td.toService,
                        callback: function(value) {
                            self.cache.selected.on_service_id = value;
                            self.showOrHideTableRows(1);
                        }
                    });
                } else {
                    self.showOrHideTableRows(1);
                }
            },
            onKeyUp: function(string) {
                if (string != self.cache.selected.on_hostname) {
                    self.showOrHideTableRows(0);
                    self.tr.toService.hide();
                    self.clearSelectedCache();
                    if (self.type == "host_to_service" || self.type == "service_to_service") {
                        if (self.toServiceSearchInput != undefined) {
                            self.toServiceSearchInput.destroy();
                        }
                    }
                }
            }
        });

        autocomplete.create();

        this.form.checkbox({
            options: [
                { label: "OK", value: "OK" },
                { label: "INFO", value: "INFO" },
                { label: "WARNING", value: "WARNING", checked: true },
                { label: "CRITICAL", value: "CRITICAL", checked: true },
                { label: "UNKNOWN", value: "UNKNOWN", checked: true }
            ],
            name: "status",
            store: { to: this.cache.selected, as: "status" },
            appendTo: this.td.fromStatus
        });

        this.form.checkbox({
            options: [
                { label: "OK", value: "OK" },
                { label: "INFO", value: "INFO" },
                { label: "WARNING", value: "WARNING", checked: true },
                { label: "CRITICAL", value: "CRITICAL", checked: true },
                { label: "UNKNOWN", value: "UNKNOWN", checked: true }
            ],
            name: "on_status",
            store: { to: this.cache.selected, as: "on_status" },
            appendTo: this.td.toStatus
        });

        this.form.radio({
            name: "inherit",
            check: 0,
            bool: true,
            callback: function(value) { self.cache.selected.inherit = value },
            appendTo: this.td.inherit
        });

        this.form.select({
            id: "int-timezone",
            name: "timezone",
            options: Timezones(),
            selected: Bloonix.user.timezone,
            appendTo: this.td.timezone,
            store: { to: this.cache.selected, as: "timezone" }
        });

        this.form.input({
            id: "int-timeslice",
            name: "timeslice",
            value: "Monday - Sunday 00:00 - 23:59",
            bubbleAlignment: "center right",
            bubbleWidth: "650px",
            description: Text.get("schema.timeperiod.examples"),
            appendTo: this.td.timeslice
        });

        Utils.create("div")
            .addClass("btn btn-white btn-default")
            .html(Text.get("action.cancel"))
            .click(function() { Bloonix.route.to("monitoring/hosts/"+ self.host.id +"/dependencies") })
            .appendTo(this.buttonContainer);

        Utils.create("div")
            .addClass("btn btn-white btn-default")
            .html(Text.get("action.create"))
            .appendTo(this.buttonContainer)
            .click(function() { self.createDependency() });
    };

    dependency.createDependency = function() {
        var self = this;
        var data = {
            type: this.cache.selected.type,
            host_id: this.host.id,
            on_host_id: this.cache.selected.on_host_id,
            service_id: this.cache.selected.service_id,
            on_service_id: this.cache.selected.on_service_id,
            status: this.cache.selected.status.join(","),
            on_status: this.cache.selected.on_status.join(","),
            inherit: this.cache.selected.inherit,
            timezone: this.cache.selected.timezone,
            timeslice: $("#int-timeslice").val()
        };
        Ajax.post({
            url: "/hosts/"+ this.host.id +"/dependencies/create",
            data: data,
            success: function(result) {
                Log.debug(result);

                if (result.status == "err-610") {
                    self.form.markErrors(result.data.failed);
                } else {
                    Bloonix.route.to("monitoring/hosts/"+ self.host.id +"/dependencies");
                }
            }
        });
    };

    dependency.init();
    return dependency;
};
Bloonix.listHostEvents = function(o) {
    o.url = "/hosts/"+ o.id +"/events";
    o.host = Bloonix.getHost(o.id);
    o.services = Bloonix.getServicesByHostId(o.id);

    Bloonix.showHostSubNavigation("events", o.id, o.host.hostname);

    o.cache = {
        selected: { }
    };

    o.postdata = {
        offset: 0,
        limit: Bloonix.requestSize
    };

    Bloonix.initEventList(o);
};

Bloonix.initEventList = function(o) {
    Bloonix.setTitle("schema.event.text.list", o.host.hostname);

    var header = Utils.create("div").appendTo("#content"),
        form = new Form({ format: "small" });

    var dataContainer = Utils.create("div")
        .attr("id", "data-container")
        .appendTo("#content");

    var dataOptions = Utils.create("div")
        .attr("id", "data-options")
        .appendTo(dataContainer);

    var dataList = Utils.create("div")
        .attr("id", "data-list")
        .appendTo(dataContainer);

    var dataSelectTime = Utils.create("div")
        .attr("id", "data-select-time")
        .appendTo(dataOptions);

    var dataTimeTypeSelectBox = Utils.create("div")
        .attr("id", "data-select-time-type")
        .appendTo(dataSelectTime);

    var dataRelativeTime = Utils.create("div")
        .attr("id", "data-relative")
        .appendTo(dataSelectTime)

    var dataAbsoluteTime = Utils.create("div")
        .attr("id", "data-absolute")
        .hide()
        .appendTo(dataSelectTime);

    var dataRelativeLink = Utils.create("span")
        .attr("id", "data-relative-box")
        .css({ "font-weight": "bold", cursor: "pointer" })
        .html(Text.get("word.Relative"))
        .hover(
            function(){ $(this).css({ "text-decoration": "underline" }) },
            function(){ $(this).css({ "text-decoration": "none" }) }
        ).appendTo(dataTimeTypeSelectBox);

    $(dataTimeTypeSelectBox).append(" | ");

    var dataAbsoluteLink = Utils.create("span")
        .attr("id", "data-absolute-box")
        .css({ cursor: "pointer" })
        .html(Text.get("word.Absolute"))
        .hover(
            function(){ $(this).css({ "text-decoration": "underline" }) },
            function(){ $(this).css({ "text-decoration": "none" }) }
        ).appendTo(dataTimeTypeSelectBox);

    dataRelativeLink.click(function() {
        dataAbsoluteTime.hide(200);
        dataAbsoluteLink.css({ "font-weight": "normal" });
        dataRelativeTime.show(200);
        dataRelativeLink.css({ "font-weight": "bold" });
        o.cache.selected.type = "relative";
    });

    dataAbsoluteLink.click(function() {
        dataRelativeTime.hide(200);
        dataRelativeLink.css({ "font-weight": "normal" });
        dataAbsoluteTime.show(200);
        dataAbsoluteLink.css({ "font-weight": "bold" });
        o.cache.selected.type = "absolute";
    });

    var searchButton1 = Utils.create("div")
        .addClass("btn btn-white btn-default")
        .html(Text.get("action.search"));
    var searchButton2 = searchButton1.clone();
    searchButton1.click(function() { o.table.getData({ resetOffset: true }) });
    searchButton2.click(function() { o.table.getData({ resetOffset: true }) });

    // The default
    o.cache.selected.type = "relative";

    Bloonix.createIconList({
        items: [
            { name: "30d",  value: "30d",  title: Text.get("text.last_30d"), default: true },
            { name: "60d",  value: "60d",  title: Text.get("text.last_60d") },
            { name: "90d",  value: "90d",  title: Text.get("text.last_90d") },
            { name: "180d", value: "180d", title: Text.get("text.last_180d") }
        ],
        store: { to: o.cache.selected, as: "preset" },
        callback: function() { o.table.getData({ resetOffset: true }) },
        appendTo: dataRelativeTime
    });

    var searchBox = Utils.create("div")
        .attr("id", "data-search-box")
        .appendTo(dataOptions);

    var dateBox = Utils.create("div")
        .attr("id", "date")
        .addClass("date")
        .appendTo(dataAbsoluteTime);

    var dateFrom = Utils.create("input")
        .attr("type", "text")
        .attr("id", "date1-input")
        .attr("placeholder", Text.get("word.From"))
        .attr("value", "")
        .addClass("input input-small")
        .css({ "z-index": 3 })
        .appendTo(dateBox);

    var dateTo = Utils.create("input")
        .attr("type", "text")
        .attr("id", "date2-input")
        .attr("placeholder", Text.get("word.To"))
        .attr("value", "")
        .addClass("input input-small")
        .css({ "z-index": 3 })
        .appendTo(dateBox);

    searchButton1.appendTo(dataAbsoluteTime);

    $.each([ dateFrom, dateTo ], function(i, obj) {
        obj.datetimepicker({
            ampm: false,
            timeFormat: "hh:mm:ss",
            dateFormat: "yy-mm-dd",
            stepMinute: 15
        });
    });

    var statusFilterBox = Bloonix.createIconList({
        items: [
            { name: "OK", value: "OK", title: "OK" },
            { name: "INFO", value: "INFO", title: "INFO" },
            { name: "WARNING", value: "WARNING", title: "WARNING" },
            { name: "CRITICAL", value: "CRITICAL", title: "CRITICAL" },
            { name: "UNKNOWN", value: "UNKNOWN", title: "UNKNOWN" }
        ],
        store: { to: o.cache.selected, as: "status" },
        callback: function() { o.table.getData({ resetOffset: true }) },
        multiple: true,
        format: "default"
    });

    new Menu({
        title: "Filter by status",
        content: statusFilterBox.getContainer(),
        hide: true,
        appendTo: searchBox
    }).create();

    var durationFilterBox = Bloonix.createIconList({
        items: [
            { name: "LT-15",  value: "lt15m", title: Text.get("text.report.availability.LT15") },
            { name: "LT-30",  value: "lt30m", title: Text.get("text.report.availability.LT30") },
            { name: "LT-60",  value: "lt60m", title: Text.get("text.report.availability.LT60") },
            { name: "LT-180", value: "lt3h",  title: Text.get("text.report.availability.LT180") },
            { name: "LT-300", value: "lt5h",  title: Text.get("text.report.availability.LT300") },
            { name: "GE-300", value: "ge5h",  title: Text.get("text.report.availability.GE300") }
        ],
        store: { to: o.cache.selected, as: "duration" },
        callback: function() { o.table.getData({ resetOffset: true }) }
    });

    new Menu({
        title: "Filter by duration",
        content: durationFilterBox.getContainer(),
        hide: true,
        appendTo: searchBox
    }).create();

    var messageBoxOuter = Utils.create("div");

    var form = new Form({ format: "small" });
    form.input({
        id: "event-search-message-input",
        placeholder: Text.get("schema.event.text.filter_message"),
        description: Text.get("info.search_syntax"),
        bubbleAlignment: "center right",
        appendTo: messageBoxOuter
    });

    new Menu({
        title: "Filter messages by query",
        content: [ messageBoxOuter, searchButton2 ],
        hide: true,
        appendTo: searchBox
    }).create();

    var services = [ ];
    $.each(o.services, function(i, service) {
        services.push({
            name: service.service_name,
            value: service.id
        });
    });

    var serviceFilterBox = Bloonix.createIconList({
        items: services,
        store: { to: o.cache.selected, as: "services" },
        callback: function() { o.table.getData({ resetOffset: true }) },
        button: false,
        multiple: true
    });

    new Menu({
        title: "Filter by services",
        content: serviceFilterBox.getContainer(),
        hide: true,
        appendTo: searchBox
    }).create();

    var clearButton = Utils.create("div")
        .addClass("btn btn-white btn-default")
        .html(Text.get("action.clear"))
        .css({ "margin-top": "20px" })
        .click(function() { Bloonix.route.to("monitoring/hosts/"+ o.host.id +"/events") })
        .appendTo(dataOptions);

    var getQueryParams = function(postdata) {
        postdata.query = {
            message: $("#event-search-message-input").val(),
            status: o.cache.selected.status,
            duration: o.cache.selected.duration,
            services: o.cache.selected.services
        };

        if (o.cache.selected.type == "relative") {
            o.postdata.preset = o.cache.selected.preset;
            delete o.postdata.from;
            delete o.postdata.to;
        } else {
            postdata.from = dateFrom.val();
            postdata.to = dateTo.val();
            delete postdata.preset;
        }

        return postdata;
    };

    o.table = new Table({
        url: "/hosts/"+ o.id +"/events",
        appendTo: dataList,
        postdata: o.postdata,
        postdataCallback: getQueryParams,
        searchable: false,
        selectable: false,
        header: {
            title: Text.get("schema.event.text.list", o.host.hostname, true),
            pager: true,
            appendTo: header
        },
        columns: [
            {
                name: "time",
                text: Text.get("schema.event.attr.time")
            },{
                name: "hostname",
                text: Text.get("schema.host.attr.hostname"),
                hide: true
            },{
                name: "service_name",
                text: Text.get("schema.service.attr.service_name")
            },{
                icons: [
                    {
                        check: function(row) {
                            if (row.plugin_id == "58") {
                                return false;
                            }
                            return typeof row.result === "object" ? true : false;
                        },
                        icon: "cicons robot",
                        title: Text.get("schema.service.info.has_result"),
                        onClick: function(row) { Bloonix.showServiceResultData(row.plugin, row.result) }
                    },{
                        check: function(row) { return typeof row.debug === "object" ? true : false },
                        icon: "cicons light-on",
                        title: Text.get("schema.service.info.has_result"),
                        onClick: function(row) { Bloonix.showServiceDebugData(row.debug) }
                    }
                ]
            },{
                name: "last_status",
                text: Text.get("schema.event.attr.last_status"),
                wrapValueClass: true
            },{
                name: "status",
                text: Text.get("schema.event.attr.status"),
                wrapValueClass: true
            },{
                name: "attempts",
                text: Text.get("schema.event.attr.attempts"),
                notNull: "n/a"
            },{
                name: "duration",
                text: Text.get("schema.event.attr.duration"),
                convertToTimeString: true
            },{
                name: "tags",
                text: Text.get("schema.event.attr.tags"),
                empty: "none"
            },{
                name: "message",
                text: Text.get("schema.service.attr.message")
            }
        ]
    }).create();

    Utils.create("div")
        .addClass("clear")
        .appendTo(dataContainer);
};
Bloonix.viewMtrResult = function(o) {
    var object = Utils.extend({
        appendTo: "#content",
        columns: [
            { key: "step",   text: "Step"   },
            { key: "ipaddr", text: "IPaddr" },
            { key: "snt",    text: "Snt",   },
            { key: "loss",   text: "Loss"   },
            { key: "last",   text: "Last"   },
            { key: "avg",    text: "Avg"    },
            { key: "best",   text: "Best"   },
            { key: "wrst",   text: "Wrst"   },
            { key: "stdev",  text: "StDev"  }
        ],
        colors: {
            Loss: [ "#cc0000", "#20c020" ],
            Last: "#2f7ed8",
            Avg: "#67116a",
            Best: "#8bbc21",
            Wrst: "#910000",
            StDev: "#1aadce"
        }
    }, o);

    object.create = function() {
        var self = this;
        this.createStruct();

        if (this.data) {
            this.showMtrData();
            if (this.showChart !== false) {
                setTimeout(function() { self.createMtrChart() }, 200);
            }
        } else {
            this.requestHostData();
        }
    };

    object.createStruct = function() {
        this.mtrTableContainer = Utils.create("div")
            .attr("id", "int-mtr-table")
            .appendTo(this.appendTo);

        if (this.showChart !== false) {
            this.mtrTableContainer.css({
                width: "48%",
                padding: "0 1%",
                float: "left"
            });

            this.mtrChartContainer = Utils.create("div")
                .attr("id", "int-mtr-chart")
                .css({ width: "48%", padding: "0 1%", float: "left" })
                .appendTo(this.appendTo);
        }

        if (this.data) {
            this.createMtrChartContainer();
            this.createMtrTable();
        }

        Utils.create("div")
            .addClass("clear")
            .appendTo(this.appendTo);
    };

    object.requestHostData = function() {
        var self = this;
        this.host = Bloonix.getHost(this.id);
        Bloonix.showHostSubNavigation("mtr", this.id, this.host.hostname);
        Bloonix.setTitle("schema.host.text.mtr_output", this.host.hostname);

        new Header({
            title: Text.get("schema.host.text.mtr_output", this.host.hostname, true),
            appendTo: this.mtrTableContainer,
            rbox: false
        }).create();

        new Header({
            title: Text.get("schema.host.text.mtr_chart"),
            appendTo: this.mtrChartContainer,
            rbox: false
        }).create();

        this.createMtrChartContainer();
        this.createMtrTable();

        Ajax.post({
            url: "/hosts/"+ this.id +"/mtr",
            success: function(result) {
                self.data = result.data.output;
                self.showMtrData();
                self.createMtrChart();
            }
        });
    };

    object.createMtrChartContainer = function() {
        var container = Utils.create("div")
            .attr("id", "int-mtr-chart-content")
            .css({ "padding-top": "20px" })
            .appendTo(this.mtrChartContainer);

        var resizeContainer = function() {
            var height = parseInt(container.width() / 1.5);

            if (height > 400) {
                height = 400;
            }

            container.css({ height: height +"px" });
        };

        resizeContainer();
        $(window).resize(resizeContainer);
    };

    object.createMtrTable = function() {
        var self = this;

        this.table = new Table({
            appendTo: this.mtrTableContainer,
            columns: this.columns
        });

        this.table.init();

        this.loading = Utils.create("div")
            .addClass("loading")
            .appendTo(this.mtrTableContainer);

        $.each(this.columns, function(i, row) {
            var th = Utils.create("th")
                .text(row.text)
                .appendTo(self.table.thRow);

            if (row.key != "step" && row.key != "ipaddr" && row.key != "snt") {
                th.addClass("a-right");
            }
            if (row.key == "snt") {
                th.addClass("center");
            }
        });
    };

    object.showMtrData = function() {
        var self = this;
        this.loading.hide();

        $.each(this.data, function(x, row) {
            var tr = Utils.create("tr");

            $.each(self.columns, function(y, col) {
                var value = row[col.key];

                var span = Utils.create("span")
                    .text(value);

                if (col.key == "loss") {
                    if (value > 60) {
                        span.addClass("c-critical bold");
                    } else if (value > 30) {
                        span.addClass("c-warning bold");
                    } else {
                        span.addClass("c-ok bold");
                    }
                }

                if (col.key != "step" && col.key != "ipaddr" && col.key != "loss" && col.key != "snt") {
                    if (value > 500) {
                        span.addClass("c-critical bold");
                    } else if (value > 200) {
                        span.addClass("c-warning bold");
                    } else {
                        span.addClass("c-ok bold");
                    }
                }

                var td = Utils.create("td")
                    td.html(span)
                    .appendTo(tr);

                if (col.key != "step" && col.key != "ipaddr" && col.key != "snt") {
                    td.addClass("a-right");
                }
                if (col.key == "snt") {
                    td.addClass("center");
                }
            });

            tr.appendTo(self.table.tbody);
        });
    };

    object.createMtrChart = function() {
        var self = this,
            categories = [ ],
            series = [ ],
            seriesByName = { },
            ipaddrByStep = { };

        $.each(this.data, function(x, row) {
            categories.push(row.step);
            ipaddrByStep[row.step] = row.ipaddr;
    
            $.each(self.columns, function(y, col) {
                if (seriesByName[col.text] == undefined) {
                    seriesByName[col.text] = [ ];
                }
    
                seriesByName[col.text].push(
                    parseFloat(row[col.key])
                );
    
                if (col.text == "Loss") {
                    if (seriesByName.noLoss == undefined) {
                        seriesByName.noLoss = [ ];
                    }
                    seriesByName.noLoss.push(
                        100 - parseFloat(row[col.key])
                    );
                }
            });
        });
    
        series.push({
            name: "Loss",
            type: "column",
            color: "rgba(255,0,0,.5)",
            yAxis: 1,
            data: seriesByName.Loss
        });
    
        series.push({
            name: "noLoss",
            type: "column",
            color: "rgba(177,227,177,.6)",
            yAxis: 1,
            data: seriesByName.noLoss
        });
    
        $.each(["Last", "Avg", "Best", "Wrst", "StDev"], function(i, key) {
            series.push({
                name: key,
                type: "line",
                color: self.colors[key],
                data: seriesByName[key]
            });
        });

        Bloonix.createChartForMTR({
            chart: {
                container: "int-mtr-chart-content"
            },
            series: series,
            categories: categories,
            ipaddrByStep: ipaddrByStep
        });
    };

    object.create();
};
Bloonix.viewHostNotifications = function(o) {
    var object = Utils.extend({}, o);

    object.create = function() {
        this.host = Bloonix.getHost(this.id);
        Bloonix.showHostSubNavigation("notifications", this.id, this.host.hostname);

        this.header = new Header({
            title: Bloonix.setTitle("schema.sms_send.text.list", this.host.hostname, true),
            pager: true
        }).create();

        this.boxes = Bloonix.createSideBySideBoxes({
            container: $("#content"),
            width: "300px",
            marginLeft: "310px"
        });

        this.createForm();
        this.getNotifications();
    };

    object.createForm = function() {
        var self = this;

        this.form = new Form({
            format: "medium",
            showButton: false,
            appendTo: this.boxes.left,
            title: Text.get("schema.sms_send.text.search"),
            onSuccess: function() { self.table.getData() }
        }).create();

        var fromTime = this.form.datetime({
            name: "from",
            placeholder: Text.get("word.From"),
            appendTo: this.form.form
        });

        var toTime = this.form.datetime({
            name: "to",
            placeholder: Text.get("word.To"),
            appendTo: this.form.form
        });

        var query = this.form.input({
            name: "query",
            placeholder: Text.get("word.Filter"),
            appendTo: this.form.form
        });

        this.form.button({
            text: Text.get("action.search"),
            appendTo: this.form.form,
            callback: function() { self.table.getData({ resetOffset: true }) }
        });

        this.form.button({
            text: Text.get("action.clear"),
            appendTo: this.form.form,
            callback: function() {
                fromTime.clear();
                toTime.clear();
                query.clear();
                self.table.getData({ resetOffset: true });
            }
        });
    };

    object.getNotifications = function() {
        var self = this;

        this.table = new Table({
            url: "/hosts/"+ this.id +"/sms-notifications",
            bindForm: this.form,
            appendTo: this.boxes.right,
            headerObject: this.header,
            columns: [
                {
                    name: "time",
                    text: Text.get("schema.sms_send.attr.time"),
                    convertFromUnixTime: true
                },{
                    name: "send_to",
                    text: Text.get("schema.sms_send.attr.send_to")
                },{
                    name: "message",
                    text: Text.get("schema.sms_send.attr.message")
                }
            ]
        }).create();

        /*
        this.table.onFormError = function(failed) {
            self.form.markErrors(failed);
        };

        this.table.postdata = function() {
            var data = self.form.getData();
            data.offset = 0;
            data.limit = Bloonix.requestSize;
            return data;
        };

        this.table.create();
        */
    };

    object.create();
};
Bloonix.viewHostReport = function(o) {
    o.host = Bloonix.getHost(o.id);
    Bloonix.setTitle("schema.host.text.report_title", o.host.hostname);
    Bloonix.showHostSubNavigation("reports", o.id, o.host.hostname);

    o.intServiceList = Utils.create("div")
        .attr("id", "int-service-list")
        .appendTo("#content");

    o.intDetailedServiceReport = Utils.create("div")
        .attr("id", "int-detailed-service-report")
        .css({ width: "1200px" })
        .hide()
        .appendTo("#content");

    o.loading = Utils.create("div")
        .addClass("loading")
        .appendTo("#content");

    Bloonix.getHostReportData(o);
};

Bloonix.getHostReportData = function(o, from, to) {
    o.intServiceList.html("");
    o.loading.show();

    Ajax.post({
        url: "/hosts/"+ o.host.id +"/report",
        data: { from: from, to: to },
        success: function(result) {
            o.loading.hide();
            o.from = result.data.from;
            o.to = result.data.to;
            Bloonix.generateHostReportView(o, result.data);
        }
    });
};

Bloonix.generateHostReportView = function(o, data) {
    $("#int-service-list").html("");

    var header = new Header({
        appendTo: "#int-service-list",
        title: Text.get("text.report.title.host_from_to", [ o.host.hostname, o.from, o.to ], true),
        notice: Text.get("text.report.availability.detailed_report_onclick")
    }).create();

    var form = Utils.create("form")
        .appendTo(header.rbox);

    var formInputFrom = Utils.create("input")
        .attr("placeholder", Text.get("word.From"))
        .attr("id", "report-from")
        .attr("type", "text")
        .attr("name", "from")
        .attr("value", o.from)
        .attr("title", Text.get("word.From"))
        .tooltip()
        .addClass("input input-tiny")
        .css({ "margin-right": "10px" })
        .appendTo(form)
        .datepicker({
            dateFormat: 'yy-mm',
            changeMonth: true,
            changeYear: true,
            showButtonPanel: true,
            onClose: function(dateText, inst) {
                var month = $("#ui-datepicker-div .ui-datepicker-month :selected").val();
                var year = $("#ui-datepicker-div .ui-datepicker-year :selected").val();
                $(this).val($.datepicker.formatDate('yy-mm', new Date(year, month, 1)));
            }
        });
    
    formInputFrom.focus(function () {
        $(".ui-datepicker-calendar").hide();
        $("#ui-datepicker-div").position({
            my: "center top",
            at: "center bottom",
            of: $(this)
        });
    });

    var formInputTo = Utils.create("input")
        .attr("placeholder", Text.get("word.To"))
        .attr("id", "report-to")
        .attr("type", "text")
        .attr("name", "to")
        .attr("value", o.to)
        .attr("title", Text.get("word.To"))
        .tooltip()
        .addClass("input input-tiny")
        .css({ "margin-right": "10px" })
        .appendTo(form)
        .datepicker({
            dateFormat: 'yy-mm',
            changeMonth: true,
            changeYear: true,
            showButtonPanel: true,
            onClose: function(dateText, inst) {
                var month = $("#ui-datepicker-div .ui-datepicker-month :selected").val();
                var year = $("#ui-datepicker-div .ui-datepicker-year :selected").val();
                $(this).val($.datepicker.formatDate('yy-mm', new Date(year, month, 1)));
            }
        });

    formInputTo.focus(function () {
        $(".ui-datepicker-calendar").hide();
        $("#ui-datepicker-div").position({
            my: "center top",
            at: "center bottom",
            of: $(this)
        });
    });

    var thisYear = new Date().getFullYear();
    var lastYear = thisYear - 1;

    Utils.create("div")
        .addClass("btn btn-small btn-white btn-icon-even")
        .html(Text.get("action.search"))
        .appendTo(form)
        .click(function() { Bloonix.getHostReportData(o, formInputFrom.val(), formInputTo.val()) });

    Utils.create("div")
        .addClass("btn btn-small btn-white btn-icon-even")
        .html(Text.get("info.this-year"))
        .appendTo(form)
        .click(function() { Bloonix.getHostReportData(o, thisYear, thisYear) });

    Utils.create("div")
        .addClass("btn btn-small btn-white btn-icon-even")
        .html(Text.get("info.last-year"))
        .appendTo(form)
        .click(function() { Bloonix.getHostReportData(o, lastYear, lastYear) });

    var table = new Table({ appendTo: "#int-service-list" });
    table.init();

    var headerColumns = [
        "Service", "Availability",
        "AV-O", "AV-I", "AV-W", "AV-C", "AV-U",
        "Events", "EV-O", "EV-I", "EV-W", "EV-C", "EV-U",
        "EV-LT15", "EV-LT30", "EV-LT60", "EV-LT180", "EV-LT300", "EV-GE300"
    ];

    $.each(headerColumns, function(i, column) {
        var th = table.addHeadColumn(column)
            .attr("title", Text.get("text.report.availability."+ column))
            .tooltip();

        if (column != "Service" && column != "Availability") {
            th.css({ "text-align": "right" });
        }
    });

    $.each(data.services, function(i, service) {
        var row = Utils.create("tr")
            .appendTo(table.tbody);

        var col = Utils.create("td")
            .appendTo(row);

        Utils.create("a")
            .text(service.service_name)
            .appendTo(col)
            .click(function() { Bloonix.showDetailedServiceReport(o, service) } );

        var graphColumn = Utils.create("td")
            .appendTo(row);

        var availability = Utils.create("span")
            .text(service.availability.total +"%")
            .appendTo(graphColumn);

        availability.css({
            width: "60px", 
            display: "inline-block",
            "text-align": "right",
            "font-weight": "bold" 
        });

        if (service.availability.total < 99.5) {
            availability.addClass("av-crit");
        } else if (service.availability.total < 99.9) {
            availability.addClass("av-warn");
        }

        Utils.create("div")
            .attr("id", "int-service-"+ service.id)
            .css({ width: "130px", height: "16px", display: "inline-block" })
            .appendTo(graphColumn);

        Bloonix.createReportBarChart("int-service-"+ service.id, {
            label: [ "OK", "INFO", "WARNING", "CRITICAL", "UNKNOWN" ],
            color: [ "#22ff22", "#7aacdb", "#ffff00", "#ff2222", "#ffaa22" ],
            values: [{
                label: "Availability",
                values: [
                    service.availability.OK,
                    service.availability.INFO,
                    service.availability.WARNING,
                    service.availability.CRITICAL,
                    service.availability.UNKNOWN
                ]
            }]
        });

        $.each([ "OK", "INFO", "WARNING", "CRITICAL", "UNKNOWN" ], function(i, stat) {
            Utils.create("td")
                .text(service.availability[stat] +"%")
                .css({ "text-align": "right" })
                .addClass("status-text-"+ stat)
                .appendTo(row);
        });

        $.each([ "total", "OK", "INFO", "WARNING", "CRITICAL", "UNKNOWN" ], function(i, stat) {
            Utils.create("td")
                .css({ "text-align": "right" })
                .text(service.number_of_events[stat])
                .addClass("status-text-"+ stat)
                .appendTo(row);
        });

        $.each([ "lt15", "lt30", "lt60", "lt180", "lt300", "ge300" ], function(i, stat) {
            var col = Utils.create("td")
                .css({ "text-align": "right", position: "relative" })
                .text(service.number_of_events[stat].total)
                .appendTo(row);

            var div = Utils.create("div")
                .css({ position: "absolute", "z-index": "5", width: "130px" })
                .addClass("info-help")
                .hide()
                .appendTo(col);

            col.hover(
                function() { div.fadeIn(200) },
                function() { div.hide() }
            );

            $.each([ "OK", "WARNING", "CRITICAL", "UNKNOWN", "INFO" ], function(x, key) {
                Utils.create("div")
                    .css({ float: "left", width: "80px", margin: "2px 0" })
                    .text(key)
                    .appendTo(div);

                Utils.create("div")
                    .css({ float: "left", width: "50px", margin: "2px 0" })
                    .text(service.number_of_events[stat][key])
                    .appendTo(div);
            });

            Utils.create("clear")
                .appendTo(div);
        });
    });

    if (data.no_data) {
        var noDataAvailableBox = Utils.create("div")
            .addClass("info-err")
            .appendTo("#int-service-list");

        Utils.create("h4")
            .html(Text.get("text.report.title.no_data"))
            .appendTo(noDataAvailableBox);

        $.each(data.no_data, function(i, service) {
            Utils.create("p")
                .text(service.service_name)
                .appendTo(noDataAvailableBox);
        });
    }
};

Bloonix.showDetailedServiceReport = function(o, service) {
    $("#int-service-list").hide();
    $("#int-detailed-service-report").show();

    new Header({
        appendTo: "#int-detailed-service-report",
        title: Text.get("text.report.title.host_from_to", [ o.host.hostname, o.from, o.to ], true),
        icons: [ { type: "go-back", callback: Bloonix.showReportServiceList } ]
    }).create();

    Bloonix.createReportServiceBox(o, service);
};

Bloonix.showReportServiceList = function() {
    $("#int-service-list").show(600);
    $("#int-detailed-service-report").hide();
    $("#int-detailed-service-report").html("");
    Bloonix.destroyChartObjects();
};

Bloonix.createReportServiceBox = function(o, service) {
    var reportBox = Utils.create("div")
        .appendTo("#int-detailed-service-report");

    var title = Utils.create("h3")
        .addClass("h3")
        .html(Text.get("text.report.service_has_a_availabilty_of", Utils.escape(service.service_name), true))
        .appendTo(reportBox);

    var avTitle = Utils.create("span")
        .addClass("cit")
        .text(" "+ service.availability.total +"%")
        .appendTo(title);

    if (service.availability.total < 99.5) {
        avTitle.addClass("av-crit");
    } else if (service.availability.total < 99.9) {
        avTitle.addClass("av-warn");
    }

    Bloonix.createServiceAvailabilityPercentBox(service, reportBox);
    Bloonix.createServiceTotalDurationOfEventsBox(service, reportBox);
    Bloonix.createServiceNumerOfEventsBox(service, reportBox);
    Bloonix.createServiceNumberOfEventsByDurationBox(service, reportBox);
    Bloonix.createServiceNumberOfEventsByTags(service, reportBox);
    Bloonix.createServiceDurationOfEventsByHourBox(service, reportBox);
    //Bloonix.createServiceAvailabilityDonut(service, reportBox);
};

Bloonix.createServiceAvailabilityPercentBox = function(service, container) {
    var box = Utils.create("div")
        .addClass("av-service-2c-box")
        .appendTo(container);

    var tableBox = Utils.create("div")
        .addClass("av-service-2c-table-box")
        .appendTo(box);

    var graphBox = Utils.create("div")
        .attr("id", "int-service-availability-percent-box")
        .addClass("av-service-2c-graph-box")
        .appendTo(box);

    Bloonix.pieChart({
        chart: {
            title: null,
            container: "int-service-availability-percent-box"
        },
        legend: false,
        colors: Bloonix.areaStatusColors,
        data: [
            { name: "OK",       y: parseFloat(service.availability.OK)       },
            { name: "INFO",     y: parseFloat(service.availability.INFO)     },
            { name: "WARNING",  y: parseFloat(service.availability.WARNING)  },
            { name: "CRITICAL", y: parseFloat(service.availability.CRITICAL) },
            { name: "UNKNOWN",  y: parseFloat(service.availability.UNKNOWN)  }
        ],
    });

    Utils.create("h3")
        .addClass("h3")
        .html(Text.get("text.report.title.total_availability"))
        .appendTo(tableBox);

    var table = Utils.create("table")
        .addClass("av-table")
        .appendTo(tableBox);

    $.each([ "total", "OK", "INFO", "WARNING", "CRITICAL", "UNKNOWN" ], function(i, stat) {
        var row = Utils.create("tr")
            .appendTo(table);

        Utils.create("th")
            .text(stat)
            .appendTo(row);

        Utils.create("td")
            .addClass("status-text-"+ stat)
            .text(service.availability[stat] +"%")
            .appendTo(row);
    });

    Utils.create("div")
        .addClass("clear")
        .appendTo(box);

    return box;
};

Bloonix.createServiceTotalDurationOfEventsBox = function(service, container) {
    var box = Utils.create("div")
        .addClass("av-service-box")
        .appendTo(container);

    Utils.create("h3")
        .addClass("h3")
        .html(Text.get("text.report.title.total_status_duration"))
        .appendTo(box);

    var table = Utils.create("table")
        .addClass("av-table")
        .appendTo(box);

    var thRow = Utils.create("tr").appendTo(table);
    Utils.create("td").html("").appendTo(thRow);
    Utils.create("td").html(Text.get("word.Days")).appendTo(thRow);
    Utils.create("td").html(Text.get("word.Hours")).appendTo(thRow);
    Utils.create("td").html(Text.get("word.Minutes")).appendTo(thRow);
    Utils.create("td").html(Text.get("word.Seconds")).appendTo(thRow);

    $.each([ "OK", "INFO", "WARNING", "CRITICAL", "UNKNOWN" ], function(i, stat) {
        var row = Utils.create("tr")
            .appendTo(table);

        Utils.create("th")
            .text(stat)
            .appendTo(row);

        $.each(Utils.secondsToStringList(service.duration_of_events[stat]), function(i, time) {
            Utils.create("td")
                .addClass("status-text-"+ stat)
                .text(time)
                .appendTo(row);
        })
    });

    return box;
};

Bloonix.createServiceNumerOfEventsBox = function(service, container) {
    var box = Utils.create("div")
        .addClass("av-service-2c-box")
        .appendTo(container);

    var tableBox = Utils.create("div")
        .addClass("av-service-2c-table-box")
        .appendTo(box);

    var graphBox = Utils.create("div")
        .attr("id", "int-service-number-of-events-box")
        .addClass("av-service-2c-graph-box")  
        .appendTo(box);

    Bloonix.pieChart({
        chart: {
            title: null,
            container: "int-service-number-of-events-box"
        },
        legend: false,
        colors: Bloonix.areaStatusColors,
        data: [
            { name: "OK",       y: parseFloat(service.number_of_events.OK)       },
            { name: "INFO",     y: parseFloat(service.number_of_events.INFO)     },
            { name: "WARNING",  y: parseFloat(service.number_of_events.WARNING)  },
            { name: "CRITICAL", y: parseFloat(service.number_of_events.CRITICAL) },
            { name: "UNKNOWN",  y: parseFloat(service.number_of_events.UNKNOWN)  }
        ],
    });

    Utils.create("h3")
        .addClass("h3")
        .html(Text.get("text.report.title.number_of_events"))
        .appendTo(tableBox);

    var table = Utils.create("table")
        .addClass("av-table")
        .appendTo(tableBox);

    $.each([ "total", "OK", "INFO", "WARNING", "CRITICAL", "UNKNOWN" ], function(i, stat) {
        var row = Utils.create("tr")
            .appendTo(table);

        Utils.create("th")
            .text(stat)
            .appendTo(row);

        Utils.create("td")
            .addClass("status-text-"+ stat)
            .text(service.number_of_events[stat])
            .appendTo(row);
    });

    return box;
};

Bloonix.createServiceNumberOfEventsByDurationBox = function(service, container) {
    var box = Utils.create("div")
        .addClass("av-service-box")
        .appendTo(container);

    Utils.create("h3")
        .addClass("h3")
        .html(Text.get("text.report.title.number_of_events_by_duration"))
        .appendTo(box);

    var table = Utils.create("table")
        .addClass("av-table")
        .appendTo(box);

    $.each([ "lt15", "lt30", "lt60", "lt180", "lt300", "ge300" ], function(i, key) {
        var row = Utils.create("tr")
            .appendTo(table);

        Utils.create("th")
            .html(Text.get("text.report.availability."+ key))
            .appendTo(row);

        $.each([ "OK", "INFO", "WARNING", "CRITICAL", "UNKNOWN" ], function(i, stat) {
            Utils.create("td")
                .addClass("status-text-"+ stat)
                .text(service.number_of_events[key][stat])
                .appendTo(row);
        });
    });

    return box;
};

Bloonix.createServiceNumberOfEventsByTags = function(service, container) {
    var box = Utils.create("div")
        .addClass("av-service-box")
        .appendTo(container);

    Utils.create("h3")
        .addClass("h3")
        .html(Text.get("text.report.title.number_of_events_by_tags"))
        .appendTo(box);

    var table = Utils.create("table")
        .addClass("av-table")
        .appendTo(box);

    $.each([ "flapping", "volatile", "timeout", "agent_dead", "security", "fatal" ], function(i, key) {
        var row = Utils.create("tr")
            .appendTo(table);

        Utils.create("th")
            .html(Text.get("text.report.availability."+ key))
            .appendTo(row);

        var col = Utils.create("td")
            .text(service.number_of_events[key])
            .appendTo(row);

        if (service.number_of_events[key] != "0") {
            col.css({ "font-weight": "bold" })
        }
    });

    return box;
};

Bloonix.createServiceDurationOfEventsByHourBox = function(service, container) {
    var box = Utils.create("div")
        .addClass("av-service-status-duration-box")
        .appendTo(container);

    Utils.create("h3")
        .addClass("h3")
        .html(Text.get("text.report.title.status_duration_by_hour"))
        .appendTo(box);

    var table = Utils.create("table")
        .addClass("av-table")
        .appendTo(box);

    var timeString = [ "d", "h", "m", "s" ];

    $.each([
        "h00", "h01", "h02", "h03", "h04", "h05", "h06", "h07", "h08", "h09", "h10", "h11",
        "h12", "h13", "h14", "h15", "h16", "h17", "h18", "h19", "h20", "h21", "h22", "h23"
    ], function(x, key) {
        var row = Utils.create("tr")
            .appendTo(table);
    
        Utils.create("th")
            .html(Text.get("text.report.availability."+ key))
            .appendTo(row);

        $.each([ "OK", "INFO", "WARNING", "CRITICAL", "UNKNOWN" ], function(y, stat) {
            $.each(Utils.secondsToStringList(service.duration_of_events[key][stat]), function(i, string) {
                var col = Utils.create("td")
                    .text(string + timeString[i])
                    .addClass("status-text-"+ stat)
                    .appendTo(row);

                if (string == "0") {
                    col.css({ "font-weight": "normal", opacity: .3 });
                }
            });
        });
    });

    return box;
};

Bloonix.createServiceAvailabilityDonut = function(service, container) {
    var box = Utils.create("div")
        .attr("id", "int-donut-"+ service.id)
        .addClass("av-service-graph-box")
        .appendTo(container);

    Bloonix.createReportDonutChart({
        container: "int-donut-"+ service.id,
        data: {
            total: service.availability.total,
            OK: service.availability.OK,
            INFO: service.availability.INFO,
            WARNING: service.availability.WARNING,
            CRITICAL: service.availability.CRITICAL,
            UNKNOWN: service.availability.UNKNOWN
        }
    });

    return box;
};

Bloonix.createReportBarChart = function(container, data) {
    var barChart = new $jit.BarChart({
        injectInto: container,
        animate: true,
        orientation: "horizontal",
        barsOffset: 0,
        Margin: {
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
        },
        labelOffset: 0,
        type: "stacked:gradient",
        showAggregates: false,
        showLabels: false,
        Label: {
            type: "Native",
            size: 12,
            family: "Arial",
            color: "#222222"
        },
        Tips: {
            enable: true,
            onShow: function(tip, elem) {
                tip.innerHTML = "<b>" + elem.name + "</b>: " + elem.value;
            }
        }
    });
    barChart.loadJSON(data);
};

Bloonix.createReportDonutChart = function(o) {
    var chartOpts = {
        chart: {
            renderTo: o.container,
            type: "pie",
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false
        },
        title: {
            text: null
        },
        subTitle: {
            text: null
        },
        plotOptions: {
            pie: {
                shadow: false
            }
        },
        tooltip: {
            formatter: function() {
                return "<b>"+ this.point.name +"</b>: "+ this.y +" %";
            }
        },
        colors: Bloonix.areaStatusColors,
        series: [{
            name: "Browsers",
            data: [
                [ "OK", parseFloat(o.data.OK) ],
                [ "INFO", parseFloat(o.data.INFO) ],
                [ "WARNING", parseFloat(o.data.WARNING) ],
                [ "CRITICAL", parseFloat(o.data.CRITICAL) ],
                [ "UNKNOWN", parseFloat(o.data.UNKNOWN) ]
            ],
            size: "100%",
            innerSize: "65%",
            dataLabels: {
                enabled: false
            }
        }]
    };

    var chartFunction = function(chart) {
        var xpos = "50%";
        var ypos = "50%";
        var circleradius = 40;

        chart.renderer.circle(xpos, ypos, circleradius).attr({
            fill: "#ffffff",
        }).add();

        var y = 103,
            x = o.data.total < 10
                ? 74
                : o.data.total < 100
                    ? 70
                    : 64;

        chart.renderer.text(o.data.total +"%", x, y).css({
            width: circleradius * 2,
            color: "#444444",
            fontSize: "19px",
            fontWeight: "bold",
            textAlign: "center"
        }).attr({
            zIndex: 0
        }).add();
    }

    Bloonix.createOrReplaceChart({
        container: o.container,
        chartOpts: chartOpts,
        chartFunction: chartFunction,
        type: "Chart"
    });
};
Bloonix.createService = function(o) {
    var object = Utils.extend({
        orderBy: "plugin",
        filter: false,
        filterByCategory: {}
    }, o);

    // If object.template is defined then a service
    // template is created or updated.
    if (object.template === true) {
        object.template = Bloonix.getTemplateById(object.id);
    } else {
        object.host = Bloonix.getHost(object.id);

        Bloonix.showHostSubNavigation(
            "host",
            object.host.id,
            object.host.hostname
        );
    }

    object.create = function() {
        object.createHeader();
        object.createBoxes();
        object.getPlugins();
        object.createForm();
        object.listPlugins();
    };

    object.createHeader = function() {
        new Header({
            title: Text.get("schema.service.text.choose_plugin")
        }).create();
    };

    object.createBoxes = function() {
        this.boxes = Bloonix.createSideBySideBoxes({
            container: "#content",
            width: "300px",
            marginLeft: "310px"
        });
    };

    object.updateOrder = function(by) {
        this.orderBy = by;
        this.listPlugins();
    };

    object.filterCategories = function(categories) {
        var self = this;

        if (categories.length) {
            this.filter = true;
        } else {
            this.filter = false;
        }

        this.filterByCategory = categories;
        this.listPlugins();
    };

    object.createForm = function() {
        var self = this;

        Utils.create("h2")
            .addClass("h2")
            .html(Text.get("text.sort_by_dots"))
            .appendTo(this.boxes.left);

        var orderIconList = Utils.create("div")
            .css({ "margin-left": "20px" })
            .appendTo(this.boxes.left);

        Bloonix.createIconList({
            format: "large",
            items: [
                { name: "• plugin name", value: "plugin", default: true },
                { name: "• check name", value: "command" }
            ],
            callback: function(value) { self.updateOrder(value) },
            appendTo: orderIconList,
            button: false
        });

        Utils.create("h2")
            .addClass("h2")
            .html(Text.get("text.filter_by_category_dots"))
            .appendTo(this.boxes.left);

        var categoryIconList = Utils.create("div")
            .css({ "margin-left": "20px" })
            .appendTo(this.boxes.left);

        var categoryList = [];
        $.each(this.categories.sort(), function(i, category) {
            categoryList.push({
                name: "• "+ category,
                value: category
            });
        });

        Bloonix.createIconList({
            format: "large",
            items: categoryList,
            callback: function(value) { self.filterCategories(value) },
            appendTo: categoryIconList,
            button: false,
            multiple: true
        });

        this.form = new Form({ format: "medium" });
    };

    object.getPlugins = function() {
        var self = this;

        this.plugins = Bloonix.get("/plugins", { limit: 1000 });
        this.categories = [];
        this.pluginsByCategory = {};
        this.order = {
            plugin: { keys: [], objects: {} },
            command: { keys: [], objects: {} }
        };

        $.each(this.plugins, function(i, plugin) {
            //if (plugin.command == "check-by-condition") {
            //    return true;
            //}
            $.each(plugin.category.split(","), function(i, category) {
                category = category.replace(/^\s+/, '').replace(/\s+$/, '');

                if (!plugin.hasCategory) {
                    plugin.hasCategory = {};
                }

                if (!self.pluginsByCategory[category]) {
                    self.pluginsByCategory[category] = [];
                    self.categories.push(category);
                }

                self.pluginsByCategory[category].push(plugin);
                plugin.hasCategory[category] = 1;
            });

            self.order.plugin.objects[plugin.plugin] = plugin;
            self.order.plugin.keys.push(plugin.plugin);
            self.order.command.objects[plugin.command] = plugin;
            self.order.command.keys.push(plugin.command);
        });

        Utils.create("div").addClass("clear").appendTo(this.boxes.right);
    };

    object.listPlugins = function() {
        var self = this;

        $(this.boxes.right).html("");

        var table = new Table({
            appendTo: this.boxes.right
        }).init();

        $.each([ "plugin", "categories", "command", "description" ], function(i, key) {
            table.addHeadColumn(
                Text.get("schema.plugin.attr."+ key)
            );
        });

        $.each(this.order[this.orderBy].keys.sort(), function(x, key) {
            var plugin = self.order[self.orderBy].objects[key];

            if (self.filter == true) {
                var show = false;

                $.each(self.filterByCategory, function(y, category) {
                    if (plugin.hasCategory[category] == 1) {
                        show = true;
                        return false;
                    }
                });

                if (show == false) {
                    return true;
                }
            }

            var boxClickEvent = function() {
                Bloonix.createServiceByCommand({
                    id: self.id,
                    host: self.host,
                    plugin: plugin,
                    template: self.template
                });
            };

            var tr = table.createRow();
            table.createColumn(tr, plugin, {
                name: "plugin",
                aTag: true,
                onClick: boxClickEvent
            });
            table.createColumn(tr, plugin, { name: "category" });
            table.createColumn(tr, plugin, { name: "command" });
            table.createColumn(tr, plugin, { name: "description" });
        });
    };

    object.create();
};

Bloonix.createServiceByCommand = function(o) {
    $("#content").html("");
    $("#content-outer").scrollTop(0);

    var serviceUrl, submitUrl, onSuccess;

    if (o.template) {
        serviceUrl = "/templates/hosts/"+ o.id +"/services/options/"+ o.plugin.id;
        submitUrl = "/templates/hosts/"+ o.id +"/services/create";
    } else {
        serviceUrl = "/hosts/"+ o.id +"/services/options/"+ o.plugin.id;
        submitUrl = "/hosts/"+ o.id +"/services/create";
    }

    var service = Bloonix.get(serviceUrl);

    Bloonix.createServiceForm({
        url: { submit: submitUrl },
        host: o.host,
        template: o.template,
        values: service.values,
        options: service.options,
        plugin: o.plugin,
        action: "create"
    });
};

Bloonix.editService = function(o) {
    var self = this,
        host, template,
        serviceUrl, submitUrl;

    if (o.template) {
        template = Bloonix.getTemplateById(o.id);
        serviceUrl = "/templates/hosts/"+ o.id +"/services/"+ o.refId +"/options/";
        submitUrl = "/templates/hosts/"+ o.id +"/services/"+ o.refId +"/update";
    } else {
        host = Bloonix.getHost(o.id);
        serviceUrl = "/hosts/"+ o.id +"/services/"+ o.service_id +"/options/";
        submitUrl = "/hosts/"+ o.id +"/services/"+ o.service_id +"/update";

        Bloonix.showHostSubNavigation(
            "host",
            host.id,
            host.hostname
        );
    }

    var service = Bloonix.get(serviceUrl),
        plugin = Bloonix.get("/plugins/"+ service.values.plugin_id);

    Bloonix.createServiceForm({
        url: { submit: submitUrl },
        host: host,
        template: template,
        values: service.values,
        options: service.options,
        plugin: plugin,
        action: "update"
    });
};

Bloonix.cloneService = function(o) {
    var toHost = Bloonix.getHost(o.clone_to),
        service = Bloonix.get("/hosts/"+ o.id +"/services/"+ o.service_id +"/options"),
        plugin = Bloonix.get("/plugins/"+ service.values.plugin_id),
        submitUrl = "/hosts/"+ o.clone_to +"/services/create"

    Bloonix.showHostSubNavigation(
        "host",
        toHost.id,
        toHost.hostname
    );

    Bloonix.createServiceForm({
        url: { submit: submitUrl },
        host: toHost,
        values: service.values,
        options: service.options,
        plugin: plugin,
        action: "clone"
    });
};

Bloonix.createServiceForm = function(o) {
    var object = Utils.extend({}, o);

    object.create = function() {
        this.preparePluginOptions();
        this.getLocations();
        this.initForm();
        this.createBaseSettingsElements();
        this.createWebTransactionWorkflow();
        this.createCommandFormElements();
        this.createNotificationFormElements();
        this.createSubmitButton();
    };

    object.preparePluginOptions = function() {
        var self = this;
        this.pluginOptionsByOption = {};
        this.commandOptionsByOption = {};
        this.thresholdElements = [];
        if (this.plugin && this.plugin.info) {
            $.each(this.plugin.info.options, function(i, opt) {
                self.pluginOptionsByOption[opt.option] = opt;
            });
        }
        if (this.action == "update" || this.action == "clone") {
            $.each(this.values.command_options, function(i, e) {
                // nagios-command is deprecated
                if (e.option == "nagios-command" && self.pluginOptionsByOption["simple-command"]) {
                    e.option = "simple-command";
                }
                if (self.pluginOptionsByOption[e.option].multiple) {
                    if (!self.commandOptionsByOption[e.option]) {
                        self.commandOptionsByOption[e.option] = [];
                    }
                    self.commandOptionsByOption[e.option].push(e.value);
                } else {
                    self.commandOptionsByOption[e.option] = e.value;
                }
            });
        }
    };

    object.getLocations = function() {
        var self = this;
        this.locations = Bloonix.get("/locations");
        this.hasLocations = this.locations.length > 0 ? true : false;
        this.locationsById = {};
        $.each(this.locations, function(i, item) {
            self.locationsById[item.id] = item;
            if (item.is_default == "1") {
                self.defaultLocation = item;
            }
        });
    };

    object.initForm = function() {
        var self = this,
            header, onSuccess,
            submitUrl;

        if (this.action == "create" || this.action == "clone") {
            submitUrl = this.template
                ? "/templates/hosts/"+ this.template.id +"/services/create"
                : "/hosts/"+ this.host.id +"/services/create";

            onSuccess = function(result) {
                if (self.template) {
                    Bloonix.route.to("monitoring/templates/"+ result.host_template_id +"/services/"+ result.ref_id +"/edit");
                } else {
                    Bloonix.route.to("monitoring/hosts/"+ result.host_id);
                }
            };

            header = new Header({
                title: Text.get("schema.service.text.create"),
                border: true,
                icons: [
                    {
                        type: "help",
                        callback: function() { Utils.open("/#help/service-parameter") }, 
                        title: Text.get("site.help.doc.service-parameter")
                    },{
                        type: "go-back",
                        callback: function() {
                            if (self.template) {
                                Bloonix.route.to("monitoring/templates/"+ self.template.id +"/services/create");
                            } else {
                                Bloonix.route.to("monitoring/hosts/"+ self.host.id +"/services/create");
                            }
                        },
                        title: Text.get("info.go-back")
                    }
                ]
            });
        } else {
            submitUrl = this.template
                ? "/templates/hosts/"+ this.template.id +"/services/"+ this.values.ref_id +"/update"
                : "/hosts/"+ this.host.id +"/services/"+ this.values.id +"/update";

            header = new Header({
                title: Text.get("schema.service.text.settings", self.values.service_name, true),
                subtitle: self.template
                    ? Text.get("schema.service.attr.ref_id") +": "+ self.values.ref_id
                    : Text.get("schema.service.attr.id") +": "+ self.values.id,
                border: true,
                icons: [
                    {
                        type: "help",
                        callback: function() { Utils.open("/#help/service-parameter") },              
                        title: Text.get("site.help.doc.service-parameter")
                    },{
                        type: "go-back",
                        callback: function() {
                            if (self.template) {
                                Bloonix.route.to("monitoring/templates/"+ self.template.id +"/services");
                            } else {
                                Bloonix.route.to("monitoring/hosts/"+ self.host.id);
                            }
                        },
                        title: Text.get("info.go-back")
                    }
                ]
            });
        }

        header.create();

        this.form = new Form({
            url: { submit: submitUrl },
            onSuccess: onSuccess,
            format: "default",
            appendTo: "#content",
            splice: [ "command_options", "agent_options" ],
            formClass: "service-form",
            postpareDataCallback: function(data) {
                self.addThresholdValues(data);
                if (self.plugin.id == "58" && self.wtrm) {
                    self.addWebTransactionSteps(data);
                }
            }
        });

        this.form.init();
        this.form.msgbox({ appendTo: this.form.form });

        Utils.create("input")
            .attr("type", "hidden")
            .attr("name", "plugin_id")
            .attr("value", this.plugin.id)
            .appendTo(this.form.form);
    };

    object.addThresholdValues = function(data) {
        $.each(this.thresholdElements, function(i, e) {
            if (e.destroyed == true) {
                return true;
            }

            var name = "command_options:"+ e.name;

            if (!data[name]) {
                data[name] = [];
            }

            var key = e.selectKey.getSelectedValue(),
                op = e.selectOperator.getSelectedValue(),
                value = e.thresholdInput.getValue();

            if (key != undefined && op != undefined && value != undefined) {
                if (key.length && op.length && value.length) {
                    data[name].push(key +":"+ op +":"+ value);
                }
            }
        });
    };

    object.addWebTransactionSteps = function(data) {
        var steps = this.wtrm.validateSteps();

        if (steps) {
            data["command_options:workflow"] = steps;
        }
    };

    object.createSettingsBox = function(title) {
        var objects = {};

        if (title) {
            objects.header = new Header({
                title: title,
                border: true,
                appendTo: this.form.form
            }).create();
        }

        objects.outer = Utils.create("div")
            .addClass("service-form-outer-box")
            .appendTo(this.form.form);

        objects.topBox = Utils.create("div")
            .addClass("service-form-top-box")
            .appendTo(objects.outer);

        objects.leftBox = Utils.create("div")
            .addClass("service-form-left-box")
            .appendTo(objects.outer);

        objects.rightBox = Utils.create("div")
            .addClass("service-form-right-box")
            .appendTo(objects.outer);

        Utils.create("div")
            .addClass("clear")
            .appendTo(objects.outer);

        objects.bottomBox = Utils.create("div")
            .addClass("service-form-bottom-box")
            .appendTo(objects.outer);

        objects.table = new Table({
            type: "form",
            appendTo: objects.leftBox
        }).init();

        return objects;
    };

    object.createOption = function(opt) {
        var desc = Utils.create("div"),
            element = "input",
            values = this.commandOptionsByOption,
            value, simple;

        if (this.action == "create") {
            value = opt.default;
        } else if (values[opt.option] != undefined) {
            value = values[opt.option];
        }

        Utils.create("p")
            .text(opt.description)
            .appendTo(desc);

        if (opt["default"] != undefined) {
            Utils.create("p")
                .html("<br/>Default: "+ opt["default"])
                .appendTo(desc);
        }

        if (this.plugin.info.flags && /simple/.test(this.plugin.info.flags)) {
            element = "textarea";
            simple = true;
        }

        this.form.createElement({
            element: element,
            type: "text",
            name: "command_options:"+ opt.option,
            text: opt.name,
            desc: desc,
            placeholder: opt.example == undefined ? "" : opt.example,
            value: value,
            css: { width: "450px" }
        });
    };

    object.createWebTransactionWorkflow = function() {
        var values = this.commandOptionsByOption;
        if (this.plugin.id == "58") {
            this.wtrm = Bloonix.WTRM({
                appendTo: this.form.form,
                preload: values.workflow
            });
        }
    };

    object.addDestroyButton = function(elem, destroy, element) {
        Utils.create("span")
            .addClass("hicons remove column-remove-button")
            .attr("title", Text.get("action.remove"))
            .tooltip()
            .appendTo(element)
            .click(function() { destroy.remove(); elem.destroyed = true; });
    };

    object.createMultipleOption = function(opt, value) {
        var tr = Utils.create("tr").appendTo(this.form.table),
            th = Utils.create("th").text(opt.name).appendTo(tr),
            td = Utils.create("td").appendTo(tr),
            options = [],
            pluginInfo = this.plugin.info;

        new iButton({
            title: opt.name,
            desc: opt.description
        }).appendTo(th);

        if (!pluginInfo.thresholds) {
            var input = this.form.input({
                name: "command_options:"+ opt.option,
                type: "text",
                appendTo: td
            });
            if (value != undefined) {
                input.setValue(value);
            }
            this.addDestroyButton({}, tr, td);
            return;
        }

        var selectkeySelected = undefined,
            selectOperatorSelected = undefined,
            thresholdValue = undefined;

        if (value) {
            var parts = value.split(":");
            selectkeySelected = parts[0];
            selectOperatorSelected = parts[1];
            thresholdValue = parts[2];
        }

        $.each(pluginInfo.thresholds.options, function(i, opt) {
            options.push(opt.key);
        });

        var selectKey = this.form.select({
            options: options,
            selected: selectkeySelected,
            appendTo: td,
            width: "210px"
        });

        var selectOperator = this.form.select({
            options: [
                { value: "lt", name: "<"  },
                { value: "le", name: "<=" },
                { value: "gt", name: ">"  },
                { value: "ge", name: ">=" },
                { value: "eq", name: "==" },
                { value: "ne", name: "!=" }
            ],
            selected: selectOperatorSelected,
            appendTo: td,
            width: "80px"
        });

        var thresholdInput = this.form.input({
            type: "text",
            appendTo: td,
            width: "140px",
            value: thresholdValue
        });

        var thresholdElement = {
            name: opt.option,
            selectKey: selectKey,
            selectOperator: selectOperator,
            thresholdInput: thresholdInput,
            destroyed: false
        };

        this.thresholdElements.push(thresholdElement);
        this.addDestroyButton(thresholdElement, tr, td);
    };

    object.getOperator = function(o) {
        if (o == "lt") {
            return "<";
        }
        if (o == "le") {
            return "<=";
        }
        if (o == "gt") {
            return ">";
        }
        if (o == "ge") {
            return ">=";
        }
        if (o == "eq") {
            return "==";
        }
        if (o == "ne") {
            return "!=";
        }
    };

    object.showThresholdOptions = function(plugin) {
        var pluginStats = Bloonix.get("/plugin-stats/"+ plugin.id),
            content = Utils.create("div"),
            thresholds = plugin.info.thresholds,
            pluginStatsByKey = {},
            pluginOptionsByOption = {},
            thresholdKeys = [];

        $.each(pluginStats, function(i, opt) {
            pluginStatsByKey[opt.statkey] = opt;
        });

        var table = new Table({ appendTo: content }).init();
        table.addHeadColumn("Key");
        table.addHeadColumn("Unit");
        table.addHeadColumn("Description");

        $.each(Utils.sort(thresholds.options, "key"), function(i, opt) {
            if (pluginStatsByKey[opt.key] == undefined) {
                Log.error("no data for plugin key "+ opt.key);
            } else {
                table.createRow([
                    opt.key,
                    opt.unit,
                    pluginStatsByKey[opt.key].description
                ]);
            }
        });

        var overlay = new Overlay({
            title: "Threshold options",
            content: content
        }).create();
    };

    object.createBaseSettingsElements = function() {
        var self = this,
            boxes = this.createSettingsBox();

        this.createPluginInfoBox(boxes);
        this.form.table = boxes.table.getTable();
        this.createBaseFormElements();
        this.createLocationFormElements();
    };

    object.createLocationFormElements = function() {
        var plugin = this.plugin;

        //if (plugin.netaccess != "1") {
        //    return;
        //}

        this.createLocationBoxes();
        this.createLocationContainer();
        this.createAgentIdElement();

        if (this.hasLocations === true) {
            this.createWorldwideLocationElements();
            this.createLocationMap();
        }
    };

    object.createLocationBoxes = function() {
        this.locationBoxes = this.createSettingsBox();
    };

    object.createLocationContainer = function() {
        this.locationContainer = Utils.create("div")
            .addClass("location-selection")
            .css({ "margin-top": "30px" })
            .hide()
            .appendTo(this.locationBoxes.leftBox);
    };

    object.createAgentIdElement = function() {
        var self = this,
            plugin = this.plugin;

        var agent_ids = plugin.netaccess != "1"
            ? [ "localhost" ]
            : this.options.agent_id;

        this.locationDefault = this.values.agent_id || plugin.prefer;

        if (this.locationDefault == "localhost") {
            this.agentTooltip.show();
        }

        this.form.createElement({
            element: "select",
            text: Text.get("schema.service.attr.agent_id"),
            desc: Text.get("schema.service.desc.agent_id_tooltip"),
            descBoxCss: { width: "400px", padding: "20px" },
            name: "agent_id",
            options: agent_ids,
            selected: this.locationDefault,
            required: true,
            callback: function(value) {
                if (value == "localhost") {
                    self.agentTooltip.show();
                } else {
                    self.agentTooltip.hide();
                }
                if (plugin.worldwide == 1) {
                    if (value == "remote") {
                        self.locationContainer.show();
                    } else {
                        self.locationContainer.hide();
                    }
                }
            }
        });
    };

    object.createWorldwideLocationElements = function() {
        var self = this,
            plugin = this.plugin;

        if (plugin.worldwide != "1") {
            return;
        }

        this.getLocationOptions();
        this.createLocationTypeContainer();
        this.createLocationTypeSelectionElements();
    };

    object.getLocationOptions = function() {
        this.locationOptions = this.values.location_options;

        if (!this.locationOptions || this.locationOptions == "0") {
            this.locationOptions = { locations: [] };
        } else if (!this.locationOptions.locations) {
            this.locationOptions.locations = [];
        }

        if (this.locationOptions.check_type) {
            this.selectedLocationType = this.locationOptions.check_type;
        } else {
            this.selectedLocationType = "default";
        }
    };

    object.createLocationTypeContainer = function() {
        if (this.locationDefault == "remote") {
            this.locationContainer.show();
        }

        this.locationSelectionLeftBox = Utils.create("div")
            .addClass("location-selection-type-box")
            .appendTo(this.locationContainer);

        /*
        this.locationSelectionRightBox = Utils.create("div")
            .attr("id", "eu-map-container")
            .addClass("location-selection-map-box")
            .appendTo(this.locationContainer);
        */

        this.typeSelection = Utils.create("div").appendTo(this.locationSelectionLeftBox);
        this.locationTypeDefaultContainer = Utils.create("div").appendTo(this.locationSelectionLeftBox).hide();
        this.locationTypeFailoverContainer = Utils.create("div").appendTo(this.locationSelectionLeftBox).hide();
        this.locationTypeRotateContainer = Utils.create("div").appendTo(this.locationSelectionLeftBox).hide();
        this.locationTypeMultipleContainer = Utils.create("div").appendTo(this.locationSelectionLeftBox).hide();

        this.locationTypeContainerByValue = {
            default: this.locationTypeDefaultContainer,
            failover: this.locationTypeFailoverContainer,
            rotate: this.locationTypeRotateContainer,
            multiple: this.locationTypeMultipleContainer
        };

        this.locationTypeContainerByValue[this.selectedLocationType].show();
    };

    object.createLocationTypeSelectionElements = function() {
        var self = this;

        var title = Utils.create("h2")
            .html(Text.get("schema.service.text.select_location_check_type"))
            .appendTo(this.typeSelection);

        Utils.create("small")
            .css({ "font-weight": "normal", "font-size": "13px" })
            .html("<br/>"+ Text.get("schema.service.text.select_location_check_type_info"))
            .appendTo(title);

        this.form.iconList({
            name: "command_options:check_type",
            options: [
                { name: Text.get("schema.service.text.default_location_check_button"), value: "default" },
                { name: Text.get("schema.service.text.failover_location_check_button"), value: "failover" },
                { name: Text.get("schema.service.text.rotate_location_check_button"), value: "rotate" },
                { name: Text.get("schema.service.text.multiple_location_check_button"), value: "multiple" }
            ],
            checked: self.selectedLocationType,
            css: { padding: "15px" },
            callback: function(value) {
                if (self.selectedLocationType != value) {
                    self.locationTypeContainerByValue[self.selectedLocationType].hide();
                    self.locationTypeContainerByValue[value].show();
                    self.selectedLocationType = value;
                }
                self.createLocationMap();
                if (Bloonix.user.sla < 3 && Bloonix.user.role != "admin") {
                    if (value == "default") {
                        $("#sla-note").hide();
                    } else {
                        $("#sla-note").fadeIn(300);
                    }
                }
            },
            appendTo: this.typeSelection
        });

        Utils.create("div")
            .attr("id", "sla-note")
            .addClass("sla-note")
            .html(Text.get("schema.service.text.sla_requirements"))
            .hide()
            .appendTo(this.typeSelection);

        // To prevent JS errors if this.locationOptions.failover_locations[0]
        // is accessed and does not exists.
        $.each([ "failover_locations", "rotate_locations", "multiple_locations" ], function(i, str) {
            if (!self.locationOptions[str]) {
                self.locationOptions[str] = [];
            }
        });

        this.createDefaultLocationTypeElements();
        this.createFailoverLocationTypeElements();
        this.createRotateLocationTypeElements();
        this.createMultipleLocationTypeElements();
    };

    object.createDefaultLocationTypeElements = function() {
        Utils.create("h2")
            .css({ "margin-top": "20px" })
            .html(Text.get("schema.service.desc.default_check_type_title"))
            .appendTo(this.locationTypeDefaultContainer);

        Utils.create("p")
            .html(Text.get("schema.service.desc.default_check_type"))
            .appendTo(this.locationTypeDefaultContainer);

        Utils.create("h3")
            .html(Text.get("schema.service.desc.default_check_type_location"))
            .appendTo(this.locationTypeDefaultContainer);

        var flag = Bloonix.flag(
            this.defaultLocation.country_code,
            this.defaultLocation.continent +" - "+ this.defaultLocation.city +" - "+ this.defaultLocation.ipaddr
        );

        Utils.create("div")
            .addClass("list-rotate-locations-box")
            .html(flag)
            .appendTo(this.locationTypeDefaultContainer);
    };

    object.createFailoverLocationTypeElements = function() {
        var self = this,
            failoverOptions = [];

        Utils.create("h2")
            .css({ "margin-top": "20px" })
            .html(Text.get("schema.service.desc.failover_check_type_title"))
            .appendTo(this.locationTypeFailoverContainer);

        Utils.create("p")
            .html(Text.get("schema.service.desc.failover_check_type"))
            .appendTo(this.locationTypeFailoverContainer);

        Utils.create("h3")
            .html(Text.get("schema.service.desc.failover_check_type_locations"))
            .appendTo(this.locationTypeFailoverContainer);

        $.each(this.locations, function(i, item) {
            failoverOptions.push({
                name: item.continent +" - "+ item.city +" - "+ item.ipaddr,
                value: item.id
            });
        });

        var failoverTable = new Table({
            type: "form",
            appendTo: this.locationTypeFailoverContainer
        }).init();

        failoverTable.createRow([
            Text.get("text.fixed_checkpoint"),
            this.form.select({
                name: "command_options:fixed_checkpoint",
                options: failoverOptions,
                selected: this.locationOptions.failover_locations[0],
                callback: function() { self.createLocationMap() }
            }).getContainer()
        ]);

        failoverTable.createRow([
            Text.get("text.first_failover_checkpoint"),
            this.form.select({
                name: "command_options:first_failover_checkpoint",
                options: failoverOptions,
                selected: this.locationOptions.failover_locations[1],
                callback: function() { self.createLocationMap() }
            }).getContainer()
        ]);

        failoverTable.createRow([
            Text.get("text.second_failover_checkpoint"),
            this.form.select({
                name: "command_options:second_failover_checkpoint",
                options: failoverOptions,
                selected: this.locationOptions.failover_locations[2],
                callback: function() { self.createLocationMap() }
            }).getContainer()
        ]);
    };

    object.createRotateLocationTypeElements = function() {
        var self = this;

        Utils.create("h2")
            .css({ "margin-top": "30px" })
            .html(Text.get("schema.service.desc.rotate_check_type_title"))
            .appendTo(this.locationTypeRotateContainer);

        Utils.create("p")
            .html(Text.get("schema.service.desc.rotate_check_type"))
            .appendTo(this.locationTypeRotateContainer);

        this.addLocationOptionsToForm(this.locationTypeRotateContainer, "rotate");
    };

    object.createMultipleLocationTypeElements = function() {
        var self = this;

        Utils.create("h2")
            .css({ "margin-top": "30px" })
            .html(Text.get("schema.service.desc.multiple_check_type_title"))
            .appendTo(this.locationTypeMultipleContainer);

        Utils.create("p")
            .html(Text.get("schema.service.desc.multiple_check_type"))
            .appendTo(this.locationTypeMultipleContainer);

        Utils.create("h3")
            .html(Text.get("schema.service.desc.multiple_check_concurrency_title"))
            .appendTo(this.locationTypeMultipleContainer);

        Utils.create("p")
            .html(Text.get("schema.service.desc.multiple_check_concurrency"))
            .appendTo(this.locationTypeMultipleContainer);

        Utils.create("h3")
            .html(Text.get("schema.service.desc.multiple_check_select_concurrency"))
            .appendTo(this.locationTypeMultipleContainer);

        this.form.slider({
            name: "command_options:concurrency",
            options: [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ],
            checked: this.locationOptions.concurrency || 3,
            appendTo: this.locationTypeMultipleContainer
        });

        this.addLocationOptionsToForm(this.locationTypeMultipleContainer, "multiple");
    };

    object.addLocationOptionsToForm = function(container, type) {
        var parameter = "command_options:"+ type +"_locations",
            label = "int-options-"+ type +"locations-";

        Utils.create("h3")
            .html(Text.get("schema.service.desc.multiple_check_type_locations"))
            .appendTo(container);

        Utils.create("input")
            .attr("type", "hidden")
            .attr("name", parameter)
            .attr("value", "")
            .appendTo(container);

        var checkboxTable = Utils.create("table")
            .attr("data-name", parameter)
            .addClass("location-checkbox-table")
            .appendTo(container);

        var locationCounterBox = Utils.create("div")
            .addClass("locations-selected")
            .appendTo(container);

        if (type !== "multiple") {
            locationCounterBox.hide();
        }

        // force array
        this.form.setOption(parameter, "forceArray", true);
        var checkedLocations = {};
        if (this.locationOptions[type + "_locations"]) {
            $.each(this.locationOptions[type + "_locations"], function(i, id) {
                checkedLocations[id] = true;
            });
        }

        var tr, n = 1;
        $.each(this.locations, function(i, item) {
            if (n == 1) {
                tr = Utils.create("tr").appendTo(checkboxTable);
                n = 0;
            } else {
                n += 1;
            }

            var th = Utils.create("th").appendTo(tr);
            var div = Utils.create("div").addClass("checkbox-ng").appendTo(th);

            var checkbox = Utils.create("input")
                .attr("id", label + i)
                .attr("type", "checkbox")
                .attr("name", parameter)
                .attr("value", item.id)
                .appendTo(div);

            if (checkedLocations[item.id]) {
                checkbox.attr("checked", "checked");
            }

            var calCost = function() {
                var len = checkboxTable.find("input:checked").length;
                locationCounterBox.html(Text.get("text.locations_selected_costs", len, true, true));
             };

            calCost();
            checkbox.click(function() {
                calCost();
                self.createLocationMap();
            });

            Utils.create("label")
                .attr("for", label+ i)
                .appendTo(div);

            Utils.create("td")
                .html( Bloonix.flag(item.country_code, Utils.escape(item.continent +" - "+ item.city +" - "+ item.ipaddr)))
                .click(function() { checkbox.click() }).appendTo(tr);
        });
    };

    object.createPluginInfoBox = function(boxes) {
        var plugin = this.plugin;

        var infoBox = Utils.create("div")
            .addClass("command-examples")
            .appendTo(boxes.rightBox);

        Utils.create("h3")
            .html(Text.get("text.plugin_info"))
            .appendTo(infoBox);

        var table = new Table({ type: "simple", appendTo: infoBox }).init();
        table.createFormRow(Text.get("schema.plugin.attr.plugin"), plugin.plugin);
        table.createFormRow(Text.get("schema.plugin.attr.categories"), plugin.category);
        table.createFormRow(Text.get("schema.plugin.attr.description"), plugin.description);
        table.createFormRow(Text.get("schema.plugin.attr.command"), plugin.command);

        if (plugin.info.info) {
            Utils.create("h3")
                .css({ "margin-top": "20px" })
                .html(Text.get("schema.plugin.attr.info"))
                .appendTo(infoBox);

            Utils.create("p")
                .html(plugin.info.info.join("<br/>"))
                .appendTo(infoBox);
        }

        this.agentTooltip = Utils.create("div")
            .css({ "margin-top": "20px" })
            .html(Text.get("schema.service.desc.agent_tooltip"))
            .hide()
            .appendTo(infoBox);

        if (plugin.netaccess == 0) {
            this.agentTooltip.show();
        }

        if (plugin.info) {
            Utils.create("h5")
                .html(plugin.info)
                .appendTo(infoBox);
        }

        if (/sudo/.test(plugin.info.flags)) {
            Utils.create("h3")
                .text("Root privileges (sudo)")
                .appendTo(infoBox);

            Utils.create("p")
                .text("Root privileged are necessary to execute this check on your server.")
                .appendTo(infoBox);

            Utils.create("a")
                .attr("href", "#help/bloonix-agent-configuration")
                .attr("target", "_blank")
                .text("⇒ Read more")
                .appendTo(infoBox);
        }
    };

    object.createBaseFormElements = function() {
        var plugin = this.plugin;

        this.form.createElement({
            element: "input",
            type: "text",
            name: "service_name",
            text: Text.get("schema.service.attr.service_name"),
            desc: Text.get("schema.service.desc.service_name"),
            value: this.values.service_name || plugin["abstract"],
            maxlength: 100,
            required: true
        });

        this.form.createElement({
            element: "input",
            type: "text",
            name: "description",
            text: Text.get("schema.service.attr.description"),
            desc: Text.get("schema.service.desc.description"),
            value: this.values.description || plugin.description,
            maxlength: 100
        });

        this.form.createElement({
            element: "input",
            type: "text",
            name: "comment",
            text: Text.get("schema.service.attr.comment"),
            desc: Text.get("schema.service.desc.comment"),
            value: this.values.comment,
            maxlength: 100
        });

        if (this.template === undefined) {
            this.form.createElement({
                element: "radio-yes-no",
                name: "active",
                text: Text.get("schema.service.attr.active"),
                desc: Text.get("schema.service.desc.active"),
                checked: this.values.active
            });
        }

        this.form.createElement({
            element: "radio-yes-no",
            name: "host_alive_check",
            text: Text.get("schema.service.attr.host_alive_check"),
            desc: Text.get("schema.service.desc.host_alive_check"),
            checked: this.values.host_alive_check
        });

        this.form.createElement({
            element: "radio-yes-no",
            name: "passive_check",
            text: Text.get("schema.service.attr.passive_check"),
            desc: Text.get("schema.service.desc.passive_check"),
            checked: this.values.passive_check
        });

        var intervalNullStrText = Text.get("text.inherited_from_host"),
            timeoutNullStrText = Text.get("text.inherited_from_host");

        // if it's a template, then this.host is undefined
        if (this.host) {
            intervalNullStrText += " ("+ Utils.secondsToStringShortReadable(this.host.interval) +")";
            timeoutNullStrText += " ("+ Utils.secondsToStringShortReadable(this.host.timeout) +")";
        }

        this.form.createElement({
            text: Text.get("schema.service.attr.interval"),
            desc: Text.get("schema.service.desc.interval"),
            element: "slider",
            name: "interval",
            options: this.options.interval,
            checked: this.values.interval,
            secondsToFormValues: true,
            nullString: intervalNullStrText
        });

        this.form.createElement({
            text: Text.get("schema.service.attr.timeout"),
            desc: Text.get("schema.service.desc.timeout"),
            element: "slider",
            name: "timeout",
            options: this.options.timeout,
            checked: this.values.timeout,
            secondsToFormValues: true,
            nullString: timeoutNullStrText
        });
    };

    object.createLocationMap = function() {
        /*
        var self = this,
            plugin = this.plugin,
            selected = {},
            locations = [],
            formData = this.form.getData(),
            options = formData.command_options;

        if (plugin.worldwide != "1") {
            return;
        }

        if (options) {
            if (options.check_type == "default") {
                selected[this.defaultLocation.city] = true;
            } else if (options.check_type == "failover") {
                $.each([ "fixed_checkpoint", "first_failover_checkpoint", "second_failover_checkpoint" ], function(i, key) {
                    if (options[key]) {
                        var id = options[key],
                            item = self.locationsById[id];
                        if (item) {
                            selected[item.city] = true;
                        }
                    }
                });
            } else if (options.check_type == "rotate") {
                $.each(this.locations, function(i, item) {
                    selected[item.city] = true;
                });
            } else if (options.check_type == "multiple" && options.locations) {
                $.each(options.locations, function(i, id) {
                    var item = self.locationsById[id];
                    if (item) {
                        selected[item.city] = true;
                    }
                });
            }
        }

        $.each(this.locations, function(i, item) {
            locations.push({
                name: item.city,
                ipaddr: item.ipaddr,
                x: item.coordinates.x,
                y: item.coordinates.y,
                color: selected[item.city] ? "#00ccff" : "#555555"
            });
        });

        if (this.map) {
            this.map.series[1].setData(locations, true);
        } else {
            this.map = Bloonix.highcharts.createLocationMap({
                container: "eu-map-container",
                data: locations
            });
            var infoBox = Utils.create("div")
                .addClass("chart-infobox")
                .html(Text.get("text.dashboard.double_click_or_mouse_wheel_to_zoom"))
                .hide()
                .appendTo("#eu-map-container");
            $("#eu-map-container").hover(
                function() { infoBox.show() },
                function() { infoBox.hide() }
            );
            this.map.mapZoom(0.45, 0, 0, -200, -150);
        }
        */
    };

    object.createCommandFormElements = function() {
        var self = this,
            boxes = this.createSettingsBox(Text.get("schema.service.text.command_options")),
            table = boxes.table,
            topBox = boxes.topBox,
            bottomBox = boxes.bottomBox,
            rightBox = boxes.rightBox,
            plugin = this.plugin,
            info = this.plugin.info,
            flags = [],
            multiple = [];

        if (info.options.length == 0) {
            Utils.create("div")
                .addClass("info-simple")
                .html(Text.get("schema.service.text.no_command_options"))
                .appendTo(topBox);
        }

        this.form.table = table.getTable();

        $.each(info.options, function(i, opt) {
            if (opt.value || opt.value_type) { // expects a value, opt.value is deprecated
                if (plugin.id == "58" && opt.option === "workflow") {
                    return true;
                } else if (opt.multiple) { // multiple values possible
                    multiple.push(opt);

                    if (self.action == "create" || !self.commandOptionsByOption[opt.option]) {
                        self.createMultipleOption(opt);
                    } else if (self.commandOptionsByOption[opt.option]) {
                        $.each(self.commandOptionsByOption[opt.option], function(i, value) {
                            self.createMultipleOption(opt, value);
                        });
                    }
                } else {
                    self.createOption(opt);
                }
            } else { // is a flag
                flags.push(opt);
            }
        });

        if (multiple.length) {
            Utils.create("p")
                .css({ "font-size": "14px", "font-weight": "bold", "margin-top": "20px" })
                .text(Text.get("info.add-further-options"))
                .appendTo(bottomBox);

            $.each(multiple, function(i, opt) {
                var btn = Utils.create("div")
                    .addClass("btn btn-white")
                    .text("+ "+ opt.name)
                    .appendTo(bottomBox);

                btn.click(function() {
                    self.form.table = table.getTable();
                    self.createMultipleOption(opt);
                });
            });
        }

        if (flags.length) {
            $.each(flags, function(i, flag) {
                var checked = self.action == "create"
                    ? flag.default
                    : self.commandOptionsByOption[flag.option];

                if (checked == undefined) {
                    checked = 0;
                }

                self.form.createElement({
                    element: "radio-yes-no",
                    name: "command_options:"+ flag.option,
                    text: flag.name,
                    desc: flag.description,
                    checked: checked
                });
            });
        }

        var exampleInfoBox = Utils.create("div")
            .addClass("command-examples")
            .hide()
            .appendTo(rightBox);

        if (info.examples) {
            Utils.create("h4")
                .html(Text.get("text.option_examples"))
                .appendTo(exampleInfoBox);

            $.each(info.examples, function(x, example) {
                var exampleDescription = example.description.join("<br/>");
                exampleDescription = exampleDescription.replace(/  /g, "&nbsp;&nbsp;");
                Utils.create("h5")
                    .html(exampleDescription)
                    .appendTo(exampleInfoBox);

                var exampleInfoTable = new Table({
                    type: "none",
                    appendTo: exampleInfoBox
                }).init();

                while (example.arguments.length > 0) {
                    var opt = example.arguments.shift(),
                        value = example.arguments.shift();

                    opt = self.pluginOptionsByOption[opt];

                    if (opt.multiple && info.thresholds) {
                        var key, op, val,
                            values = value.split(":");

                        if (values.length == 3) {
                            key = values[0];
                            op = self.getOperator(values[1]);
                            val = values[2];
                        } else {
                            key = values[0];
                            op = ">=";
                            val = values[1];
                        }

                        value = [ key, op, val ].join(" ");
                    }

                    // this is a flag (opt.value is deprecated)
                    if (!opt.value && !opt.value_type) {
                        value = Text.get("word.yes");
                    }

                    exampleInfoTable.createRow([ opt.name +":", value ]);
                }
            });

            exampleInfoBox.show();

            this.form.createElement({
                text: Text.get("schema.service.attr.agent_options.timeout"),
                desc: Text.get("schema.service.desc.agent_options.timeout"),
                element: "slider",
                name: "agent_options:timeout",
                options: [ 0, 10, 15, 30, 60, 90, 120 ],
                checked: this.values.agent_options.timeout || 0,
                secondsToFormValues: true,
                nullString: Text.get("text.default")
            });
        }

        if (info.thresholds) {
            Utils.create("h4")
                .css({ "margin-top": "20px" })
                .html(Text.get("text.thresholds"))
                .appendTo(exampleInfoBox);

            Utils.create("h5")
                .css({ cursor: "pointer", "text-decoration": "underline" })
                .text("View a full list of all possible threshold options")
                .click(function() { self.showThresholdOptions(plugin) })
                .appendTo(exampleInfoBox);

            exampleInfoBox.show();
        }
    };

    object.createNotificationFormElements = function() {
        var boxes = this.createSettingsBox(Text.get("schema.service.text.notification_settings"));
        this.form.table = boxes.table.getTable();

        if (this.template === undefined) {
            this.form.createElement({
                text: Text.get("schema.service.attr.acknowledged"),
                desc: Text.get("schema.service.desc.acknowledged"),
                element: "radio-yes-no",
                name: "acknowledged",
                checked: this.values.acknowledged
            });

            this.form.createElement({
                text: Text.get("schema.service.attr.notification"),
                desc: Text.get("schema.service.desc.notification"),
                element: "radio-yes-no",
                name: "notification",
                checked: this.values.notification
            });
        }

        this.form.createElement({
            text: Text.get("schema.service.attr.attempt_max"),
            desc: Text.get("schema.service.desc.attempt_max"),
            element: "slider",
            name: "attempt_max",
            options: this.options.attempt_max,
            checked: this.values.attempt_max
        });

        this.form.createElement({
            text: Text.get("schema.service.attr.attempt_warn2crit"),
            desc: Text.get("schema.service.desc.attempt_warn2crit"),
            element: "radio-yes-no",
            name: "attempt_warn2crit",
            checked: this.values.attempt_warn2crit
        });

        this.form.createElement({
            text: Text.get("schema.service.attr.fd_enabled"),
            desc: Text.get("schema.service.desc.fd_enabled"),
            element: "radio-yes-no",
            name: "fd_enabled",
            checked: this.values.fd_enabled
        });

        this.form.createElement({
            text: Text.get("schema.service.attr.fd_time_range"),
            desc: Text.get("schema.service.desc.fd_time_range"),
            element: "slider",
            name: "fd_time_range",
            options: this.options.fd_time_range,
            checked: this.values.fd_time_range,
            secondsToFormValues: true
        });

        this.form.createElement({
            text: Text.get("schema.service.attr.fd_flap_count"),
            desc: Text.get("schema.service.desc.fd_flap_count"),
            element: "slider",
            name: "fd_flap_count",
            options: this.options.fd_flap_count,
            checked: this.values.fd_flap_count
        });

        this.form.createElement({
            text: Text.get("schema.service.attr.is_volatile"),
            desc: Text.get("schema.service.desc.is_volatile"),
            element: "radio-yes-no",
            name: "is_volatile",
            checked: this.values.is_volatile
        });

        this.form.createElement({
            text: Text.get("schema.service.attr.volatile_retain"),
            desc: Text.get("schema.service.desc.volatile_retain"),
            element: "slider",
            name: "volatile_retain",
            options: this.options.volatile_retain,
            checked: this.values.volatile_retain,
            secondsToFormValues: true,
            nullString: Text.get("text.never")
        });

        this.form.createElement({
            text: Text.get("schema.service.attr.mail_soft_interval"),
            desc: Text.get("schema.service.desc.mail_soft_interval"),
            element: "slider",
            name: "mail_soft_interval",
            options: this.options.mail_soft_interval,
            checked: this.values.mail_soft_interval,
            secondsToFormValues: true,
            nullString: Text.get("text.undefined")
        });

        this.form.createElement({
            text: Text.get("schema.service.attr.mail_hard_interval"),
            desc: Text.get("schema.service.desc.mail_hard_interval"),
            element: "slider",
            name: "mail_hard_interval",
            options: this.options.mail_hard_interval,
            checked: this.values.mail_hard_interval,
            secondsToFormValues: true,
            nullString: Text.get("text.undefined")
        });

        this.form.createElement({
            text: Text.get("schema.service.attr.mail_warnings"),
            desc: Text.get("schema.service.desc.mail_warnings"),
            element: "radio-yes-no",
            name: "mail_warnings",
            checked: this.values.mail_warnings
        });

        this.form.createElement({
            text: Text.get("schema.service.attr.mail_ok"),
            desc: Text.get("schema.service.desc.mail_ok"),
            element: "radio-yes-no",
            name: "mail_ok",
            checked: this.values.mail_ok
        });

        this.form.createElement({
            text: Text.get("schema.service.attr.send_sms"),
            desc: Text.get("schema.service.desc.send_sms"),
            element: "radio-yes-no",
            name: "send_sms",
            checked: this.values.send_sms
        });

        this.form.createElement({
            text: Text.get("schema.service.attr.sms_soft_interval"),
            desc: Text.get("schema.service.desc.sms_soft_interval"),
            element: "slider",
            name: "sms_soft_interval",
            options: this.options.sms_soft_interval,
            checked: this.values.sms_soft_interval,
            secondsToFormValues: true,
            nullString: Text.get("text.undefined")
        });

        this.form.createElement({
            text: Text.get("schema.service.attr.sms_hard_interval"),
            desc: Text.get("schema.service.desc.sms_hard_interval"),
            element: "slider",
            name: "sms_hard_interval",
            options: this.options.sms_hard_interval,
            checked: this.values.sms_hard_interval,
            secondsToFormValues: true,
            nullString: Text.get("text.undefined")
        });

        this.form.createElement({
            text: Text.get("schema.service.attr.sms_warnings"),
            desc: Text.get("schema.service.desc.sms_warnings"),
            element: "radio-yes-no",
            name: "sms_warnings",
            checked: this.values.sms_warnings
        });

        this.form.createElement({
            text: Text.get("schema.service.attr.sms_ok"),
            desc: Text.get("schema.service.desc.sms_ok"),
            element: "radio-yes-no",
            name: "sms_ok",
            checked: this.values.sms_ok
        });
    };

    object.createSubmitButton = function() {
        var self = this;
        this.form.button({
            name: "submit",
            text: this.action == "create" || this.action == "clone"
                ? Text.get("action.create")
                : Text.get("action.update"),
            appendTo: this.form.form
        });
    };

    object.create();
};
Bloonix.viewServiceLocationReport = function(o) {
    var object = Utils.extend({
        avgTimeChartContainer: "avg-time-chart-container",
        mmTimeChartContainer: "mm-time-chart-container",
        minTimeChartContainer: "min-time-chart-container",
        maxTimeChartContainer: "max-time-chart-container",
        eventChartContainer: "event-chart-container",
        eventTableContainer: "event-table-container",
        boxMargin: 5
    }, o);

    object.create = function() {
        this.createContainer();
        this.getHost();
        this.getService();
        this.getPlugin();
        this.getStats();
        this.getLocations();
        this.generateTimeCharts();
        this.generateEventTable();
    };

    object.getHost = function() {
        this.host = Bloonix.getHost(this.id);
    };

    object.getService = function() {
        this.service = Bloonix.getService(this.service_id);
        Bloonix.showHostSubNavigation("host", this.service.host_id, this.service.hostname);
    };

    object.getPlugin = function() {
        this.plugin = Bloonix.get("/plugins/"+ this.service.plugin);
    };

    object.getStats = function() {
        this.stats = Bloonix.get("/services/"+ this.service_id +"/location-stats");
    };

    object.getLocations = function() {
        var self = this,
            locations = Bloonix.get("/locations");

        this.locations = {};

        $.each(locations, function(i, item) {
            self.locations[item.hostname] = item;
        });
    };

    object.createContainer = function() {
        this.container = Utils.create("div")
            .appendTo("#content");

        var size = this.getContentSize(),
            bigSize = Math.floor(size.width / 3 * 2),
            lowSize = Math.floor(size.width - bigSize);

        this.timeChartBox = this.createBox(this.avgTimeChartContainer);
        this.eventBox = this.createBox(this.eventTableContainer);
        this.minMaxTimeBox = this.createBox(this.mmTimeChartContainer);

        /*
        this.maxTimeChartBox = Utils.create("div")
            .attr("id", this.maxTimeChartContainer)
            .css({ height: "250px" })
            .appendTo(this.minMaxTimeBox);

        this.minTimeChartBox = Utils.create("div")
            .attr("id", this.minTimeChartContainer)
            .css({ height: "250px" })
            .appendTo(this.minMaxTimeBox);
        */

        this.eventChartBox = this.createBox(this.eventChartContainer);
        this.resizeContainer();
        this.enableAutoResize();
    };

    object.enableAutoResize = function() {
        var self = this;
        $(window).resize(function() { self.resizeContainer() });
    };

    object.resizeContainer = function() {
        var size = this.getContentSize(),
            boxSize = Math.floor(size.width / 3),
            bigSize = boxSize * 2 - (this.boxMargin * 2),
            lowSize = boxSize - (this.boxMargin * 2);

        bigSize += "px";
        lowSize += "px";

        this.timeChartBox.css({ width: bigSize, height: "500px", float: "left" });
        this.eventBox.css({ width: lowSize, "min-height": "800px", float: "right" });
        //this.minMaxTimeBox.css({ width: lowSize, height: "500px" });
        //this.eventChartBox.css({ width: lowSize, height: "400px" });
    };

    object.getContentSize = function() {
        var width = $("#content").width() - 20, // minus scrollbar
            height = $(window).height() - $("#content").offset().top;

        if ($("#footer").length) {
            height -= $("#footer").outerHeight();
        }

        return { width: width, height: height };
    };

    object.createBox = function(id) {
        return Utils.create("div").attr("id", id).css({
            "vertical-align": "top",
            margin: this.boxMargin + "px"
        }).appendTo(this.container);
    };

    object.generateTimeCharts = function() {
        Bloonix.plotChart({
            chart: {
                container: this.avgTimeChartContainer,
                title: this.host.hostname +" :: "+ this.service.service_name,
                subtitle: "HTTP location AVG statistics",
                ylabel: "time",
                type: "area"
            },
            series: [{
                data: this.stats.avgstats.time,
                name: "time",
                yAxis: 0,
                color: "rgba("+ Utils.hexToRGB("#005467").join(",") +",0.8)"
            }],
            colors: { time: "#005467" },
            hasNegativeValues: false
        });

        /*
        Bloonix.plotChart({
            chart: {
                container: this.maxTimeChartContainer,
                title: this.host.hostname +" :: "+ this.service.service_name,
                subtitle: "HTTP location MAX statistics",
                ylabel: "time",
                type: "area"
            },
            series: [{
                data: this.stats.maxstats.time,
                name: "time",
                yAxis: 0,
                color: "rgba("+ Utils.hexToRGB("#005467").join(",") +",0.8)"
            }],
            colors: { time: "#005467" },
            hasNegativeValues: false
        });

        Bloonix.plotChart({
            chart: {
                container: this.minTimeChartContainer,
                title: this.host.hostname +" :: "+ this.service.service_name,
                subtitle: "HTTP location MIN statistics",
                ylabel: "time",
                type: "area"
            },
            series: [{
                data: this.stats.minstats.time,
                name: "time",
                yAxis: 0,
                color: "rgba("+ Utils.hexToRGB("#005467").join(",") +",0.8)"
            }],
            colors: { time: "#005467" },
            hasNegativeValues: false
        });
        */
    };

    object.generateEventTable = function() {
        var self = this,
            table = new Table({ appendTo: this.eventBox }).init();

        table.addHeadColumn("Status");
        table.addHeadColumn("Time");
        table.addHeadColumn("Respone time");
        table.addHeadColumn("");

        $.each(this.stats.events, function(x, row) {
            $.each(row.data, function(y, item) {
                var span = Bloonix.createInfoIcon({ type: item.status }),
                    loc = self.locations[item.hostname],
                    date = DateFormat(row.time * 1, DateFormat.masks.bloonix),
                    stats;

                var flag = Bloonix.flag(loc.country_code)
                    .attr("title", loc.continent +" - "+ loc.city +" - "+ loc.ipaddr)
                    .tooltip({ track: true });

                if (item.stats && item.stats.time) {
                    stats = Math.floor(item.stats.time) +" ms";
                } else {
                    stats = Utils.create("div")
                        .attr("title", item.message)
                        .css({ color: "#12a0be", cursor: "default" })
                        .tooltip({ track: true })
                        .text(item.message.substr(0, 20) +"...");
                }

                table.createRow([ span, date, stats, flag ]);
            });
        });
    };

    object.create();
    return object;
};
Bloonix.viewServiceWtrmReport = function(o) {
    var object = Utils.extend({
        appendTo: "#content",
        postdata: {
            offset: 0,
            limit: 25
        }
    }, o);

    object.create = function() {
        this.getService();
        this.createStruct();
        this.createHeader();
        this.getWtrmResultData();
    };

    object.getService = function() {
        this.service = Bloonix.getService(this.service_id);
        Bloonix.showHostSubNavigation("host", this.service.host_id, this.service.hostname);
    };

    object.createStruct = function() {
        this.headerBox = Utils.create("div")
            .appendTo(this.appendTo);

        this.resultBox = Utils.create("div")
            .addClass("w40 left")
            .appendTo(this.appendTo);

        this.stepBoxOuter = Utils.create("div")
            .addClass("w60 left")
            .appendTo(this.appendTo);

        this.stepBoxInner = Utils.create("div")
            .css({ "padding-left": "10px" })
            .appendTo(this.stepBoxOuter);

        this.chartBoxId = "chart-box-wtrm";

        this.chartBox = Utils.create("div")
            .attr("id", this.chartBoxId)
            .css({ height: "250px" })
            .appendTo(this.stepBoxInner);

        Utils.create("span")
            .addClass("info-simple")
            .css({ margin: "40px 20px" })
            .html(Text.get("site.wtrm.text.click_for_details"))
            .appendTo(this.chartBox);

        this.stepBox = Utils.create("div")
            .appendTo(this.stepBoxInner);
    };

    object.createHeader = function() {
        this.header = new Header({
            appendTo: this.headerBox,
            title: Text.get("site.wtrm.text.service_report", this.service.service_name, true),
            pager: true
        }).create();
    };

    object.getWtrmResultData = function() {
        var self = this;

        this.table = new Table({
            url: "/wtrm/report/"+ this.service.id,
            appendTo: this.resultBox,
            postdata: this.postdata,
            searchable: false,
            selectable: false,
            pager: { appendTo: this.header.pager },
            onClick: function(row) { self.showResultSteps(row) },
            columns: [
                {
                    name: "time",
                    text: Text.get("schema.event.attr.time")
                },{
                    name: "status",
                    text: Text.get("schema.event.attr.status"),
                    wrapIconClass: true
                },{
                    name: "message",
                    text: Text.get("schema.service.attr.message")
                }
            ]
        }).create();
    };

    object.showResultSteps = function(row) {
        this.stepBox.hide();
        this.stepBox.html("");

        if (this.chart) {
            this.chart.destroy();
            this.chartBox.html("");
        }

        var table = new Table({ appendTo: this.stepBox }).init(),
            seriesData = [],
            categories = [];

        table.addHeadColumn("Step");
        table.addHeadColumn("Action");
        table.addHeadColumn("Status");
        table.addHeadColumn("Took");

        $.each(row.data, function(i, r) {
            var tr = table.createRow();

            var data = r.data,
                step = data.step,
                num = i + 1,
                success = data.success === true ? "ok" : "error";

            var addClass = /^do/.test(step.action)
                ? "wtrm-step-command wtrm-action"
                : "wtrm-step-command wtrm-check";

            table.addColumn({ html: num +"." });

            var col = table.addColumn({
                addClass: addClass,
                html: Bloonix.WtrmAction[step.action](step)
            });

            if (success == "error") {
                if (data.message) {
                    Utils.create("div")
                        .text(data.message)
                        .appendTo(col);
                }
                if (data.debug) {
                    $.each(data.debug, function(i) {
                        data.debug[i] = Utils.escape(data.debug[i]);
                    });
                    Utils.create("div")
                        .html(data.debug.join("<br/>"))
                        .appendTo(col);
                }
            }

            table.addColumn({
                addClass: "wtrm-step-result",
                html: Utils.create("span").addClass("wtrm-step-result-"+ success).text(success)
            });

            table.addColumn({
                addClass: "wtrm-step-result",
                html: Utils.create("span").addClass("wtrm-step-result-took").text(data.took + "ms")
            });

            categories.push(num +".");
            seriesData.push(data.took);
        });

        this.stepBox.fadeIn(400);
        this.createChart({
            title: row.time +" - "+ row.message,
            categories: categories,
            seriesData: seriesData
        });
    };

    object.createChart = function(opts) {
        this.chart = Bloonix.createChartForWTRM({
            chart: {
                container: this.chartBoxId,
                title: Text.get("schema.service.text.wtrm_result_steps"),
                subtitle: opts.title
            },
            categories: opts.categories,
            seriesData: opts.seriesData
        });
    };

    object.create();
    return object;
};
Bloonix.editHostTemplates = function(o) {
    var contentContainer = $("#content"),
        host = Bloonix.getHost(o.id),
        data = Bloonix.get("/hosts/"+ o.id +"/templates");

    Bloonix.showHostSubNavigation(
        "templates",
        host.id,
        host.hostname
    );

    var boxes = Bloonix.createSideBySideBoxes({
        container: contentContainer,
        width: "500px",
        marginLeft: "520px"
    });

    new Header({
        title: Text.get("schema.host.text.list_templates", host.hostname, true),
        appendTo: boxes.left,
        rbox: false
    }).create();

    new Table({
        appendTo: boxes.left,
        deletable: {
            title: Text.get("schema.host.action.remove_template"),
            url: "/hosts/"+ o.id +"/templates/remove/:id",
            result: [ "id", "name", "description" ],
            warning: Text.get("schema.host.text.remove_template_warning"),
            successCallback: function() { Bloonix.route.to("monitoring/hosts/"+ o.id +"/templates") }
        },
        values: data.is_member_in,
        columns: [
            {
                name: "id",
                text: Text.get("schema.host_template.attr.id"),
                hide: true
            },{
                name: "name",
                text: Text.get("schema.host_template.attr.name"),
                call: function(row) { return Bloonix.call("monitoring/templates/"+ row.id +"/services", row.name) }
            },{
                name: "description",
                text: Text.get("schema.host_template.attr.description")
            }
        ]
    }).create();

    new Header({
        title: Text.get("schema.host.text.templates_not_assigned"),
        appendTo: boxes.right
    }).create();

    var options = [];
    $.each(data.is_not_member_in, function(i, row) {
        options.push({
            name: row.name,
            value: row.id
        });
    });

    var form = new Form({
        appendTo: boxes.right,
        url: { submit: "/hosts/"+ o.id +"/templates/add" },
        onSuccess: function() { Bloonix.route.to("monitoring/hosts/"+ o.id +"/templates") }
    }).init();

    form.multiselect({
        name: "host_template_id",
        size: 10,
        options: options,
        appendTo: form.getContainer()
    });

    form.button({
        appendTo: form.getContainer(),
        text: Text.get("action.add")
    });
};
/*
    Dashboard ideas ...

   * simple report
        - short availability report (from events)
        - check_host_alive graph

    * list of itil change management log of the host
        - downtimes hosts + services
        - acknowledges
        - active / inactive

*/

Bloonix.viewHostDashboard = function(o) {
    Bloonix.initHostView();
    Bloonix.loadHost(o.id);
};

Bloonix.initHostView = function() {
    Utils.create("div")
        .attr("id", "b2x-left")
        .addClass("b2x-left")
        .appendTo("#content");
    Utils.create("div")
        .attr("id", "b2x-right")
        .addClass("b2x-right")
        .appendTo("#content");
    Utils.create("div")
        .addClass("loading")
        .appendTo("#b2x-right");
    Utils.create("div")
        .addClass("clear")
        .appendTo("#content");
};

Bloonix.loadHost = function(hostId) {
    Log.debug("load host "+ hostId);
    var host = Bloonix.getHost(hostId);
    var services = Bloonix.getServicesByHostId(hostId);
    Bloonix.viewHost(host);
    Bloonix.viewServices(host, services);
    Bloonix.showHostSubNavigation("host", hostId, host.hostname);
    $("#b2x-right").find(".loading").remove();
};

Bloonix.viewHost = function(host) {
    Bloonix.setTitle("schema.host.text.view", host.hostname);

    new Header({
        title: Text.get("schema.host.text.view", host.hostname, true),
        appendTo: "#b2x-left"
    }).create();

    Bloonix.createHoverBoxIcons({
        container: "#b2x-left",
        icons: [
            {
                type: "remove",
                title: Text.get("action.delete"),
                callback: function() { Bloonix.deleteHost(host) }
            },{
                type: "edit",
                title: Text.get("action.edit"),
                route: "monitoring/hosts/"+ host.id +"/edit"
            }
        ]
    });

    var table = Utils.create("table")
        .addClass("vtable")
        .appendTo("#b2x-left");

    $.each([
        "id", "company", "hostname", "ipaddr", "description", "comment", "status", "last_check",
        "active", "notification", "interval", "timeout", "max_sms", "max_services", "allow_from",
        "location", "sysgroup", "sysinfo", "device_class", "hw_manufacturer", "hw_product",
        "os_manufacturer", "os_product", "virt_manufacturer", "virt_product"
    ], function(index, item) {
        if (host[item] == "") {
            return true;
        }

        var row = Utils.create("tr");
        var text = item == "company"
            ? "schema.company.attr."+ item
            : "schema.host.attr."+ item;

        Utils.create("th")
            .html(Text.get(text))
            .appendTo(row);

        if (item == "last_check") {
            var date = new Date(host[item] * 1000);
            Utils.create("td")
                .html(DateFormat(date, DateFormat.masks.bloonix))
                .appendTo(row);
        } else if (item == "active" || item == "notification") {
            var word = host[item] == "0" ? "word.no" : "word.yes";
            Utils.create("td")
                .html(Text.get(word))
                .appendTo(row);
        } else if (item == "status") {
            Utils.create("td").html(
                Utils.create("div")
                    .addClass("status-base status-"+ host.status +" inline")
                    .text(host.status)
            ).appendTo(row);
        } else {
            Utils.create("td")
                .text(host[item])
                .appendTo(row);
        }

        row.appendTo(table);
    });
};

Bloonix.deleteHost = function(host) {
    var table = new Table({ type: "vtable" }).init();

    table.createFormRow(Text.get("schema.host.attr.id"), host.id);
    table.createFormRow(Text.get("schema.host.attr.hostname"), host.hostname);
    table.createFormRow(Text.get("schema.host.attr.ipaddr"), host.ipaddr);

    new Overlay({
        title: Text.get("schema.host.text.delete"),
        content: table.getContainer(),
        buttons: [{
            content: Text.get("action.delete"),
            callback: function() {
                Ajax.post({
                    url: "/administration/hosts/"+ host.id +"/delete",
                    async: false,
                    token: true,
                    success: function(result) {
                        if (result.status == "ok") {
                            Bloonix.route.to("monitoring/hosts");
                        }
                    }
                })
            }
        }]
    }).create();
};

Bloonix.viewServices = function(host, services) {
    Bloonix.listServices({
        host: host,
        services: services,
        appendTo: "#b2x-right",
        forHostView: true
    });

    Utils.create("div")
        .addClass("clear")
        .appendTo("#b2x-right");
};

Bloonix.viewExtServiceData = function(service) {
    var box = Utils.create("div")
        .addClass("a-divbox");

    var columns = [
        "id", "agent_id", "description", "acknowledged",
        "notification", "flapping", "scheduled"
    ];

    $.each(columns, function(index, item) {
        var text = "schema.service.attr."+ item,
            spanText;

        Utils.create("span")
            .addClass("a-th")
            .html(Text.get(text) +":&nbsp;")
            .appendTo(box);

        if (item == "acknowledged" || item == "notification" || item == "flapping" || item == "scheduled") {
            var word = service[item] == 0 ? "word.no" : "word.yes";
            spanText = Text.get(word);
        } else {
            spanText = service[item];
        }

        Utils.create("span")
            .addClass("a-td")
            .text(spanText)
            .appendTo(box);
        Utils.create("br")
            .appendTo(box);
    });

    return box;
};
Bloonix.viewHostDowntimes = function(o) {
    var object = o;
    object.host = Bloonix.getHost(o.id);

    object.init = function() {
        var self = this;
        this.container = $("#content");
        this.container.html("");

        Bloonix.showHostSubNavigation(
            "downtimes",
            this.host.id,
            this.host.hostname
        );

        this.boxes = Bloonix.createSideBySideBoxes({
            container: this.container,
            width: "350px",
            marginLeft: "360px"
        });

        new Header({
            title: Text.get("schema.hs_downtime.text.create"),
            appendTo: this.boxes.left,
            rbox: false
        }).create();

        this.form = Bloonix.createScheduledDowntime({
            url: "/hosts/"+ this.host.id +"/downtimes/create",
            services: Bloonix.getServicesByHostId(this.host.id),
            callback: function() { Bloonix.viewHostDowntimes({ id: self.host.id }) }
        });

        this.form.container.appendTo(this.boxes.left);

        this.hostTable = new Table({
            url: "/hosts/"+ this.host.id +"/downtimes",
            appendTo: this.boxes.right,
            header: {
                appendTo: this.boxes.right,
                title: Text.get("schema.host_downtime.text.title", this.host.hostname, true),
                icons: [
                    {
                        type: "help",
                        callback: function() { Utils.open("/#help/scheduled-downtimes") },
                        title: Text.get("site.help.doc.scheduled-downtimes")
                    }
                ]
            },
            deletable: {
                title: Text.get("schema.hs_downtime.text.delete"),
                url: "/hosts/"+ this.host.id +"/downtimes/:id/delete",
                result: [ "id", "description" ]
            },
            columns: [
                {
                    name: "id",
                    text: Text.get("schema.hs_downtime.attr.id")
                },{
                    name: "begin",
                    text: Text.get("schema.hs_downtime.attr.begin_time")
                },{
                    name: "end",
                    text: Text.get("schema.hs_downtime.attr.end_time")
                },{
                    name: "timeslice",
                    text: Text.get("schema.hs_downtime.attr.timeslice")
                },{
                    name: "description",
                    text: Text.get("schema.hs_downtime.attr.description")
                },{
                    name: "active",
                    text: "",
                    activeFlag: true
                }
            ]
        }).create();

        this.serviceTable = new Table({
            url: "/hosts/"+ this.host.id +"/services/downtimes",
            appendTo: this.boxes.right,
            header: {
                appendTo: this.boxes.right,
                title: Text.get("schema.service_downtime.text.title", this.host.hostname, true),
                css: { "margin-top": "30px" },
            },
            deletable: {
                title: Text.get("schema.hs_downtime.text.delete"),
                url: "/hosts/"+ this.host.id +"/services/:service_id/downtimes/:id/delete",
                result: [ "id", "service_name", "description" ]
            },
            columns: [
                {
                    name: "id",
                    text: Text.get("schema.hs_downtime.attr.id")
                },{
                    name: "service_name",
                    text: Text.get("schema.service.attr.service_name")
                },{
                    name: "begin",
                    text: Text.get("schema.hs_downtime.attr.begin_time")
                },{
                    name: "end",
                    text: Text.get("schema.hs_downtime.attr.end_time")
                },{
                    name: "timeslice",
                    text: Text.get("schema.hs_downtime.attr.timeslice")
                },{
                    name: "description",
                    text: Text.get("schema.hs_downtime.attr.description")
                },{
                    name: "active",
                    text: "",
                    activeFlag: true
                }
            ]
        }).create();
    };

    object.init();
};

Bloonix.createScheduledDowntime = function(o) {
    var object = Utils.extend({
        url: false,
        callback: false
    }, o);

    object.create = function() {
        var self = this;
        this.cache = {};

        var outerContainer = Utils.create("div")
            .addClass("form-options");

        var menu = new SimpleMenu({
            appendTo: outerContainer,
            store: { to: this.cache, as: "timetype" }
        }).create();

        var formContainer = Utils.create("form")
            .appendTo(outerContainer);

        var form = new Form({ format: "medium" });

        // absolute time
        var absoluteTimeContainer = Utils.create("div")
            .addClass("form-row")
            .appendTo(formContainer);

        Utils.create("p")
            .addClass("form-row-desc")
            .html(Text.get("schema.hs_downtime.attr.begin_time"))
            .appendTo(absoluteTimeContainer);

        form.datetime({
            name: "begin",
            appendTo: absoluteTimeContainer,
            placeholder: Text.get("schema.hs_downtime.attr.begin_time")
        });

        Utils.create("p")
            .addClass("form-row-desc")
            .html(Text.get("schema.hs_downtime.attr.end_time"))
            .appendTo(absoluteTimeContainer);

        form.datetime({
            name: "end",
            appendTo: absoluteTimeContainer,
            placeholder: Text.get("schema.hs_downtime.attr.end_time")
        });

        menu.add({
            text: Text.get("word.Absolute"),
            value: "absolute",
            container: absoluteTimeContainer,
            show: true
        });

        // timeslice
        var timesliceContainer = Utils.create("div")
            .addClass("form-row")
            .appendTo(formContainer);

        Utils.create("p")
            .addClass("form-row-desc")
            .html(Text.get("schema.hs_downtime.attr.timeslice"))
            .appendTo(timesliceContainer);

        form.input({
            name: "timeslice",
            placeholder: Text.get("schema.hs_downtime.attr.timeslice"),
            bubbleAlignment: "center right",
            bubbleWidth: "650px",
            description: Text.get("schema.timeperiod.examples"),
            maxlength: 200,
            appendTo: timesliceContainer
        });

        menu.add({
            text: Text.get("word.Timeslice"),
            value: "timeslice",
            container: timesliceContainer
        });

        // preset
        var presetContainer = Utils.create("div")
            .addClass("form-row")
            .appendTo(formContainer);

        Utils.create("p")
            .addClass("form-row-desc")
            .html(Text.get("word.Preset"))
            .appendTo(presetContainer);

        form.iconList({
            name: "preset",
            checked: "1h",
            appendTo: presetContainer,
            even: true,
            buttonsPerRow: 4,
            options: [
                { value: "1h", title: Text.get("text.from_now_to_1h"), checked: true },
                { value: "2h", title: Text.get("text.from_now_to_2h") },
                { value: "4h", title: Text.get("text.from_now_to_4h") },
                { value: "8h", title: Text.get("text.from_now_to_8h") },
                { value: "1d", title: Text.get("text.from_now_to_1d") },
                { value: "2d", title: Text.get("text.from_now_to_2d") },
                { value: "4d", title: Text.get("text.from_now_to_4d") },
                { value: "7d", title: Text.get("text.from_now_to_7d") }
            ]
        });

        menu.add({
            text: "Preset",
            value: "preset",
            container: presetContainer
        });

        // timezone
        var timezoneContainer = Utils.create("div")
            .addClass("form-row")
            .appendTo(formContainer);

        Utils.create("p")
            .addClass("form-row-desc")
            .html(Text.get("schema.hs_downtime.attr.timezone"))
            .appendTo(timezoneContainer);

        form.select({
            name: "timezone",
            selected: Bloonix.user.timezone,
            options: Timezones(),
            maxHeight: "126px", // 6 items
            appendTo: timezoneContainer
        });

        // description
        var descriptionContainer = Utils.create("div")
            .addClass("form-row")
            .appendTo(formContainer);

        Utils.create("p")
            .addClass("form-row-desc")
            .html(Text.get("schema.hs_downtime.attr.description"))
            .appendTo(descriptionContainer);

        form.input({
            name: "description",
            maxlength: 300,
            appendTo: descriptionContainer,
            placeholder: Text.get("schema.hs_downtime.attr.description")
        });

        // services
        if (this.services) {
            var serviceContainer = Utils.create("div")
                .addClass("form-row")
                .appendTo(formContainer);

            Utils.create("p")
                .addClass("form-row-desc")
                .html(Text.get("schema.hs_downtime.text.select_services"))
                .appendTo(serviceContainer);

            var services = [];
            $.each(this.services, function(i, service) {
                services.push({
                    name: service.service_name,
                    value: service.id
                });
            });

            form.multiselect({
                name: "service_id",
                options: services,
                appendTo: serviceContainer
            });
        }

        // button
        var buttonContainer = Utils.create("div")
            .addClass("form-row")
            .appendTo(formContainer);

        form.button({
            text: Text.get("action.create"),
            appendTo: buttonContainer,
            callback: function() { self.submit() }
        });

        form.form = formContainer;
        this.container = outerContainer;
        this.form = form;
        this.menu = menu;
    };

    object.submit = function() {
        var self = this,
            formData = this.form.getData();

        var data = Utils.extend({
            description: formData.description,
            timezone: formData.timezone,
            type: this.cache.timetype
        }, this.data);

        if (formData.service_id) {
            data.service_id = formData.service_id;
        }

        if (this.cache.timetype == "absolute") {
            data.begin = formData.begin;
            data.end = formData.end;
        } else if (this.cache.timetype == "timeslice") {
            data.timeslice = formData.timeslice;
        } else if (this.cache.timetype == "preset") {
            data.preset = formData.preset;
        }

        if (this.url) {
            Ajax.post({
                url: this.url,
                data: data,
                token: true,
                success: function(result) {
                    if (result.status == "err-610") {
                        self.form.markErrors(result.data.failed);
                    } else if (self.callback) {
                        self.callback(result, data);
                    }
                }
            });
        } else if (this.callback) {
            this.callback(data);
        }
    };

    object.create();
    return object;
};
Bloonix.listServices = function(o) {
    var object = Utils.extend({
        postdata: {
            offset: 0,
            limit: Bloonix.requestSize
        },
        appendTo: "#content",
    }, o);

    if (object.query) {
        object.postdata.query = object.query;
    }

    object.action = function(action) {
        var self = this,
            selectedIds = this.table.getSelectedIds();

        if (selectedIds.length == 0) {
            Bloonix.createNoteBox({ text: Text.get("schema.service.text.multiple_help") });
            return;
        }

        var overlay = new Overlay();
        overlay.content = Utils.create("div");

        if (action == 0) {
            overlay.title = Text.get("schema.service.text.multiple_downtimes");
            overlay.visible = true;
            var form = Bloonix.createScheduledDowntime({
                url: "/services/create-downtime/",
                data: { service_id: selectedIds },
                callback: function() { self.table.getData(); overlay.close() }
            });
            form.container.appendTo(overlay.content);
        } else if (action == 1) {
            overlay.title = Text.get("schema.service.text.multiple_notification");

            Utils.create("div")
                .addClass("btn btn-white btn-medium")
                .html(Text.get("schema.service.action.disable_notifications_multiple"))
                .appendTo(overlay.content)
                .click(function() {
                    Bloonix.hostServiceAction(
                        "/services/disable-notification/",
                        { service_id: selectedIds }
                    );
                    self.table.getData();
                    overlay.close();
                });

            Utils.create("div")
                .addClass("btn btn-white btn-medium")
                .html(Text.get("schema.service.action.enable_notifications_multiple"))
                .appendTo(overlay.content)
                .click(function() {
                    Bloonix.hostServiceAction(
                        "/services/enable-notification/", 
                        { service_id: selectedIds }
                    );
                    self.table.getData();
                    overlay.close();
                });
        } else if (action == 2) {
            overlay.title = Text.get("schema.service.text.multiple_activate");

            Utils.create("div")
                .addClass("btn btn-white btn-medium")
                .html(Text.get("schema.service.action.deactivate_multiple"))
                .appendTo(overlay.content)
                .click(function() {
                    Bloonix.hostServiceAction(
                        "/services/deactivate/",
                        { service_id: selectedIds }
                    );
                    self.table.getData();
                    overlay.close();
                });

            Utils.create("div")
                .addClass("btn btn-white btn-medium")
                .html(Text.get("schema.service.action.activate_multiple"))
                .appendTo(overlay.content)
                .click(function() {
                    Bloonix.hostServiceAction(
                        "/services/activate/", 
                        { service_id: selectedIds }
                    );
                    self.table.getData();
                    overlay.close();
                });
        } else if (action == 3) {
            overlay.title = Text.get("schema.service.text.multiple_acknowledge");

            Utils.create("div")
                .addClass("btn btn-white btn-medium")
                .html(Text.get("schema.service.action.acknowledge_multiple"))
                .appendTo(overlay.content)
                .click(function() {
                    Bloonix.hostServiceAction(
                        "/services/acknowledge",
                        { service_id: selectedIds }
                    );
                    self.table.getData();
                    overlay.close();
                });

            Utils.create("div")
                .addClass("btn btn-white btn-medium")
                .html(Text.get("schema.service.action.clear_acknowledgement_multiple"))
                .appendTo(overlay.content)
                .click(function() {
                    Bloonix.hostServiceAction(
                        "/services/clear-acknowledgement",
                        { service_id: selectedIds }
                    );
                    self.table.getData();
                    overlay.close();
                });
        } else if (action == 4) {
            overlay.title = Text.get("schema.service.text.multiple_volatile");

            Utils.create("div")
                .addClass("btn btn-white btn-medium")
                .html(Text.get("schema.service.action.clear_volatile_multiple"))
                .appendTo(overlay.content)
                .click(function() {
                    Bloonix.hostServiceAction(
                        "/services/clear-volatile-status/",
                        { service_id: selectedIds }
                    );
                    self.table.getData();
                    overlay.close();
                });
        } else if (action == 5) {
            overlay.title = Text.get("schema.service.text.multiple_force_next_check");

            Utils.create("div")
                .addClass("btn btn-white btn-medium")
                .html(Text.get("schema.service.action.multiple_force_next_check"))
                .appendTo(overlay.content)
                .click(function() {
                    Bloonix.hostServiceAction(
                        "/services/force-next-check/",
                        { service_id: selectedIds }
                    );
                    self.table.getData();
                    overlay.close();
                });
        }

        overlay.create();
    };

    object.create = function() {
        this.createFooterIcons();

        if (this.forHostView === true) {
            this.createHostServiceTable();
        } else {
            this.createServiceTable();
        }
    };

    object.createFooterIcons = function() {
        var self = this;

        Utils.create("span")
            .attr("title", Text.get("schema.service.text.multiple_downtimes"))
            .tooltip()
            .addClass("footer-button")
            .html(Utils.create("div").addClass("hicons-white hicons time"))
            .appendTo("#footer-left")
            .click(function() { self.action(0) });

        Utils.create("span")
            .attr("title", Text.get("schema.service.text.multiple_notification"))
            .tooltip()
            .addClass("footer-button")
            .html(Utils.create("div").addClass("hicons-white hicons envelope"))
            .appendTo("#footer-left")
            .click(function() { self.action(1) });

        Utils.create("span")
            .attr("title", Text.get("schema.service.text.multiple_activate"))
            .tooltip()
            .addClass("footer-button")
            .html(Utils.create("div").addClass("hicons-white hicons remove-sign"))
            .appendTo("#footer-left")
            .click(function() { self.action(2) });

        Utils.create("span")
            .attr("title", Text.get("schema.service.text.multiple_acknowledge"))
            .tooltip()
            .addClass("footer-button")
            .html(Utils.create("div").addClass("hicons-white hicons ok-sign"))
            .appendTo("#footer-left")
            .click(function() { self.action(3) });

        Utils.create("span")
            .attr("title", Text.get("schema.service.text.multiple_volatile"))
            .tooltip()
            .addClass("footer-button")
            .html(Utils.create("div").addClass("hicons-white hicons exclamation-sign"))
            .appendTo("#footer-left")
            .click(function() { self.action(4) });

        Utils.create("span")
            .attr("title", Text.get("schema.service.text.multiple_force_next_check"))
            .tooltip()
            .addClass("footer-button")
            .html(Utils.create("div").addClass("hicons-white hicons refresh"))
            .appendTo("#footer-left")
            .click(function() { self.action(5) });

        this.counterButton = Utils.create("span")
            .attr("title", Text.get("text.selected_objects"))
            .tooltip()
            .addClass("footer-button")
            .text("0")
            .hide()
            .appendTo("#footer-left");
    };

    object.createServiceTable = function() {
        Bloonix.setTitle("schema.service.text.list");

        this.table = new Table({
            url: "/services/list/",
            postdata: this.postdata,
            appendTo: this.appendTo,
            header: {
                title: Text.get("schema.service.text.list"),
                pager: true,
                search: true
            },
            selectable: {
                result: [ "id", "hostname", "service_name" ],
                counter: { update: this.counterButton }
            },
            searchable: {
                url: "/services/search/",
                result: [ "id", "hostname", "service_name", "status", "message" ],
                value: this.postdata.query
            },
            reloadable: true,
            sortable: true,
            columnSwitcher: true,
            rowHoverIcons: [{
                title: Text.get("schema.service.text.clone"),
                icon: "share",
                onClick: this.cloneService
            }],
            columns: [
                {
                    name: "id",
                    text: Text.get("schema.service.attr.id"),
                    hide: true
                },{
                    name: "hostname",
                    text: Text.get("schema.host.attr.hostname"),
                    call: function(row) { return Bloonix.call("monitoring/hosts/"+ row.host_id, row.hostname) }
                },{
                    name: "service_name",
                    text: Text.get("schema.service.attr.service_name"),
                },{
                    icons: this.getStatusIcons()
                },{
                    name: "command",
                    text: Text.get("schema.service.attr.command"),
                    hide: true
                },{
                    name: "plugin",
                    text: Text.get("schema.service.attr.plugin")
                },{
                    name: "agent_id",
                    text: Text.get("schema.service.attr.agent_id"),
                    hide: true
                },{
                    name: "description",
                    text: Text.get("schema.service.attr.description"),
                    hide: true
                },{
                    name: "active",
                    text: Text.get("schema.service.attr.active"),
                    hide: true,
                    bool: "yn"
                },{
                    name: "acknowledged",
                    text: Text.get("schema.service.attr.acknowledged"),
                    hide: true,
                    bool: "yn"
                },{
                    name: "notification",
                    text: Text.get("schema.service.attr.notification"),
                    hide: true,
                    bool: "yn"
                },{
                    name: "flapping",
                    text: Text.get("schema.service.attr.flapping"),
                    hide: true,
                    bool: "yn"
                },{
                    name: "scheduled",
                    text: Text.get("schema.service.attr.scheduled"),
                    hide: true,
                    bool: "yn"
                },{
                    name: "status",
                    text: Text.get("schema.service.attr.status"),
                    wrapValueClass: true
                },{
                    name: "last_check",
                    text: Text.get("schema.service.attr.last_check"),
                    convertFromUnixTime: true
                },{
                    text: Text.get("schema.service.text.attempt"),
                    call: function(row) { return [ row.attempt_counter, row.attempt_max ].join("/") }
                },{
                    name: "message",
                    text: Text.get("schema.service.attr.message")
                }
            ]
        }).create();
    };

    object.createHostServiceTable = function() {
        var self = this,
            host = this.host,
            services = this.services,
            appendTo = this.appendTo,
            icons = this.getStatusIcons();

        icons.push({
            check: function(row) {
                return false; // DISABLED
                if (row.location_options != "0") {
                    if (row.location_options.check_type == "rotate") {
                        return true;
                    }
                }

                return false;
            },
            icon: "cicons report2",
            title: Text.get("schema.service.text.view_location_report"),
            onClick: function(row) { Bloonix.route.to("monitoring/hosts/"+ row.host_id +"/services/"+ row.id +"/report") }
        });

        icons.push({
            check: function(row) { return row.plugin_id == "58" ? true : false },
            icon: "cicons atom",
            title: Text.get("schema.service.text.view_wtrm_report"),
            onClick: function(row) { Bloonix.route.to("monitoring/hosts/"+ row.host_id +"/services/"+ row.id +"/wtrm-report") }
        });

        icons.push({
            check: function(row) { return row.host_template_name ? true : false },
            icon: "cicons template2",
            title: function(row) {
                return Text.get("schema.service.info.inherits_from_host_template", Utils.escape(row.host_template_name));
            }
        });

        this.table = new Table({
            url: "/hosts/"+ host.id +"/services",
            header: {
                appendTo: appendTo,
                title: Text.get("schema.service.text.title"),
                icons: [
                    {
                        type: "help",
                        callback: function() { Utils.open("/#help/add-new-service") },
                        title: Text.get("site.help.doc.add-new-service")
                    },{
                        type: "create",
                        callback: function() { Bloonix.route.to("monitoring/hosts/"+ host.id +"/services/create") },
                        title: Text.get("schema.service.text.create")
                    }
                ]
            },
            selectable: {
                result: [ "id", "service_name" ],
                counter: { update: this.counterButton }
            },
            searchable: false,
            appendTo: appendTo,
            values: services,
            reloadable: {
                callback: function() {
                    Bloonix.route.to("monitoring/hosts/"+ host.id);
                }
            },
            deletable: {
                title: Text.get("schema.service.text.delete"),
                url: "/hosts/:host_id/services/:id/delete",
                result: [ "id", "service_name", "plugin" ],
                check: function(row) { return row.host_template_name ? false : true }
            },
            columnSwitcher: true,
            rowHoverIcons: [{
                title: Text.get("schema.service.text.clone"),
                icon: "share",
                onClick: self.cloneService
            }],
            columns: [
                {
                    name: "id",
                    text: Text.get("schema.service.attr.id"),
                    hide: true
                },{
                    name: "service_name",
                    text: Text.get("schema.service.attr.service_name"),
                    call: function(row) {
                        if (row.host_template_name) {
                            return row.service_name;
                        }
                        return Bloonix.call("monitoring/hosts/"+ row.host_id +"/services/"+ row.id +"/edit", row.service_name);
                    }
                },{
                    icons: icons
                },{
                    name: "plugin",
                    text: Text.get("schema.service.attr.plugin"),
                    hide: true
                },{
                    name: "agent_id",
                    text: Text.get("schema.service.attr.agent_id"),
                    hide: true
                },{
                    name: "status",
                    text: Text.get("schema.service.attr.status"),
                    wrapValueClass: true
                },{
                    name: "attempt_max",
                    text: Text.get("schema.service.text.attempt"),
                    value: function(row) { return row.attempt_counter +"/"+ row.attempt_max },
                    centered: true
                },{
                    name: "last_check",
                    text: Text.get("schema.service.attr.last_check"),
                    convertFromUnixTime: true
                },{
                    name: "host_template_name",
                    text: Text.get("schema.service.text.host_template"),
                    hide: true,
                    call: function(row) {
                        if (row.host_template_name) {
                            return Bloonix.call("monitoring/templates/"+ row.host_template_id +"/services", row.host_template_name);
                        }
                        return "─";
                    }
                },{
                    name: "message",
                    text: Text.get("schema.service.attr.message")
                }
            ]
        }).create();
    };

    object.cloneService = function(service) {
        var content = Utils.create("div");

        var overlay = new Overlay({
            title: Text.get("schema.service.text.clone_service", service.service_name, true),
            content: content
        });

        var buttons = Utils.create("div")
            .appendTo(content);

        var hostList = Utils.create("div")
            .appendTo(content)
            .hide();

        Utils.create("div")
            .addClass("btn btn-white btn-medium")
            .html(Text.get("schema.service.text.clone_to_the_same_host"))
            .appendTo(buttons)
            .click(function() {
                overlay.close();
                Bloonix.route.to("monitoring/hosts/"+ service.host_id +"/services/"+ service.id +"/clone-to/"+ service.host_id);
            });

        Utils.create("div")
            .addClass("btn btn-white btn-medium")
            .html(Text.get("schema.service.text.clone_select_host"))
            .appendTo(buttons)
            .click(function() {
                buttons.hide();
                hostList.html("").show();
                overlay.setWidth("1000px");
                new Table({
                    url: "/hosts",
                    postdata: { offset: 0, limit: 20 },
                    appendTo: hostList,
                    sortable: true,
                    header: {
                        title: Text.get("schema.service.text.clone_select_host"),
                        pager: true,
                        search: true,
                        appendTo: hostList
                    },
                    searchable: {
                        url: "/hosts/search/",
                        result: [ "id", "hostname", "ipaddr" ]
                    },
                    onClick: function(row) {
                        overlay.close();
                        Bloonix.route.to("monitoring/hosts/"+ service.host_id +"/services/"+ service.id +"/clone-to/"+ row.id);
                    },
                    columns: [
                        {
                            name: "id",
                            text: Text.get("schema.host.attr.id")
                        },{
                            name: "hostname",
                            text: Text.get("schema.host.attr.hostname")
                        },{
                            name: "ipaddr",
                            text:  Text.get("schema.host.attr.ipaddr")
                        }
                    ]
                }).create();
            });

        overlay.create();
    };

    object.getStatusIcons = function() {
        var self = this;

        return [
            {
                check: function(row) { return row.notification == "0" ? true : false },
                icon: "cicons mute",
                title: Text.get("schema.service.info.notification")
            },{
                check: function(row) { return row.active == "0" ? true : false },
                icon: "cicons disabled",
                title: Text.get("schema.service.info.active")
            },{
                check: function(row) { return row.acknowledged == "1" ? true : false },
                icon: "cicons noalarm",
                title: Text.get("schema.service.info.acknowledged")
            },{
                check: function(row) { return row.flapping == "1" ? true : false },
                icon: "cicons attention",
                title: Text.get("schema.service.info.flapping")
            },{
                check: function(row) { return row.volatile_status == "1" ? true : false },
                icon: "cicons lightning",
                title: Text.get("schema.service.info.is_volatile")
            },{
                check: function(row) { return row.host_alive_check == "1" ? true : false },
                icon: "cicons host",
                title: Text.get("schema.service.info.host_alive_check")
            },{
                check: function(row) {
                    if (row.plugin_id == "58") {
                        return false;
                    }
                    return Bloonix.checkIfObject(row.result);
                },
                icon: "cicons robot",
                title: Text.get("schema.service.info.has_result"),
                onClick: function(row) { Bloonix.showServiceResultData(row.plugin, row.result) }
            },{
                check: function(row) { return Bloonix.checkIfObject(row.debug) },
                icon: "cicons light-on",
                title: Text.get("schema.service.info.has_result"),
                onClick: function(row) { Bloonix.showServiceDebugData(row.debug) }
            }
        ]
    };

    object.create();
    return object;
};

Bloonix.formatNiceJsonOutput = function(json) {
    json = Utils.escapeAndSyntaxHightlightJSON(json);

    var content = Utils.create("pre")
        .addClass("service-result")
        .html(json);

    return content;
};

Bloonix.searchServices = function(query) {
    Bloonix.route.to("monitoring/services", { query: query });
};

Bloonix.getServicesByHostId = function(hostId) {
    return Bloonix.get("/hosts/"+ hostId + "/services");
};

Bloonix.getService = function(serviceId) {
    return Bloonix.get("/services/"+ serviceId);
};

Bloonix.getServicesForSelection = function(hostId) {
    var services = Bloonix.getServicesByHostId(hostId);
    var selection = [ ];

    $.each(services, function(i, service) {
        selection.push({
            name: service.service_name,
            value: service.id
        });
    });

    return selection;
};

Bloonix.showServiceResultData = function(plugin, data) {
    var content = Utils.create("div");

    var table = new Table({ appendTo: content }).init();
    table.addHeadColumn(Text.get("schema.host.attr.hostname"));
    table.addHeadColumn(Text.get("schema.service.attr.status"));
    table.addHeadColumn(Text.get("schema.service.attr.message"));

    $.each(data, function(i, row) {
        table.createRow([
            row.hostname,
            Utils.create("span").addClass("status-base status-"+ row.status).text(row.status),
            Utils.escape(row.message)
        ]);
    });

    new Overlay({
        title: Text.get("schema.service.attr.result"),
        content: content
    }).create();
};

Bloonix.showServiceDebugData = function(data) {
    var content = Utils.create("div");

    if (data.ipaddr) {
        Utils.create("p")
            .css({ "font-size": "14px", "font-weight": "bold", "margin-bottom": "10px" })
            .text("Target IP-Address: "+ data.ipaddr)
            .appendTo(content);
    }

    $.each([ "mtr", "http-header", "html-content" ], function(i, key) {
        var value = data[key];

        if (value === undefined || value.length === 0) {
            return true;
        }

        var box = Utils.create("div")
            .css({ padding: "0 20px 30px 0", float: "left" })
            .appendTo(content);

        var title = Utils.create("h4")
            .css({ padding: "0 0 10px 0" })
            .appendTo(box);

        if (key === "mtr") {
            box.width("470px");
            title.text("MTR-Result");
            Bloonix.viewMtrResult({
                appendTo: box,
                data: value.result,
                showChart: false
            });
        }

        if (key === "http-header") {
            box.width("470px");
            title.text("HTTP-Header");
            var table = new Table({
                appendTo: box,
                type: "simple",
                addClass: "vtable small"
            }).init();
            $.each(value, function(headerKey, headerValue) {
                table.createRow([ headerKey, headerValue ]);
            });
        }

        if (key === "html-content") {
            box.width("970px");
            title.text("HTML-Content");
            //value = Utils.escape(value);
            Utils.create("pre")
                .css({ color: "green", "font-size": "11px" })
                .text(value)
                .appendTo(box);
        }
    });

    var title = Text.get("schema.service.attr.result");
    if (data.ipaddr) {
        title += ", IP: "+ data.ipaddr;
    }

    new Overlay({
        title: title,
        content: content
    }).create();
};
Bloonix.listCharts = function(o) {
    Bloonix.showChartsSubNavigation("service-charts");

    var object = Utils.extend({
        container: $("#content"),
        defaultAlignment: 3,
        cache: {},
        postdata: {
            offset: 0,
            limit: Bloonix.requestSize
        }
    }, o);

    object.create = function() {
        this.chartOptionBox = Utils.create("div").appendTo(this.container);
        this.chartChartBox = Utils.create("div").appendTo(this.container);
        this.chartViewAlias = "";

        if (this.screenCharts) {
            this.chartOptionBox.hide();
            this.createScreenCharts();
            return;
        }

        this.chartChartBox.hide();
        this.createTitleAndNavigation();
        this.createBoxes();
        this.getChartOptions();
        this.createChartOptions();
        this.createChartSelectionInfoBox();
        this.createServiceChartList();
        this.createUserChartList();
    };

    object.createTitleAndNavigation = function() {
        if (this.id) {
            this.host = Bloonix.getHost(this.id);
            Bloonix.showHostSubNavigation("charts", this.id, this.host.hostname);
            Bloonix.setTitle("schema.chart.text.select", this.host.hostname);
        } else {
            Bloonix.setTitle("schema.chart.text.multiselect");
        }
    };

    object.createBoxes = function() {
        this.boxes = Bloonix.createSideBySideBoxes({
            container: this.chartOptionBox,
            width: "300px",
            marginLeft: "310px"
        });

        if (this.id) {
            this.serviceChartContainer = this.boxes.right;
        } else {
            this.serviceChartContainer = Utils.create("div")
                .appendTo(this.boxes.right);

            this.userChartContainer = Utils.create("div")
                .appendTo(this.boxes.right)
                .hide();
        }
    };

    object.getChartOptions = function() {
        this.chartOptions = Bloonix.get("/hosts/charts/options/");
    };

    object.createChartOptions = function() {
        this.createFormHeader();

        if (this.id === undefined) {
            this.createChartTypeOptions();
        }

        this.createForm();
        this.createChartOptionsTimeMenu();
        this.createRefreshOptions();
        this.createPresetOptions();
        this.createFixedTimeOptions();
        this.createChartAlignmentOptions();
        this.createButtons();
        this.createChartLoaderOptions();
    };

    object.createFormHeader = function()  {
        new Header({
            title: Text.get("schema.chart.attr.options"),
            appendTo: this.boxes.left,
            rbox: false
        }).create();
    };

    object.createForm = function() {
        this.form = new Form({
            format: "default",
            appendTo: this.boxes.left
        });

        this.form.init();
        this.leftContainer = this.form.getContainer();
    };

    object.createChartTypeOptions = function() {
        var self = this;

        Utils.create("p")
            .addClass("chart-options-title")
            .html(Text.get("schema.chart.text.chart_type"))
            .appendTo(this.boxes.left);

        Bloonix.createIconList({
            items: [
                { name: Text.get("schema.chart.text.service_charts"), value: "service-charts", default: true },
                { name: Text.get("schema.chart.text.user_charts"), value: "user-charts" },
            ],
            format: "small",
            appendTo: this.boxes.left,
            callback: function(value) {
                if (value === "service-charts") {
                    self.userChartContainer.hide();
                    self.serviceChartContainer.show();
                } else {
                    self.serviceChartContainer.hide();
                    self.userChartContainer.show();
                }
            }
        });
    };

    object.createChartOptionsTimeMenu = function() {
        this.menu = new SimpleMenu({
            appendTo: this.leftContainer,
            store: { to: this.cache, as: "timetype" }
        }).create();

        this.absoluteTimeContainer = Utils.create("div")
            .appendTo(this.leftContainer);

        this.relativeTimeContainer = Utils.create("div")
            .appendTo(this.leftContainer);

        this.menu.add({
            text: Text.get("word.Relative"),
            value: "relative",
            container: this.relativeTimeContainer,
            show: true
        });

        this.menu.add({
            text: Text.get("word.Absolute"),
            value: "absolute",
            container: this.absoluteTimeContainer
        });
    };

    object.createRefreshOptions = function() {
        var options = [];

        $.each(this.chartOptions.options.refresh, function(i, value) {
            options.push({ name: value +"s", value: value });
        });

        Utils.create("p")
            .addClass("chart-options-title")
            .html(Text.get("schema.chart.attr.refresh"))
            .appendTo(this.relativeTimeContainer);

        this.refreshFormOptions = this.form.iconList({
            name: "refresh",
            options: options,
            appendTo: this.relativeTimeContainer,
            checked: this.chartOptions.defaults.refresh,
            even: true
        });
    };

    object.createPresetOptions = function() {
        Utils.create("p")
            .addClass("chart-options-title")
            .html(Text.get("schema.chart.attr.preset"))
            .appendTo(this.relativeTimeContainer);

        this.presetFormOptions = this.form.iconList({
            name: "preset",
            options: this.chartOptions.options.preset,
            appendTo: this.relativeTimeContainer,
            checked: this.chartOptions.defaults.preset,
            even: true
        });
    };

    object.createFixedTimeOptions = function() {
        this.fromFormOption = this.form.datetime({
            placeholder: Text.get("schema.chart.attr.from"),
            name: "from",
            format: "small",
            timeFormat: "hh:mm",
            stepMinute: 15,
            appendTo: this.absoluteTimeContainer
        });
        this.toFormOption = this.form.datetime({
            placeholder: Text.get("schema.chart.attr.to"),
            name: "to",
            format: "small",
            timeFormat: "hh:mm",
            stepMinute: 15,
            appendTo: this.absoluteTimeContainer
        });
    };

    object.createChartAlignmentOptions = function() {
        Utils.create("p")
            .addClass("chart-options-title")
            .html(Text.get("schema.chart.text.alignment"))
            .appendTo(this.leftContainer);

        this.alignmentFormOptions = this.form.iconList({
            name: "alignment",
            options: [
                { value: 3, icon: "hicons-gray hicons th" },
                { value: 2, icon: "hicons-gray hicons th-large" },
                { value: 1, icon: "hicons-gray hicons align-justify" }
            ],
            appendTo: this.leftContainer,
            even: true,
            checked: this.defaultAlignment
        });
    };

    object.createButtons = function() {
        var self = this;

        this.buttonBox = Utils.create("div")
            .css({ "margin-top": "20px" })
            .appendTo(this.leftContainer);

        this.submitButton = Utils.create("div")
            .addClass("btn btn-white btn-default")
            .click(function() { self.generateCharts() })
            .html(Text.get("action.generate"))
            .css({ "margin-right": "6px" })
            .appendTo(this.buttonBox)
            .attr("title", Text.get("action.generate"))
            .tooltip();
    };

    object.createChartLoaderOptions = function() {
        if (this.id) {
            return;
        }

        var self = this,
            options = [ ];

        $.each(this.chartOptions.views, function(i, opt) {
            options.push({ name: opt.alias, value: opt.id });
        });

        this.saveChartBox = Utils.create("div")
            .css({ "margin-top": "20px" })
            .addClass("save-chart")
            .appendTo(this.boxes.left);

        Utils.create("p")
            .addClass("chart-options-title")
            .html(Text.get("schema.chart.text.chart_views"))
            .appendTo(this.saveChartBox);

        this.cache.chartSelection = new Form({ format: "small" }).select({
            placeholder: Text.get("schema.chart.text.load_view"),
            name: "chart_view",
            id: "chart-view-list",
            options: options,
            callback: function(id) { self.loadChartView(id) },
            appendTo: this.saveChartBox,
            showValue: true
        });

        Utils.create("div")
            .attr("title", Text.get("schema.chart.text.delete_view"))
            .addClass("btn btn-white btn-icon")
            .click(function(){ self.deleteChartView() })
            .html(Utils.create("span").addClass("hicons-gray hicons remove"))
            .appendTo(this.saveChartBox)
            .tooltip();

        Utils.create("div")
            .addClass("clear")
            .appendTo(this.saveChartBox);
    };

    object.saveChartView = function() {
        var self = this,
            alias = $("#chart-view-alias").val();

        if (alias == undefined || alias == false) {
            $("#chart-view-alias").addClass("rwb");
            return false;
        }

        $("#chart-view-alias").removeClass("rwb");

        var toSave = {
            alignment: this.chartFormOptions.alignment,
            alias: alias,
            selected: [ ]
        };

        if (this.cache.timetype == "relative") {
            toSave.refresh = this.chartFormOptions.refresh;
            toSave.preset = this.chartFormOptions.preset;
        } else if (this.validateChartOptions(this.chartFormOptions)== true) {
            toSave.from = this.chartFormOptions.from;
            toSave.to = this.chartFormOptions.to;
        } else {
            return false;
        }

        $.each(this.chartColumnIDs, function(x, id) {
            x += 1;
            $(id).find(".chart-outer").each(function(y, obj) {
                var data = $(obj).data("chart");
                data.position = x;
                toSave.selected.push(data);
            });
        });

        Ajax.post({
            url: "/hosts/charts/view/save/",
            data: toSave,
            async: false,
            success: function(result) {
                if (result.status === "ok") {
                    self.reloadChartViews(alias);
                    Bloonix.createNoteBox({
                        infoClass: "info-ok",
                        text: Text.get("info.update_success"),
                        autoClose: true
                    });
                } else {
                    Bloonix.createNoteBox({
                        infoClass: "info-err",
                        text: Text.get("info.update_failed"),
                        autoClose: true
                    });
                }
            }
        });
    };

    object.reloadChartViews = function(selected) {
        var self = this;
        $("#chart-view-list ul").html("");

        Ajax.post({
            url: "/hosts/charts/options/",
            success: function(result) {
                var options = [ ];

                $.each(result.data.views, function(i, option) {
                    options.push({ name: option.alias, value: option.id });
                });

                self.cache.chartSelection.replaceOptions({
                    options: options,
                    selected: selected
                });
            }
        });
    };

    object.loadChartView = function(id) {
        var self = this;

        $("#chart-view-alias").removeClass("rwb");
        $("#chart-view-list .select").removeClass("rwb");
    
        Ajax.post({
            url: "/hosts/charts/view/"+ id,
            async: false,
            success: function(result) {
                var options = result.data.options;

                if (options.refresh) {
                    self.refreshFormOptions.switchTo(options.refresh);
                }
                if (options.preset) {
                    self.presetFormOptions.switchTo(options.preset);
                }
                if (options.alignment) {
                    self.alignmentFormOptions.switchTo(options.alignment);
                }
    
                if (options.from && options.to) {
                    self.fromFormOption.setValue(options.from);
                    self.toFormOption.setValue(options.to);
                    self.menu.switchTo("absolute");
                } else {
                    self.menu.switchTo("relative");
                }

                if (options.service_charts) {
                    self.serviceChartsTable.refreshSelectedRows(options.service_charts);
                }

                if (options.user_charts) {
                    self.userChartsTable.refreshSelectedRows(options.user_charts);
                }

                if (options.selected) {
                    self.chartPosition = options.selected;
                }

                self.chartViewAlias = result.data.alias;
            }
        });
    };

    object.deleteChartView = function(id, force) {
        var self = this,
            selected = this.cache.chartSelection.getSelected();

        if (!selected.value) {
            $("#chart-view-list .select").addClass("rwb");
            return false;
        }
    
        if (force == undefined) {
            new Overlay({
                title: Text.get("schema.chart.text.delete_view"),
                closeText: Text.get("action.abort"),
                content: Utils.create("div").html(Text.get("schema.chart.text.really_delete_view", Utils.escape(selected.option))),
                buttons: [{
                    content: Text.get("action.yes_delete"),
                    callback: function() { self.deleteChartView(selected.value, true) }
                }],
            }).create();
    
            return false;
        }
    
        $("#chart-view-list .select").removeClass("rwb");
        this.chartViewAlias = "";
        this.serviceChartsTable.clearSelectedRows();

        if (this.id === undefined) {
            this.userChartsTable.clearSelectedRows();
        }

        this.refreshFormOptions.switchTo(this.chartOptions.defaults.refresh);
        this.presetFormOptions.switchTo(this.chartOptions.defaults.preset);
        this.alignmentFormOptions.switchTo(this.defaultAlignment);
        this.fromFormOption.setValue("");
        this.toFormOption.setValue("");
        this.menu.switchTo("relative");
    
        Ajax.post({
            url: "/hosts/charts/view/"+ id + "/delete",
            async: false,
            success: function() { self.reloadChartViews() }
        });
    };

    object.createServiceChartList = function() {
        var self = this,
            url = this.id
                ? "/hosts/"+ o.id +"/charts"
                : "/hosts/charts",
            searchUrl = this.id
                ? "/hosts/"+ o.id +"/charts/search"
                : "/hosts/charts/search/";

        var header = new Header({
            appendTo: this.serviceChartContainer,
            title: this.id
                ? Text.get("schema.chart.text.select", this.host.hostname, true)
                : Text.get("schema.chart.text.multiselect"),
            pager: true,
            search: true,
            counter: true,
            infoBox: false
        }).create();

        this.serviceChartsTable = new Table({
            url: url,
            postdata: Utils.extend({}, this.postdata),
            appendTo: this.serviceChartContainer,
            headerObject: header,
            selectable: {
                result: [ "hostname", "service_name", "plugin", "title" ],
                counter: { update: header.counterObject, hideIfNull: false, descriptive: true },
                getUniqueId: function(row) { return row.service_id +":"+ row.chart_id },
                max: 100
            },
            searchable: {
                url: searchUrl,
                result: [ "hostname", "ipaddr", "service_name", "plugin", "title" ]
            },
            columns: this.getChartTableColumns()
        });

        this.serviceChartsTable.create();
        this.serviceChartsTable.getContainer().hover(
            function() { self.chartSelectionInfoBox.fadeIn(300) },
            function() { self.chartSelectionInfoBox.hide() }
        );
    };

    object.createUserChartList = function() {
        var self = this;

        var header = new Header({
            title: Text.get("schema.user_chart.text.title"),
            pager: true,
            search: true,
            counter: true,
            appendTo: this.userChartContainer
        }).create();

        this.userChartsTable = new Table({
            url: "/user/charts",
            postdata: Utils.extend({}, this.postdata),
            appendTo: this.userChartContainer,
            headerObject: header,
            searchable: {
                url: "/user/charts/search",
                result: [ "title" ]
            },
            selectable: {
                result: [ "title", "subtitle", "description" ],
                counter: { update: header.counterObject, hideIfNull: false, descriptive: true },
                max: 100
            },
            columns: [
                {
                    name: "id",
                    text: Text.get("schema.user_chart.attr.id"),
                    hide: true
                },{
                    name: "title",
                    text: Text.get("schema.user_chart.attr.title")
                },{
                    name: "subtitle",
                    text: Text.get("schema.user_chart.attr.subtitle")
                },{
                    name: "yaxis_label",
                    text: Text.get("schema.user_chart.attr.yaxis_label")
                },{
                    name: "description",
                    text: Text.get("schema.user_chart.attr.description")
                }
            ]
        }).create();
    };

    object.createChartSelectionInfoBox = function() {
        this.chartSelectionInfoBox = Utils.create("div")
            .addClass("info-simple")
            .html(Text.get("schema.chart.desc.charts"))
            .appendTo(this.boxes.left)
            .hide();
    };

    object.getChartTableColumns = function() {
        return [
            {
                name: "id",
                hide: true,
                value: function(row) { return row.service_id +":"+ row.chart_id }
            },{
                name: "hostname",
                text: Text.get("schema.host.attr.hostname")
            },{
                name: "ipaddr",
                text: Text.get("schema.host.attr.ipaddr"),
            },{
                name: "service_name",
                text: Text.get("schema.service.attr.service_name")
            },{
                name: "plugin",
                text: Text.get("schema.service.attr.plugin")
            },{
                name: "title",
                text: Text.get("schema.chart.attr.title")
            }
        ];
    };

    object.generateCharts = function() {
        this.chartFormOptions = this.form.getData();
        this.chartsSelected = {};

        this.serviceChartsSelected = this.serviceChartsTable.getSelectedRows();
        this.userChartsSelected = this.userChartsTable.getSelectedRows();

        if (this.serviceChartsSelected) {
            Utils.extend(this.chartsSelected, this.serviceChartsSelected);
        }

        if (this.userChartsSelected) {
            Utils.extend(this.chartsSelected, this.userChartsSelected);
        }

        if (Utils.objectSize(this.chartsSelected) === 0) {
            return;
        }

        if (this.validateChartOptions(this.chartFormOptions) === true) {
            this.chartOptionBox.hide(200);
            this.chartChartBox.show(400);
            this.createChartBoxHeader();
            this.calculateChartSize();
            this.createChartBoxColumns();
            this.createChartBoxes();
            this.makeItSortable();
        }
    };

    object.createScreenCharts = function() {
        this.chartsSelected = this.screenCharts.options.selected;
        this.chartFormOptions = this.screenCharts.options;

        if (this.chartFormOptions.preset) {
            this.cache.timetype = "relative";
        }

        this.calculateChartSize();
        this.createChartBoxColumns();
        this.createChartBoxes();
        this.makeItSortable();
    };

    object.createChartBoxHeader = function() {
        var self = this;

        var header = new Header({
            appendTo: this.chartChartBox,
            title: this.id
                ? Text.get("schema.chart.text.view", this.host.hostname)
                : Text.get("schema.chart.text.multiple_view"),
            pager: false,
            search: false,
            infoBox: false
        }).create();

        Utils.create("input")
            .attr("placeholder", Text.get("schema.chart.text.save_view"))
            .attr("type", "text")
            .attr("id", "chart-view-alias")
            .attr("name", "chart-view-alias")
            .attr("value", Utils.escape(this.chartViewAlias))
            .addClass("input input-small")
            .css({ "margin-right": "6px", "margin-top": "9px" })
            .appendTo(header.rbox);

        Utils.create("div")
            .attr("title", Text.get("schema.chart.text.save_view"))
            .addClass("btn btn-white")
            .click(function() { self.saveChartView() })
            .html(Utils.create("span").addClass("hicons-gray hicons check"))
            .appendTo(header.rbox)
            .tooltip();

        Utils.create("div")
            .attr("title", Text.get("schema.chart.text.back_to_selection"))
            .click(function() { self.reviewChartOptions() })
            .addClass("btn btn-white")
            .html(Utils.create("span").addClass("hicons-gray hicons cog"))
            .appendTo(header.rbox)
            .tooltip();
    };

    object.createChartBoxColumns = function() {
        this.chartColumnsCounter = 0;
        this.chartColumnIDs = [];
        for (var i = 1; i <= this.countChartColumns; i++) {
            Utils.create("div")
                .attr("id", "chart-sortable-column-"+ i)
                .addClass("chart-sortable-column")
                .css(this.sortableChartColumns)
                .appendTo(this.chartChartBox);
            this.chartColumnIDs.push("#chart-sortable-column-"+ i);
        }
    };

    object.getNextChartPosition = function() {
        if (this.chartColumnsCounter >= this.countChartColumns) {
            this.chartColumnsCounter = 1;
        } else {
            this.chartColumnsCounter += 1;
        }
        return this.chartColumnsCounter;
    };

    object.createChartBoxes = function() {
        var self = this,
            selected = [],
            seen = {},
            x = 0;

        // store subkeys into an object
        $.each(this.chartsSelected, function(x, row) {
            if (row.subkeys && row.subkeys.length) {
                var subkeys = {};
                $.each(row.subkeys.split(","), function(y, str) {
                    subkeys[str] = true;
                });
                row.subkeys = subkeys;
            }
        });

        if (this.chartPosition) {
            $.each(this.chartPosition, function(i, row) {
                var key = row.service_id && row.chart_id
                    ? row.service_id +":"+ row.chart_id
                    : row.chart_id;

                // check if the chart is selected, if not, then ignore the saved selection
                if (self.chartsSelected[key]) {
                    var obj = Utils.extend({}, self.chartsSelected[key]);
                    obj.position = row.position;

                    if (obj.subkeys) {
                        // check if the subkey still exists, if not, then ignore it
                        if (row.subkey && row.subkey.length && obj.subkeys[row.subkey]) {
                            obj.subkey = row.subkey;
                            seen[key +":"+ row.subkey] = true;
                        }
                    // maybe the check switched from multiple to failover,
                    // then subkeys does not exists any more
                    } else {
                        seen[key] = true;
                    }

                    selected.push(obj);
                }
            });
        }

        // key = service_id:chart_id or chart_id
        $.each(this.chartsSelected, function(key, row) {
            if (row.subkeys) {
                $.each(row.subkeys, function(subkey, value) {
                    var obj = Utils.extend({}, row);

                    if (seen[key +":"+ subkey] !== true) {
                        obj.subkey = subkey;
                        obj.position = self.getNextChartPosition();
                        seen[key +":"+ subkey] = true;
                        selected.push(obj);
                    }
                });
            } else if (seen[key] !== true) {
                var obj = Utils.extend({}, row);
                obj.position = self.getNextChartPosition();
                seen[key] = true;
                selected.push(obj);
            }
        });

        $.each(selected, function(i, item) {
            var renderTo = "chart"+ x,
                outerContainer = "#"+ renderTo +"-outer",
                container = "#"+ renderTo;

            self.createChartBox(renderTo, item);
            item.outerContainer = outerContainer;
            item.container = container;
            item.renderTo = renderTo;
            item.avg = Math.floor(self.chartBoxCSS.width * 1.2) + "p";

            if (self.cache.timetype == "relative") {
                item.refresh = self.chartFormOptions.refresh;
                item.preset = self.chartFormOptions.preset;
                Bloonix.intervalObjects.push(
                    setInterval(function() {
                        Log.debug("load chart data for id "+ item.service_id +":"+ item.chart_id);
                        self.loadChartData(item);
                    }, self.chartFormOptions.refresh * 1000)
                );
            } else {
                item.from = self.chartFormOptions.from;
                item.to = self.chartFormOptions.to;
            }

            x++;
            self.loadChartData(item);
        });

        $(window).resize(function() {
            self.calculateChartSize();
            $(self.container).find(".chart-sortable-column").css(self.sortableChartColumns);
            $(self.container).find(".chart").css(self.chartBoxCSS);
        });
    };

    object.loadChartData = function(chart) {
        var self = this,
            query = this.createChartQuery(chart);

        if (this.screenCharts) {
            query.username = this.screenOpts.username;
            query.authkey = this.screenOpts.authkey;
        }

        Ajax.post({
            url: this.screenCharts
                ? "/screen/charts/data/"
                : "/hosts/charts/data/",
            data: query,
            success: function(result) {
                if (chart.service_id && chart.chart_id) {
                    self.plotServiceChart(chart, result);
                } else {
                    self.plotUserChart(chart, result);
                }
            }
        });
    };

    object.plotServiceChart = function(chart, result) {
        var service = result.data.service,
            stats = result.data.stats,
            title = service.hostname +" :: "+ service.title,
            subtitle = service.service_name,
            chartType = "line";

        if (service.subkey && service.subkey != "0") {
            subtitle += " ("+ service.subkey +")";
        }

        if (service.options["chart-type"]) {
            chartType = service.options["chart-type"];
        }

        var plotOptions = {
            chart: {
                container: chart.renderTo,
                title: title,
                subtitle: subtitle,
                ylabel: service.options.ylabel,
                xlabel: service.options.xlabel,
                units: service.options.units,
                type: chartType
            },
            series: [ ],
            colors: { },
            units: { },
            hasNegativeValues: service.options.negative === "true" ? true : false
        };

        $.each(service.options.series, function(index, item) {
            if (item.opposite == "true") {
                plotOptions.hasNegativeValues = true;
            }

            if (stats[item.name]) {
                var name = item.alias ? item.alias : item.name;
                plotOptions.colors[name] = item.color;

                plotOptions.series.push({
                    data: stats[item.name],
                    name: name,
                    description: item.description,
                    yAxis: 0,
                    color: "rgba("+ Utils.hexToRGB(item.color).join(",") +",0.8)"
                });
            }
        });

        $(chart.container)
            .css({ "border-color": "transparent" })
            .removeClass("loading chart-load-info");

        Bloonix.plotChart(plotOptions);
    };

    object.plotUserChart = function(chart, result) {
        var self = this,
            services = result.data.service,
            stats = result.data.stats;

        var plotOptions = { 
            chart: {
                container: chart.renderTo,
                title: chart.title,
                subtitle: chart.subtitle,
                ylabel: chart.yaxis_label,
                xlabel: chart.xaxis_label,
                units: chart.units,
                type: "area"
            },
            series: [ ],
            colors: { },
            units: { },
            hasNegativeValues: false
        };

        $.each(chart.options, function(i, item) {
            var service = services[item.service_id],
                alias = item.statkey_options.alias || item.statkey,
                name = '['+ alias +'] '+ service.hostname +' - '+ service.service_name;

            plotOptions.colors[name] = item.color;
            plotOptions.units[name] = item.statkey_options.units;

            var s = {
                data: stats[ item.service_id +':'+ item.statkey ],
                name: name,
                description: item.statkey,
                yAxis: 0
            };

            if (item.color) {
                s.color = "rgba("+ Utils.hexToRGB(item.color).join(",") +",0.8)"
            }

            plotOptions.series.push(s);
        });

        $(chart.container)
            .css({ "border-color": "transparent" })
            .removeClass("loading chart-load-info");

        Bloonix.plotChart(plotOptions);
    };

    object.createChartQuery = function(chart) {
        var query = { avg: chart.avg };

        if (chart.service_id && chart.chart_id) {
            query.chart_id = chart.chart_id;
            query.service_id = chart.service_id;
            query.subkey = chart.subkey;
            query.avg = chart.avg;
        } else {
            query.chart_id = chart.id;
        }

        if (chart.from && chart.to) {
            query.from = chart.from;
            query.to = chart.to;
        } else {
            query.preset = chart.preset;
        }

        return query;
    };

    object.createChartBox = function(id, item) {
        var self = this,
            icons = [];

        var outerBox = Utils.create("div")
            .attr("id", id +"-outer")
            .addClass("chart-outer")
            .css({ position: "relative", display: "inline-block" })
            .appendTo("#chart-sortable-column-"+ item.position);

        if (item.service_id && item.chart_id) {
            outerBox.data("chart", {
                service_id: item.service_id,
                chart_id: item.chart_id,
                subkey: item.subkey
            });
            icons.push({
                type: "info-sign",
                title: Text.get("text.chart_info"),
                callback: function() { self.createInfoBoxOverlay(item) }
            });
        } else {
            outerBox.data("chart", {
                chart_id: item.id
            });
        }

        icons.push({
            type: "move",
            title: Text.get("action.move_box"),
            addClass: "chart-portlet"
        });

        Bloonix.createHoverBoxIcons({
            container: outerBox,
            icons: icons
        });

        var chartBox = Utils.create("div")
            .attr("id", id)
            .addClass("chart")
            .appendTo(outerBox)
            .css(this.chartBoxCSS)
            .css({ "border-color": "#d1d1d1" })
            .addClass("loading chart-load-info");

        var title = Utils.create("p").appendTo(chartBox);
        var subtitle = Utils.create("p").appendTo(chartBox);

        if (item.service_id && item.chart_id) {
            Utils.create("i")
                .text([ item.hostname, item.title ].join("::"))
                .appendTo(title);

            Utils.create("i")
                .text(item.service_name)
                .appendTo(subtitle);
        } else {
            Utils.create("i")
                .text(item.title)
                .appendTo(title);

            Utils.create("i")
                .text(item.subtitle)
                .appendTo(subtitle);
        }

        return chartBox;
    };

    object.createInfoBoxOverlay = function(chartOptions) {
        var query = {};

        if (this.screenCharts) {
            query.username = this.screenOpts.username;
            query.authkey = this.screenOpts.authkey;
        }

        var pluginStats = Bloonix.get("/hosts/charts/info/"+ chartOptions.plugin_id, query);
        var names = [],
            content = Utils.create("div"),
            table = new Table({ appendTo: content }).init();

        table.addHeadColumn("Statistic");
        table.addHeadColumn("Description");

        $.each(chartOptions.options.series, function(i, item) {
            names.push(item.name);
        });

        $.each(names.sort(), function(i, name) {
            if (pluginStats[name]) {
                table.createRow([
                    pluginStats[name]["alias"],
                    pluginStats[name]["description"]
                ]);
            }
        });

        var chartId = chartOptions.subkey
            ? chartOptions.service_id +":"+ chartOptions.chart_id +":"+ chartOptions.subkey
            : chartOptions.service_id +":"+ chartOptions.chart_id;

        Utils.create("p")
            .css({ "font-size": "10px", "margin-top": "20px" })
            .text(Text.get("schema.chart.text.chart_id", chartId))
            .appendTo(content);

        new Overlay({
            title: Text.get("schema.chart.text.chart_information"),
            content: content
        }).create();
    };

    object.reviewChartOptions = function() {
        Ajax.abortXHRs();
        Bloonix.clearIntervalObjects();
        Bloonix.destroyChartObjects();
        this.chartChartBox.html("");
        this.chartChartBox.hide(400);
        this.chartOptionBox.show(200);
    };

    object.validateChartOptions = function(data) {
        if (this.cache.timetype == "absolute") {
            if (Bloonix.validateFromToDateHourMin(data.from, data.to) == false) {
                this.form.markErrors([ "from", "to" ]);
                return false;
            }
        }

        this.form.removeErrors();
        return true;
    };

    object.calculateChartSize = function() {
        var chartMargin = 10,
            chartWidth, chartHeight;

        if (this.chartFormOptions.alignment == 0) {
            chartWidth = Math.floor( $(this.container).width() / 2 );
            this.countChartColumns = 2;
        } else if (this.chartFormOptions.alignment == 1) {
            chartWidth = Math.floor( $(this.container).width() );
            this.countChartColumns = 1;
        } else if (this.chartFormOptions.alignment == 2) {
            chartWidth = Math.floor( $(this.container).width() / 2 );
            this.countChartColumns = 2;
        } else if (this.chartFormOptions.alignment == 3) {
            chartWidth = Math.floor( $(this.container).width() / 3 );
            this.countChartColumns = 3;
        }

        chartWidth -= 20; // -20px scrollbar
        chartWidth = Math.floor( chartWidth - (chartMargin * 2) );

        if (chartWidth > 1000) {
            chartHeight = 450;
        } else if (this.chartFormOptions.alignment == 3) {
            chartHeight = Math.floor( (chartWidth / 2.2) - (chartMargin * 2) );
        } else {
            chartHeight = Math.floor( (chartWidth / 3) - (chartMargin * 2) );
        }

        if (chartHeight < 250) {
            chartHeight = 270;
        }

        this.sortableChartColumns = {
            width: chartWidth + chartMargin + chartMargin,
            "min-height": "200px",
            margin: 0,
            padding: 0,
            float: "left",
            border: "1px solid transparent"
        };

        this.chartBoxCSS = {
            width: chartWidth,
            height: chartHeight,
            margin: chartMargin,
            border: "1px solid transparent"
        };
    };

    object.makeItSortable = function() {
        $(".chart-sortable-column").sortable({
            start: function() { $(".chart-outer").css({ "border": "1px dashed #c1c1c1" }) },
            stop: function() { $(".chart-outer").css({ "border": "1px solid transparent" }) },
            connectWith: ".chart-sortable-column",
            handle: ".chart-portlet",
            forcePlaceholderSize: true,
            tolerance: "pointer"
        }).disableSelection();
    };

    object.create();
};

Bloonix.listUserCharts = function(o) {
    Bloonix.showChartsSubNavigation("user-charts");

    var object = Utils.extend({
        appendTo: $("#content"),
        postdata: {
            offset: 0,
            limit: Bloonix.requestSize
        }
    }, o);

    object.create = function() {
        this.table = new Table({
            url: "/user/charts",
            postdata: this.postdata,
            appendTo: this.appendTo,
            header: {
                title: Text.get("schema.user_chart.text.title"),
                pager: true,
                search: true,
                icons: [
                    {
                        type: "help",
                        callback: function() { Utils.open("/#help/user-charts") },
                        title: Text.get("site.help.doc.user-charts")
                    },{
                        type: "create",
                        callback: function() { Bloonix.route.to("monitoring/charts/editor/create") },
                        title: Text.get("schema.user_chart.text.create")
                    }
                ]
            },
            searchable: {
                url: "/user/charts/search",
                result: [ "title" ]
            },
            deletable: {
                title: Text.get("schema.user_chart.text.delete"),
                url: "/user/charts/:id/delete",
                result: [ "id", "title" ]
            },
            columnSwitcher: true,
            columns: [
                {
                    name: "id",
                    text: Text.get("schema.user_chart.attr.id"),
                    hide: true
                },{
                    name: "title",
                    text: Text.get("schema.user_chart.attr.title"),
                    call: function(row) { return Bloonix.call("monitoring/charts/editor/"+ row.id +"/update", row.title) }
                },{
                    name: "subtitle",
                    text: Text.get("schema.user_chart.attr.subtitle")
                },{
                    name: "yaxis_label",
                    text: Text.get("schema.user_chart.attr.yaxis_label")
                },{
                    name: "description",
                    text: Text.get("schema.user_chart.attr.description"),
                }
            ]
        }).create();
    };

    object.create();
};

Bloonix.createUserChart = function(o) {
    Bloonix.showChartsSubNavigation("user-charts");

    var object = Utils.extend({
        appendTo: $("#content")
    }, o);

    object.create = function() {
        this.getUserChart();
        this.createHeader();
        this.createForm();
        this.createSelectBoxes();
        this.createSubmitButton();
    };

    object.getUserChart = function() {
        if (this.id) {
            this.values = Bloonix.get("/user/charts/"+ this.id);
        } else {
            this.values = {};
        }
    };

    object.createHeader = function() {
        new Header({
            title: Text.get("schema.user_chart.text.create"),
            icons: [
                {
                    type: "go-back",
                    callback: function() { Bloonix.route.to("monitoring/charts/editor") }
                }
            ]
        }).create();
    };

    object.createForm = function() {
        var self = this;

        var submit = o.id
            ? "/user/charts/"+ o.id +"/update"
            : "/user/charts/create";

        this.form = new Form({
            url: { submit: submit },
            format: "default",
            appendTo: this.appendTo,
            createTable: true
        }).init();

        this.form.postpareDataCallback = function(data) {
            data.options = self.getChartMetrics();
        };

        this.form.createElement({
            element: "input",
            type: "text",
            name: "title",
            text: Text.get("schema.user_chart.attr.title"),
            desc: Text.get("schema.user_chart.desc.title"),
            placeholder: Text.get("schema.user_chart.attr.title"),
            maxlength: 50,
            value: this.values.title
        });

        this.form.createElement({
            element: "input",
            type: "text",
            name: "subtitle",
            text: Text.get("schema.user_chart.attr.subtitle"),
            desc: Text.get("schema.user_chart.desc.subtitle"),
            placeholder: Text.get("schema.user_chart.attr.subtitle"),
            maxlength: 50,
            value: this.values.subtitle
        });

        this.form.createElement({
            element: "input",
            type: "text",
            name: "yaxis_label",
            text: Text.get("schema.user_chart.attr.yaxis_label"),
            desc: Text.get("schema.user_chart.desc.yaxis_label"),
            placeholder: Text.get("schema.user_chart.attr.yaxis_label"),
            maxlength: 30,
            value: this.values.yaxis_label
        });

        this.form.createElement({
            element: "input",
            type: "text",
            name: "description",
            text: Text.get("schema.user_chart.attr.description"),
            desc: Text.get("schema.user_chart.desc.description"),
            placeholder: Text.get("schema.user_chart.attr.description"),
            maxlength: 100,
            value: this.values.description
        });
    };

    object.createSelectBoxes = function() {
        var self = this;

        this.selectBoxes = Utils.create("div")
            .addClass("chart-selection")
            .appendTo(this.form.form);

        var box = {};

        box.outer = Utils.create("div")
            .addClass("chart-selection-outer")
            .appendTo(self.selectBoxes);

        box.header = Utils.create("div")
            .addClass("chart-selection-header")
            .text(Text.get("schema.user_chart.text.chart_metrics"))
            .appendTo(box.outer);

        box.content = Utils.create("ul")
            .attr("data-name", "options")
            .addClass("chart-selection-content")
            .appendTo(box.outer);

        Bloonix.createHoverBoxIcons({
            container: box.header,
            addClass: "chart-selection-header-icons",
            icons: [
                {
                    type: "plus-sign",
                    title: Text.get("schema.user_chart.text.add_metric"),
                    callback: function() { self.addMetric(box) },
                }
            ]
        });

        $(".chart-selection-content").sortable({
            connectWith: ".chart-selection-content",
            handle: ".chart-selection-portlet",
            forcePlaceholderSize: true,
            tolerance: "pointer"
        });

        if (this.values.options) {
            $.each(this.values.options, function(i, opt) {
                self.addServiceToBox({
                    appendTo: box.content,
                    text: "["+ opt.statkey +"] "+ opt.hostname +" - "+ opt.service_name,
                    color: opt.color,
                    data: {
                        service_id: opt.service_id,
                        plugin_id: opt.plugin_id,
                        statkey: opt.statkey
                    }
                });
            });
        }
    };

    object.createSubmitButton = function() {
        var self = this;
        this.form.button({ appendTo: this.form.form });
    };

    object.addMetric = function(box) {
        this.selectedBox = box;
        this.createOverlay();
        this.listPlugins();
    };

    object.createOverlay = function() {
        this.overlayContent = Utils.create("div");

        this.pluginList = Utils.create("div")
            .appendTo(this.overlayContent);

        this.pluginStatsList = Utils.create("div")
            .appendTo(this.overlayContent)
            .hide();

        this.serviceList = Utils.create("div")
            .appendTo(this.overlayContent)
            .hide();

        this.overlay = new Overlay({
            title: Text.get("schema.user_chart.text.add_metric"),
            content: this.overlayContent,
            width: "1000px",
            buttons: [{
                content: Text.get("action.submit"),
                alias: "Submit",
                hide: true,
                close: false
            }]
        }).create();
    };

    object.listPlugins = function() {
        var self = this;

        this.table = new Table({
            url: "/plugins",
            postdata: {
                offset: 0,
                limit: 15
            },
            appendTo: this.pluginList,
            sortable: true,
            header: {
                title: Text.get("schema.plugin.text.list"),
                pager: true,
                search: true,
                appendTo: this.pluginList
            },
            searchable: {
                url: "/plugins/search",
                result: [ "plugin", "command", "category", "description" ],
                resultWidth: "900px"
            },
            columnSwitcher: true,
            onClick: function(row) { self.listPluginStats(row) },
            columns: [
                {
                    name: "id",
                    text: Text.get("schema.plugin.attr.id"),
                    hide: true
                },{
                    name: "plugin",
                    text: Text.get("schema.plugin.attr.plugin")
                },{
                    name: "command",
                    text: Text.get("schema.plugin.attr.command"),
                    hide: true
                },{
                    name: "category",
                    text: Text.get("schema.plugin.attr.categories")
                },{
                    name: "description",
                    text: Text.get("schema.plugin.attr.description")
                }
            ]
        }).create();
    };

    object.listPluginStats = function(plugin) {
        var self = this;
        this.pluginList.hide(300);
        this.pluginStatsList.html("");
        this.pluginStatsList.show();

        this.table = new Table({
            url: "/plugin-stats/"+ plugin.id,
            appendTo: this.pluginStatsList,
            header: {
                title: Text.get("schema.plugin_stats.text.list", plugin.plugin),
                pager: true,
                search: true,
                appendTo: this.pluginStatsList,
                icons: [{
                    type: "go-back",
                    callback: function() {
                        self.pluginStatsList.hide();
                        self.pluginStatsList.html("");
                        self.pluginList.show(300);
                    }
                }]
            },
            columnSwitcher: true,
            onClick: function(row) { self.listServices(row) },
            columns: [
                {
                    name: "alias",
                    text: Text.get("schema.plugin_stats.attr.alias"),
                    value: function(row) { return row.alias && row.alias.length ? row.alias : row.statkey }
                },{
                    name: "statkey",
                    text: Text.get("schema.plugin_stats.attr.statkey"),
                    hide: true
                },{
                    name: "datatype",
                    text: Text.get("schema.plugin_stats.attr.datatype"),
                    hide: true
                },{
                    name: "description",
                    text: Text.get("schema.plugin_stats.attr.description")
                }
            ]
        }).create();
    };

    object.listServices = function(plugin) {
        var self = this;
        this.pluginStatsList.hide("");
        this.serviceList.html("");
        this.serviceList.show();

        var header = new Header({
            title: Text.get("schema.service.text.list"),
            pager: true,
            search: true,
            appendTo: this.serviceList,
            icons: [{
                type: "go-back",
                callback: function() { 
                    self.overlay.getButton("Submit").hide();
                    self.serviceList.hide();
                    self.serviceList.html("");
                    self.pluginStatsList.show(300);
                }
            }]
        }).create();

        var leftBox = Utils.create("div")
            .addClass("chart-selection-service-table")
            .appendTo(this.serviceList);

        var rightBox = Utils.create("div")
            .attr("id", "int-chart-selection-services-selected")
            .addClass("chart-selection-services-selected")
            .appendTo(this.serviceList);

        var selectedList = Utils.create("ul")
            .appendTo(rightBox);

        Utils.create("div")
            .addClass("clear")
            .appendTo(this.serviceList);

        this.table = new Table({
            url: "/plugin-stats/"+ plugin.plugin_id +"/"+ plugin.statkey +"/services",
            appendTo: leftBox,
            headerObject: header,
            searchable: {
                url: "/plugin-stats/"+ plugin.plugin_id +"/"+ plugin.statkey +"/services",
                result: [ "id", "hostname", "service_name" ]
            },
            columnSwitcher: true,
            onClick: function(row) {
                $("#int-chart-selection-services-selected").removeClass("rwb");

                var li = Utils.create("li")
                    .data("service-id", row.id)
                    .data("statkey", plugin.statkey)
                    .text(row.hostname +" - "+ row.service_name)
                    .attr("title", Text.get("text.click_to_delete_seletion"))
                    .appendTo(selectedList)
                    .tooltip({ track: true });

                li.click(function() { li.remove() });
            },
            columns: [
                {
                    name: "id",
                    text: Text.get("schema.service.attr.id"),
                    hide: true
                },{
                    name: "hostname",
                    text: Text.get("schema.host.attr.hostname")
                },{
                    name: "ipaddr",
                    text: Text.get("schema.host.attr.ipaddr")
                },{
                    name: "service_name",
                    text: Text.get("schema.service.attr.service_name"),
                },{
                    name: "description",
                    text: Text.get("schema.service.attr.description"),
                    hide: true
                }
            ]
        }).create();

        this.overlay.getButton("Submit").show().click(function() {
            var i = 0;

            selectedList.find("li").each(function() {
                var id = $(this).data("service-id"),
                    key = $(this).data("statkey"),
                    text = $(this).text();

                self.addServiceToBox({
                    appendTo: self.selectedBox.content,
                    text: "["+ key +"] "+ text,
                    data: {
                        service_id: id,
                        plugin_id: plugin.plugin_id,
                        statkey: plugin.statkey
                    }
                });

                i++;
            });

            // If no service is selected and the user clicks
            // on the submit button, then the select field
            // is marked with a red border.
            if (i == 0) {
                $("#int-chart-selection-services-selected").addClass("rwb");
            } else {
                self.overlay.close();
            }
        });
    };

    object.addServiceToBox = function(o) {
        var item = Utils.create("li")
            .data("item", o.data)
            .addClass("chart-selection-item")
            .text(o.text)
            .appendTo(o.appendTo);

        Bloonix.createHoverBoxIcons({
            addClass: "chart-selection-content-icons",
            container: item,
            icons: [
                {
                    type: "move",
                    title: Text.get("info.move_with_mouse"),
                    addClass: "chart-selection-portlet"
                },{
                    type: "remove",
                    title: Text.get("action.remove"),
                    callback: function() {
                        item.remove();
                        $(".chart-selection-content").sortable("refresh");
                    }
                },{
                    type: "colorpicker",
                    color: o.color
                }
            ]
        });

        $(".chart-selection-content").sortable("refresh");
    };

    object.getChartMetrics = function() {
        var options = [];

        $(".chart-selection-item").each(function() {
            var item = $(this).data("item");
            item.color = $(this).find(".color-picker-icon").data("color");
            options.push(item);
        });

        return options;
    };

    object.create();
};
Bloonix.listHostTemplates = function(o) {
    Bloonix.setTitle("schema.host_template.text.list");

    var table = new Table({
        url: "/templates/hosts/",
        header: {
            title: Text.get("schema.host_template.text.list"),
            pager: true,
            search: true,
            icons: [
                {
                    type: "help",
                    callback: function() { Utils.open("/#help/host-templates") },
                    title: Text.get("site.help.doc.host-templates")
                },{
                    type: "create",
                    callback: function() { Bloonix.route.to("monitoring/templates/create") },
                    title: Text.get("schema.host_template.text.create")
                }
            ]
        },
        searchable: {
            url: "/templates/hosts/search/",
            result: [ "name", "description" ]
        },
        deletable: {
            title: Text.get("schema.host_template.text.delete"),
            url: "/templates/hosts/:id/delete",
            result: [ "id", "name", "description" ]
        },
        reloadable: true,
        columnSwitcher: true,
        rowHoverIcons: [{
            title: Text.get("schema.host_template.text.clone"),
            icon: "share",
            onClick: function(row) {
                var content = Utils.create("div"),
                    overlay = new Overlay();

                var form = new Form({
                    format: "medium",
                    url: { submit: "/templates/hosts/"+ row.id +"/clone" },
                    onSuccess: function() { overlay.close(); Bloonix.route.to("monitoring/templates") },
                    appendTo: content,
                    showButton: false,
                    elements: [
                        {
                            element: "input",
                            type: "text",
                            name: "name",
                            text: Text.get("schema.host_template.attr.name"),
                            desc: Text.get("schema.host_template.desc.name"),
                            maxlength: 100
                        },{
                            element: "input",
                            type: "text",
                            name: "description",
                            text: Text.get("schema.host_template.attr.description"),
                            desc: Text.get("schema.host_template.desc.description"),
                            maxlength: 100
                        }
                    ]
                }).create();

                overlay.title = Text.get("schema.host_template.text.clone_title", row.name, true),
                overlay.content = content,
                overlay.buttons = [{
                    content: Text.get("action.clone"),
                    callback: function() { form.submit() },
                    close: false
                }];
                overlay.create();
            }
        }],
        columns: [
            {
                name: "id",
                text: Text.get("schema.host_template.attr.id"),
                hide: true
            },{
                name: "name",
                text: Text.get("schema.host_template.attr.name"),
                call: function(row) { return Bloonix.call("monitoring/templates/"+ row.id, row.name) }
            },{
                name: "description",
                text: Text.get("schema.host_template.attr.description")
            }
        ]
    });

    table.create();
};

Bloonix.createHostTemplate = function() {
    var template = Bloonix.get("/templates/hosts/options");

    Bloonix.setTitle("schema.host_template.text.create");
    new Header({ title: Text.get("schema.host_template.text.create") }).create();

    new Form({
        url: { submit: "/templates/hosts/create" },
        action: "create",
        onSuccess: function(result) { Bloonix.route.to("monitoring/templates/"+ result.id) },
        values: template.values,
        options: template.options,
        elements: Bloonix.getHostTemplateFormElements()
    }).create();
};

Bloonix.editHostTemplate = function(o) {
    Bloonix.showTemplateSubNavigation("settings", o.id);
    var template = Bloonix.get("/templates/hosts/"+ o.id +"/options");

    Bloonix.setTitle("schema.host_template.text.view", template.values.name);
    new Header({ title: Text.get("schema.host_template.text.view", template.values.name, true) }).create();

    new Form({
        url: { submit: "/templates/hosts/"+ o.id +"/update" },
        title: Text.get("schema.host_template.attr.id") +": "+ o.id,
        action: "update",
        values: template.values,
        options: template.options,
        elements: Bloonix.getHostTemplateFormElements()
    }).create();
};

Bloonix.getHostTemplateFormElements = function() {
    return [
        {
            element: "input",
            type: "text",
            name: "name",
            text: Text.get("schema.host_template.attr.name"),
            desc: Text.get("schema.host_template.desc.name"),
            maxlength: 100
        },{
            element: "input",
            type: "text",
            name: "description",
            text: Text.get("schema.host_template.attr.description"),
            desc: Text.get("schema.host_template.desc.description"),
            maxlength: 100
        },{
            element: "textarea",
            name: "variables",
            text: Text.get("schema.host.attr.variables"),
            desc: Text.get("schema.host.desc.variables")
        }
    ];
};

Bloonix.listHostTemplateServices = function(o) {
    Bloonix.showTemplateSubNavigation("services", o.id);
    var template = Bloonix.get("/templates/hosts/"+ o.id);
    Bloonix.setTitle("schema.host_template.text.view", template.name);

    new Table({
        url: "/templates/hosts/"+ o.id +"/services",
        header: {
            title: Text.get("schema.host_template.text.view", template.name, true),
            icons: [{
                type: "create",
                callback: function() { Bloonix.route.to("monitoring/templates/"+ o.id +"/services/create") },
                title: Text.get("schema.service.text.create")
            }]
        },
        deletable: {
            title: Text.get("schema.host_template.text.delete_service"),
            url: "/templates/hosts/:host_template_id/services/:ref_id/delete",
            result: [ "ref_id", "service_name", "description" ],
            warning: Text.get("schema.host_template.text.delete_service_warning")
        },
        columnSwitcher: true,
        columns: [
            {
                name: "ref_id",
                text: Text.get("schema.service.attr.ref_id"),
                hide: true
            },{
                name: "service_name",
                text: Text.get("schema.service.attr.service_name"),
                call: function(row) { return Bloonix.call("monitoring/templates/"+ o.id +"/services/"+ row.ref_id +"/edit", row.service_name) }
            },{
                name: "command",
                text: Text.get("schema.service.attr.command"),
                hide: true
            },{
                name: "plugin",
                text: Text.get("schema.service.attr.plugin")
            },{
                name: "agent_id",
                text: Text.get("schema.service.attr.agent_id")
            },{
                name: "description",
                text: Text.get("schema.service.attr.description"),
                hide: true
            },{
                name: "attempt_max",
                text: Text.get("schema.service.attr.attempt_max")
            },{
                name: "host_alive_check",
                text: Text.get("schema.service.text.host_alive_check"),
                bool: "yn"
            }
        ]
    }).create();
};

Bloonix.listHostTemplateMembers = function(o) {
    Bloonix.showTemplateSubNavigation("members", o.id);
    var template = Bloonix.get("/templates/hosts/"+ o.id);

    var form = new Form();

    form.group({
        appendTo: "#content",
        title: Text.get("schema.host_template.text.view", template.name),
        subtitle: Text.get("schema.group.attr.id") +": "+ template.id,
        left: {
            title: Text.get("schema.group.text.host_members"),
            listURL: "/templates/hosts/"+ o.id +"/members/list/",
            searchURL: "/templates/hosts/"+ o.id +"/members/list/",
            updateMember: "/templates/hosts/"+ o.id +"/members/remove/"
        },
        right: {
            title: Text.get("schema.group.text.host_nonmembers"),
            listURL: "/templates/hosts/"+ o.id +"/members/list-non/",
            searchURL: "/templates/hosts/"+ o.id +"/members/list-non/",
            updateMember: "/templates/hosts/"+ o.id +"/members/add/"
        },
        columns: [
            {
                name: "id",
                text: Text.get("schema.host.attr.id")
            },{
                name: "hostname",
                text: Text.get("schema.host.attr.hostname")
            },{
                name: "ipaddr",
                text: Text.get("schema.host.attr.ipaddr")
            }
        ],
        selectable: {
            key: "id",
            title: Text.get("schema.host_template.text.selected_hosts"),
            result: [ "id", "hostname", "ipaddr" ]
        },
        searchable: {
            result: [ "id", "hostname", "ipaddr" ]
        }
    });
};

Bloonix.getTemplateById = function(id) {
    return Bloonix.get("/templates/hosts/"+ id);
};
Bloonix.listContactgroups = function(o) {
    Bloonix.setTitle("schema.contactgroup.text.list");

    var table = new Table({
        url: "/contactgroups",
        header: {
            title: Text.get("schema.contactgroup.text.list"),
            pager: true,
            search: true,
            icons: [
                {
                    type: "help",
                    callback: function() { Utils.open("/#help/contacts-and-notifications") },
                    title: Text.get("site.help.doc.contacts-and-notifications")
                },{
                    type: "create",
                    callback: function() { Bloonix.route.to("notification/contactgroups/create") },
                    title: Text.get("schema.contactgroup.text.create")
                }
            ]
        },
        searchable: {
            url: "/contactgroups/search",
            result: [ "name", "description" ]
        },
        deletable: {
            title: Text.get("schema.contactgroup.text.delete"),
            url: "/contactgroups/:id/delete",
            result: [ "id", "name", "description" ]
        },
        appendTo: "#content",
        reloadable: true,
        columnSwitcher: true,
        columns: [
            {
                name: "id",
                text: Text.get("schema.contactgroup.attr.id"),
                hide: true
            },{
                name: "name",
                text: Text.get("schema.contactgroup.attr.name"),
                call: function(row) { return Bloonix.call("notification/contactgroups/"+ row.id +"/edit", row.name) }
            },{
                name: "company",
                text: Text.get("schema.company.attr.company"),
                call: function(row) {
                    return Bloonix.call(
                        "administration/companies/"+ row.company_id +"/edit", row.company
                    );
                },
                hide: true
            },{
                name: "description",
                text: Text.get("schema.contactgroup.attr.description")
            }
        ]
    });

    table.create();
};

Bloonix.createContactgroup = function() {
    Bloonix.setTitle("schema.contactgroup.text.create");

    new Header({
        title: Text.get("schema.contactgroup.text.create"),
        border: true
    }).create();

    new Form({
        url: { submit: "/contactgroups/create" },
        onSuccess: function(result) {
            Bloonix.route.to("notification/contactgroups/"+ result.id +"/edit");
        },
        action: "create",
        elements: Bloonix.getContactgroupFormElements()
    }).create();
};

Bloonix.editContactgroup = function(o) {
    Bloonix.setTitle("schema.contactgroup.text.settings");
 
    o.contactgroup = Bloonix.getContactgroup(o.id);
    Bloonix.showContactgroupSubNavigation();
    Bloonix.createContactgroupForm(o);
    Bloonix.createContactgroupContactMemberForm(o);
    Bloonix.createContactgroupHostMemeberForm(o);
    Bloonix.createContactgroupServiceMemberForm(o);
};

Bloonix.createContactgroupForm = function(o) {
    new Header({
        title: Text.get("schema.contactgroup.text.settings"),
        border: true,
        appendTo: "#int-contactgroup-form"
    }).create();

    new Form({
        url: { submit: "/contactgroups/"+ o.id +"/update" },
        action: "update",
        values: o.contactgroup,
        elements: Bloonix.getContactgroupFormElements(),
        appendTo: "#int-contactgroup-form"
    }).create();
};

Bloonix.createContactgroupContactMemberForm = function(o) {
    new Header({
        title: Text.get("schema.contactgroup.text.contact_members"),
        border: true,
        appendTo: "#int-contact-form",
    }).create();

    var form = new Form();

    form.group({
        appendTo: "#int-contact-form",
        title: Text.get("schema.contactgroup.text.group_members", o.contactgroup.name),
        subtitle: Text.get("schema.contactgroup.attr.id") +": "+ o.id,
        left: {
            title: Text.get("schema.contactgroup.text.host_members"),
            listURL: "/contactgroups/"+ o.id +"/contacts/in-group",
            searchURL: "/contactgroups/"+ o.id +"/contacts/in-group",
            updateMember: "/contactgroups/"+ o.id +"/contacts/remove"
        },
        right: {
            title: Text.get("schema.contactgroup.text.host_nonmembers"),
            listURL: "/contactgroups/"+ o.id +"/contacts/not-in-group",
            searchURL: "/contactgroups/"+ o.id +"/contacts/not-in-group",
            updateMember: "/contactgroups/"+ o.id +"/contacts/add"
        },
        columns: [
            {
                name: "id",
                text: Text.get("schema.contact.attr.id")
            },{
                name: "name",
                text: Text.get("schema.contact.attr.name")
            },{
                name: "mail_to",
                text: Text.get("schema.contact.attr.mail_to")
            }
        ],
        selectable: {
            key: "id",
            title: Text.get("schema.contactgroup.text.selected_hosts"),
            result: [ "id", "name", "mail_to" ]
        },
        searchable: {
            result: [ "id", "name", "mail_to" ]
        }
    });
};

Bloonix.createContactgroupHostMemeberForm = function(o) {
    new Header({
        title: Text.get("schema.contactgroup.text.host_members"),
        border: true,
        appendTo: "#int-host-form"
    }).create();

    var form = new Form();

    form.group({
        appendTo: "#int-host-form",
        title: Text.get("schema.contactgroup.text.group_members", o.contactgroup.name),
        subtitle: Text.get("schema.group.attr.id") +": "+ o.id,
        left: {
            title: Text.get("schema.contactgroup.text.host_members"),
            listURL: "/contactgroups/"+ o.id +"/hosts/in-group",
            searchURL: "/contactgroups/"+ o.id +"/hosts/in-group",
            updateMember: "/contactgroups/"+ o.id +"/hosts/remove"
        },
        right: {
            title: Text.get("schema.contactgroup.text.host_nonmembers"),
            listURL: "/contactgroups/"+ o.id +"/hosts/not-in-group",
            searchURL: "/contactgroups/"+ o.id +"/hosts/not-in-group",
            updateMember: "/contactgroups/"+ o.id +"/hosts/add"
        },
        columns: [
            {
                name: "id",
                text: Text.get("schema.host.attr.id")
            },{
                name: "hostname",
                text: Text.get("schema.host.attr.hostname")
            },{
                name: "ipaddr",
                text: Text.get("schema.host.attr.ipaddr")
            }
        ],
        selectable: {
            key: "id",
            title: Text.get("schema.contactgroup.text.selected_hosts"),
            result: [ "id", "hostname", "ipaddr" ]
        },
        searchable: {
            result: [ "id", "hostname", "ipaddr" ]
        }
    });
};

Bloonix.createContactgroupServiceMemberForm = function(o) {
    new Header({
        title: Text.get("schema.contactgroup.text.service_members"),
        border: true,
        appendTo: "#int-service-form"
    }).create();

    var form = new Form();

    form.group({
        appendTo: "#int-service-form",
        title: Text.get("schema.contactgroup.text.group_members", o.contactgroup.name),
        subtitle: Text.get("schema.contactgroup.attr.id") +": "+ o.id,
        left: {
            title: Text.get("schema.contactgroup.text.service_members"),
            listURL: "/contactgroups/"+ o.id +"/services/in-group",
            searchURL: "/contactgroups/"+ o.id +"/services/in-group",
            updateMember: "/contactgroups/"+ o.id +"/services/remove"
        },
        right: {
            title: Text.get("schema.contactgroup.text.service_nonmembers"),
            listURL: "/contactgroups/"+ o.id +"/services/not-in-group",
            searchURL: "/contactgroups/"+ o.id +"/services/not-in-group",
            updateMember: "/contactgroups/"+ o.id +"/services/add"
        },
        columns: [
            {
                name: "id",
                text: Text.get("schema.service.attr.id")
            },{
                name: "hostname",
                text: Text.get("schema.host.attr.hostname")
            },{
                name: "service_name",
                text: Text.get("schema.service.attr.service_name")
            }
        ],
        selectable: {
            key: "id",
            title: Text.get("schema.contactgroup.text.selected_services"),
            result: [ "id", "hostname", "service_name" ]
        },
        searchable: {
            result: [ "id", "hostname", "service_name" ]
        }
    });
};

Bloonix.getContactgroupFormElements = function() {
    return [
        {
            element: "input",
            name: "name",
            maxlength: 40,
            text: Text.get("schema.contactgroup.attr.name"),
            desc: Text.get("schema.contactgroup.desc.name"),
            required: true
        },{
            element: "input",
            name: "description",
            maxlength: 100,
            text: Text.get("schema.contactgroup.attr.description"),
            desc: Text.get("schema.contactgroup.desc.description")
        }
    ];
};

Bloonix.getContactgroup = function(id) {
    return Bloonix.get("/contactgroups/" +id);
};
Bloonix.listContacts = function(o) {
    Bloonix.setTitle("schema.contact.text.list");

    var table = new Table({
        url: "/contacts",
        header: {
            title: Text.get("schema.contact.text.list"),
            pager: true,
            search: true,
            icons: [
                {
                    type: "help",
                    callback: function() { Utils.open("/#help/contacts-and-notifications") },
                    title: Text.get("site.help.doc.contacts-and-notifications")
                },{
                    type: "create",
                    callback: function() { Bloonix.route.to("notification/contacts/create") },
                    title: Text.get("schema.contact.text.create")
                }
            ]
        },
        searchable: {
            url: "/contacts/search",
            result: [ "id", "name", "mail_to", "sms_to" ]
        },
        deletable: {
            title: Text.get("schema.contact.text.delete"),
            url: "/contacts/:id/delete",
            result: [ "id", "name", "mail_to" ]
        },
        appendTo: "#content",
        reloadable: true,
        columnSwitcher: true,
        columns: [
            {
                name: "id",
                text: Text.get("schema.contact.attr.id"),
                hide: true
            },{
                name: "name",
                text: Text.get("schema.contact.attr.name"),
                call: function(row) { return Bloonix.call("notification/contacts/"+ row.id +"/edit", row.name) },
            },{
                name: "company",
                text: Text.get("schema.company.attr.company"),
                call: function(row) {
                    return Bloonix.call(
                        "administration/companies/"+ row.company_id +"/edit", row.company
                    );
                },
                hide: true
            },{
                name: "mail_to",
                text: Text.get("schema.contact.attr.mail_to")
            },{
                name: "sms_to",
                text: Text.get("schema.contact.attr.sms_to")
            }
        ]
    });

    table.create();
};

Bloonix.createContact = function() {
    var contact = Bloonix.get("/contacts/options");

    Bloonix.setTitle("schema.contact.text.create");

    new Header({
        title: Text.get("schema.contact.text.create"),
        border: true
    }).create();

    new Form({
        url: { submit: "/contacts/create" },
        onSuccess: function(result) { Bloonix.route.to("notification/contacts/"+ result.id +"/edit") },
        action: "create",
        values: contact.values,
        options: contact.options,
        elements: Bloonix.getContactFormElements()
    }).create();
};

Bloonix.editContact = function(o) {
    var contact = Bloonix.get("/contacts/"+ o.id +"/options");

    Bloonix.setTitle("schema.contact.text.settings");

    new Header({
        title: Text.get("schema.contact.text.settings"),
        border: true
    }).create();

    new Form({
        url: { submit: "/contacts/"+ o.id +"/update" },
        title: Text.get("schema.contact.attr.id") + ": "+ o.id,
        values: contact.values,
        options: contact.options,
        elements: Bloonix.getContactFormElements()
    }).create();

    new Header({
        title: Text.get("schema.contact.text.timeperiods"),
        border: true
    }).create();

    var boxes = Bloonix.createSideBySideBoxes({
        container: $("#content"),
        width: "300px",
        marginLeft: "310px"
    });

    var timeperiodTable = new Table({
        url: "/contacts/"+ o.id +"/timeperiods",
        width: "inline",
        appendTo: boxes.right,
        selectable: false,
        searchable: false,
        deletable: {
            url: "/contacts/"+ o.id +"/timeperiods/:id/remove",
            title: Text.get("schema.contact.text.remove_timeperiod"),
            result: [ "name", "description", "type", "timezone" ],
            buttonText: Text.get("action.remove")
        },
        columns: [
            {
                name: "id",
                text: "ID",
                hide: true
            },{
                name: "name",
                text: Text.get("schema.timeperiod.attr.name")
            },{
                name: "description",
                text: Text.get("schema.timeperiod.attr.description")
            },{
                name: "type",
                text: Text.get("schema.contact.text.timeperiod_type"),
                value: function(row) {
                    return Text.get("schema.contact.text.timeperiod_type_"+ row.type);
                }
            },{
                name: "timezone",
                text: Text.get("word.Timezone")
            }
        ]
    });

    var timeperiodContainer = Utils.create("div").appendTo("#content");

    var timeperiodForm = new Form({
        url: { submit: "/contacts/"+ o.id +"/timeperiods/add" },
        format: "medium",
        appendTo: boxes.left,
        showButton: false,
        onSuccess: function() { timeperiodTable.getData() }
    });     

    timeperiodForm.create();

    var options = Bloonix.get("/contacts/"+ o.id +"/timeperiods/options/");

    timeperiodForm.select({
        name: "timeperiod_id",
        placeholder: Text.get("schema.timeperiod.attr.name"),
        options: options.options.timeperiod_id,
        selected: options.values.timeperiod_id,
        appendTo: timeperiodForm.form
    });

    timeperiodForm.select({
        name: "type",
        placeholder: Text.get("schema.contact.text.timeperiod_type"),
        options: options.options.type,
        selected: options.values.type,
        appendTo: timeperiodForm.form,
        getValueName: function(value) {
            return Text.get("schema.contact.text.timeperiod_type_"+ value);
        }
    });

    timeperiodForm.select({
        name: "timezone",
        placeholder: Text.get("word.Timezone"),
        options: options.options.timezone,
        selected: options.values.timezone,
        appendTo: timeperiodForm.form
    });

    timeperiodForm.button({
        css: { "margin-right": "10px" },
        text: Text.get("action.add"),
        appendTo: timeperiodForm.form,
        onSuccess: function() { timeperiodTable.getData() }
    });         

    timeperiodTable.create();
};

Bloonix.getContactFormElements = function() {
    return [
        {
            element: "input",
            type: "text",
            name: "name",
            text: Text.get("schema.contact.attr.name"),
            desc: Text.get("schema.contact.desc.name"),
            maxlength: 100,
            required: true
        },{
            element: "input",
            type: "email",
            name: "mail_to",
            text: Text.get("schema.contact.attr.mail_to"),
            desc: Text.get("schema.contact.desc.mail_to"),
            maxlength: 100,
            required: true
        },{
            element: "radio-yes-no",
            name: "mail_notifications_enabled",
            text: Text.get("schema.contact.attr.mail_notifications_enabled"),
            desc: Text.get("schema.contact.desc.mail_notifications_enabled"),
            required: true
        },{
            element: "checkbox",
            name: "mail_notification_level",
            text: Text.get("schema.contact.attr.mail_notification_level"),
            desc: Text.get("schema.contact.desc.mail_notification_level"),
            commaSeparatedList: true,
            required: true
        },{
            element: "input",
            type: "tel",
            name: "sms_to",
            text: Text.get("schema.contact.attr.sms_to"),
            desc: Text.get("schema.contact.desc.sms_to"),
            maxlength: 100
        },{
            element: "radio-yes-no",
            name: "sms_notifications_enabled",
            text: Text.get("schema.contact.attr.sms_notifications_enabled"),
            desc: Text.get("schema.contact.desc.sms_notifications_enabled"),
            required: true
        },{
            element: "checkbox",
            name: "sms_notification_level",
            text: Text.get("schema.contact.attr.sms_notification_level"),
            desc: Text.get("schema.contact.desc.sms_notification_level"),
            commaSeparatedList: true,
            required: true
        },{
            element: "select",
            name: "escalation_level",
            text: Text.get("schema.contact.attr.escalation_level"),
            desc: Text.get("schema.contact.desc.escalation_level"),
            getValueName: function(value) {
                if (value == 0) {
                    return Text.get("schema.contact.text.escalation_level_event.0");
                }
                if (value == 1) {
                    return Text.get("schema.contact.text.escalation_level_event.1");
                }
                return Text.get("schema.contact.text.escalation_level_event.x", value);
            },
            required: true
        }
    ];
};
Bloonix.listTimeperiods = function() {
    Bloonix.setTitle("schema.timeperiod.text.list");

    var table = new Table({
        url: "/timeperiods",
        header: {
            title: Text.get("schema.timeperiod.text.list"),
            pager: true,
            search: true,
            icons: [{
                type: "create",
                callback: function() { Bloonix.route.to("notification/timeperiods/create") },
                title: Text.get("schema.timeperiod.text.create")
            }]
        },
        searchable: {
            url: "/timeperiods/search",
            result: [ "id", "name", "description" ]
        },
        deletable: {
            title: Text.get("schema.timeperiod.text.delete"),
            url: "/timeperiods/:id/delete",
            result: [ "name", "description" ]
        },
        appendTo: "#content",
        reloadable: true,
        columnSwitcher: true,
        columns: [
            {
                name: "id",
                text: Text.get("schema.timeperiod.attr.id"),
                hide: true
            },{
                name: "name",
                text: Text.get("schema.timeperiod.attr.name"),
                call: function(row) { return Bloonix.call("notification/timeperiods/"+ row.id +"/edit", row.name) }
            },{
                name: "company",
                text: Text.get("schema.company.attr.company"),
                call: function(row) {
                    return Bloonix.call(
                        "administration/companies/settings/"+ row.company_id, row.company
                    );
                },
                hide: true
            },{
                name: "description",
                text: Text.get("schema.timeperiod.attr.description")
            }
        ]
    });

    table.create();
};

Bloonix.createTimeperiod = function() {
    Bloonix.setTitle("schema.timeperiod.text.create");

    new Header({ title: Text.get("schema.timeperiod.text.create") }).create();

    new Form({
        url: { submit: "/timeperiods/create" },
        onSuccess: function(result) {
            Bloonix.route.to("notification/timeperiods/"+ result.id +"/edit");
        },
        action: "create",
        elements: Bloonix.getTimeperiodFormElements()
    }).create();
};

Bloonix.editTimeperiod = function(o) {
    Bloonix.setTitle("schema.timeperiod.text.settings");

    new Header({ title: Text.get("schema.timeperiod.text.settings"), border: true }).create();

    new Form({
        url: { submit: "/timeperiods/"+ o.id +"/update" },
        action: "update",
        values: Bloonix.getTimeperiod(o.id),
        elements: Bloonix.getTimeperiodFormElements()
    }).create();

    new Header({ title: Text.get("schema.timeslice.text.list"), border: true }).create();

    var timesliceTable = new Table({
        url: "/timeperiods/"+ o.id +"/timeslices",
        width: "inline",
        selectable: false,
        searchable: false,
        deletable: {
            title: Text.get("schema.timeslice.text.delete"),
            url: "/timeperiods/"+ o.id +"/timeslices/:id/delete",
            result: [ "id", "timeslice" ]
        },
        columns: [
            {
                name: "id",
                text: Text.get("schema.timeslice.attr.id"),
                hide: true
            },{
                name: "timeperiod_id",
                text: Text.get("schema.timeperiod.attr.id"),
                hide: true
            },{
                name: "timeslice",
                text: Text.get("schema.timeslice.attr.timeslice")
            }
        ]
    });

    var timesliceContainer = Utils.create("div").appendTo("#content");
    var timesliceForm = new Form({
        url: { submit: "/timeperiods/"+ o.id +"/timeslices/create" },
        format: "medium",
        appendTo: "#content",
        showButton: false,
        onSuccess: function() { timesliceTable.getData() }
    });

    timesliceForm.init();
    var timesliceBox = Utils.create("div")
        .css({ position: "relative" })
        .appendTo(timesliceForm.form);

    timesliceForm.button({
        css: { "margin-right": "10px" },
        text: Text.get("action.add"),
        appendTo: timesliceBox
    });

    timesliceForm.input({
        name: "timeslice",
        value: "",
        placeholder: "Monday - Sunday 00:00 - 23:59",
        appendTo: timesliceBox
    });

    timesliceForm.desc({
        title: Text.get("schema.timeperiod.text.examples"),
        desc: Text.get("schema.timeperiod.examples"),
        width: "600px",
        appendTo: timesliceBox
    });

    timesliceTable.create();
};

Bloonix.getTimeperiodFormElements = function() {
    return [
        {
            element: "input",
            name: "name",
            maxlength: 40,
            text: Text.get("schema.timeperiod.attr.name"),
            desc: Text.get("schema.timeperiod.desc.name"),
            required: true
        },{
            element: "input",
            name: "description",
            maxlength: 100,
            text: Text.get("schema.timeperiod.attr.description"),
            desc: Text.get("schema.timeperiod.desc.description")
        }
    ];
};

Bloonix.getTimeperiod = function(id) {
    return Bloonix.get("/timeperiods/"+ id);
};
Bloonix.listUsers = function() {
    Bloonix.setTitle("schema.user.text.list");

    var table = new Table({
        url: "/administration/users",
        header: {
            title: Text.get("schema.user.text.list"),
            pager: true,
            search: true,
            icons: [
                {
                    type: "help",
                    callback: function() { Utils.open("/#help/users-and-groups") },
                    title: Text.get("site.help.doc.users-and-groups")
                },{
                    type: "create",
                    callback: function() { Bloonix.route.to("administration/users/create") },
                    title: Text.get("schema.user.text.create")
                }
            ]
        },
        searchable: {
            url: "/administration/users/search/",
            result: [ "id", "username", "company", "name", "role" ]
        },
        deletable: {
            title: Text.get("schema.user.text.delete"),
            url: "/administration/users/:id/delete",
            result: [ "id", "username" ]
        },
        sortable: true,
        reloadable: true,
        columnSwitcher: true,
        columns: [
            {
                name: "id",
                text: Text.get("schema.user.attr.id"),
                hide: true
            },{
                name: "username",
                text: Text.get("schema.user.attr.username"),
                call: function(row) { return Bloonix.call("administration/users/"+ row.id +"/edit", row.username) }
            },{
                name: "company",
                text: Text.get("schema.company.attr.company"),
                call: function(row) {
                    return Bloonix.call(
                        "administration/companies/"+ row.company_id +"/edit", row.company
                    )
                },
                hide: Bloonix.user.role == "admin" ? false : true
            },{
                name: "name",
                text: Text.get("schema.user.attr.name")
            },{
                name: "phone",
                text: Text.get("schema.user.attr.phone")
            },{
                name: "manage_contacts",
                text: Text.get("schema.user.attr.manage_contacts"),
                hide: true,
                bool: "yn"
            },{
                name: "manage_templates",
                text: Text.get("schema.user.attr.manage_templates"),
                hide: true,
                bool: "yn"
            },{
                name: "last_login",
                text: Text.get("schema.user.attr.last_login")
            },{
                name: "is_logged_in",
                text: Text.get("schema.user.text.is_logged_in"),
                bool: "yn",
                sortable: false
            },{
                name: "session_expires",
                text: Text.get("schema.user.text.session_expires"),
                hide: true,
                sortable: false
            },{
                name: "locked",
                text: Text.get("schema.user.attr.locked"),
                hide: true,
                bool: "yn"
            },{
                name: "role",
                text: Text.get("schema.user.attr.role")
            },{ 
                name: "comment",
                text: Text.get("schema.user.attr.comment"),
                hide: true
            },{ 
                name: "allow_from",
                text: Text.get("schema.user.attr.allow_from"),
                hide: true
            },{ 
                name: "timezone",
                text: Text.get("schema.user.attr.timezone"),
                hide: true
            },{
                name: "operate_as",
                icons: [
                    {
                        check: function() { return Bloonix.user.role == "admin" ? true : false },
                        icon: "cicons arrow-right-orange",
                        text: Text.get("action.operate_as"),
                        link: "operateas/:id"
                    }
                ]
            }
        ]
    });

    table.create();
};

Bloonix.editUser = function(o) {
    var user = Bloonix.get("/administration/users/" + o.id +"/options");

    Bloonix.setTitle("schema.user.text.view", user.values.username);
    new Header({ title: Text.get("schema.user.text.view", user.values.username, true) }).create();

    new Form({
        url: { submit: "/administration/users/"+ o.id +"/update" },
        title: Text.get("schema.user.attr.id") +": "+ o.id,
        action: "update",
        values: user.values,
        options: user.options,
        elements: Bloonix.getUserFormElements()
    }).create();
};

Bloonix.createUser = function() {
    var user = Bloonix.get("/administration/users/options");

    Bloonix.setTitle("schema.user.text.create");
    new Header({ title: Text.get("schema.user.text.create") }).create();

    new Form({
        url: { submit: "/administration/users/create" },
        action: "create",
        values: user.values,
        options: user.options,
        elements: Bloonix.getUserFormElements()
    }).create();
};

Bloonix.getUserFormElements = function() {
    return [
        {
            element: "select",
            name: "company_id",
            text: Text.get("schema.company.attr.company"),
            desc: Text.get("schema.user.desc.company"),
            required: true
        },{
            element: "input",
            type: "email",
            name: "username",
            text: Text.get("schema.user.attr.username"),
            desc: Text.get("schema.user.desc.username"),
            minlength: 6,
            maxlength: 50,
            required: true
        },{
            element: "input",
            type: "text",
            name: "name",
            text: Text.get("schema.user.attr.name"),
            desc: Text.get("schema.user.desc.name"),
            maxlength: 50,
            required: true
        },{
            element: "input",
            type: "text",
            name: "phone",
            text: Text.get("schema.user.attr.phone"),
            desc: Text.get("schema.user.desc.phone"),
            maxlength: 100
        },{
            element: "select",
            name: "timezone",
            text: Text.get("schema.user.attr.timezone"),
            desc: Text.get("schema.user.desc.timezone")
        },{
            element: "select",
            name: "role",
            text: Text.get("schema.user.attr.role"),
            desc: Text.get("schema.user.desc.role"),
            required: true
        },{
            element: "radio-yes-no",
            name: "manage_contacts",
            text: Text.get("schema.user.attr.manage_contacts"),
            desc: Text.get("schema.user.desc.manage_contacts"),
            required: true
        },{
            element: "radio-yes-no",
            name: "manage_templates",
            text: Text.get("schema.user.attr.manage_templates"),
            desc: Text.get("schema.user.desc.manage_templates"),
            required: true
        },{
            element: "input",
            type: "text",
            name: "password",
            text: Text.get("schema.user.attr.password"),
            desc: Text.get("schema.user.desc.password"),
            minlength: 8,
            maxlength: 128,
            genString: 30,
            required: true
        },{
            element: "input",
            type: "text",
            name: "authentication_key",
            text: Text.get("schema.user.attr.authentication_key"),
            desc: Text.get("schema.user.desc.authentication_key"),
            minlength: 30,
            maxlength: 128,
            genString: 30
        },{
            element: "radio-yes-no",
            name: "password_changed",
            text: Text.get("schema.user.attr.password_changed"),
            desc: Text.get("schema.user.desc.password_changed"),
            required: true
        },{
            element: "radio-yes-no",
            name: "locked",
            text: Text.get("schema.user.attr.locked"),
            desc: Text.get("schema.user.desc.locked"),
            required: true
        },{
            element: "input",
            type: "text",
            name: "allow_from",
            text: Text.get("schema.user.attr.allow_from"),
            desc: Text.get("schema.user.desc.allow_from"),
            maxlength: 300
        },{
            element: "input",
            type: "text",
            name: "comment",
            text: Text.get("schema.user.attr.comment"),
            desc: Text.get("schema.user.desc.comment"),
            maxlength: 200
        }
    ];
};

Bloonix.saveUserConfig = function(key, data) {
    Ajax.post({
        url: "/user/config/save",
        data: { key: key, data: data },
        async: false,
        success: function(result) {
            if (data.status == "ok") {
                if (key === "dashboard") {
                    Bloonix.user.stash[key][data.name] = data.data;
                } else {
                    Bloonix.user.stash[key] = result.data;
                }
                Bloonix.createNoteBox({
                    infoClass: "info-ok",
                    text: Text.get("info.update_success"),
                    autoClose: true
                });
            }
        }
    });
};

Bloonix.changeUserPassword = function(o) {
    var opts = Utils.extend({ force: false }, o),
        content = Utils.create("div");

    var overlay = new Overlay({
        title: Text.get("schema.user.text.password_update"),
        content: content,
        visible: true
    });

    if (opts.force) {
        overlay.closeText = Text.get("action.abort");
        overlay.closeCallback = function() { location.href = "/logout" };
    }

    var form = new Form({
        url: { submit: "/user/passwd" },
        onSuccess: function() {
            overlay.close();
            if (opts.force) {
                location.href = "/";
            } else {
                Bloonix.createNoteBox({
                    infoClass: "info-ok",
                    text: Text.get("update.success")
                });
            }
        },
        format: "medium",
        appendTo: content,
        showButton: false
    }).create();

    form.input({
        name: "current",
        type: "password",
        placeholder: Text.get("schema.user.text.current_password"),
        appendTo: form.form
    });

    Utils.create("br").appendTo(form.form);

    form.input({
        name: "new",
        type: "password",
        placeholder: Text.get("schema.user.text.new_password"),
        maxlength: 128,
        minlength: 8,
        appendTo: form.form
    });

    Utils.create("br").appendTo(form.form);

    form.input({
        name: "repeat",
        type: "password",
        placeholder: Text.get("schema.user.text.repeat_password"),
        appendTo: form.form
    });

    Utils.create("br").appendTo(form.form);

    form.button({
        text: Text.get("action.update"),
        appendTo: form.form
    });

    overlay.create();

    if (opts.force) {
        throw new Error();
    }
};

Bloonix.changeUserSettings = function() {
    Bloonix.changeUserPassword();
};

Bloonix.changeUserLanguage = function() {
    var content = Utils.create("div");

    var table = new Table({
        type: "vtable",
        appendTo: content
    }).init();

    $.each([
        { text: "English", flag: "gb", lang: "en" },
        { text: "Deutsch", flag: "de", lang: "de" }
    ], function(i, item) {
        var row = table.createFormRow(
            Utils.create("span")
                .addClass("f32")
                .html( Utils.create("span").addClass("flag "+ item.flag) ),
            item.text
        );

        row.tr.css({ cursor: "pointer" });
        row.tr.click(function() {
            Ajax.post({
                url: "/lang/"+ item.lang,
                success: function() {
                    location.href = "/";
                }
            });
        });
    });

    Utils.create("p")
        .css({ width: "300px", "font-size": "12px", "margin-top": "15px" })
        .html( Text.get("schema.user.desc.select_language") )
        .appendTo(content);

    var overlay = new Overlay({
        title: Text.get("schema.user.text.select_language"),
        content: content
    }).create();
};
Bloonix.listGroups = function() {
    Bloonix.setTitle("schema.group.text.list");

    var table = new Table({
        url: "/administration/groups",
        header: {
            title: Text.get("schema.group.text.list"),
            pager: true,
            search: true,
            icons: [
                {
                    type: "help",
                    callback: function() { Utils.open("/#help/users-and-groups") },
                    title: Text.get("site.help.doc.users-and-groups")
                },{
                    type: "create",
                    callback: function() { Bloonix.route.to("administration/groups/create") },
                    title: Text.get("schema.group.text.create")
                }
            ]
        },
        searchable: {
            url: "/administration/groups/search/",
            result: [ "id", "groupname", "company", "description" ]
        },
        deletable: {
            title: Text.get("schema.group.text.delete"),
            url: "/administration/groups/:id/delete",
            result: [ "id", "groupname" ]
        },
        sortable: true,
        reloadable: true,
        columnSwitcher: true,
        columns: [
            {
                name: "id",
                text: Text.get("schema.group.attr.id"),
                hide: true
            },{
                name: "groupname",
                text: Text.get("schema.group.attr.groupname"),
                call: function(row) { return Bloonix.call("administration/groups/"+ row.id +"/edit", row.groupname) }
            },{
                name: "company",
                text: Text.get("schema.company.attr.company"),
                call: function(row) {
                    return Bloonix.call(
                        "administration/companies/"+ row.company_id +"/edit", row.company
                    );
                },
                hide: Bloonix.user.role == "admin" ? false : true
            },{
                name: "description",
                text: Text.get("schema.group.attr.description")
            }
        ]
    }).create();
};

Bloonix.editGroup = function(o) {
    var group = Bloonix.get("/administration/groups/"+ o.id +"/options");
    o.groupname = group.values.groupname;

    new Header({ title: Text.get("schema.group.text.settings") }).create();
    Bloonix.setTitle("schema.group.text.settings");
    Bloonix.showGroupSubNavigation();

    new Form({
        url: { submit: "/administration/groups/"+ o.id +"/update" },
        title: Text.get("schema.group.attr.id") + ": "+ o.id,
        appendTo: "#int-group-form",
        options: group.options,
        values: group.values,
        elements: Bloonix.getGroupFormElements()
    }).create();

    Bloonix.createHostGroupMemberForm(o);
    Bloonix.createUserGroupMember(o);
    Bloonix.createUserGroupMemberList(o);
    Bloonix.createUserGroupMemberForm(o);
};

Bloonix.createGroup = function() {
    var group = Bloonix.get("/administration/groups/options");
    new Header({ title: Text.get("schema.group.text.create") }).create();
    Bloonix.setTitle("schema.group.text.create");
    new Form({
        url: { submit: "/administration/groups/create" },
        action: "create",
        onSuccess: function(result) { Bloonix.route.to("administration/groups/"+ result.id +"/edit") },
        options: group.options,
        values: group.values,
        elements: Bloonix.getGroupFormElements()
    }).create();
};

Bloonix.getGroupFormElements = function() {
    return [
        {
            element: "select",
            name: "company_id",
            text: Text.get("schema.company.attr.company"),
            desc: Text.get("schema.group.desc.company"),
            required: true
        },{
            element: "input",
            type: "text",
            name: "groupname",
            text: Text.get("schema.group.attr.groupname"),
            desc: Text.get("schema.group.desc.groupname"),
            maxlength: 64,
            required: true
        },{
            element: "input",
            type: "text",
            name: "description",
            text: Text.get("schema.group.attr.description"),
            desc: Text.get("schema.group.desc.description"),
            maxlength: 100
        }
    ];
};

Bloonix.createHostGroupMemberForm = function(o) {
    var form = new Form();

    form.group({
        appendTo: "#int-host-form",
        title: Text.get("schema.group.text.group_members", o.groupname),
        subtitle: Text.get("schema.group.attr.id") +": "+ o.id,
        left: {
            title: Text.get("schema.group.text.host_members"),
            listURL: "/administration/groups/"+ o.id +"/members/hosts/list/",
            searchURL: "/administration/groups/"+ o.id +"/members/hosts/search/",
            updateMember: "/administration/groups/"+ o.id +"/members/hosts/remove/"
        },
        right: {
            title: Text.get("schema.group.text.host_nonmembers"),
            listURL: "/administration/groups/"+ o.id +"/members/hosts/list-non/",
            searchURL: "/administration/groups/"+ o.id +"/members/hosts/search-non/",
            updateMember: "/administration/groups/"+ o.id +"/members/hosts/add/"
        },
        columns: [
            {
                name: "id",
                text: Text.get("schema.host.attr.id")
            },{
                name: "hostname",
                text: Text.get("schema.host.attr.hostname")
            },{
                name: "ipaddr",
                text: Text.get("schema.host.attr.ipaddr")
            }
        ],
        selectable: {
            key: "id",
            title: Text.get("schema.group.text.selected_hosts"),
            result: [ "id", "hostname", "ipaddr" ]
        },
        searchable: {
            result: [ "id", "hostname", "ipaddr" ]
        }
    });

    var userContainer = Utils.create("div")
        .attr("id", "int-user-group")
        .css({ width: "600px" })
        .appendTo("#int-user-form");

    Utils.create("div")
        .attr("id", "int-user-group-header")
        .appendTo(userContainer);

    Utils.create("div")
        .attr("id", "int-user-group-list-non")
        .css({ "text-align": "right" })
        .appendTo(userContainer);

    Utils.create("div")
        .attr("id", "int-user-group-list")
        .appendTo(userContainer);

    Utils.create("div")
        .addClass("clear")
        .appendTo(userContainer);
};

Bloonix.createUserGroupMember = function(o) {
    $("#int-user-group-header").html("");

    Utils.create("div")
        .addClass("form-title")
        .html(Text.get("schema.group.text.group_members", Utils.escape(o.groupname)))
        .appendTo("#int-user-group-header");

    Utils.create("div")
        .addClass("form-subtitle")
        .html(Text.get("schema.group.attr.id") +": "+ o.id)
        .appendTo("#int-user-group-header");
};

Bloonix.createUserGroupMemberList = function(o) {
    $("#int-user-group-list").html("");

    var table = new Table({
        url: "/administration/groups/"+ o.id +"/members/users/list/",
        appendTo: "#int-user-group-list",
        deletable: {
            title: Text.get("schema.group.text.remove_user"),
            url: "/administration/groups/"+ o.id +"/members/users/remove/",
            result: [ "username", "create_service", "update_service", "delete_service" ],
            buttonText: Text.get("action.remove"),
            successCallback: function() { Bloonix.refreshUserGroupForm(o) }
        },
        columns: [
            {
                name: "username",
                text: Text.get("schema.user.attr.username"),
                callback: function(row) { Bloonix.modifyUserGroupMember(o, "update", row) }
            },{
                name: "create_service",
                text: Text.get("schema.group.text.may_create_services"),
                bool: "yn"
            },{
                name: "update_service",
                text: Text.get("schema.group.text.may_modify_services"),
                bool: "yn"
            },{
                name: "delete_service",
                text: Text.get("schema.group.text.may_delete_services"),
                bool: "yn"
            }
        ]
    });

    table.create();
};

Bloonix.createUserGroupMemberForm = function(o) {
    $("#int-user-group-list-non").html("");

    Ajax.post({
        url: "/administration/groups/"+ o.id +"/members/users/list-non/",
        success: function(result) {
            if (result.status == "ok") {
                var options = [];
                $.each(result.data, function(i, row) {
                    options.push({ name: row.username, value: row.id });
                })
                new Form({ format: "medium" }).select({
                    placeholder: Text.get("schema.group.text.add_user"),
                    name: "user_id",
                    options: options,
                    appendTo: "#int-user-group-list-non",
                    callback: function(name, value) {
                        Bloonix.modifyUserGroupMember(
                            o, "add", {
                                username: name,
                                user_id: value,
                                create_service: 0,
                                update_service: 0,
                                delete_service: 0
                            }
                        );
                    },
                    passNameValue: true
                });
            }
        }
    });
};

Bloonix.modifyUserGroupMember = function(o, action, row) {
    var container = Utils.create("div");

    var form = new Form({
        id: "user-group-member",
        appendTo: container,
        showButton: false,
        title: row.username,
        elements: [
            {
                element: "radio-yes-no",
                name: "create_service",
                text: Text.get("schema.group.text.may_create_services")
            },{
                element: "radio-yes-no",
                name: "update_service",
                text: Text.get("schema.group.text.may_modify_services")
            },{
                element: "radio-yes-no",
                name: "delete_service",
                text: Text.get("schema.group.text.may_delete_services")
            },
        ],
        values: {
            create_service: row.create_service,
            update_service: row.update_service,
            delete_service: row.delete_service
        }
    }).create();

    new Overlay({
        title: Text.get("schema.group.text."+ action),
        content: container,
        buttons: [{
            content: Text.get("action."+ action),
            callback: function() {
                var data = form.getData();
                data.id = row.user_id;
                Ajax.post({
                    url: "/administration/groups/"+ o.id +"/members/users/"+ action +"/",
                    data: data,
                    async: false,
                    token: true,
                    success: function(updateResult) {
                        if (updateResult.status == "ok") {
                            Bloonix.refreshUserGroupForm(o);
                        }
                    }
                });
            }
        }]
    }).create();
};

Bloonix.refreshUserGroupForm = function(o) {
    Bloonix.createUserGroupMemberList(o);
    Bloonix.createUserGroupMemberForm(o);
};
Bloonix.listCompanies = function() {
    Bloonix.setTitle("schema.company.text.list");

    new Table({
        url: "/administration/companies",
        header: {
            title: Text.get("schema.company.text.list"),
            pager: true,
            search: true,
            icons: [{
                type: "create",
                callback: function() { Bloonix.route.to("administration/companies/create") },
                title: Text.get("schema.company.text.create")
            }]
        },
        searchable: {
            url: "/administration/companies/search/",
            result: [
                "id", "alt_company_id", "company", "title", "name",
                "surname", "zipcode", "city", "country", "email"
            ]
        },
        deletable: {
            title: Text.get("schema.company.text.delete"),
            url: "/administration/companies/:id/delete/",
            result: [ "id", "alt_company_id", "company" ]
        },
        sortable: true,
        reloadable: true,
        columnSwitcher: true,
        columns: [
            {
                name: "id",
                text: Text.get("schema.company.attr.id"),
                hide: true
            },{
                name: "alt_company_id",
                text: Text.get("schema.company.attr.alt_company_id"),
                hide: true
            },{
                name: "company",
                text: Text.get("schema.company.attr.company"),
                call: function(row) { return Bloonix.call("administration/companies/"+ row.id +"/edit", row.company) }
            },{
                name: "sla",
                text: Text.get("schema.company.attr.sla"),
                prefix: Text.get("schema.company.attr.sla"),
                wrapNameValueClass: true
            },{
                name: "email",
                text: Text.get("schema.company.attr.email")
            },{
                name: "count_hosts_services",
                text: Text.get("word.Hosts") + "/" + Text.get("word.Services"),
                sortable: false
            },{
                name: "title",
                text: Text.get("schema.company.attr.title"),
                hide: true
            },{
                name: "name",
                text: Text.get("schema.company.attr.name")
            },{
                name: "surname",
                text: Text.get("schema.company.attr.surname"),
                hide: true
            },{
                name: "address1",
                text: Text.get("schema.company.attr.address1"),
                hide: true
            },{
                name: "address2",
                text: Text.get("schema.company.attr.address2"),
                hide: true
            },{
                name: "zipcode",
                text: Text.get("schema.company.attr.zipcode"),
                hide: true
            },{
                name: "city",
                text: Text.get("schema.company.attr.city"),
                hide: true
            },{
                name: "state",
                text: Text.get("schema.company.attr.state"),
                hide: true
            },{
                name: "country",
                text: Text.get("schema.company.attr.country"),
                hide: true
            },{
                name: "phone",
                text: Text.get("schema.company.attr.phone"),
                hide: true
            },{
                name: "fax",
                text: Text.get("schema.company.attr.fax"),
                hide: true
            },{
                name: "active",
                text: Text.get("schema.company.attr.active"),
                bool: "yn"
            },{
                name: "max_services",
                text: Text.get("schema.company.attr.max_services")
            },{
                name: "sms_enabled",
                text: Text.get("schema.company.attr.sms_enabled"),
                bool: "yn"
            },{
                name: "comment",
                text: Text.get("schema.company.attr.comment"),
                hide: true
            }
        ]
    }).create();
};

Bloonix.editCompany = function(o) {
    var company = Bloonix.get("/administration/companies/"+ o.id +"/options/");

    new Header({ title: Text.get("schema.company.text.view", company.values.company, true) }).create();
    Bloonix.setMetaTitle(Text.get("schema.company.text.view", company.values.company));

    new Form({
        url: { submit: "/administration/companies/"+ o.id +"/update/" },
        buttonText: Text.get("action.update"),
        values: company.values,
        options: company.options,
        elements: Bloonix.getCompanyFormElements()
    }).create();
};

Bloonix.createCompany = function() {
    var company = Bloonix.get("/administration/companies/options/");

    new Header({ title: Text.get("schema.company.text.create") }).create();
    Bloonix.setTitle("schema.company.text.create");

    new Form({
        url: { submit: "/administration/companies/create/" },
        buttonText: Text.get("action.create"),
        values: company.values,
        options: company.options,
        elements: Bloonix.getCompanyFormElements()
    }).create();
};

Bloonix.getCompanyFormElements = function() {
    return [
        {
            element: "input",
            type: "text",
            name: "alt_company_id",
            text: Text.get("schema.company.attr.alt_company_id"),
            maxlength: 64,
            required: true
        },{
            element: "input",
            type: "text",
            name: "company",
            text: Text.get("schema.company.attr.company"),
            maxlength: 100,
            required: true
        },{
            element: "select",
            name: "sla",
            text: Text.get("schema.company.attr.sla")
        },{
            element: "input",
            type: "email",
            name: "email",
            text: Text.get("schema.company.attr.email"),
            maxlength: 100,
            required: true
        },{
            element: "input",
            type: "text",
            name: "title",
            text: Text.get("schema.company.attr.title"),
            maxlength: 30
        },{
            element: "input",
            type: "text",
            name: "name",
            text: Text.get("schema.company.attr.name"),
            maxlength: 100
        },{
            element: "input",
            type: "text",
            name: "surname",
            text: Text.get("schema.company.attr.surname"),
            maxlength: 100
        },{
            element: "input",
            type: "text",
            name: "address1",
            text: Text.get("schema.company.attr.address1"),
            maxlength: 100
        },{
            element: "input",
            type: "text",
            name: "address2",
            text: Text.get("schema.company.attr.address2"),
            maxlength: 100
        },{
            element: "input",
            type: "text",
            name: "zipcode",
            text: Text.get("schema.company.attr.zipcode"),
            maxlength: 20
        },{
            element: "input",
            type: "text",
            name: "city",
            text: Text.get("schema.company.attr.city"),
            maxlength: 100
        },{
            element: "input",
            type: "text",
            name: "state",
            text: Text.get("schema.company.attr.state"),
            maxlength: 100
        },{
            element: "input",
            type: "text",
            name: "country",
            text: Text.get("schema.company.attr.country"),
            maxlength: 100
        },{
            element: "input",
            type: "tel",
            name: "phone",
            text: Text.get("schema.company.attr.phone"),
            maxlength: 100
        },{
            element: "input",
            type: "tel",
            name: "fax",
            text: Text.get("schema.company.attr.fax"),
            maxlength: 100
        },{
            element: "radio-yes-no",
            name: "active",
            text: Text.get("schema.company.attr.active"),
            desc: Text.get("schema.company.desc.active")
        },{
            element: "input",
            type: "text",
            name: "max_templates",
            text: Text.get("schema.company.attr.max_templates"),
            desc: Text.get("schema.company.desc.max_templates"),
            minvalue: 0, maxvalue: 2147483647
        },{
            element: "input",
            type: "text",
            name: "max_hosts",
            text: Text.get("schema.company.attr.max_hosts"),
            desc: Text.get("schema.company.desc.max_hosts"),
            minvalue: 0, maxvalue: 9999999999
        },{
            element: "input",
            type: "text",
            name: "max_services",
            text: Text.get("schema.company.attr.max_services"),
            desc: Text.get("schema.company.desc.max_services"),
            minvalue: 0, maxvalue: 9999999999
        },{
            element: "input",
            type: "text",
            name: "max_services_per_host",
            text: Text.get("schema.company.attr.max_services_per_host"),
            desc: Text.get("schema.company.desc.max_services_per_host"),
            minvalue: 0, maxvalue: 32767
        },{
            element: "input",
            type: "text",
            name: "max_contacts",
            text: Text.get("schema.company.attr.max_contacts"),
            desc: Text.get("schema.company.desc.max_contacts"),
            minvalue: 0, maxvalue: 32767
        },{
            element: "input",
            type: "text",
            name: "max_contactgroups",
            text: Text.get("schema.company.attr.max_contactgroups"),
            desc: Text.get("schema.company.desc.max_contactgroups"),
            minvalue: 0, maxvalue: 32767
        },{
            element: "input",
            type: "text",
            name: "max_timeperiods",
            text: Text.get("schema.company.attr.max_timeperiods"),
            desc: Text.get("schema.company.desc.max_timeperiods"),
            minvalue: 0, maxvalue: 32767
        },{
            element: "input",
            type: "text",
            name: "max_timeslices_per_object",
            text: Text.get("schema.company.attr.max_timeslices_per_object"),
            desc: Text.get("schema.company.desc.max_timeslices_per_object"),
            minvalue: 0, maxvalue: 32767
        },{
            element: "input",
            type: "text",
            name: "max_groups",
            text: Text.get("schema.company.attr.max_groups"),
            desc: Text.get("schema.company.desc.max_groups"),
            minvalue: 0, maxvalue: 32767
        },{
            element: "input",
            type: "text",
            name: "max_users",
            text: Text.get("schema.company.attr.max_users"),
            desc: Text.get("schema.company.desc.max_users"),
            minvalue: 0, maxvalue: 32767
        },{
            element: "input",
            type: "text",
            name: "max_dependencies_per_host",
            text: Text.get("schema.company.attr.max_dependencies_per_host"),
            desc: Text.get("schema.company.desc.max_dependencies_per_host"),
            minvalue: 0, maxvalue: 32767
        },{
            element: "input",
            type: "text",
            name: "max_downtimes_per_host",
            text: Text.get("schema.company.attr.max_downtimes_per_host"),
            desc: Text.get("schema.company.desc.max_downtimes_per_host"),
            minvalue: 0, maxvalue: 32767
        },{
            element: "input",
            type: "text",
            name: "max_chart_views_per_user",
            text: Text.get("schema.company.attr.max_chart_views_per_user"),
            desc: Text.get("schema.company.desc.max_chart_views_per_user"),
            minvalue: 0, maxvalue: 9999999999
        },{
            element: "input",
            type: "text",
            name: "max_charts_per_user",
            text: Text.get("schema.company.attr.max_charts_per_user"),
            desc: Text.get("schema.company.desc.max_charts_per_user"),
            minvalue: 0, maxvalue: 9999999999
        },{
            element: "input",
            type: "text",
            name: "max_metrics_per_chart",
            text: Text.get("schema.company.attr.max_metrics_per_chart"),
            desc: Text.get("schema.company.desc.max_metrics_per_chart"),
            minvalue: 0, maxvalue: 9999999999
        },{
            element: "input",
            type: "text",
            name: "max_dashboards_per_user",
            text: Text.get("schema.company.attr.max_dashboards_per_user"),
            desc: Text.get("schema.company.desc.max_dashboards_per_user"),
            minvalue: 0, maxvalue: 32767
        },{
            element: "input",
            type: "text",
            name: "max_dashlets_per_dashboard",
            text: Text.get("schema.company.attr.max_dashlets_per_dashboard"),
            desc: Text.get("schema.company.desc.max_dashlets_per_dashboard"),
            minvalue: 0, maxvalue: 32767
        },{
            element: "input",
            type: "text",
            name: "max_sms",
            text: Text.get("schema.company.attr.max_sms"),
            desc: Text.get("schema.company.desc.max_sms"),
            minvalue: 0, maxvalue: 9999999999
        },{
            element: "radio-yes-no",
            name: "sms_enabled",
            text: Text.get("schema.company.attr.sms_enabled")
        },{
            element: "textarea",
            name: "comment",
            text: Text.get("schema.company.attr.comment"),
            maxlength: 500
        }
    ];
};
Bloonix.editCompanyVariables = function(o) {
    Bloonix.setTitle("schema.company.text.edit_variables");

    new Header({
        title: Text.get("schema.company.text.edit_variables"),
        icons: [
            {
                type: "help",
                callback: function() { Utils.open("/#help/host-variables") },
                title: Text.get("site.help.doc.host-variables")
            }
        ]
    }).create();

    var variables = Bloonix.get("/administration/variables");

    new Form({
        url: { submit: "/administration/variables/update" },
        buttonText: Text.get("action.update"),
        values: { variables: variables },
        elements: [{
            element: "textarea",
            name: "variables",
            text: Text.get("schema.company.attr.variables"),
            desc: Text.get("schema.company.desc.variables"),
            maxlength: 50000
        }]
    }).create();
};
Bloonix.viewScreen = function(o) {
    var object = Utils.extend({ opts: {} }, o);

    object.create = function() {
        this.checkUser();
        this.hideElements();
        this.showContent();
    };

    object.checkUser = function() {
        var self = this;

        if (Bloonix.user == undefined) {
            var parts = window.document.URL.toString().split("?");
            if (parts[1] != undefined) {
                var pairs = parts[1].split(/[;&]/);
                var username, authkey;
                $.each(pairs, function(i, pair) {
                    var pv = pair.split("=");
                    if (pv[0] != undefined && pv[1] != undefined) {
                        var key = pv[0], value = pv[1];
                        self.opts[key] = value;
                    }
                });
                if (this.opts.username != undefined && this.opts.authkey != undefined) {
                    this.postdata = {
                        username: this.opts.username,
                        authkey: this.opts.authkey
                    };
                }
            }
        }
    };

    object.hideElements = function() {
        $("#nav-sub").fadeOut(200);
        $("#nav-main").fadeOut(200);
        $("#header").fadeOut(200);
        $("#footer").fadeOut(200);
        $("#content-outer").fadeOut(200);
    };

    object.showElements = function() {
        $("#nav-sub").fadeIn(200);
        $("#nav-main").fadeIn(200);
        $("#header").fadeIn(200);
        $("#footer").fadeIn(200);
        $("#content-outer").fadeIn(200);
    };

    object.addScreenElements = function() {
        this.body = $("body")
            .css({ "padding-top": "0px", width: "100%" })
            .addClass("screen");
    };

    object.removeScreenElements = function() {
        $(".screen-box-content").fadeOut(200).remove();
        $(".screen-counter-content").fadeOut(200).remove();
        $(".screen-container").fadeOut(200).remove();
        $("body").removeClass("screen");
    };

    object.goBack = function(site, args) {
        if (Bloonix.user == undefined) {
            location.href = "/login/";
        }

        this.removeScreenElements();
        this.showElements();
        Bloonix.route.to(site, args);
    };

    object.showContent = function() {
        if (this.charts) {
            this.viewCharts();
        } else if (this.dashboard) {
            this.viewStatusDashboard();
        }
    };

    object.viewCharts = function() {
        var charts = Bloonix.get("/screen/charts/view/"+ this.opts.id, this.postdata);
        Bloonix.listCharts({
            screenCharts: charts,
            screenOpts: this.opts,
            container: $("body")
        });
    };

    object.viewStatusDashboard = function() {
        var self = this;
        Bloonix.setTitle("nav.sub.screen");

        this.addScreenElements();

        this.screenContainer = Utils.create("div")
            .addClass("screen-container")
            .appendTo(this.body);

        this.screenCounterContent = Utils.create("div")
            .addClass("screen-counter-content")
            .appendTo(this.screenContainer)
            .hide();

        this.screenBoxContent = Utils.create("div")
            .addClass("screen-box-content")
            .appendTo(this.screenContainer);

        this.unknownCounter = Utils.create("span")
            .addClass("screen-unknown-counter")
            .appendTo(this.screenCounterContent)
            .click(function(){ self.goBack("monitoring/hosts", { query: "status:UNKNOWN" }) });

        this.criticalCounter = Utils.create("span")
            .addClass("screen-critical-counter")
            .appendTo(this.screenCounterContent)
            .click(function(){ self.goBack("monitoring/hosts", { query: "status:CRITICAL" }) });

        this.warningCounter = Utils.create("span")
            .addClass("screen-warning-counter")
            .appendTo(this.screenCounterContent)
            .click(function(){ self.goBack("monitoring/hosts", { query: "status:WARNING" }) });

        this.infoCounter = Utils.create("span")
            .addClass("screen-info-counter")
            .appendTo(this.screenCounterContent)
            .click(function(){ self.goBack("monitoring/hosts", { query: "status:INFO" }) });

        this.okCounter = Utils.create("span")
            .addClass("screen-ok-counter")
            .appendTo(this.screenCounterContent)
            .click(function(){ self.goBack("monitoring/hosts", { query: "status:OK" }) });

        this.timestamp = Utils.create("span")
            .addClass("screen-timestamp")
            .appendTo(this.screenCounterContent);

        Utils.create("div")
            .addClass("clear")
            .appendTo(this.screenCounterContent);

        this.refreshStatusDashboard();

        var interval = setInterval(function() {
            self.refreshStatusDashboard();
        }, 30000);

        Bloonix.intervalObjects.push(interval);
    };

    object.refreshStatusDashboard = function() {
        var self = this;

        this.timestamp
            .html(DateFormat(new Date, DateFormat.masks.bloonix))
            .click(function(){ self.goBack("monitoring/hosts") });

        Ajax.post({
            url: "/screen/stats/",
            data: this.postdata,
            success: function(data) {
                $("body").find(".screen-box-remove").fadeOut(300).remove();

                self.unknownCounter.text(data.data.overall_service_status.UNKNOWN +" "+ Text.get("text.services"));
                self.criticalCounter.text(data.data.overall_service_status.CRITICAL +" "+ Text.get("text.services"));
                self.warningCounter.text(data.data.overall_service_status.WARNING +" "+ Text.get("text.services"));
                self.infoCounter.text(data.data.overall_service_status.INFO +" "+ Text.get("text.services"));
                self.okCounter.text(data.data.overall_service_status.OK +" "+ Text.get("text.services"));

                if (self.screenCounterContent.is(':hidden')) {
                    self.screenCounterContent.fadeIn(400);
                }

                $.each(data.data.service_status_by_host, function(x, host) {
                    if (host.services.length) {
                        var outerBox = Utils.create("a")
                            .addClass("screen-box-remove screen-box-1-1-outer screen-box-"+ host["status"])
                            .click(function() { self.goBack("monitoring/hosts/"+ host.id) })
                            .appendTo(self.screenBoxContent);

                        var box = Utils.create("div")
                            .addClass("screen-box-1-1")
                            .appendTo(outerBox);

                        var messages = [];

                        $.each(host.services, function(y, service) {
                            if (host.services.length > 1) {
                                messages.push(service.service_name);
                            } else {
                                messages.push(service.service_name +" - "+ service.message);
                            }
                        });

                        messages = messages.join(", ");

                        if (messages.length > 200) {
                            messages = messages.substring(0,197) + "...";
                        }

                        Utils.create("h1")
                            .text(host.hostname)
                            .appendTo(box);

                        Utils.create("h2")
                            .text(host.ipaddr)
                            .appendTo(box);

                        Utils.create("p")
                            .text(messages)
                            .appendTo(box);
                    }
                });

                Utils.create("div")
                    .addClass("clear")
                    .appendTo(self.screenCounterContent);
            }
        });
    };

    object.create();
};
Bloonix.WTRM = function(o) {
    var object = Utils.extend({
        appendTo: "#content",
        header: true,
        preload: false
    }, o);

    object.stepId = 0;
    object.maxSteps = 50;
    object.stepCounter = 0;
    object.steps = {};

    object.getNewStepId = function(id) {
        if (id == undefined) {
            this.stepId++;
            return this.stepId;
        }

        if (parseInt(id) > parseInt(this.stepId)) {
            this.stepId = id;
        }

        return id;
    };

    object.create = function() {
        this.getActions();
        this.createStruct();
        this.createForm();
        this.createResultBoxes();
        this.preloadSteps();
    };

    object.getActions = function() {
        var self = this;
        this.actions = Bloonix.get("/wtrm/actions");
        this.actionsByName = {};
        $.each(this.actions, function(i, item) {
            self.actionsByName[item.action] = item;
        });
    };

    object.createStruct = function() {
        if (this.header == true) {
            new Header({
                title: Text.get("site.wtrm.text.wtrm_workflow"),
                border: true,
                appendTo: this.appendTo
            }).create();
        }
        this.outerBox = Utils.create("div")
            .addClass("wtrm-outer-box")
            .attr("data-name", "command_options:workflow")
            .appendTo(this.appendTo);
        this.infoBox = Utils.create("div")
            .addClass("info-err")
            .hide()
            .appendTo(this.outerBox);
        this.formBox = Utils.create("div")
            .appendTo(this.outerBox);
        this.stepBox = Utils.create("div")
            .appendTo(this.outerBox);
    };

    object.createForm = function() {
        var self = this,
            actions = [];

        this.form = new Form({
            format: "large",
            appendTo: this.formBox
        }).init();

        $.each(this.actions, function(i, item) {
            var addClass = /^do/.test(item.action)
                ? "wtrm-action"
                : "wtrm-check";

            var name = Utils.create("span");

            Utils.create("span")
                .html(Text.get("site.wtrm.action."+ item.action))
                .appendTo(name);

            actions.push({
                name: name,
                value: item.action,
                addClass: addClass
            });
        });

        this.selectBox = Utils.create("div").appendTo(this.form.getContainer());

        this.select = this.form.select({
            placeholder: "Add an action",
            appendTo: this.selectBox,
            options: actions,
            readOnly: true,
            callback: function(action) { self.createOrUpdateStep(action) }
        });

        this.button = Utils.create("div")
            .css({ "margin-left": "20px" })
            .addClass("btn btn-white btn-tall")
            .html(Text.get("site.wtrm.text.check_it"))
            .appendTo(this.selectBox)
            .click(function() { self.runTest() });

        this.button = Utils.create("div")
            .css({ "margin-left": "4px" })
            .addClass("btn btn-white btn-tall")
            .html(Text.get("site.wtrm.text.quick_check"))
            .appendTo(this.selectBox)
            .click(function() { self.runTest(true) });
    };

    object.createResultBoxes = function() {
        var self = this;

        this.transactionOuterBox = Utils.create("div")
            .addClass("wtrm-outer")
            .appendTo(this.stepBox);

        this.transactionInnerBox = Utils.create("div")
            .addClass("wtrm-inner")
            .appendTo(this.transactionOuterBox);

        this.transactionBox = Utils.create("ul")
            .addClass("wtrm-steps")
            .appendTo(this.transactionInnerBox)
            .sortable({ stop: function() { self.reNumberSteps() } });
    };

    object.createOrUpdateStep = function(action, id) {
        this.infoBox.hide();

        var self = this,
            config = this.actionsByName[action],
            content = Utils.create("div").css({ "margin-bottom": "60px" });

        var form = new Form({
            format: "medium",
            appendTo: content,
            preventDefault: true
        }).init();

        var table = new Table({
            type: "form",
            appendTo: form.getContainer()
        }).init();

        form.table = table.getTable();

        $.each(config.options, function(i, item) {
            var name = item.name,
                mandatory = item.mandatory,
                value;

            if (id) {
                value = self.steps[id].attrs[name];
            }

            if (name == "hidden") {
                form.createElement({
                    element: "radio-yes-no",
                    name: name,
                    text: Text.get("site.wtrm.attr."+ name),
                    desc: Text.get("site.wtrm.desc."+ name),
                    checked: value === "1" ? "1" : 0
                });
            } else {
                form.createElement({
                    element: "input",
                    type: "text",
                    name: name,
                    value: value,
                    text: Text.get("site.wtrm.attr."+ name),
                    desc: Text.get("site.wtrm.desc."+ name),
                    placeholder: Text.get("site.wtrm.placeholder."+ name),
                    mandatory: mandatory
                });
            }
        });

        new Overlay({
            title: Text.get("site.wtrm.action."+ action),
            content: content,
            buttons: [{
                content: id ? Text.get("action.update") : Text.get("action.add"),
                close: false,
                callback: function(a, c) {
                    var attrs = self.validateStep(action, form);

                    if (attrs) {
                        if (id) {
                            self.updateStep(id, attrs);
                        } else {
                            self.addStep(action, attrs);
                        }
                        c.close();
                    }
                },
            }],
            width: "600px"
        }).create();
    };

    object.validateStep = function(action, form, step) {
        var self = this,
            config = this.actionsByName[action],
            data = Utils.filterEmptyValues(form.getData()),
            markErrors;

        data.action = action;

        Ajax.post({
            url: "/wtrm/validate/step",
            data: data,
            async: false,
            success: function(result) {
                if (result.status == "err-610") {
                    markErrors = result.data.failed;
                }
            }
        });

        if (markErrors) {
            form.markErrors(markErrors);
            return false;
        }

        return data;
    };

    object.addStep = function(action, attrs) {
        var self = this;

        var addClass = /^do/.test(action)
            ? "wtrm-action"
            : "wtrm-check";

        var stepId = this.getNewStepId(attrs.id);

        var step = Utils.create("li")
            .attr("data-id", stepId)
            .addClass("wtrm-step")
            .appendTo(this.transactionBox);

        this.stepCounter++;
        this.steps[stepId] = {
            action: action,
            object: step,
            attrs: attrs,
            pos: this.stepCounter
        };

        var stepNum = Utils.create("div")
            .addClass("wtrm-step-num")
            .text("Step "+ this.stepCounter)
            .appendTo(step);

        Utils.create("div")
            .addClass("wtrm-step-command")
            .addClass(addClass)
            .html(Bloonix.PreWtrmAction(action, attrs))
            .appendTo(step);

        this.steps[stepId].resultContainer = Utils.create("div")
            .addClass("wtrm-step-result")
            .appendTo(step);

        var imageContainer = Utils.create("span")
            .addClass("wtrm-step-image")
            .appendTo(step);

        Utils.create("span")
            .addClass("hicons cog")
            .appendTo(imageContainer)
            .attr("title", Text.get("action.edit"))
            .tooltip()
            .click(function() { self.createOrUpdateStep(action, stepId) });

        Utils.create("span")
            .addClass("hicons remove")
            .appendTo(imageContainer)
            .attr("title", Text.get("action.remove"))
            .tooltip()
            .click(function() {
                self.removeStep(stepId);
                self.reNumberSteps();
            });

        Utils.create("span")
            .addClass("hicons sort")
            .appendTo(imageContainer)
            .attr("title", Text.get("info.move_with_mouse"))
            .tooltip();

        return true;
    };

    object.updateStep = function(id, attrs) {
        var step = this.steps[id],
            action = step.action;

        step.attrs = {};

        $.each(attrs, function(name, value) {
            step.attrs[name] = value;
        });

        step.object.find(".wtrm-step-command").each(function() {
            $(this).html(Bloonix.PreWtrmAction(action, attrs));
        });
    };

    object.removeStep = function(id) {
        var step = this.steps[id];
        delete this.steps[id];
        step.object.remove();
        this.stepCounter--;
        this.reNumberSteps();
    };

    object.reNumberSteps = function() {
        this.infoBox.hide();

        var self = this,
            i = 1;

        this.transactionBox.find(".wtrm-step").each(function() {
            var object = $(this),
                id = object.data("id"),
                step = self.steps[id];

            object.find(".wtrm-step-num").each(function() {
                $(this).text("Step "+ i);
                step.pos = i;
            });

            i++;
        });
    };

    object.validateSteps = function() {
        var self = this,
            hasUrl = false,
            hasErr = false,
            steps = [];

        // order steps
        $.each(this.steps, function(id, item) {
            var i = item.pos - 1;
            steps[i] = Utils.extend({ action: item.action, id: id }, item.attrs);
        });

        // validate first
        $.each(steps, function(pos, step) {
            var item = self.steps[step.id];

            if (item.action == "doUrl") {
                hasUrl = true;
            } else if (hasUrl === false) {
                if (item.action != "doAuth" && item.action != "doUserAgent") {
                    hasErr = "It's not possible to run a test without a <i>URL</i> action at the beginning of the workflow!"
                        +" The only actions that may be placed in front of the <i>URL</i> action, are the actions"
                        +" <i>Auth-Basic</i> and <i>User-Agent</i>!";
                    return false;
                }
            }
        });

        if (hasErr === false && hasUrl === false) {
            hasErr = "It's not possible to run a test without a <i>URL</i> action at the beginning of the workflow!";
        }

        if (hasErr) {
            self.infoBox.html(hasErr);
            self.infoBox.fadeIn(400);
            self.formBox.find(".loading-small").removeClass("loading-small");
            self.select.getContainer().show();
            self.button.show();
            return false;
        }

        return steps;
    };

    object.runTest = function(quick) {
        var self = this;

        this.selectBox.hide();
        this.infoBox.hide();

        var steps = this.validateSteps();

        if (steps) {
            $.each(steps, function(pos, step) {
                var item = self.steps[step.id];
                item.resultContainer.html("");
                item.resultContainer.css({ "min-height": "20px" });
                item.resultContainer.addClass("loading-small");
            });

            Ajax.post({
                url: quick ? "/wtrm/quick" : "/wtrm/test",
                data: steps,
                success: function(result) {
                    if (result.status === "err-802") {
                        Bloonix.createNoteBox({
                            text: Text.get("err-802"),
                            infoClass: "info-err"
                        });
                        self.outerBox.find(".loading-small").removeClass("loading-small");
                        self.selectBox.show();
                    } else {
                        self.maxTestRequests = 50;
                        self.waitForData(result.data, 1);
                    }
                }
            });
        }
    };

    object.waitForData = function(url, num) {
        var self = this;

        Ajax.post({
            url: url +"/"+ num,
            success: function(result) {
                self.processTestData(url, num, result.data);
            }
        });
    };

    object.processTestData = function(url, num, data) {
        this.maxTestRequests--;
        var self = this,
            done = false;

        $.each(data, function(i, result) {
            if (result.status === "ok") {
                var m = result.data;

                if (result.status == "done") {
                    done = true;
                } else {
                    var step = self.steps[m.id],
                        success = m.success == true ? "ok" : "error";

                    if (success === "error") {
                        done = true;
                    }

                    step.result = m;
                    step.resultContainer.removeClass("loading-small");

                    Utils.create("span")
                        .addClass("wtrm-step-result-"+ success)
                        .html(success)
                        .appendTo(step.resultContainer);

                    Utils.create("span")
                        .addClass("wtrm-step-result-took")
                        .text(m.took + "ms")
                        .appendTo(step.resultContainer);

                    var table = new Table({
                        type: "none",
                        addClass: "wtrm-step-result-table",
                        appendTo: step.resultContainer
                    }).init();

                    table.createRow([ "Status", success ]);
                    table.createRow([ "Took", m.took + "ms" ]);
                    table.createRow([ "Start", DateFormat(m.start, DateFormat.masks.timePlusMs) ]);
                    table.createRow([ "Stop", DateFormat(m.stop, DateFormat.masks.timePlusMs) ]);
                    //table.createRow([ "Start (ms)", m.start ]);
                    //table.createRow([ "Stop (ms)", m.stop ]);

                    if (success === "error") {
                        if (m.message) {
                            table.createRow([ "Message", m.message ]);
                        }
                        if (m.debug) {
                            table.createRow([ "Debug", m.debug.join("<br/>") ]);
                        }
                    }

                    if (m.image) {
                        var img = Utils.create("div")
                            .addClass("wtrm-step-result-image")
                            .appendTo(step.resultContainer);

                        Utils.create("img")
                            .attr("src", "data:image/png;base64,"+ m.image)
                            .appendTo(img);

                        img.click(function() {
                            var overlay = Utils.create("div")
                                .addClass("overlay-outer")
                                .appendTo("body");

                            var img = Utils.create("div")
                                .addClass("overlay-fullscreen")
                                .appendTo(overlay);

                            Utils.create("img")
                                .attr("src", "data:image/png;base64,"+ m.image)
                                .appendTo(img);

                            overlay.fadeIn(400);
                            overlay.click(function() { overlay.remove() });
                        });
                    }
                }
            } else {
                done = true;
            }
        });

        if (done == true) {
            this.outerBox.find(".loading-small").removeClass("loading-small");
            this.selectBox.show();
            return false;
        } else if (this.maxTestRequests > 0) {
            this.waitForData(url, num + data.length);
        } else {
            this.selectBox.show();
        }
    };

    object.preloadSteps = function() {
        var self = this;

        if (this.preload) {
            $.each(this.preload, function(i, step) {
                self.addStep(step.action, step);
            });
        }
    };

    object.create();
    return object;
};

Bloonix.getWtrmElement = function(item) {
    return item["parent"]
        ? item["parent"] +" "+ item.element
        : item.element;
};

Bloonix.PreWtrmAction = function(action, attrs) {
    var clone = {};

    $.each(attrs, function(key, value) {
        clone[key] = Utils.escape(value);
    });

    return Bloonix.WtrmAction[action](clone);
};

Bloonix.WtrmAction = {
    doAuth: function(item) {
        return Text.get("site.wtrm.command.doAuth", [ item.username, item.password ]);
    },
    doUserAgent: function(item) {
        return Text.get("site.wtrm.command.doUserAgent", [ item.userAgent ]);
    },
    doUrl: function(item) {
        return Text.get("site.wtrm.command.doUrl", [ item.url ]);
    },
    doFill: function(item) {
        return Text.get("site.wtrm.command.doFill", [ Bloonix.getWtrmElement(item), item.hidden === "1" ? "xxxxxx" : item.value ]);
    },
    doClick: function(item) {
        return Text.get("site.wtrm.command.doClick", [ Bloonix.getWtrmElement(item) ]);
    },
    doSubmit: function(item) {
        return Text.get("site.wtrm.command.doSubmit", [ Bloonix.getWtrmElement(item) ]);
    },
    doCheck: function(item) {
        return Text.get("site.wtrm.command.doCheck", [ Bloonix.getWtrmElement(item), item.value ]);
    },
    doUncheck: function(item) {
        return Text.get("site.wtrm.command.doUncheck", [ Bloonix.getWtrmElement(item), item.value ]);
    },
    doSelect: function(item) {
        return Text.get("site.wtrm.command.doSelect", [ item.value, Bloonix.getWtrmElement(item) ]);
    },
    doWaitForElement: function(item) {
        if (item.text) {
            return Text.get("site.wtrm.command.doWaitForElementWithText", [ Bloonix.getWtrmElement(item), item.text ]);
        }
        return Text.get("site.wtrm.command.doWaitForElement", [ Bloonix.getWtrmElement(item) ]);
    },
    doSleep: function(item) {
        return Text.get("site.wtrm.command.doSleep", [ item.ms ]);
    },
    checkUrl: function(item) {
        if (item.contentType) {
            return Text.get("site.wtrm.command.checkUrlWithContentType", [ item.url, item.contentType ]);
        }
        return Text.get("site.wtrm.command.checkUrl", [ item.url ]);
    },
    checkIfElementExists: function(item) {
        return Text.get("site.wtrm.command.checkIfElementExists", [ Bloonix.getWtrmElement(item) ]);
    },
    checkIfElementNotExists: function(item) {
        return Text.get("site.wtrm.command.checkIfElementNotExists", [ Bloonix.getWtrmElement(item) ]);
    },
    checkIfElementHasText: function(item) {
        return Text.get("site.wtrm.command.checkIfElementHasText", [ Bloonix.getWtrmElement(item), item.text ]);
    },
    checkIfElementHasNotText: function(item) {
        return Text.get("site.wtrm.command.checkIfElementHasNotText", [ Bloonix.getWtrmElement(item), item.text ]);
    },
    checkIfElementHasHTML: function(item) {
        return Text.get("site.wtrm.command.checkIfElementHasHTML", [ Bloonix.getWtrmElement(item), item.html ]);
    },
    checkIfElementHasNotHTML: function(item) {
        return Text.get("site.wtrm.command.checkIfElementHasNotHTML", [ Bloonix.getWtrmElement(item), item.html ]);
    },
    checkIfElementHasValue: function(item) {
        return Text.get("site.wtrm.command.checkIfElementHasValue", [ Bloonix.getWtrmElement(item), item.hidden === "1" ? "xxxxxx" : item.value ]);
    },
    checkIfElementHasNotValue: function(item) {
        return Text.get("site.wtrm.command.checkIfElementHasNotValue", [ Bloonix.getWtrmElement(item), item.value ]);
    },
    checkIfElementIsChecked: function(item) {
        return Text.get("site.wtrm.command.checkIfElementIsChecked", [ Bloonix.getWtrmElement(item), item.value ]);
    },
    checkIfElementIsNotChecked: function(item) {
        return Text.get("site.wtrm.command.checkIfElementIsNotChecked", [ Bloonix.getWtrmElement(item), item.value ]);
    },
    checkIfElementIsSelected: function(item) {
        return Text.get("site.wtrm.command.checkIfElementIsSelected", [ Bloonix.getWtrmElement(item), item.value ]);
    },
    checkIfElementIsNotSelected: function(item) {
        return Text.get("site.wtrm.command.checkIfElementIsNotSelected", [ Bloonix.getWtrmElement(item), item.value ]);
    }
};
if (window.Highcharts) {
    // Highcharts global options.
    Highcharts.setOptions({
        credits: { enabled: false },
        global: { useUTC: false },
        chart: {
            style: {
                fontFamily: '"Helvetica Neue",Arial,Helvetica,sans-serif,Serif'
            }
        }
    });
}

Bloonix.highcharts = {};
Bloonix.highcharts.plotChart = function(o) {
    if (Bloonix.checkEmptyChartData(o)) {
        return false;
    }

    if (o.chart.xAxisType == undefined) {
        o.chart.xAxisType = "datetime";
    }

    if (o.chart.lineMarker == undefined) {
        o.chart.lineMarker = false;
    }

    var chartOpts = {
        chart: {
            zoomType: "x",
            renderTo: o.chart.container,
            type: o.chart.type,
            plotBorderColor: "#e1e1e1",
            plotBorderWidth: 1
        },
        title: {
            text: o.chart.title,
            align: "left",
            style: {
                color: "#333333",
                fontWeight: "normal",
                fontSize: "14px"
            }
        },
        subtitle: {
            text: o.chart.subtitle,
            align: "left",
            style: {
                color: "#555555",
                fontWeight: "normal",
                fontSize: "13px"
            }
        },
        xAxis: {
            type: "datetime",
            title: {
                text: o.chart.xlabel,
                style: {
                    color: "#555555",
                    fontWeight: "normal",
                    fontSize: "13px"
                }
            }
        },
        yAxis: {
            title: {
                text: o.chart.ylabel,
                align: "high",
                style: {
                    color: "#555555",
                    fontWeight: "normal",
                    fontSize: "12px"
                }
            },
            labels: {
                style: {
                    color: "#555555",
                    fontWeight: "normal",
                    fontSize: "12px"
                }
            }
        },
        legend: {
            itemStyle: {
                color: "#333333",
                fontSize: "12px",
                fontWeight: "normal",
            },
            symbolWidth: 20,
            borderWidth: 0
        },
        tooltip: {
            crosshairs: true,
            shared: true,
            valueDecimals: 2,
            formatter: function() {
                var date = new Date(this.x),
                    series = "<b>"+ DateFormat(date, "highchartsTooltip") +"</b>";

                $.each(this.points, function(index, point) {
                    var name = point.series.name,
                        color = o.colors[point.series.name] || Utils.rgbToHex(point.series.color),
                        value = point.y,
                        units = o.chart.units || o.units[name];

                    if (units) {
                        if (/bytes|bits/.test(units)) {
                            value = Bloonix.convertBytesToStr(units, value, true);
                        } else if (units == "default" || units == "null") {
                            value = Bloonix.convertUnitsToStr(units, value, true);
                        }
                    }

                    series += '<br /><span style="color:'+ color +';font-weight:bold;">'+ name +': '+ value +'</span>';
                });         

                return series;
            }
        },
        plotOptions: {
            line: {
                marker: { enabled: false },
                connectNulls: false
            },
            spline: {
                marker: { enabled: false },
                connectNulls: false
            },
            area: {
                stacking : o.hasNegativeValues == true ? null : "normal",
                //lineColor: "#aaaaaa",
                lineWidth: 1,
                marker: { enabled: false },
                connectNulls: false
            }
        },
        series: o.series
    };

    if (o.legend && o.legend.enabled === false) {
        chartOpts.legend.enabled = false;
    }

    if (o.plotOptions && o.plotOptions.animation !== undefined) {
        chartOpts.plotOptions.line.animation = o.plotOptions.animation;
        chartOpts.plotOptions.spline.animation = o.plotOptions.animation;
        chartOpts.plotOptions.area.animation = o.plotOptions.animation;
    }

    if (o.chart.units) {
        if (/bytes|bits/.test(o.chart.units)) {
            chartOpts.yAxis.labels.formatter = function() {
                return Bloonix.convertBytesToStr(o.chart.units, this.value);
            };
        } else {
            chartOpts.yAxis.labels.formatter = function() {
                return Bloonix.convertUnitsToStr(o.chart.units, this.value);
            };
        }
    }

    if (o.hasNegativeValues != true) {
        chartOpts.yAxis.min = 0;
    }

    Bloonix.createOrReplaceChart({
        container: o.chart.container, 
        chartOpts: chartOpts,
        type: "Chart"
    });
};

Bloonix.highcharts.createChartForMTR = function(o) {
    var chartOpts = {
        chart: {
            renderTo: o.chart.container
        },
        title: {
            text: false
        },
        yAxis: [
            { min: 0, title: { text: "time in ms" } },
            { min: 0, max: 100, title: { text: "loss %" }, opposite: true }
        ],
        xAxis: {
            title: "Step",
            categories: o.categories
        },
        tooltip: {
            crosshairs: true,
            shared: true,
            formatter: function() {
                var step = this.x,
                    desc = "<b>"+ step +") IP "+ o.ipaddrByStep[step] +"</b>";

                $.each(this.points, function(index, point) {
                    var name = point.series.name,
                        color = point.series.color,
                        value = point.y;

                    desc += '<br /><span style="color:'
                        + color +'; font-weight: bold;">'
                        + name +'</span>: <b>'
                        + value +'</b>';
                });

                return desc;
            }
        },
        plotOptions: {
            column: {
                stacking: "normal"
            }
        },
        series: o.series
    };

    new Highcharts.Chart(chartOpts);
};

Bloonix.highcharts.createChartForWTRM = function(o) {
    return new Highcharts.Chart({
        chart: {
            type: "area",
            renderTo: o.chart.container
        },
        title: {
            text: o.chart.title,
            align: "left",
            style: {
                color: "#333333",
                fontWeight: "normal",
                fontSize: "14px"
            }
        },
        subtitle: {
            text: o.chart.subtitle,
            align: "left",
            style: {
                color: "#555555",
                fontWeight: "normal",
                fontSize: "13px"
            }
        },
        xAxis: {
            categories: o.categories,
            title: { enabled: false }
        },
        yAxis: { title: { text: "ms" } },
        tooltip: {
            formatter: function() {
                return this.x +" step took <b>"+ this.y +"ms</b>";
            }
        },
        legend: {
            enabled: false
        },
        plotOptions: {
            area: {
                stacking: "normal",
                lineColor: "#005467",
                lineWidth: 1,
                marker: {
                    lineWidth: 1,
                    lineColor: "#005467"
                }
            }
        },
        series: [{
            name: "Steps",
            color: "#005467",
            data: o.seriesData
        }]
    });
};
Bloonix.highcharts.pieChart = function(o) {
    var chartOpts = {
        chart: {
            renderTo: o.chart.container,
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: true,
            type: "pie",
            options3d: {
                enabled: true,
                alpha: 45,
                beta: 0
            }
        },
        title: {
            text: o.chart.title,
            style: {
                color: "#444444",
                fontWeight: "normal",
                fontSize: "15px"
            }
        },
        subtitle: {
            text: o.chart.subtitle,
            style: {
                color: "#555555",
                fontWeight: "normal",
                fontSize: "13px"
            }
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
            //pointFormat: "{series.name}: <b>{point.y}</b>",
            //percentageDecimals: 1
        },
        legend: {
            itemStyle: {
                color: "#444444",
                fontSize: "12px"
            },
            itemHoverStyle: { color: "#000000" },
            borderWidth: 0
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: "pointer",
                showInLegend: true,
                depth: 35,
                dataLabels: {
                    enabled: true,
                    //format: '{point.name}'
                    //color: "#444444",
                    //connectorColor: "#444444",
                    //connectorPadding: 1,
                    //overflow: "justify",
                    formatter: function() {
                        return "<b>"+ this.point.name +"</b>: "+ this.percentage.toFixed(2) +" %";
                    }
                }
            },
        },
        series: [{
            data: o.data
        }]
    };

    if (o.plotOptions && o.plotOptions.animation !== undefined) {
        chartOpts.plotOptions.pie.animation = o.plotOptions.animation;
    }

    if (o.legend == false) {
        chartOpts.plotOptions.pie.showInLegend = false;
        chartOpts.plotOptions.pie.dataLabels.enabled = false;
    }

    if (o.onClick != undefined) {
        chartOpts.plotOptions.series = {
            cursor: "pointer",
            point: {
                events: {
                    click: function() {
                        o.onClick(this.name);
                    }
                }
            }
        };
    }

    if (o.colors) {
        if (o.gradient == true || o.gradient == undefined) {
            chartOpts.colors = [ ];
            $.each(o.colors, function(index, color) {
                var rgb = "rgb("+ Utils.hexToRGB(color).join(",") +")";
                chartOpts.colors.push({
                    radialGradient: { cx: 0.5, cy: 0.3, r: 0.7 },
                    stops: [
                        [ 0, Highcharts.Color(rgb).brighten(0.2).get("rgb") ],
                        [ 1, Highcharts.Color(rgb).brighten(-0.1).get("rgb") ]
                    ]
                });
            });
        } else {
            chartOpts.colors = o.colors;
        }
    }

    Bloonix.createOrReplaceChart({
        container: o.chart.container, 
        chartOpts: chartOpts,
        type: "Chart"
    });
};
Bloonix.highcharts.barChart = function(o) {
    var chartOpts = {
        chart: {
            renderTo: o.chart.container,
            type: "column",
            margin: 50,
            options3d: {
                enabled: true,
                alpha: 10,
                beta: 25,
                depth: 70
            }
        },
        title: {
            text: o.chart.title,
            style: {
                color: "#444444",
                fontWeight: "normal",
                fontSize: "15px"
            }
        },
        subtitle: {
            text: o.chart.subtitle,
            style: {
                color: "#555555",
                fontWeight: "normal",
                fontSize: "13px"
            }
        },
        xAxis: {
            categories: o.categories,
            title: {
                text: o.chart.xaxisTitle,
                style: {
                    color: "#555555",
                    fontWeight: "normal",
                    fontSize: "12px"
                }
            }
        },
        yAxis: {
            min: 0,
            title: {
                text: o.chart.yaxisTitle,
                align: "high",
                style: {
                    color: "#555555",
                    fontWeight: "normal",
                    fontSize: "12px"
                }
            },
            labels: {
                overflow: "justify"
            }
        },
        tooltip: {
            formatter: function() {
                return ""+
                    this.series.name +": "+ this.y +" services";
            }
        },
        plotOptions: {
            column: {
                dataLabels: {
                    enabled: false
                }
            }
        },
        series: o.series
    };

    if (o.plotOptions && o.plotOptions.animation !== undefined) {
        chartOpts.plotOptions.column.animation = o.plotOptions.animation;
    }

    Bloonix.createOrReplaceChart({
        container: o.chart.container, 
        chartOpts: chartOpts,
        type: "Chart"
    });
};
Bloonix.highcharts.mapChart = function(o) {
    var data = [],
        seriesBackgroundColor = "#c9c9c9",
        seriesBorderColor = "#f9f9f9";

    if (o.data.GB) {
        o.data.UK = o.data.GB;
        delete o.data.GB;
    }

    $.each(Bloonix.highcharts.mapCodes, function (code, name) {
        var country = code.toUpperCase(),
            value = 0;

        if (o.data[country]) {
            if (o.data[country].UNKNOWN > 0) {
                value = 5;
            } else if (o.data[country].CRITICAL > 0) {
                value = 4;
            } else if (o.data[country].WARNING > 0) {
                value = 3;
            } else if (o.data[country].INFO > 0) {
                value = 2;
            } else if (o.data[country].OK > 0) {
                value = 1;
            }
        }

        data.push({
            flag: code,
            code: country,
            name: name,
            value: value,
            borderColor: seriesBorderColor
        });
    });

    var chartOpts = {
        chart: {
            renderTo: o.chart.container
        },
        title: {
            text: o.chart.title,
            style: {
                color: "#444444",
                fontWeight: "normal",
                fontSize: "15px"
            }
        },
        subtitle: {
            text: o.chart.subtitle,
            style: {
                color: "#555555",
                fontWeight: "normal",
                fontSize: "13px"
            }
        },
        legend: {
            enabled: false
        },
        mapNavigation: {
            enabled: true,
            //enableDoubleClickZoom: true,
            //enableDoubleClickZoomTo: true,
            enableMouseWheelZoom: true,
            enableTouchZoom: true,
            enableButtons: false
        },
        tooltip: {
            backgroundColor: "none",
            borderWidth: 0,
            shadow: false,
            useHTML: true,
            padding: 0,
            formatter: function() {
                if (!this.point.flag) {
                    return "";
                }
                if (!o.data[this.point.code]) {
                    o.data[this.point.code] = { UNKNOWN: 0, CRITICAL: 0, WARNING: 0, INFO: 0, OK: 0 };
                }
                return '<div class="map-tooltip"><span class="f32"><span class="flag '+ this.point.flag +'"></span></span> '+ this.point.name
                    +'<br/><b>Unknown: </b>'+ o.data[this.point.code].UNKNOWN
                    +'<br/><b>Critical: </b>'+ o.data[this.point.code].CRITICAL
                    +'<br/><b>Warning: </b>'+ o.data[this.point.code].WARNING
                    +'<br/><b>Info: </b>'+ o.data[this.point.code].INFO
                    +'<br/><b>Ok: </b>'+ o.data[this.point.code].OK
                    +'</div>';
            }
            //positioner: function () {
            //    return { x: 0, y: 160 }
            //}
        },
        plotOptions: {
            series: {
                point: {
                    events: {
                        click: function () {
                            Bloonix.route.to("monitoring/hosts", { query: "c:"+ this.flag.toUpperCase() });
                        }
                    }
                }
            }
        },
        colorAxis: {
            dataClasses: [
                { from: 0, to: 0, color: seriesBackgroundColor },
                { from: 1, to: 1, color: "#5fbf5f" },
                { from: 2, to: 2, color: "#339ab8" },
                { from: 3, to: 3, color: "#edc951" },
                { from: 4, to: 4, color: "#cc333f" },
                { from: 5, to: 5, color: "#eb6841" }
            ]
        },
        series: [{
            data: data,
            name: "Host availability",
            mapData: Highcharts.maps.world,
            joinBy: "code",
            valueRanges: [
                { from: 0, to: 0, color: seriesBackgroundColor },
                { from: 1, to: 1, color: "#5fbf5f" },
                { from: 2, to: 2, color: "#339ab8" },
                { from: 3, to: 3, color: "#edc951" },
                { from: 4, to: 4, color: "#cc333f" },
                { from: 5, to: 5, color: "#eb6841" }
            ],
            states: {
                hover: {
                    color: "#68a4a3"
                }
            }
        }]
    };

    if (o.plotOptions && o.plotOptions.animation !== undefined) {
        chartOpts.series[0].animation = o.plotOptions.animation;
    }

    Bloonix.createOrReplaceChart({
        container: "#"+ o.chart.container,
        chartOpts: chartOpts,
        type: "Map"
    });
};

Bloonix.highcharts.createLocationMap = function(o) {
    return new Highcharts.Map({
        chart: {
            renderTo: o.container
        },
        title: {
            text: o.title,
            style: {
                color: "#444444",
                fontWeight: "normal",
                fontSize: "15px"
            }
        },
        subtitle: {
            text: o.subtitle,
            style: {
                color: "#555555",
                fontWeight: "normal",
                fontSize: "13px"
            }
        },
        legend: {
            enabled: false
        },
        tooltip: {
            formatter: function () {
                if (!this.point.ipaddr) {
                    return false;
                }
                return "<b>"+ this.point.name +"</b><br/><span>"+ this.point.ipaddr +"</span>";
            }
        },
        mapNavigation: {
            enabled: true,
            enableDoubleClickZoom: true,
            enableDoubleClickZoomTo: true,
            enableMouseWheelZoom: true,
            enableTouchZoom: true,
            enableButtons: false
        },
        series: [{
            name: "Country",
            mapData: Highcharts.maps.world,
            joinBy: "code",
            borderColor: "#b1b1b1",
            states: {
                hover: {
                    color: "#aad7d6"
                }
            }
        },{
            type: "mappoint",
            id: "clicks",
            name: "Location",
            data: o.data
        }]
    });
};

Bloonix.highcharts.mapCodes = {
    "af": "Afghanistan",
    "al": "Albania",
    "dz": "Algeria",
    "as": "American Samoa",
    "ad": "Andorra",
    "ao": "Angola",
    "ai": "Antigua and Barbuda",
    "ar": "Argentina",
    "am": "Armenia",
    "aw": "Aruba",
    "au": "Australia",
    "at": "Austria",
    "az": "Azerbaijan",
    "bs": "Bahamas, The",
    "bh": "Bahrain",
    "bd": "Bangladesh",
    "bb": "Barbados",
    "by": "Belarus",
    "be": "Belgium",
    "bz": "Belize",
    "bj": "Benin",
    "bm": "Bermuda",
    "bt": "Bhutan",
    "bo": "Bolivia",
    "ba": "Bosnia and Herzegovina",
    "bw": "Botswana",
    "br": "Brazil",
    "bn": "Brunei Darussalam",
    "bg": "Bulgaria",
    "bf": "Burkina Faso",
    "bi": "Burundi",
    "kh": "Cambodia",
    "cm": "Cameroon",
    "ca": "Canada",
    "cv": "Cape Verde",
    "ky": "Cayman Islands",
    "cf": "Central African Republic",
    "td": "Chad",
    "cl": "Chile",
    "cn": "China",
    "co": "Colombia",
    "km": "Comoros",
    "cd": "Congo, Dem. Rep.",
    "cg": "Congo, Rep.",
    "cr": "Costa Rica",
    "ci": "Cote d'Ivoire",
    "hr": "Croatia",
    "cu": "Cuba",
    "cw": "Curacao",
    "cy": "Cyprus",
    "cz": "Czech Republic",
    "dk": "Denmark",
    "dj": "Djibouti",
    "dm": "Dominica",
    "do": "Dominican Republic",
    "ec": "Ecuador",
    "eg": "Egypt, Arab Rep.",
    "sv": "El Salvador",
    "gq": "Equatorial Guinea",
    "er": "Eritrea",
    "ee": "Estonia",
    "et": "Ethiopia",
    "fo": "Faeroe Islands",
    "fj": "Fiji",
    "fi": "Finland",
    "fr": "France",
    "pf": "French Polynesia",
    "ga": "Gabon",
    "gm": "Gambia, The",
    "ge": "Georgia",
    "de": "Germany",
    "gh": "Ghana",
    "gr": "Greece",
    "gl": "Greenland",
    "gd": "Grenada",
    "gu": "Guam",
    "gt": "Guatemala",
    "gn": "Guinea",
    "gw": "Guinea-Bissau",
    "gy": "Guyana",
    "ht": "Haiti",
    "hn": "Honduras",
    "hk": "Hong Kong SAR, China",
    "hu": "Hungary",
    "is": "Iceland",
    "in": "India",
    "id": "Indonesia",
    "ir": "Iran, Islamic Rep.",
    "iq": "Iraq",
    "ie": "Ireland",
    "im": "Isle of Man",
    "il": "Israel",
    "it": "Italy",
    "jm": "Jamaica",
    "jp": "Japan",
    "jo": "Jordan",
    "kz": "Kazakhstan",
    "ke": "Kenya",
    "ki": "Kiribati",
    "kp": "Korea, Dem. Rep.",
    "kr": "Korea, Rep.",
    "xk": "Kosovo",
    "kw": "Kuwait",
    "kg": "Kyrgyz Republic",
    "la": "Lao PDR",
    "lv": "Latvia",
    "lb": "Lebanon",
    "ls": "Lesotho",
    "lr": "Liberia",
    "ly": "Libya",
    "li": "Liechtenstein",
    "lt": "Lithuania",
    "lu": "Luxembourg",
    "mo": "Macao SAR, China",
    "mk": "Macedonia, FYR",
    "mg": "Madagascar",
    "mw": "Malawi",
    "my": "Malaysia",
    "mv": "Maldives",
    "ml": "Mali",
    "mt": "Malta",
    "mh": "Marshall Islands",
    "mr": "Mauritania",
    "mu": "Mauritius",
    "yt": "Mayotte",
    "mx": "Mexico",
    "fm": "Micronesia, Fed. Sts.",
    "md": "Moldova",
    "mc": "Monaco",
    "mn": "Mongolia",
    "me": "Montenegro",
    "ma": "Morocco",
    "mz": "Mozambique",
    "mm": "Myanmar",
    "na": "Namibia",
    "np": "Nepal",
    "nl": "Netherlands",
    "nc": "New Caledonia",
    "nz": "New Zealand",
    "ni": "Nicaragua",
    "ne": "Niger",
    "ng": "Nigeria",
    "mp": "Northern Mariana Islands",
    "no": "Norway",
    "om": "Oman",
    "pk": "Pakistan",
    "pw": "Palau",
    "pa": "Panama",
    "pg": "Papua New Guinea",
    "py": "Paraguay",
    "pe": "Peru",
    "ph": "Philippines",
    "pl": "Poland",
    "pt": "Portugal",
    "pr": "Puerto Rico",
    "wa": "Qatar",
    "ro": "Romania",
    "ru": "Russian Federation",
    "rw": "Rwanda",
    "ws": "Samoa",
    "sm": "San Marino",
    "st": "Sao Tome and Principe",
    "sa": "Saudi Arabia",
    "sn": "Senegal",
    "rs": "Serbia",
    "sc": "Seychelles",
    "sl": "Sierra Leone",
    "sg": "Singapore",
    "sk": "Slovak Republic",
    "si": "Slovenia",
    "sb": "Solomon Islands",
    "so": "Somalia",
    "za": "South Africa",
    "ss": "South Sudan",
    "es": "Spain",
    "lk": "Sri Lanka",
    "kn": "St. Kitts and Nevis",
    "lc": "St. Lucia",
    "mf": "St. Martin (French part)",
    "vc": "St. Vincent and the Grenadines",
    "sd": "Sudan",
    "sr": "Suriname",
    "sz": "Swaziland",
    "se": "Sweden",
    "ch": "Switzerland",
    "sy": "Syrian Arab Republic",
    "tj": "Tajikistan",
    "tz": "Tanzania",
    "th": "Thailand",
    "tp": "Timor-Leste",
    "tg": "Togo",
    "to": "Tonga",
    "tt": "Trinidad and Tobago",
    "tn": "Tunisia",
    "tr": "Turkey",
    "tm": "Turkmenistan",
    "tc": "Turks and Caicos Islands",
    "tv": "Tuvalu",
    "ug": "Uganda",
    "ua": "Ukraine",
    "ae": "United Arab Emirates",
    "uk": "United Kingdom",
    "us": "United States",
    "uy": "Uruguay",
    "uz": "Uzbekistan",
    "vu": "Vanuatu",
    "ve": "Venezuela, RB",
    "vn": "Vietnam",
    "vi": "Virgin Islands (U.S.)",
    "ps": "West Bank and Gaza",
    "eh": "Western Sahara",
    "ye": "Yemen, Rep.",
    "zm": "Zambia",
    "zw": "Zimbabwe"
};
Bloonix.other = {};
Bloonix.other.plotChart = function(o) {    
    if (Bloonix.checkEmptyChartData(o)) {
        return false;
    }

    var chartOuterId = o.chart.container,
        chartOuterBox = "#"+ o.chart.container,
        chartHeaderId = chartOuterId +"-header",
        chartHeaderBox = chartOuterBox +"-header",
        chartContentId = chartOuterId +"-content",
        chartContentBox = chartOuterBox +"-content",
        chartLegendId = chartOuterId +"-legend",
        chartLegendBox = chartOuterBox +"-legend",
        chartTooltipId = chartOuterId +"-tooltip",
        chartTooltipBox = chartOuterBox +"-tooltip",
        colors = [];

    var object = { container: chartContentBox };

    $(chartOuterBox).html("");

    var chartHeader = Utils.create("div")
        .attr("id", chartHeaderId)
        .appendTo(chartOuterBox);

    if (o.chart.title) {
        Utils.create("div")
            .addClass("chart-title")
            .text(o.chart.title)
            .appendTo(chartHeader);
    }

    if (o.chart.subtitle) {
        Utils.create("div")
            .addClass("chart-subtitle")
            .text(o.chart.subtitle)
            .appendTo(chartHeader);
    }

    var chartContent = Utils.create("div")
        .attr("id", chartContentId)
        .appendTo(chartOuterBox);

    var chartLegend = Utils.create("div")
        .attr("id", chartLegendId)
        .addClass("chart-legend")
        .appendTo(chartOuterBox);

    if (o.mode === undefined) {
        o.mode = "time";
    }

    object.opts = {
        yaxis: {
            show: true,
            position: "left",
            font: {
                size: 12,
                lineHeight: 12,
                color: "#606060"
            },
            axisLabel: o.chart.ylabel,
            axisLabelUseCanvas: true,
            axisLabelFontSizePixels: 12,
            axisLabelColour: "#606060"
        },
        xaxis: {
            show: true,
            mode: o.mode,
            timezone: "browser",
            tickLength: 0,
            font: {
                size: 12,
                lineHeight: 12,
                color: "#606060"
            }
        },
        legend: {
            show: false
        },
        grid: {
            show: true,
            color: "#222222",
            borderWidth: 1,
            borderColor: "#e1e1e1",
            hoverable: true,
            autoHighlight: false
        },
        series: {}
    };

    if (o.mode === "time") {
        object.opts.crosshair = {
            mode: "x",
            color: "rgba(0,0,0,.2)"
        };
    }

    if (o.points === true) {
        object.opts.series.points = { show: true, radius: 3 };
        object.opts.lines = { show: true };
    }

    if (o.chart.type === "area") {
        object.opts.series.stack = true;
        object.opts.series.lines = { fill: .7, lineWidth: 1 };
    }

    if (o.chart.units) {
        if (/bytes|bits/.test(o.chart.units)) {
            object.opts.yaxis.tickFormatter = function(value) {
                return Bloonix.convertBytesToStr(o.chart.units, value);
            };
        } else {
            object.opts.yaxis.tickFormatter = function(value) {
                return Bloonix.convertUnitsToStr(o.chart.units, value);
            };
        }
    }

    object.data = [];
    $.each(o.series, function(i, s) {
        if (s.type === "column") {
            return true;
        }

        if (s.color === undefined) {
            if (colors.length === 0) {
                colors = Bloonix.other.defaultColors();
            }
            s.color = colors.shift();
        }

        object.data.push({
            label: s.name,
            color: s.color,
            data: s.data,
            points: s.points,
            __showData: true,
            __data: s.__data
        });

        var legendItem = Utils.create("div")
            .addClass("chart-legend-box")
            .css({ cursor: "pointer" })
            .appendTo(chartLegend);

        Utils.create("div")
            .addClass("chart-legend-label")
            .css({ background: s.color })
            .appendTo(legendItem);

        Utils.create("div")
            .addClass("chart-legend-text")
            .text(s.name)
            .appendTo(legendItem);

        legendItem.click(function() {
            Bloonix.other.showOrHideData({
                chart: object,
                label: s.name,
                item: legendItem
            });
        });
    });

    var resizeContent = function() {
        var chartContentHeight = $(chartOuterBox).height() - chartHeader.outerHeight() - chartLegend.outerHeight() - 1;

        chartContent.css({
            height: chartContentHeight +"px"
        });
    };

    resizeContent();
    object.plot = $(chartContentBox).plot(object.data, object.opts).data("plot");

    $(chartOuterBox).tooltip({
        items: chartContentBox,
        content: function() { return '<div id="'+ chartTooltipId +'"></div>' },
        tooltipClass: "tooltip-ng",
        track: true
    });

    if (o.mode === "time") {
        $(chartContentBox).bind("plothover",  function (event, pos) {
            var axes = object.plot.getAxes();

            if (pos.x < axes.xaxis.min || pos.x > axes.xaxis.max ||
                pos.y < axes.yaxis.min || pos.y > axes.yaxis.max) {
                return;
            }

            var i, j, dataset = object.plot.getData(), text = [];

            for (i = 0; i < dataset.length; ++i) {
                var series = dataset[i];

                if (series.data.length > 0) {
                    $.each(series.data, function(ii, z) {
                        if (z[0] >= pos.x) {
                            var key = z[0];
                            var value = z[1];

                            if (i === 0) {
                                if (series.__data) {
                                    text.push("<b>"+ key +": "+ series.__data.xaxis[key] + "</b>");
                                } else {
                                    var date = new Date(key);
                                    text.push("<b>"+ DateFormat(date, "highchartsTooltip") +"</b>");
                                }
                            }

                            if (o.chart.units) {
                                if (/bytes|bits/.test(o.chart.units)) {
                                    value = Bloonix.convertBytesToStr(o.chart.units, value, true);
                                } else {
                                    value = Bloonix.convertUnitsToStr(o.chart.units, value, true);
                                }
                            }

                            text.push('<b style="color:'+ series.color +';">'+ series.label +"</b>: "+ "<b>"+ value +"</b>");

                            return false;
                        }
                    });
                }
            }

            if (text.length > 0) {
                $(chartTooltipBox).html(
                    '<div class="tooltip-ng-content">'+ text.join("<br/>") +'</div>'
                );
            }
        });
    }

    $(chartLegendBox).resize(function() {
        resizeContent();
        object.plot.resize();
    });
};

/*
    chart: {
        data: chart data
        opts: chart options
        plot: plot object
        container: chartN container
    }
    label: label name
    item: legend item
*/
Bloonix.other.showOrHideData = function(o) {
    var data = [];

    $.each(o.chart.data, function(i, row) {
        if (row.label === o.label) {
            if (row.__showData === true) {
                row.__showData = false;
                o.item.css({ opacity: .5 });
            } else {
                data.push(row);
                row.__showData = true;
                o.item.css({ opacity: 1 });
            }
        } else if (row.__showData === true) {
            data.push(row);
        }
    });

    o.chart.plot = $(o.chart.container).plot(data, o.chart.opts).data("plot");
};

// Special chart for MTR
Bloonix.other.createChartForMTR = function(o) {
    var data = [],
        points = [ "circle", "square", "diamond", "triangle", "cross" ];

    $.each(o.series, function(x, s) {
        if (s.type === "column") {
            return true;
        }

        $.each(s.data, function(y, d) {
            s.data[y] = [ o.categories[y], s.data[y] ];
        });

        data.push({
            name: s.name,
            color: s.color,
            data: s.data,
            points: { symbol: points.shift() },
            __data: {
                xaxis: o.ipaddrByStep
            }
        });
    });

    o.mode = "categories";
    o.type = "line";
    o.series = data;
    o.points = true;
    Bloonix.other.plotChart(o);
};

Bloonix.other.createChartForWTRM = function(o) {
    var data = [];

    $.each(o.seriesData, function(y, d) {
        o.seriesData[y] = [ o.categories[y], o.seriesData[y] ];
    });

    data.push({
        name: "Steps",
        color: "#005467",
        data: o.seriesData,
        points: { symbol: "circle" }
    });

    o.mode = "categories";
    o.type = "area";
    o.series = data;
    o.points = true;
    Bloonix.other.plotChart(o);
};

Bloonix.other.defaultColors = function() {
    return [
        '#7cb5ec', '#434348', '#90ed7d', '#f7a35c', '#8085e9', 
        '#f15c80', '#e4d354', '#8085e8', '#8d4653', '#91e8e1'
    ];
};
Bloonix.other.pieChart = function(o) {
    var data = [];

    var chartOuterId = o.chart.container,
        chartOuterBox = "#"+ o.chart.container,
        chartContentId = chartOuterId +"-content",
        chartContentBox = chartOuterBox +"-content",
        chartLegendId = chartOuterId +"-legend",
        chartLegendBox = chartOuterBox +"-legend";

    $(chartOuterBox).html("");

    var chartContent = Utils.create("div")
        .attr("id", chartContentId)
        .appendTo(chartOuterBox);

    var chartLegend = Utils.create("div")
        .attr("id", chartLegendId)
        .addClass("chart-legend")
        .appendTo(chartOuterBox);

    if (o.legend === false) {
        chartLegend.hide();
    }

    $.each(o.data, function(i, s) {
        data.push({
            label: s.name,
            data: s.y,
            color: o.colors[i]
            //color: "rgba("+ Utils.hexToRGB(o.colors[i]) +", 0.9)",
        });

        var legendItem = Utils.create("div")
            .addClass("chart-legend-box")
            .appendTo(chartLegend);

        Utils.create("div")
            .addClass("chart-legend-label")
            .css({ background: o.colors[i] })
            .appendTo(legendItem);

        Utils.create("div")
            .addClass("chart-legend-text")
            .text(s.name)
            .appendTo(legendItem);
    });

    var resizeContent = function() {
        var chartContentHeight = $(chartOuterBox).height() - chartLegend.outerHeight() - 1;

        chartContent.css({
            height: chartContentHeight +"px"
        });
    };

    resizeContent();

    $(chartContentBox).html("");
    var plot = $.plot(chartContentBox, data, {
        series: {
            pie: {
                show: true,
                radius: 3/4,
                highlight: {
                    opacity: 0.1
                },
                stroke: {
                    color: "#ffffff",
                    width: 1
                },
                label: {
                    show: o.legend === false ? false : true,
                    radius: 3/4,
                    formatter: function(label, series) {
                        return "<div style='font-size:12px; text-align:center; padding:4px; color:white;'>"
                            + label + "<br/>" + Math.round(series.percent) + "%</div>";
                    },
                    background: {
                        opacity: 0.5,
                        color: '#000'
                    }
                }
            }
        },
        grid: {
            clickable: true,
            hoverable: true
        },
        legend: {
            show: false
        }
    });

    $(chartContentBox).resize(function() {
        resizeContent();
        plot.resize();
    });

    $(chartContentBox).bind("plotclick", function (event, pos, item) {
        if (item && o.onClick) {
            o.onClick(item.series.label);
        }
    });

    $(chartContentBox).bind("plothover", function (event, pos, item) {
        if (item) {
            document.body.style.cursor = 'pointer';
        } else {
            document.body.style.cursor = 'default';
        }
    });
};
Bloonix.other.barChart = function(o) {
    var chartContentBox = "#"+ o.chart.container,
        data = [];

    $.each(o.series, function(x, s) {
        $.each(s.data, function(y, d) {
            data.push({ data: [[ o.categories[y], d ]], color: s.color });
        });
    });

    $.plot(chartContentBox, data, {
        series: {
            bars: {
                show: true,
                barWidth: 0.6,
                align: "center"
            }
        },
        xaxis: {
            mode: "categories",
            tickLength: 0
        },
        legend: {
            show: true
        },
        grid: {
            show: true,
            color: "#222222",
            borderWidth: 1,
            borderColor: "#e1e1e1",
            hoverable: true,
            autoHighlight: false
        }
    });
};
Bloonix.other.mapChart = function(o) {
    var data = {},
        colors = {},
        region = {};

    var fillColor = {
        UNKNOWN: "#eb6841",
        CRITICAL: "#cc333f",
        WARNING: "#edc951",
        INFO: "#339ab8",
        OK: "#5fbf5f",
        defaultFill: "#c9c9c9"
    };

    $.each(o.data, function(k, v) {
        var country = k.toLowerCase(),
            color = "OK";

        if (v.UNKNOWN > 0) {
            color = "UNKNOWN";
        } else if (v.CRITICAL > 0) {
            color = "CRITICAL";
        } else if (v.WARNING > 0) {
            color = "WARNING";
        } else if (v.INFO > 0) {
            color = "INFO";
        }

        colors[country] = fillColor[color];

        data[country] = {
            UNKNOWN: v.UNKNOWN,
            CRITICAL: v.CRITICAL,
            WARNING: v.WARNING,
            INFO: v.INFO,
            OK: v.OK
        };
    });

    $(".jqvmap-label").remove();
    $("#"+ o.chart.container).html("").off().vectorMap({
        map: "world_en",
        backgroundColor: "#ffffff",
        borderColor: "#ffffff",
        borderOpacity: 1,
        borderWidth: 1,
        color: "#c9c9c9",
        colors: colors,
        enableZoom: true,
        hoverColor: '#68a4a3',
        hoverOpacity: null,
        normalizeFunction: 'linear',
        //scaleColors: ['#b6d6ff', '#005ace'],
        selectedColor: null,
        selectedRegion: null,
        showTooltip: true,
        onRegionClick: function(element, code, region) {
            $("#"+ o.chart.container).html("").off();
            $(".jqvmap-label").remove();
            Bloonix.route.to("monitoring/hosts", { query: "c:"+ code.toUpperCase() });
        },
        onLabelShow: function(element, label, code) {
            label.css({ "z-index": "10005", position: "fixed" });
            var mapData;

            if (data[code]) {
                mapData = data[code];
            } else {
                mapData = { OK: 0, INFO: 0, WARNING: 0, CRITICAL: 0, UNKNOWN: 0 };
            }

            var div = '<div class="map-tooltip"><span class="f32"><span class="flag '
                + code +'"></span></span> '+ Bloonix.other.mapRegions[code]
                +'<br/><b>Unknown: </b>'+ mapData.UNKNOWN
                +'<br/><b>Critical: </b>'+ mapData.CRITICAL
                +'<br/><b>Warning: </b>'+ mapData.WARNING
                +'<br/><b>Info: </b>'+ mapData.INFO
                +'<br/><b>Ok: </b>'+ mapData.OK
                +'</div>';

            label.html(div);
        }
    });
};

Bloonix.other.mapCodes = {
    "AF": "AFG", "af": "AFG", "AFG": "af",
    "AL": "ALB", "al": "ALB", "ALB": "al",
    "DZ": "DZA", "dz": "DZA", "DZA": "dz",
    "AS": "ASM", "as": "ASM", "ASM": "as",
    "AD": "AND", "ad": "AND", "AND": "ad",
    "AO": "AGO", "ao": "AGO", "AGO": "ao",
    "AI": "AIA", "ai": "AIA", "AIA": "ai",
    "AQ": "ATA", "aq": "ATA", "ATA": "aq",
    "AG": "ATG", "ag": "ATG", "ATG": "ag",
    "AR": "ARG", "ar": "ARG", "ARG": "ar",
    "AM": "ARM", "am": "ARM", "ARM": "am",
    "AW": "ABW", "aw": "ABW", "ABW": "aw",
    "AU": "AUS", "au": "AUS", "AUS": "au",
    "AT": "AUT", "at": "AUT", "AUT": "at",
    "AZ": "AZE", "az": "AZE", "AZE": "az",
    "BS": "BHS", "bs": "BHS", "BHS": "bs",
    "BH": "BHR", "bh": "BHR", "BHR": "bh",
    "BD": "BGD", "bd": "BGD", "BGD": "bd",
    "BB": "BRB", "bb": "BRB", "BRB": "bb",
    "BY": "BLR", "by": "BLR", "BLR": "by",
    "BE": "BEL", "be": "BEL", "BEL": "be",
    "BZ": "BLZ", "bz": "BLZ", "BLZ": "bz",
    "BJ": "BEN", "bj": "BEN", "BEN": "bj",
    "BM": "BMU", "bm": "BMU", "BMU": "bm",
    "BT": "BTN", "bt": "BTN", "BTN": "bt",
    "BO": "BOL", "bo": "BOL", "BOL": "bo",
    "BA": "BIH", "ba": "BIH", "BIH": "ba",
    "BW": "BWA", "bw": "BWA", "BWA": "bw",
    "BR": "BRA", "br": "BRA", "BRA": "br",
    "IO": "IOT", "io": "IOT", "IOT": "io",
    "VG": "VGB", "vg": "VGB", "VGB": "vg",
    "BN": "BRN", "bn": "BRN", "BRN": "bn",
    "BG": "BGR", "bg": "BGR", "BGR": "bg",
    "BF": "BFA", "bf": "BFA", "BFA": "bf",
    "MM": "MMR", "mm": "MMR", "MMR": "mm",
    "BI": "BDI", "bi": "BDI", "BDI": "bi",
    "KH": "KHM", "kh": "KHM", "KHM": "kh",
    "CM": "CMR", "cm": "CMR", "CMR": "cm",
    "CA": "CAN", "ca": "CAN", "CAN": "ca",
    "CV": "CPV", "cv": "CPV", "CPV": "cv",
    "KY": "CYM", "ky": "CYM", "CYM": "ky",
    "CF": "CAF", "cf": "CAF", "CAF": "cf",
    "TD": "TCD", "td": "TCD", "TCD": "td",
    "CL": "CHL", "cl": "CHL", "CHL": "cl",
    "CN": "CHN", "cn": "CHN", "CHN": "cn",
    "CX": "CXR", "cx": "CXR", "CXR": "cx",
    "CC": "CCK", "cc": "CCK", "CCK": "cc",
    "CO": "COL", "co": "COL", "COL": "co",
    "KM": "COM", "km": "COM", "COM": "km",
    "CK": "COK", "ck": "COK", "COK": "ck",
    "CR": "CRC", "cr": "CRC", "CRC": "cr",
    "HR": "HRV", "hr": "HRV", "HRV": "hr",
    "CU": "CUB", "cu": "CUB", "CUB": "cu",
    "CY": "CYP", "cy": "CYP", "CYP": "cy",
    "CZ": "CZE", "cz": "CZE", "CZE": "cz",
    "CD": "COD", "cd": "COD", "COD": "cd",
    "DK": "DNK", "dk": "DNK", "DNK": "dk",
    "DJ": "DJI", "dj": "DJI", "DJI": "dj",
    "DM": "DMA", "dm": "DMA", "DMA": "dm",
    "DO": "DOM", "do": "DOM", "DOM": "do",
    "EC": "ECU", "ec": "ECU", "ECU": "ec",
    "EG": "EGY", "eg": "EGY", "EGY": "eg",
    "SV": "SLV", "sv": "SLV", "SLV": "sv",
    "GQ": "GNQ", "gq": "GNQ", "GNQ": "gq",
    "ER": "ERI", "er": "ERI", "ERI": "er",
    "EE": "EST", "ee": "EST", "EST": "ee",
    "ET": "ETH", "et": "ETH", "ETH": "et",
    "FK": "FLK", "fk": "FLK", "FLK": "fk",
    "FO": "FRO", "fo": "FRO", "FRO": "fo",
    "FJ": "FJI", "fj": "FJI", "FJI": "fj",
    "FI": "FIN", "fi": "FIN", "FIN": "fi",
    "FR": "FRA", "fr": "FRA", "FRA": "fr",
    "PF": "PYF", "pf": "PYF", "PYF": "pf",
    "GA": "GAB", "ga": "GAB", "GAB": "ga",
    "GM": "GMB", "gm": "GMB", "GMB": "gm",
    "GE": "GEO", "ge": "GEO", "GEO": "ge",
    "DE": "DEU", "de": "DEU", "DEU": "de",
    "GH": "GHA", "gh": "GHA", "GHA": "gh",
    "GI": "GIB", "gi": "GIB", "GIB": "gi",
    "GR": "GRC", "gr": "GRC", "GRC": "gr",
    "GL": "GRL", "gl": "GRL", "GRL": "gl",
    "GD": "GRD", "gd": "GRD", "GRD": "gd",
    "GU": "GUM", "gu": "GUM", "GUM": "gu",
    "GT": "GTM", "gt": "GTM", "GTM": "gt",
    "GN": "GIN", "gn": "GIN", "GIN": "gn",
    "GW": "GNB", "gw": "GNB", "GNB": "gw",
    "GY": "GUY", "gy": "GUY", "GUY": "gy",
    "HT": "HTI", "ht": "HTI", "HTI": "ht",
    "VA": "VAT", "va": "VAT", "VAT": "va",
    "HN": "HND", "hn": "HND", "HND": "hn",
    "HK": "HKG", "hk": "HKG", "HKG": "hk",
    "HU": "HUN", "hu": "HUN", "HUN": "hu",
    "IS": "IS ", "is": "IS ", "IS ": "is",
    "IN": "IND", "in": "IND", "IND": "in",
    "ID": "IDN", "id": "IDN", "IDN": "id",
    "IR": "IRN", "ir": "IRN", "IRN": "ir",
    "IQ": "IRQ", "iq": "IRQ", "IRQ": "iq",
    "IE": "IRL", "ie": "IRL", "IRL": "ie",
    "IM": "IMN", "im": "IMN", "IMN": "im",
    "IL": "ISR", "il": "ISR", "ISR": "il",
    "IT": "ITA", "it": "ITA", "ITA": "it",
    "CI": "CIV", "ci": "CIV", "CIV": "ci",
    "JM": "JAM", "jm": "JAM", "JAM": "jm",
    "JP": "JPN", "jp": "JPN", "JPN": "jp",
    "JE": "JEY", "je": "JEY", "JEY": "je",
    "JO": "JOR", "jo": "JOR", "JOR": "jo",
    "KZ": "KAZ", "kz": "KAZ", "KAZ": "kz",
    "KE": "KEN", "ke": "KEN", "KEN": "ke",
    "KI": "KIR", "ki": "KIR", "KIR": "ki",
    "KW": "KWT", "kw": "KWT", "KWT": "kw",
    "KG": "KGZ", "kg": "KGZ", "KGZ": "kg",
    "LA": "LAO", "la": "LAO", "LAO": "la",
    "LV": "LVA", "lv": "LVA", "LVA": "lv",
    "LB": "LBN", "lb": "LBN", "LBN": "lb",
    "LS": "LSO", "ls": "LSO", "LSO": "ls",
    "LR": "LBR", "lr": "LBR", "LBR": "lr",
    "LY": "LBY", "ly": "LBY", "LBY": "ly",
    "LI": "LIE", "li": "LIE", "LIE": "li",
    "LT": "LTU", "lt": "LTU", "LTU": "lt",
    "LU": "LUX", "lu": "LUX", "LUX": "lu",
    "MO": "MAC", "mo": "MAC", "MAC": "mo",
    "MK": "MKD", "mk": "MKD", "MKD": "mk",
    "MG": "MDG", "mg": "MDG", "MDG": "mg",
    "MW": "MWI", "mw": "MWI", "MWI": "mw",
    "MY": "MYS", "my": "MYS", "MYS": "my",
    "MV": "MDV", "mv": "MDV", "MDV": "mv",
    "ML": "MLI", "ml": "MLI", "MLI": "ml",
    "MT": "MLT", "mt": "MLT", "MLT": "mt",
    "MH": "MHL", "mh": "MHL", "MHL": "mh",
    "MR": "MRT", "mr": "MRT", "MRT": "mr",
    "MU": "MUS", "mu": "MUS", "MUS": "mu",
    "YT": "MYT", "yt": "MYT", "MYT": "yt",
    "MX": "MEX", "mx": "MEX", "MEX": "mx",
    "FM": "FSM", "fm": "FSM", "FSM": "fm",
    "MD": "MDA", "md": "MDA", "MDA": "md",
    "MC": "MCO", "mc": "MCO", "MCO": "mc",
    "MN": "MNG", "mn": "MNG", "MNG": "mn",
    "ME": "MNE", "me": "MNE", "MNE": "me",
    "MS": "MSR", "ms": "MSR", "MSR": "ms",
    "MA": "MAR", "ma": "MAR", "MAR": "ma",
    "MZ": "MOZ", "mz": "MOZ", "MOZ": "mz",
    "NA": "NAM", "na": "NAM", "NAM": "na",
    "NR": "NRU", "nr": "NRU", "NRU": "nr",
    "NP": "NPL", "np": "NPL", "NPL": "np",
    "NL": "NLD", "nl": "NLD", "NLD": "nl",
    "AN": "ANT", "an": "ANT", "ANT": "an",
    "NC": "NCL", "nc": "NCL", "NCL": "nc",
    "NZ": "NZL", "nz": "NZL", "NZL": "nz",
    "NI": "NIC", "ni": "NIC", "NIC": "ni",
    "NE": "NER", "ne": "NER", "NER": "ne",
    "NG": "NGA", "ng": "NGA", "NGA": "ng",
    "NU": "NIU", "nu": "NIU", "NIU": "nu",
    "KP": "PRK", "kp": "PRK", "PRK": "kp",
    "MP": "MNP", "mp": "MNP", "MNP": "mp",
    "NO": "NOR", "no": "NOR", "NOR": "no",
    "OM": "OMN", "om": "OMN", "OMN": "om",
    "PK": "PAK", "pk": "PAK", "PAK": "pk",
    "PW": "PLW", "pw": "PLW", "PLW": "pw",
    "PA": "PAN", "pa": "PAN", "PAN": "pa",
    "PG": "PNG", "pg": "PNG", "PNG": "pg",
    "PY": "PRY", "py": "PRY", "PRY": "py",
    "PE": "PER", "pe": "PER", "PER": "pe",
    "PH": "PHL", "ph": "PHL", "PHL": "ph",
    "PN": "PCN", "pn": "PCN", "PCN": "pn",
    "PL": "POL", "pl": "POL", "POL": "pl",
    "PT": "PRT", "pt": "PRT", "PRT": "pt",
    "PR": "PRI", "pr": "PRI", "PRI": "pr",
    "QA": "QAT", "qa": "QAT", "QAT": "qa",
    "CG": "COG", "cg": "COG", "COG": "cg",
    "RO": "ROU", "ro": "ROU", "ROU": "ro",
    "RU": "RUS", "ru": "RUS", "RUS": "ru",
    "RW": "RWA", "rw": "RWA", "RWA": "rw",
    "BL": "BLM", "bl": "BLM", "BLM": "bl",
    "SH": "SHN", "sh": "SHN", "SHN": "sh",
    "KN": "KNA", "kn": "KNA", "KNA": "kn",
    "LC": "LCA", "lc": "LCA", "LCA": "lc",
    "MF": "MAF", "mf": "MAF", "MAF": "mf",
    "PM": "SPM", "pm": "SPM", "SPM": "pm",
    "VC": "VCT", "vc": "VCT", "VCT": "vc",
    "WS": "WSM", "ws": "WSM", "WSM": "ws",
    "SM": "SMR", "sm": "SMR", "SMR": "sm",
    "ST": "STP", "st": "STP", "STP": "st",
    "SA": "SAU", "sa": "SAU", "SAU": "sa",
    "SN": "SEN", "sn": "SEN", "SEN": "sn",
    "RS": "SRB", "rs": "SRB", "SRB": "rs",
    "SC": "SYC", "sc": "SYC", "SYC": "sc",
    "SL": "SLE", "sl": "SLE", "SLE": "sl",
    "SG": "SGP", "sg": "SGP", "SGP": "sg",
    "SK": "SVK", "sk": "SVK", "SVK": "sk",
    "SI": "SVN", "si": "SVN", "SVN": "si",
    "SB": "SLB", "sb": "SLB", "SLB": "sb",
    "SO": "SOM", "so": "SOM", "SOM": "so",
    "ZA": "ZAF", "za": "ZAF", "ZAF": "za",
    "KR": "KOR", "kr": "KOR", "KOR": "kr",
    "ES": "ESP", "es": "ESP", "ESP": "es",
    "LK": "LKA", "lk": "LKA", "LKA": "lk",
    "SD": "SDN", "sd": "SDN", "SDN": "sd",
    "SR": "SUR", "sr": "SUR", "SUR": "sr",
    "SJ": "SJM", "sj": "SJM", "SJM": "sj",
    "SZ": "SWZ", "sz": "SWZ", "SWZ": "sz",
    "SE": "SWE", "se": "SWE", "SWE": "se",
    "CH": "CHE", "ch": "CHE", "CHE": "ch",
    "SY": "SYR", "sy": "SYR", "SYR": "sy",
    "TW": "TWN", "tw": "TWN", "TWN": "tw",
    "TJ": "TJK", "tj": "TJK", "TJK": "tj",
    "TZ": "TZA", "tz": "TZA", "TZA": "tz",
    "TH": "THA", "th": "THA", "THA": "th",
    "TL": "TLS", "tl": "TLS", "TLS": "tl",
    "TG": "TGO", "tg": "TGO", "TGO": "tg",
    "TK": "TKL", "tk": "TKL", "TKL": "tk",
    "TO": "TON", "to": "TON", "TON": "to",
    "TT": "TTO", "tt": "TTO", "TTO": "tt",
    "TN": "TUN", "tn": "TUN", "TUN": "tn",
    "TR": "TUR", "tr": "TUR", "TUR": "tr",
    "TM": "TKM", "tm": "TKM", "TKM": "tm",
    "TC": "TCA", "tc": "TCA", "TCA": "tc",
    "TV": "TUV", "tv": "TUV", "TUV": "tv",
    "UG": "UGA", "ug": "UGA", "UGA": "ug",
    "UA": "UKR", "ua": "UKR", "UKR": "ua",
    "AE": "ARE", "ae": "ARE", "ARE": "ae",
    "GB": "GBR", "gb": "GBR", "GBR": "gb",
    "US": "USA", "us": "USA", "USA": "us",
    "UY": "URY", "uy": "URY", "URY": "uy",
    "VI": "VIR", "vi": "VIR", "VIR": "vi",
    "UZ": "UZB", "uz": "UZB", "UZB": "uz",
    "VU": "VUT", "vu": "VUT", "VUT": "vu",
    "VE": "VEN", "ve": "VEN", "VEN": "ve",
    "VN": "VNM", "vn": "VNM", "VNM": "vn",
    "WF": "WLF", "wf": "WLF", "WLF": "wf",
    "EH": "ESH", "eh": "ESH", "ESH": "eh",
    "YE": "YEM", "ye": "YEM", "YEM": "ye",
    "ZM": "ZMB", "zm": "ZMB", "ZMB": "zm",
    "ZW": "ZWE", "zw": "ZWE", "ZWE": "zw"
};

Bloonix.other.mapRegions = {
    "ae": "United Arab Emirates",
    "af": "Afghanistan",
    "ag": "Antigua and Barbuda",
    "al": "Albania",
    "am": "Armenia",
    "ao": "Angola",
    "ar": "Argentina",
    "at": "Austria",
    "au": "Australia",
    "az": "Azerbaijan",
    "ba": "Bosnia and Herzegovina",
    "bb": "Barbados",
    "bd": "Bangladesh",
    "be": "Belgium",
    "bf": "Burkina Faso",
    "bg": "Bulgaria",
    "bi": "Burundi",
    "bj": "Benin",
    "bn": "Brunei Darussalam",
    "bo": "Bolivia",
    "br": "Brazil",
    "bs": "Bahamas",
    "bt": "Bhutan",
    "bw": "Botswana",
    "by": "Belarus",
    "bz": "Belize",
    "ca": "Canada",
    "cd": "Congo",
    "cf": "Central African Republic",
    "cg": "Congo",
    "ch": "Switzerland",
    "ci": "Cote d'Ivoire",
    "cl": "Chile",
    "cm": "Cameroon",
    "cn": "China",
    "co": "Colombia",
    "cr": "Costa Rica",
    "cu": "Cuba",
    "cv": "Cape Verde",
    "cy": "Cyprus",
    "cz": "Czech Republic",
    "de": "Germany",
    "dj": "Djibouti",
    "dk": "Denmark",
    "dm": "Dominica",
    "do": "Dominican Republic",
    "dz": "Algeria",
    "ec": "Ecuador",
    "ee": "Estonia",
    "eg": "Egypt",
    "er": "Eritrea",
    "es": "Spain",
    "et": "Ethiopia",
    "fi": "Finland",
    "fj": "Fiji",
    "fk": "Falkland Islands",
    "fr": "France",
    "ga": "Gabon",
    "gb": "United Kingdom",
    "gd": "Grenada",
    "ge": "Georgia",
    "gf": "French Guiana",
    "gh": "Ghana",
    "gl": "Greenland",
    "gm": "Gambia",
    "gn": "Guinea",
    "gq": "Equatorial Guinea",
    "gr": "Greece",
    "gt": "Guatemala",
    "gw": "Guinea-Bissau",
    "gy": "Guyana",
    "hn": "Honduras",
    "hr": "Croatia",
    "ht": "Haiti",
    "hu": "Hungary",
    "id": "Indonesia",
    "ie": "Ireland",
    "il": "Israel",
    "in": "India",
    "iq": "Iraq",
    "ir": "Iran",
    "is": "Iceland",
    "it": "Italy",
    "jm": "Jamaica",
    "jo": "Jordan",
    "jp": "Japan",
    "ke": "Kenya",
    "kg": "Kyrgyz Republic",
    "kh": "Cambodia",
    "km": "Comoros",
    "kn": "Saint Kitts and Nevis",
    "kp": "North Korea",
    "kr": "South Korea",
    "kw": "Kuwait",
    "kz": "Kazakhstan",
    "la": "Lao People's Democratic Republic",
    "lb": "Lebanon",
    "lc": "Saint Lucia",
    "lk": "Sri Lanka",
    "lr": "Liberia",
    "ls": "Lesotho",
    "lt": "Lithuania",
    "lv": "Latvia",
    "ly": "Libya",
    "ma": "Morocco",
    "md": "Moldova",
    "mg": "Madagascar",
    "mk": "Macedonia",
    "ml": "Mali",
    "mm": "Myanmar",
    "mn": "Mongolia",
    "mr": "Mauritania",
    "mt": "Malta",
    "mu": "Mauritius",
    "mv": "Maldives",
    "mw": "Malawi",
    "mx": "Mexico",
    "my": "Malaysia",
    "mz": "Mozambique",
    "na": "Namibia",
    "nc": "New Caledonia",
    "ne": "Niger",
    "ng": "Nigeria",
    "ni": "Nicaragua",
    "nl": "Netherlands",
    "no": "Norway",
    "np": "Nepal",
    "nz": "New Zealand",
    "om": "Oman",
    "pa": "Panama",
    "pe": "Peru",
    "pf": "French Polynesia",
    "pg": "Papua New Guinea",
    "ph": "Philippines",
    "pk": "Pakistan",
    "pl": "Poland",
    "pt": "Portugal",
    "py": "Paraguay",
    "qa": "Qatar",
    "re": "Reunion",
    "ro": "Romania",
    "rs": "Serbia",
    "ru": "Russian Federation",
    "rw": "Rwanda",
    "sa": "Saudi Arabia",
    "sb": "Solomon Islands",
    "sc": "Seychelles",
    "sd": "Sudan",
    "se": "Sweden",
    "si": "Slovenia",
    "sk": "Slovakia",
    "sl": "Sierra Leone",
    "sn": "Senegal",
    "so": "Somalia",
    "sr": "Suriname",
    "st": "Sao Tome and Principe",
    "sv": "El Salvador",
    "sy": "Syrian Arab Republic",
    "sz": "Swaziland",
    "td": "Chad",
    "tg": "Togo",
    "th": "Thailand",
    "tj": "Tajikistan",
    "tl": "Timor-Leste",
    "tm": "Turkmenistan",
    "tn": "Tunisia",
    "tr": "Turkey",
    "tt": "Trinidad and Tobago",
    "tw": "Taiwan",
    "tz": "Tanzania",
    "ua": "Ukraine",
    "ug": "Uganda",
    "us": "United States of America",
    "uy": "Uruguay",
    "uz": "Uzbekistan",
    "ve": "Venezuela",
    "vn": "Vietnam",
    "vu": "Vanuatu",
    "ye": "Yemen",
    "za": "South Africa",
    "zm": "Zambia",
    "zw": "Zimbabwe"
};
Bloonix.createInfovisGraph = function(o) {
    var graphFunction;

    o.width = $("#"+ o.container).innerWidth(),
    o.height = $("#"+ o.container).innerHeight();

    if (o.type == "radialGraph") {
        graphFunction = Bloonix.createInfovisRadialGraph;
    } else if (o.type == "hyperTree") {
        graphFunction = Bloonix.createInfovisHyperTree;
    } else if (o.type == "spaceTree") {
        graphFunction = Bloonix.createInfovisSpaceTree;
    }

    $("#"+ o.container).html("");
    graphFunction(o);
};

Bloonix.createInfovisRadialGraph = function(o) {
    var graph = new $jit.RGraph({
        injectInto: o.container,
        width: o.width,
        height: o.height,
        background: {
            CanvasStyles: {
                strokeStyle: "#aaaaaa"
            }
        },
        Navigation: {
            enable: true,
            panning: true
        },
        Node: {
            dim: 5,
            color: "#aaaaaa",
            overridable: true
        },
        Edge: {
            color: "#c17878",
            lineWidth: 1.2
        },
        Tips: {
            enable: false,
            offsetX: 20,
            offsetY: 20
        },
        Label: {
            type: "HTML",
            size: 11,
            style: "bold",
            color: "#222222"
        },
        onBeforeCompute: function(node){
            o.onClick(node.data);
        },
        onCreateLabel: function(domElement, node){
            domElement.innerHTML = node.name;
            domElement.onclick = function(){
                graph.onClick(node.id, {
                    onComplete: function() {
                    }
                });
            };
        },
        onPlaceLabel: function(domElement, node){
            var style = domElement.style;
            style.display = "";
            style.cursor = "pointer";
            if (node._depth <= 1) {
                style.fontSize = "11px";
                style.color = "#333333";
            } else if(node._depth == 2){
                style.fontSize = "10px";
                style.color = "#494949";
            } else {
                style.fontSize = "8px";
                style.color = "#494949";
            }
            var left = parseInt(style.left);
            var w = domElement.offsetWidth;
            style.left = (left - w / 2) + "px";
        }
    });
    graph.loadJSON(o.data);
    graph.graph.eachNode(function(n) {
        var pos = n.getPos();
        pos.setc(-200, -200);
    });
    graph.compute("end");
    graph.fx.animate({
        modes:["polar"],
        duration: 1000
    });
    //$jit.id("inner-details").innerHTML = graph.graph.getNode(graph.root).data.relation;
};

Bloonix.createInfovisHyperTree = function(o) {
    var graph = new $jit.Hypertree({
        injectInto: o.container,
        width: o.width,
        height: o.height,
        duration: 1500,
        Node: {
            dim: 5,
            color: "#aaaaaa",
            overridable: true
        },
        Edge: {
            color: "#008888",
            lineWidth: 1.2
        },
        Tips: {
            enable: false,
            offsetX: 20,
            offsetY: 20,
            //onShow: function(tip, elem) {
            //    tip.innerHTML = "<div class="infovis-node-tip">" + elem.data.description + "</div>";
            //},
        },
        onBeforeCompute: function(node){
            o.onClick(node.data);
        },
        onCreateLabel: function(domElement, node){
            domElement.innerHTML = node.name;
            $jit.util.addEvent(domElement, "click", function () {
                graph.onClick(node.id, {
                    onComplete: function() {
                    }
                });
            });
        },
        onPlaceLabel: function(domElement, node){
            var style = domElement.style;
            style.display = "";
            style.cursor = "pointer";
            if (node._depth <= 1) {
                style.fontSize = "11px";
                style.color = "#333333";
            } else if(node._depth == 2){
                style.fontSize = "10px";
                style.color = "#333333";
            } else {
                style.fontSize = "8px";
                style.color = "#333333";
            }
            var left = parseInt(style.left);
            var w = domElement.offsetWidth;
            style.left = (left - w / 2) + "px";
        },
    });
    graph.loadJSON(o.data);
    graph.refresh();
    graph.controller.onComplete();
};

Bloonix.createInfovisSpaceTree = function(o) {
    var graph = new $jit.ST({
        injectInto: o.container,
        width: o.width,
        height: o.height,
        duration: 600,
        levelsToShow: 10,
        transition: $jit.Trans.Quart.easeInOut,
        //transition: $jit.Trans.linear,
        levelDistance: 30,
        orientation: "bottom",
        Navigation: {
            enable: true,
            panning: true,
        },
        Node: {
            height: 40,
            width: 200,
            type: "rectangle",
            color: "#cccccc",
            overridable: true
        },
        Edge: {
            type: "bezier",
            overridable: true,
            lineWidth: 1.2
        },
        Tips: {
            enable: false,
            offsetX: 20,
            offsetY: 20,
            //onShow: function(tip, elem) {
            //    tip.innerHTML = "<div class="infovis-node-tip">" + elem.data.description + "</div>";
            //},
        },
        onBeforeCompute: function(node){
        },
        onAfterCompute: function(){
        },
        onCreateLabel: function(label, node){
            label.id = node.id;
            label.innerHTML = node.name;
            label.onclick = function(){
                graph.onClick(node.id);
                o.onClick(node.data);
                //graph.setRoot(node.id, "animate");
            };
            var style = label.style;
            style.width = "200px";
            style.height = "40px";
            style.cursor = "pointer";
            style.color = "#333333";
            style.fontSize = "12px";
            style.textAlign= "center";
            style.paddingTop = "3px";
            style.paddingLeft = "3px";
        },
        onBeforePlotNode: function(node){
            if (node.selected) {
                node.data.$color = "#ffff77";
            }
            else {
                delete node.data.$color;
                if(!node.anySubnode("exist")) {
                    var count = 0;
                    node.eachSubnode(function(n) { count++; });
                    node.data.$color = ["#aaa", "#baa", "#caa", "#daa", "#eaa", "#faa"][count];
                }
            }
        },
        onBeforePlotLine: function(adj){
            if (adj.nodeFrom.selected && adj.nodeTo.selected) {
                adj.data.$color = "#eeeedd";
                adj.data.$lineWidth = 3;
            }
            else {
                delete adj.data.$color;
                delete adj.data.$lineWidth;
            }
        }
    });
    graph.loadJSON(o.data);
    graph.compute();
    graph.geom.translate(new $jit.Complex(-200, 0), "current");
    graph.onClick(graph.root);
};

// Expose the Bloonix object as global.
window.Bloonix = Bloonix;

// End of encapsulation.
})();
