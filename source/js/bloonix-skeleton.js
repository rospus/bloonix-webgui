/*
    Header:

    <div id="header-wrapper">
        <div id="header"></div>
            <div id="header-left-box"></div>
            <div id="header-center-box">
                <nav id="nav-top-1"><nav>
            </div>
            <div id="header-right-box"></div>
        </div>
        <nav id="nav-top-2"></nav>
        <nav id="nav-top-3"></nav>
    </div>
*/

Bloonix.initHeader = function() {
    Log.debug("initHeader()");

    var headerWrapper = Utils.create("div")
        .attr("id", "header-wrapper")
        .appendTo("body");

    var header = Utils.create("div")
        .attr("id", "header")
        .appendTo(headerWrapper);

    var headerLeftBox = Utils.create("div")
        .attr("id", "header-left-box")
        .appendTo(header);

    var headerCenterBox = Utils.create("div")
        .attr("id", "header-center-box")
        .appendTo(header);

    var headerRightBox = Utils.create("div")
        .attr("id", "header-right-box")
        .appendTo(header);

    var logo = Utils.create("div")
        .attr("id", "logo")
        .appendTo(headerLeftBox);

    Utils.create("img")
        .attr("src", "/public/img/bloonix-logo.png")
        .appendTo(logo);

    Utils.create("nav")
        .attr("id", "nav-top-1")
        .appendTo(headerCenterBox);

    Utils.create("nav")
        .attr("id", "nav-top-2")
        .appendTo(headerWrapper);

    Utils.create("nav")
        .attr("id", "nav-top-3")
        .appendTo(headerWrapper);

    Utils.clear(header);
    Utils.clear(headerCenterBox);
    Utils.clear(headerWrapper);

    var btnGroup = Utils.create("div")
        .addClass("btn-group")
        .appendTo(headerRightBox);

    Bloonix.registeredHostsInfoIcon = Utils.create("a")
        .attr("href", "#monitoring/registration")
        .attr("title", Text.get("info.hosts_ready_for_registration"))
        .addClass("btn btn-dark btn-medium")
        .text("0")
        .appendTo(btnGroup)
        .click(function() { Bloonix.route.to("#monitoring/registration") })
        .css({ color: "#ff0000" })
        .hide()
        .tooltip();

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

    if (Bloonix.user.role == "admin") {
        Utils.create("a")
            .attr("href", "#maintenance")
            .attr("title", Text.get("site.maintenance.text.tooltip"))
            .addClass("btn btn-dark btn-medium")
            .html(Utils.create("span").addClass("hicons-white hicons volume-off"))
            .appendTo(btnGroup)
            .click(Bloonix.changeMaintenanceStatus)
            .tooltip();
    }

    Utils.create("a")
        .attr("href", "/logout/")
        .attr("title", Text.get("action.logout"))
        .addClass("btn btn-dark btn-medium")
        .html(Utils.create("span").addClass("hicons-white hicons off"))
        .appendTo(btnGroup)
        .tooltip();

    Utils.create("div")
        .addClass("clear")
        .appendTo(headerRightBox);
};

Bloonix.initContent = function() {
    Log.debug("initContent()");

    var outer = Utils.create("div")
        .attr("id", "content-outer")
        .appendTo("body");

    var content = Utils.create("div")
        .attr("id", "content")
        .appendTo(outer);

    Utils.clear(outer);

    $(window).resize(Bloonix.resizeContent);
    $("#content").resize(Bloonix.resizeContent);
    Bloonix.resizeContent();
};

Bloonix.resizeContent = function() {
    if ($("#content-outer").length > 0) {
        var w = $(window).height(),
            h = $("#header-wrapper").outerHeight(),
            f = $("#footer-outer").outerHeight();

        $("#content-outer").height(
            $(window).height()
                - $("#content-outer").offset().top
                - $("#footer-outer").outerHeight()
        );
    }
};

Bloonix.initFooter = function() {
    Log.debug("initFooter()");
    var body = $("body");

    Bloonix.objects.footerStats = { };

    // Outer footer element
    var footerOuter = Utils.create("div")
        .attr("id", "footer-outer")
        .appendTo(body);

    var footer = Utils.create("div")
        .attr("id", "footer-inner")
        .appendTo(footerOuter);

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

    Bloonix.objects.footerStats.User = Utils.create("span")
        .attr("title", "Logged in as")
        .text(Bloonix.user.username)
        .tooltip()
        .appendTo(t);

    if (Bloonix.user.admin_id) {
        Bloonix.objects.footerStats.User.css({ color: "#ff6666" });
        Bloonix.objects.footerStats.User.text(
            "YOU OPERATES AS "+ Bloonix.user.username
        );
    }

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
    var object = {},
        outer = Utils.create("div")
            .addClass("b2x-outer");

    object.header = Utils.create("div")
        .appendTo(outer);

    object.left = Utils.create("div")
        .addClass("b2x-left")
        .appendTo(outer);

    if (o.width) {
        object.left.css({ "min-width": o.width })
        object.left.css({ "max-width": o.width })
    }

    object.right = Utils.create("div")
        .addClass("b2x-right")
        .appendTo(outer);

    Utils.clear(outer);

    if (o.container) {
        outer.appendTo(o.container);
    }

    return object;
};
