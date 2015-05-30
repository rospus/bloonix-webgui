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
                    icon: "hicons hicons-white remove-circle",
                    value: "radialGraph",
                    title: Text.get("text.radial_graph"),
                    default: true
                },{
                    icon: "hicons hicons-white asterisk",
                    value: "hyperTree",
                    title: Text.get("text.hypertree")
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
