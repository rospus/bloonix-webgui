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
