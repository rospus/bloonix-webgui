Bloonix.viewMtrResult = function(o) {
    var object = Utils.extend({
        appendTo: "#content",
        columns: [
            { key: "step",   text: "Step"   },
            { key: "ipaddr", text: "IPaddr" },
            { key: "snt",    text: "Snt",   },
            { key: "loss",   text: "Loss"   },
            { key: "last",   text: "Last"   },
            { key: "avg",    text: "Avg"    },
            { key: "best",   text: "Best"   },
            { key: "wrst",   text: "Wrst"   },
            { key: "stdev",  text: "StDev"  }
        ],
        colors: {
            Loss: [ "#cc0000", "#20c020" ],
            Last: "#2f7ed8",
            Avg: "#67116a",
            Best: "#8bbc21",
            Wrst: "#910000",
            StDev: "#1aadce"
        }
    }, o);

    object.create = function() {
        var self = this;
        this.createStruct();

        if (this.data) {
            this.showMtrData();
            if (this.showChart !== false) {
                setTimeout(function() { self.createMtrChart() }, 200);
            }
        } else {
            this.requestHostData();
        }
    };

    object.createStruct = function() {
        this.mtrTableContainer = Utils.create("div")
            .attr("id", "int-mtr-table")
            .appendTo(this.appendTo);

        if (this.showChart !== false) {
            this.mtrTableContainer.css({
                width: "48%",
                padding: "0 1%",
                float: "left"
            });

            this.mtrChartContainer = Utils.create("div")
                .attr("id", "int-mtr-chart")
                .css({ width: "48%", padding: "0 1%", float: "left" })
                .appendTo(this.appendTo);
        }

        if (this.data) {
            this.createMtrChartContainer();
            this.createMtrTable();
        }

        Utils.create("div")
            .addClass("clear")
            .appendTo(this.appendTo);
    };

    object.requestHostData = function() {
        var self = this;
        this.host = Bloonix.getHost(this.id);
        Bloonix.showHostSubNavigation("mtr", this.id, this.host.hostname);
        Bloonix.setTitle("schema.host.text.mtr_output", this.host.hostname);

        new Header({
            title: Text.get("schema.host.text.mtr_output", this.host.hostname, true),
            appendTo: this.mtrTableContainer,
            rbox: false
        }).create();

        new Header({
            title: Text.get("schema.host.text.mtr_chart"),
            appendTo: this.mtrChartContainer,
            rbox: false
        }).create();

        this.createMtrChartContainer();
        this.createMtrTable();

        Ajax.post({
            url: "/hosts/"+ this.id +"/mtr",
            success: function(result) {
                self.data = result.data.output;
                self.showMtrData();
                self.createMtrChart();
            }
        });
    };

    object.createMtrChartContainer = function() {
        var container = Utils.create("div")
            .attr("id", "int-mtr-chart-content")
            .css({ "padding-top": "20px" })
            .appendTo(this.mtrChartContainer);

        var resizeContainer = function() {
            var height = parseInt(container.width() / 1.5);

            if (height > 400) {
                height = 400;
            }

            container.css({ height: height +"px" });
        };

        resizeContainer();
        $(window).resize(resizeContainer);
    };

    object.createMtrTable = function() {
        var self = this;

        this.table = new Table({
            appendTo: this.mtrTableContainer,
            columns: this.columns
        });

        this.table.init();

        this.loading = Utils.create("div")
            .addClass("loading")
            .appendTo(this.mtrTableContainer);

        $.each(this.columns, function(i, row) {
            var th = Utils.create("th")
                .text(row.text)
                .appendTo(self.table.thRow);

            if (row.key != "step" && row.key != "ipaddr" && row.key != "snt") {
                th.addClass("a-right");
            }
            if (row.key == "snt") {
                th.addClass("center");
            }
        });
    };

    object.showMtrData = function() {
        var self = this;
        this.loading.hide();

        $.each(this.data, function(x, row) {
            var tr = Utils.create("tr");

            $.each(self.columns, function(y, col) {
                var value = row[col.key];

                var span = Utils.create("span")
                    .text(value);

                if (col.key == "loss") {
                    if (value > 60) {
                        span.addClass("c-critical bold");
                    } else if (value > 30) {
                        span.addClass("c-warning bold");
                    } else {
                        span.addClass("c-ok bold");
                    }
                }

                if (col.key != "step" && col.key != "ipaddr" && col.key != "loss" && col.key != "snt") {
                    if (value > 500) {
                        span.addClass("c-critical bold");
                    } else if (value > 200) {
                        span.addClass("c-warning bold");
                    } else {
                        span.addClass("c-ok bold");
                    }
                }

                var td = Utils.create("td")
                    td.html(span)
                    .appendTo(tr);

                if (col.key != "step" && col.key != "ipaddr" && col.key != "snt") {
                    td.addClass("a-right");
                }
                if (col.key == "snt") {
                    td.addClass("center");
                }
            });

            tr.appendTo(self.table.tbody);
        });
    };

    object.createMtrChart = function() {
        var self = this,
            categories = [ ],
            series = [ ],
            seriesByName = { },
            ipaddrByStep = { };

        $.each(this.data, function(x, row) {
            categories.push(row.step);
            ipaddrByStep[row.step] = row.ipaddr;
    
            $.each(self.columns, function(y, col) {
                if (seriesByName[col.text] == undefined) {
                    seriesByName[col.text] = [ ];
                }
    
                seriesByName[col.text].push(
                    parseFloat(row[col.key])
                );
    
                if (col.text == "Loss") {
                    if (seriesByName.noLoss == undefined) {
                        seriesByName.noLoss = [ ];
                    }
                    seriesByName.noLoss.push(
                        100 - parseFloat(row[col.key])
                    );
                }
            });
        });
    
        series.push({
            name: "Loss",
            type: "column",
            color: "rgba(255,0,0,.5)",
            yAxis: 1,
            data: seriesByName.Loss
        });
    
        series.push({
            name: "noLoss",
            type: "column",
            color: "rgba(177,227,177,.6)",
            yAxis: 1,
            data: seriesByName.noLoss
        });
    
        $.each(["Last", "Avg", "Best", "Wrst", "StDev"], function(i, key) {
            series.push({
                name: key,
                type: "line",
                color: self.colors[key],
                data: seriesByName[key]
            });
        });

        Bloonix.createChartForMTR({
            chart: {
                container: "int-mtr-chart-content"
            },
            series: series,
            categories: categories,
            ipaddrByStep: ipaddrByStep
        });
    };

    object.create();
};
