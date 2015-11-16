/*
    <nav id="nav-top-1">
        <ul>
            <li data-path="dashboard">DASHBOARD</li>
            <li data-path="monitoring" class="active">MONITORING</li>
            <li data-path="notification">NOTIFICATION</li>
            <li data-path="administration">ADMINISTRATION</li>
        </ul>
    </nav>

    <nav id="nav-top-2">
        <ul>
            <li data-path="monitoring/hosts" class="active">Hosts</li>
            <li data-path="monitoring/services">Services</li>
            <li data-path="monitoring/charts">Charts</li>
            <li data-path="monitoring/templates">Templates</li>
            <li data-path="monitoring/screen">Screen</li>
        </ul>
    </nav>

    <nav id="nav-top-3">
        <ul>
            <li data-path="monitoring/hosts/10" class="active">hostname.example</li>
            <li data-path="monitoring/hosts/10/events">Events</li>
            <li data-path="monitoring/hosts/10/charts">Charts</li>
            <li data-path="monitoring/hosts/10/reports">Reports</li>
        </ul>
    </nav>
*/

Bloonix.navType = "X";
Bloonix.createNav = {};
Bloonix.activeNav1 = false;
Bloonix.activeNav2 = false;
Bloonix.activeNav3 = false;
Bloonix.nav1Class = "nav-top-1";
Bloonix.nav2Class = "nav-top-2";
Bloonix.nav3Class = "nav-top-3";
Bloonix.navIconColor = "white";

Bloonix.initNavigation = function(site) {
    Log.debug("initNavigation()");

    $("#nav-top-1").html(
        Bloonix.createNav.main()
    );
};

Bloonix.createNav.main = function(addClass) {
    var ul =  Utils.create("ul")
        .addClass(Bloonix.nav1Class);

    Bloonix.createNavElem({
        link: "dashboard",
        icon: "pie-chart",
        iconSize: "gicons",
        text: Text.get("nav.main.dashboard")
    }).appendTo(ul);

    Bloonix.createNavElem({
        path: "monitoring",
        link: "monitoring/hosts",
        icon: "sampler",
        iconSize: "gicons",
        text: Text.get("nav.main.monitoring")
    }).appendTo(ul);

    Bloonix.createNavElem({
        path: "notification",
        link: "notification/contacts",
        icon: "bullhorn",
        iconSize: "gicons",
        text: Text.get("nav.main.notifications")
    }).appendTo(ul);

    Bloonix.createNavElem({
        path: "administration",
        link: "administration/users",
        icon: "cogwheels",
        iconSize: "gicons",
        text: Text.get("nav.main.administration")
    }).appendTo(ul);

    Bloonix.createNavElem({
        link: "help",
        icon: "circle-question-mark",
        iconSize: "gicons",
        text: Text.get("nav.main.help")
    }).appendTo(ul);

    return ul;
};

Bloonix.createNav.monitoring = function() {
    var ul = Utils.create("ul")
        .addClass(Bloonix.nav2Class);

    Bloonix.createNavElem({
        link: "monitoring/hosts",
        icon: "hdd",
        text: Text.get("nav.sub.hosts")
    }).appendTo(ul);

    Bloonix.createNavElem({
        link: "monitoring/services",
        icon: "th-list",
        text: Text.get("nav.sub.services")
    }).appendTo(ul);

    Bloonix.createNavElem({
        link: "monitoring/charts",
        icon: "signal",
        text: Text.get("nav.sub.charts" )
    }).appendTo(ul);

    Bloonix.createNavElem({
        link: "monitoring/templates",
        icon: "list-alt",
        text: Text.get("nav.sub.templates")
    }).appendTo(ul);

    if (Bloonix.user.role === "operator") {
        Bloonix.createNavElem({
            link: "monitoring/registration",
            icon: "edit",
            text: Text.get("nav.sub.registration")
        }).appendTo(ul);
    }

    Bloonix.createNavElem({
        link: "monitoring/screen",
        icon: "tasks",
        text: Text.get("nav.sub.screen")
    }).appendTo(ul);

    return ul;
};

Bloonix.createNav.notification = function() {
    var ul = Utils.create("ul")
        .addClass(Bloonix.nav2Class);

    Bloonix.createNavElem({
        link: "notification/contacts",
        icon: "user",
        text: Text.get("nav.sub.contacts")
    }).appendTo(ul);

    Bloonix.createNavElem({
        link: "notification/contactgroups",
        icon: "user",
        text: Text.get("nav.sub.contactgroups")
    }).appendTo(ul);

    Bloonix.createNavElem({
        link: "notification/timeperiods",
        icon: "time",
        text: Text.get("nav.sub.timeperiods")
    }).appendTo(ul);

    return ul;
};

Bloonix.createNav.administration = function() {
    var ul = Utils.create("ul")
        .addClass(Bloonix.nav2Class);

    Bloonix.createNavElem({
        link: "administration/users",
        icon: "user",
        text: Text.get("nav.sub.users")
    }).appendTo(ul);

    Bloonix.createNavElem({
        link: "administration/groups",
        icon: "user",
        text: Text.get("nav.sub.groups")
    }).appendTo(ul);

    Bloonix.createNavElem({
        link: "administration/variables",
        icon: "wrench",
        text: Text.get("nav.sub.variables")
    }).appendTo(ul);

    if (Bloonix.user.role === "admin") {
        Bloonix.createNavElem({
            link: "administration/locations",
            icon: "globe",
            text: Text.get("nav.sub.locations")
        }).appendTo(ul);

        Bloonix.createNavElem({
            link: "administration/companies",
            icon: "home",
            text: Text.get("nav.sub.companies")
        }).appendTo(ul);
    }

    return ul;
};

