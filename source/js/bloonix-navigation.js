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
        if (Bloonix.args.showLocations === "yes") {
            administrationItems.push({
                link: "administration/locations",
                icon: "hicons globe",
                text: Text.get("nav.sub.locations")
            });
        }

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
