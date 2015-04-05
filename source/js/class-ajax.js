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
