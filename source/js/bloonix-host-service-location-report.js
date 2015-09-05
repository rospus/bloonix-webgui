Bloonix.viewServiceLocationReport = function(o) {
    var object = Utils.extend({
        avgTimeChartContainer: "avg-time-chart-container",
        mmTimeChartContainer: "mm-time-chart-container",
        minTimeChartContainer: "min-time-chart-container",
        maxTimeChartContainer: "max-time-chart-container",
        eventChartContainer: "event-chart-container",
        eventTableContainer: "event-table-container",
        boxMargin: 5
    }, o);

    object.create = function() {
        this.createContainer();
        this.getHost();
        this.getService();
        this.getPlugin();
        this.getStats();
        this.getLocations();
        this.generateTimeCharts();
        this.generateEventTable();
    };

    object.getHost = function() {
        this.host = Bloonix.getHost(this.id);
    };

    object.getService = function() {
        this.service = Bloonix.getService(this.service_id);
        Bloonix.showHostSubNavigation("host", this.service.host_id, this.service.hostname);
    };

    object.getPlugin = function() {
        this.plugin = Bloonix.get("/plugins/"+ this.service.plugin);
    };

    object.getStats = function() {
        this.stats = Bloonix.get("/services/"+ this.service_id +"/location-stats");
    };

    object.getLocations = function() {
        var self = this,
            locations = Bloonix.get("/locations");

        this.locations = {};

        $.each(locations, function(i, item) {
            self.locations[item.hostname] = item;
        });
    };

    object.createContainer = function() {
        this.container = Utils.create("div")
            .appendTo("#content");

        var size = this.getContentSize(),
            bigSize = Math.floor(size.width / 3 * 2),
            lowSize = Math.floor(size.width - bigSize);

        this.timeChartBox = this.createBox(this.avgTimeChartContainer);
        this.eventBox = this.createBox(this.eventTableContainer);
        this.minMaxTimeBox = this.createBox(this.mmTimeChartContainer);

        /*
        this.maxTimeChartBox = Utils.create("div")
            .attr("id", this.maxTimeChartContainer)
            .css({ height: "250px" })
            .appendTo(this.minMaxTimeBox);

        this.minTimeChartBox = Utils.create("div")
            .attr("id", this.minTimeChartContainer)
            .css({ height: "250px" })
            .appendTo(this.minMaxTimeBox);
        */

        this.eventChartBox = this.createBox(this.eventChartContainer);
        this.resizeContainer();
        this.enableAutoResize();
    };

    object.enableAutoResize = function() {
        var self = this;
        $(window).resize(function() { self.resizeContainer() });
    };

    object.resizeContainer = function() {
        var size = this.getContentSize(),
            boxSize = Math.floor(size.width / 3),
            bigSize = boxSize * 2 - (this.boxMargin * 2),
            lowSize = boxSize - (this.boxMargin * 2);

        bigSize += "px";
        lowSize += "px";

        this.timeChartBox.css({ width: bigSize, height: "500px", float: "left" });
        this.eventBox.css({ width: lowSize, "min-height": "800px", float: "right" });
        //this.minMaxTimeBox.css({ width: lowSize, height: "500px" });
        //this.eventChartBox.css({ width: lowSize, height: "400px" });
    };

    object.getContentSize = function() {
        var width = $("#content").width() - 20, // minus scrollbar
            height = $(window).height() - $("#content").offset().top;

        if ($("#footer").length) {
            height -= $("#footer").outerHeight();
        }

        return { width: width, height: height };
    };

    object.createBox = function(id) {
        return Utils.create("div").attr("id", id).css({
            "vertical-align": "top",
            margin: this.boxMargin + "px"
        }).appendTo(this.container);
    };

    object.generateTimeCharts = function() {
        Bloonix.plotChart({
            chart: {
                container: this.avgTimeChartContainer,
                title: this.host.hostname +" :: "+ this.service.service_name,
                subtitle: "HTTP location AVG statistics",
                ylabel: "time",
                type: "area"
            },
            series: [{
                data: this.stats.avgstats.time,
                name: "time",
                yAxis: 0,
                color: "rgba("+ Utils.hexToRGB("#005467").join(",") +",0.8)"
            }],
            colors: { time: "#005467" },
            hasNegativeValues: false
        });

        /*
        Bloonix.plotChart({
            chart: {
                container: this.maxTimeChartContainer,
                title: this.host.hostname +" :: "+ this.service.service_name,
                subtitle: "HTTP location MAX statistics",
                ylabel: "time",
                type: "area"
            },
            series: [{
                data: this.stats.maxstats.time,
                name: "time",
                yAxis: 0,
                color: "rgba("+ Utils.hexToRGB("#005467").join(",") +",0.8)"
            }],
            colors: { time: "#005467" },
            hasNegativeValues: false
        });

        Bloonix.plotChart({
            chart: {
                container: this.minTimeChartContainer,
                title: this.host.hostname +" :: "+ this.service.service_name,
                subtitle: "HTTP location MIN statistics",
                ylabel: "time",
                type: "area"
            },
            series: [{
                data: this.stats.minstats.time,
                name: "time",
                yAxis: 0,
                color: "rgba("+ Utils.hexToRGB("#005467").join(",") +",0.8)"
            }],
            colors: { time: "#005467" },
            hasNegativeValues: false
        });
        */
    };

    object.generateEventTable = function() {
        var self = this,
            table = new Table({ appendTo: this.eventBox }).init();

        table.addHeadColumn("Status");
        table.addHeadColumn("Time");
        table.addHeadColumn("Respone time");
        table.addHeadColumn("");

        $.each(this.stats.events, function(x, row) {
            $.each(row.data, function(y, item) {
                var span = Utils.createInfoIcon({ type: item.status }),
                    loc = self.locations[item.hostname],
                    date = DateFormat(row.time * 1, DateFormat.masks.bloonix),
                    stats;

                var flag = Bloonix.flag(loc.country_code)
                    .attr("title", loc.continent +" - "+ loc.city +" - "+ loc.ipaddr)
                    .tooltip({ track: true });

                if (item.stats && item.stats.time) {
                    stats = Math.floor(item.stats.time) +" ms";
                } else {
                    stats = Utils.create("div")
                        .attr("title", item.message)
                        .css({ color: "#12a0be", cursor: "default" })
                        .tooltip({ track: true })
                        .text(item.message.substr(0, 20) +"...");
                }

                table.createRow([ span, date, stats, flag ]);
            });
        });
    };

    object.create();
    return object;
};
