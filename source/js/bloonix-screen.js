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
        $("#header-wrapper").fadeOut(200);
        $("#footer-outer").fadeOut(200);
        $("#content-outer").fadeOut(200);
    };

    object.showElements = function() {
        $("#header-wrapper").fadeIn(200);
        $("#footer-outer").fadeIn(200);
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
