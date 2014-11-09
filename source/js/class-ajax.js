var Ajax = function(o) {
    Utils.extend(this, o);

    this.requestDefaults = {
        type: this.type || "post",
        contentType: "application/json; charset=utf-8",
        scriptCharset: "utf-8",
        dataType: "json",
        processData: false,
        async: true,
        // Because of a bug it's necessary to set a default data string.
        // If data is empty, then the content type is not send to the server.
        //data: "{}",
        error: function() {
            Log.error(
                "Failed to load data from server."
                +"Try it again and reload the site."
                +"Please contact an administrator if the request failed again."
            );
        }
    };

    Utils.extend(this.err, Ajax.defaults.err);
    Utils.extend(this.ignoreErrors, Ajax.defaults.ignoreErrors);
    Utils.extend(this.handleStatus, Ajax.defaults.handleStatus);

    if (this.beforeSuccess === false && Ajax.defaults.beforeSuccess !== false) {
        this.beforeSuccess = Ajax.defaults.beforeSuccess;
    }
};

Ajax.defaults = { beforeSuccess: false };
Ajax.xhrPool = [];
Ajax.prototype = {
    token: false,
    tokenURL: "/token/csrf",
    beforeSuccess: false,
    handleStatus: {},
    ignoreErrors: {},
    err: {}
};

Ajax.prototype.request = function(o) {
    var self = this,
        success = o.success,
        handler = {},
        request = {};

    delete o.ignoreErrors;
    Utils.extend(request, this.requestDefaults);
    Utils.extend(request, o);

    $.each([ "redirectOnError" ], function(i, h) {
        if (request[h] != undefined) {
            handler[h] = request[h];
            delete request[h];
        }
    });

    request.success = function(result) {
        Log.debug("response status: "+ result.status);

        if (self.beforeSuccess !== false) {
            self.beforeSuccess(result);
        }

        if (self.handleStatus[result.status]) {
            self.handleStatus[result.status](result);
            return false;
        }

        if (result.status === "ok" || self.ignoreErrors[result.status] === true) {
            if (success != undefined) {
                success(result);
            }
            return false;
        }

        Log.error("request ("+ request.url +"):");
        Log.error(result);

        var infoErr;

        if (self.err[result.status]) {
            infoErr = self.err[result.status]();
        } else if (result.data && result.data.message) {
            infoErr = result.data.message;
        } else {
            infoErr = result.status;
        }

        if (infoErr) {
            $("#content").html(
                Utils.create("div")
                    .addClass("info-err")
                    .html(infoErr)
            );
            throw new Error();
        }
    };

    if (request.beforeSend == undefined) {
        request.beforeSend = Ajax.addXHRs;
    } else {
        var beforeSend = request.beforeSend;
        request.beforeSend = function(x) {
            Ajax.addXHRs(x);
            beforeSend(x);
        }
    }

    if (request.complete == undefined) {
        request.complete = Ajax.removeXHRs;
    } else {
        var complete = request.complete;
        request.complete = function(x) {
            Ajax.removeXHRs(x);
            complete(x);
        }
    }

    if (request.token === true) {
        request.token = false;
        Ajax.post({
            url: this.tokenURL,
            async: false,
            type: "get",
            success: function(result) {
                if (request.data == undefined) {
                    request.data = { };
                }
                request.data.token = result.data;
                Ajax.post(request);
            }
        });
    } else {
        if (typeof(request.data) == "object") {
            request.data = Utils.toJSON(request.data);
        }
        if (request.data == undefined) {
            request.type = "get";
        } else {
            request.type = "post";
        }
        Log.info("request "+ request.url);
        $.ajax(request);
    }
};

Ajax.post = function(req) {
    var ajax = new Ajax();
    return ajax.request(req);
};

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
