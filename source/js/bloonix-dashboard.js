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
        if (this.safeInitialDashboard === true) {
            this.safeDashboard();
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

        var input = Utils.create("input")
            .attr("placeholder", Text.get("text.dashboard.name"))
            .addClass("input input-medium")
            .appendTo(form);

        Utils.create("br")
            .appendTo(form);

        var button = Utils.create("div")
            .addClass("btn btn-white btn-medium")
            .html(Text.get("action.create"))
            .appendTo(form);

        button.click(function() {
            var name = input.val();

            if (name === undefined || name.length === 0 || /^\s+$/.test(name)) {
                input.addClass("rwb");
                return;
            }

            // Check if the dashboard name already exists. This check
            // is only on client side! The server does not check this!
            var stash = Bloonix.get("/user/config/stash");
            if (typeof stash === "object" && typeof stash.dashboard === "object" && stash.dashboard[name] !== undefined) {
                input.addClass("rwb");
                return;
            }

            overlay.close();

            if (clone === true) {
                self.safeDashboard(name);
            } else {
                Bloonix.safeUserConfig("dashboard", {
                    name: name,
                    data: []
                });
            }

            Bloonix.safeUserConfig("last_open_dashboard", name);
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
            icon: "unchecked",
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

            Bloonix.safeUserConfig("rename-dashboard", {
                "new": name,
                "old": self.configName
            });

            Bloonix.safeUserConfig("last_open_dashboard", name);
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
                Bloonix.safeUserConfig("last_open_dashboard", name);
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
            .html(Text.get("text.dashboard.really_delete_dashboard", Utils.escape(this.configName), true))
            .css({ "margin-bottom": "20px" })
            .appendTo(content);

        Utils.create("div")
            .addClass("btn btn-white btn-medium")
            .html(Text.get("action.yes_delete"))
            .appendTo(overlay.content)
            .click(function() {
                Bloonix.safeUserConfig("dashboard", { name: self.configName });
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

        $.each(this.config, function(i, c) {
            var pos = c.pos > 3 ? c.pos - 3 : c.pos,
                dashlet = dashlets[c.name],
                box = self.createDashlet(pos, c.name, c.width, c.height, c.opts);
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

        this.title = Utils.create("div")
            .attr("id", "header-title")
            .appendTo("#header-wrapper")
            .text("Dashboard: Default");
    };

    object.setDashboardTitle = function(text) {
        this.title.text(text);
    };

    object.getDashboardConfig = function() {
        var userConfig = Bloonix.get("/user/config/stash");

        if (userConfig && userConfig.dashboard && Utils.objectSize(userConfig.dashboard)) {
            this.dashboards = userConfig.dashboard;
        } else {
            this.dashboards = this.getDefaultDashlets();
            this.safeInitialDashboard = true;
        }

        if (this.name !== false) {
            if (this.dashboards[this.name]) {
                this.config = this.dashboards[this.name];
                this.configName = this.name;
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
            this.configName = userConfig.last_open_dashboard;
        } else {
            this.config = this.dashboards.Default;
            this.configName = "Default";
        }

        this.setDashboardTitle(Text.get("text.dashboard.title") +": "+ this.configName);
    };

    object.getDefaultDashlets = function() {
        return {
            Default: [
                { pos: "1", name: "hostAvailStatus" },
                { pos: "1", name: "hostStatusMap" },
                { pos: "1", name: "hostTopStatus" },
                { pos: "2", name: "serviceAvailStatus" },
                { pos: "2", name: "serviceNoteStatus" },
                { pos: "2", name: "serviceTopStatus" }
            ]
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
                type: "move",
                title: Text.get("action.move_box"),
                addClass: "dashlet-portlet"
            },{
                type: "fullscreen",
                title: Text.get("action.resize"),
                callback: function() { self.resizeDashlet(dashlet) }
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

        Bloonix.createHoverBoxIcons({
            container: dashlet.outer,
            icons: icons
        });

        this.resizeDashlets(dashlet);
        this.boxes.push(dashlet);
        this.reload[id] = dashlet;
        dashlets[name].callback(dashlet, { animation: true });
        return dashlet;
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
                { label: "1/9", value: 1 },
                { label: "2/9", value: 2 },
                { label: "3/9", value: 3 },
                { label: "4/9", value: 4 },
                { label: "5/9", value: 5 },
                { label: "6/9", value: 6 },
                { label: "7/9", value: 7 },
                { label: "8/9", value: 8 },
                { label: "9/9", value: 9 }
            ]
        });

        form.createElement({
            element: "radio",
            name: "height",
            text: "Dashlet height",
            checked: dashlet.outer.data("height"),
            options: [
                { label: "1/6", value: 1 },
                { label: "2/6", value: 2 },
                { label: "3/6", value: 3 },
                { label: "4/6", value: 4 },
                { label: "5/6", value: 5 },
                { label: "6/6", value: 6 },
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
                self.safeDashboard();
                $(window).trigger("resize");
            }
        });

        overlay.create();
    };

    object.resizeDashlets = function(box) {
        var size = Bloonix.getContentSize();
        size.height = size.height - $("#dashboard-title").outerHeight() - 10;

        $(".dashlet-outer").css({ "min-width": size.width - 10, "margin-bottom": "2px" });

        var chartBoxMargin = this.chartBoxMargin,
            chartBoxPadding = this.chartBoxPadding,
            chartBoxBorderWidth = this.chartBoxBorderWidth,
            chartBoxWidth = chartBoxWidth - 2, // dashlet-outer border
            chartBoxHeight = chartBoxHeight - 2, // dashlet-outer border
            // -1px because of an unknown bug with tooltip()
            chartBoxWidth = Math.floor(size.width / 9) - 2,
            chartBoxHeight = Math.floor(size.height / 6);

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
            self.resizeDashlets()
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
                self.safeDashboard();
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
            this.safeDashboard();
        } else {
            this.createDashlet(1, name, 3, 3, opts);
            this.resizeDashlets();
            this.safeDashboard();
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

    object.safeDashboard = function(configName) {
        var self = this,
            config = { name: configName || this.configName, data: [] };

        $(".dashlet-outer").each(function() {
            var pos = $(this).data("pos");

            $(this).find(".dashlet").each(function() {
                var opts = $(this).data("opts");

                var data = {
                    pos: pos,
                    name: $(this).data("name"),
                    width: $(this).data("width"),
                    height: $(this).data("height")
                };

                if (opts) {
                    data.opts = opts;
                }

                config.data.push(data);
            });
        });

        this.config = config.data;
        Bloonix.safeUserConfig("dashboard", config);
    };

    object.startSortOrResizeDashlets = function() {
        $(".dashlet-outer").css({ "border": "1px dashed #444444" });
        $(".dashlet").css({ "border": "1px dashed #c1c1c1" });
    };

    object.stopSortOrResizeDashlets = function() {
        this.safeDashboard();
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
            text: Text.get("action.safe"),
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