Bloonix.showHostSubNavigation = function(active, id, hostname) {
    Log.debug("showHostSubNavigation()");

    Bloonix.showNav3({
        active: active,
        items: [
            {
                link: "monitoring/hosts/" +id,
                text: Utils.escape(hostname),
                active: "host",
            },{
                link: "monitoring/hosts/"+ id +"/events",
                text: Text.get("nav.sub.events"),
                active: "events"
            },{
                link: "monitoring/hosts/"+ id +"/charts",
                text: Text.get("nav.sub.charts"),
                active: "charts"
            },{
                link: "monitoring/hosts/"+ id +"/reports",
                text: Text.get("nav.sub.reports"),
                active: "reports"
            },{
                link: "monitoring/hosts/"+ id +"/dependencies",
                text: Text.get("nav.sub.dependencies"),
                active: "dependencies"
            },{
                link: "monitoring/hosts/"+ id +"/downtimes",
                text: Text.get("nav.sub.downtimes"),
                active: "downtimes"
            },{
                link: "monitoring/hosts/"+ id +"/templates",
                text: Text.get("nav.sub.templates"),
                active: "templates"
            },{
                link: "monitoring/hosts/"+ id +"/mtr",
                text: Text.get("nav.sub.mtr"),
                active: "mtr"
            },{
                link: "monitoring/hosts/" + id +"/notifications",
                text: Text.get("nav.sub.notifications"),
                active: "notifications"
            }
        ]
    });
};

Bloonix.showChartsSubNavigation = function(active, id) {
    Log.debug("showGroupSubNavigation()");

    Bloonix.showNav3({
        active: active,
        items: [
            {
                link: "monitoring/charts",
                text: Text.get("schema.chart.text.charts"),
                active: "service-charts"
            },{
                link: "monitoring/charts/editor",
                text: Text.get("schema.user_chart.text.editor"),
                active: "user-charts"
            }
        ]
    });
};

Bloonix.showGroupSubNavigation = function() {
    Log.debug("showGroupSubNavigation()");

    new Tabs({
        activeClass: "active",
        appendNavTo: "#nav-top-3",
        appendContentTo: "#content",
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

    $("#nav-top-3").show();
    Bloonix.resizeContent();
};

Bloonix.showContactgroupSubNavigation = function() {
    Log.debug("showGroupSubNavigation()");

    new Tabs({
        activeClass: "active",
        appendNavTo: "#nav-top-3",
        appendContentTo: "#content",
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

    $("#nav-top-3").show();
    Bloonix.resizeContent();
};

Bloonix.showTemplateSubNavigation = function(active, id) {
    Log.debug("showTemplateSubNavigation()");

    Bloonix.showNav3({
        active: active,
        items: [
            {
                link: "monitoring/templates/"+ id,
                text: Text.get("schema.host_template.text.setting"),
                active: "settings"
            },{
                link: "monitoring/templates/"+ id +"/members",
                text: Text.get("schema.host_template.text.view_members"),
                active: "members"
            },{
                link: "monitoring/templates/"+ id +"/services",
                text: Text.get("schema.host_template.text.view_services"),
                active: "services"
            }
        ]
    });
};

Bloonix.createNavElem = function(item) {
    var link;

    if (item.icon) {
        var icon = Utils.create("div");

        if (item.iconSize === "gicons") {
            icon.addClass("gicons gicons-white "+ item.icon);
        } else {
            icon.addClass("hicons hicons-"+ Bloonix.navIconColor +" "+ item.icon);
        }

        link = Bloonix.call(item.link, icon);
        link.append(item.text);
    } else {
        link = Bloonix.call(item.link, text);
    }

    var li = Utils.create("li")
        .attr("data-path", item.path || item.link)
        .html(link);

    if (item.id) {
        li.attr("id", item.id);
    }

    return li;
};

Bloonix.showNavigation = function(site, args) {
    Log.debug("showNavigation()");

    var nav = site.split("/"),
        nav1 = nav[0], // dashboard, monitoring, notification
        nav2 = nav[1], // hosts, services, charts
        nav3 = nav[2]; // create, list

    if (Bloonix.activeNav1 !== nav1) {
        Bloonix.activeNav1 = nav1;
        $("#nav-top-1").find(".active").removeClass("active");
        $("#nav-top-1").find("[data-path='"+ nav1 +"']").addClass("active");

        if (Bloonix.createNav[nav1]) {
            $("#nav-top-2").html(Bloonix.createNav[nav1]());
            Utils.clear("#nav-top-2");
        }
    }

    if (nav2) {
        var activeNav = nav1 +"-"+ nav2;
        if (Bloonix.activeNav2 !== activeNav) {
            $("#nav-top-2").find(".active").removeClass("active");
            $("#nav-top-2").find("[data-path='"+ nav1 +"/"+ nav2 +"']").addClass("active");
        }
    } else {
        $("#nav-top-3").html("");
        $("#nav-top-2").html("");
    }

    if (!nav3) {
        $("#nav-top-3").html("");
    }
};

Bloonix.showNav3 = function(o) {
    Log.debug("showNav3()");

    var ul = Utils.create("ul");

    $.each(o.items, function(i, item) {
        var li = Utils.create("li")
            .html( Bloonix.call(item.link, item.text) )
            .appendTo(ul);

        if (item.active && item.active === o.active) {
            li.addClass("active");
        }
    });

    $("#nav-top-3").html(ul).show();
    Utils.clear("#nav-top-3");
    Bloonix.resizeContent();
};
