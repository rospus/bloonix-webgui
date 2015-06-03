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
    var outer = Utils.create("div")
        .addClass("b2x-outer")
        .appendTo("#content");

    Utils.create("div")
        .attr("id", "b2x-left")
        .addClass("b2x-left")
        .appendTo(outer);

    Utils.create("div")
        .attr("id", "b2x-right")
        .addClass("b2x-right")
        .appendTo(outer);

    Utils.create("div")
        .addClass("loading")
        .appendTo("#b2x-right");

    Utils.create("div")
        .addClass("clear")
        .appendTo(outer);
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
