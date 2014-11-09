Bloonix.viewHostReport = function(o) {
    o.host = Bloonix.getHost(o.id);
    Bloonix.setTitle("schema.host.text.report_title", o.host.hostname);
    Bloonix.showHostSubNavigation("reports", o.id, o.host.hostname);

    o.intServiceList = Utils.create("div")
        .attr("id", "int-service-list")
        .appendTo("#content");

    o.intDetailedServiceReport = Utils.create("div")
        .attr("id", "int-detailed-service-report")
        .css({ width: "1200px" })
        .hide()
        .appendTo("#content");

    o.loading = Utils.create("div")
        .addClass("loading")
        .appendTo("#content");

    Bloonix.getHostReportData(o);
};

Bloonix.getHostReportData = function(o, from, to) {
    o.intServiceList.html("");
    o.loading.show();

    Ajax.post({
        url: "/hosts/"+ o.host.id +"/report",
        data: { from: from, to: to },
        success: function(result) {
            o.loading.hide();
            o.from = result.data.from;
            o.to = result.data.to;
            Bloonix.generateHostReportView(o, result.data);
        }
    });
};

Bloonix.generateHostReportView = function(o, data) {
    $("#int-service-list").html("");

    var header = new Header({
        appendTo: "#int-service-list",
        title: Text.get("text.report.title.host_from_to", [ o.host.hostname, o.from, o.to ], true),
        notice: Text.get("text.report.availability.detailed_report_onclick")
    }).create();

    var form = Utils.create("form")
        .appendTo(header.rbox);

    var formInputFrom = Utils.create("input")
        .attr("placeholder", Text.get("word.From"))
        .attr("id", "report-from")
        .attr("type", "text")
        .attr("name", "from")
        .attr("value", o.from)
        .attr("title", Text.get("word.From"))
        .tooltip()
        .addClass("input input-tiny")
        .css({ "margin-right": "10px" })
        .appendTo(form)
        .datepicker({
            dateFormat: 'yy-mm',
            changeMonth: true,
            changeYear: true,
            showButtonPanel: true,
            onClose: function(dateText, inst) {
                var month = $("#ui-datepicker-div .ui-datepicker-month :selected").val();
                var year = $("#ui-datepicker-div .ui-datepicker-year :selected").val();
                $(this).val($.datepicker.formatDate('yy-mm', new Date(year, month, 1)));
            }
        });
    
    formInputFrom.focus(function () {
        $(".ui-datepicker-calendar").hide();
        $("#ui-datepicker-div").position({
            my: "center top",
            at: "center bottom",
            of: $(this)
        });
    });

    var formInputTo = Utils.create("input")
        .attr("placeholder", Text.get("word.To"))
        .attr("id", "report-to")
        .attr("type", "text")
        .attr("name", "to")
        .attr("value", o.to)
        .attr("title", Text.get("word.To"))
        .tooltip()
        .addClass("input input-tiny")
        .css({ "margin-right": "10px" })
        .appendTo(form)
        .datepicker({
            dateFormat: 'yy-mm',
            changeMonth: true,
            changeYear: true,
            showButtonPanel: true,
            onClose: function(dateText, inst) {
                var month = $("#ui-datepicker-div .ui-datepicker-month :selected").val();
                var year = $("#ui-datepicker-div .ui-datepicker-year :selected").val();
                $(this).val($.datepicker.formatDate('yy-mm', new Date(year, month, 1)));
            }
        });

    formInputTo.focus(function () {
        $(".ui-datepicker-calendar").hide();
        $("#ui-datepicker-div").position({
            my: "center top",
            at: "center bottom",
            of: $(this)
        });
    });

    var thisYear = new Date().getFullYear();
    var lastYear = thisYear - 1;

    Utils.create("div")
        .addClass("btn btn-small btn-white btn-icon-even")
        .html(Text.get("action.search"))
        .appendTo(form)
        .click(function() { Bloonix.getHostReportData(o, formInputFrom.val(), formInputTo.val()) });

    Utils.create("div")
        .addClass("btn btn-small btn-white btn-icon-even")
        .html(Text.get("info.this-year"))
        .appendTo(form)
        .click(function() { Bloonix.getHostReportData(o, thisYear, thisYear) });

    Utils.create("div")
        .addClass("btn btn-small btn-white btn-icon-even")
        .html(Text.get("info.last-year"))
        .appendTo(form)
        .click(function() { Bloonix.getHostReportData(o, lastYear, lastYear) });

    var table = new Table({ appendTo: "#int-service-list" });
    table.init();

    var headerColumns = [
        "Service", "Availability",
        "AV-O", "AV-I", "AV-W", "AV-C", "AV-U",
        "Events", "EV-O", "EV-I", "EV-W", "EV-C", "EV-U",
        "EV-LT15", "EV-LT30", "EV-LT60", "EV-LT180", "EV-LT300", "EV-GE300"
    ];

    $.each(headerColumns, function(i, column) {
        var th = table.addHeadColumn(column)
            .attr("title", Text.get("text.report.availability."+ column))
            .tooltip();

        if (column != "Service" && column != "Availability") {
            th.css({ "text-align": "right" });
        }
    });

    $.each(data.services, function(i, service) {
        var row = Utils.create("tr")
            .appendTo(table.tbody);

        var col = Utils.create("td")
            .appendTo(row);

        Utils.create("a")
            .text(service.service_name)
            .appendTo(col)
            .click(function() { Bloonix.showDetailedServiceReport(o, service) } );

        var graphColumn = Utils.create("td")
            .appendTo(row);

        var availability = Utils.create("span")
            .text(service.availability.total +"%")
            .appendTo(graphColumn);

        availability.css({
            width: "60px", 
            display: "inline-block",
            "text-align": "right",
            "font-weight": "bold" 
        });

        if (service.availability.total < 99.5) {
            availability.addClass("av-crit");
        } else if (service.availability.total < 99.9) {
            availability.addClass("av-warn");
        }

        Utils.create("div")
            .attr("id", "int-service-"+ service.id)
            .css({ width: "130px", height: "16px", display: "inline-block" })
            .appendTo(graphColumn);

        Bloonix.createReportBarChart("int-service-"+ service.id, {
            label: [ "OK", "INFO", "WARNING", "CRITICAL", "UNKNOWN" ],
            color: [ "#22ff22", "#7aacdb", "#ffff00", "#ff2222", "#ffaa22" ],
            values: [{
                label: "Availability",
                values: [
                    service.availability.OK,
                    service.availability.INFO,
                    service.availability.WARNING,
                    service.availability.CRITICAL,
                    service.availability.UNKNOWN
                ]
            }]
        });

        $.each([ "OK", "INFO", "WARNING", "CRITICAL", "UNKNOWN" ], function(i, stat) {
            Utils.create("td")
                .text(service.availability[stat] +"%")
                .css({ "text-align": "right" })
                .addClass("status-text-"+ stat)
                .appendTo(row);
        });

        $.each([ "total", "OK", "INFO", "WARNING", "CRITICAL", "UNKNOWN" ], function(i, stat) {
            Utils.create("td")
                .css({ "text-align": "right" })
                .text(service.number_of_events[stat])
                .addClass("status-text-"+ stat)
                .appendTo(row);
        });

        $.each([ "lt15", "lt30", "lt60", "lt180", "lt300", "ge300" ], function(i, stat) {
            var col = Utils.create("td")
                .css({ "text-align": "right", position: "relative" })
                .text(service.number_of_events[stat].total)
                .appendTo(row);

            var div = Utils.create("div")
                .css({ position: "absolute", "z-index": "5", width: "130px" })
                .addClass("info-help")
                .hide()
                .appendTo(col);

            col.hover(
                function() { div.fadeIn(200) },
                function() { div.hide() }
            );

            $.each([ "OK", "WARNING", "CRITICAL", "UNKNOWN", "INFO" ], function(x, key) {
                Utils.create("div")
                    .css({ float: "left", width: "80px", margin: "2px 0" })
                    .text(key)
                    .appendTo(div);

                Utils.create("div")
                    .css({ float: "left", width: "50px", margin: "2px 0" })
                    .text(service.number_of_events[stat][key])
                    .appendTo(div);
            });

            Utils.create("clear")
                .appendTo(div);
        });
    });

    if (data.no_data) {
        var noDataAvailableBox = Utils.create("div")
            .addClass("info-err")
            .appendTo("#int-service-list");

        Utils.create("h4")
            .html(Text.get("text.report.title.no_data"))
            .appendTo(noDataAvailableBox);

        $.each(data.no_data, function(i, service) {
            Utils.create("p")
                .text(service.service_name)
                .appendTo(noDataAvailableBox);
        });
    }
};

Bloonix.showDetailedServiceReport = function(o, service) {
    $("#int-service-list").hide();
    $("#int-detailed-service-report").show();

    new Header({
        appendTo: "#int-detailed-service-report",
        title: Text.get("text.report.title.host_from_to", [ o.host.hostname, o.from, o.to ], true),
        icons: [ { type: "go-back", callback: Bloonix.showReportServiceList } ]
    }).create();

    Bloonix.createReportServiceBox(o, service);
};

Bloonix.showReportServiceList = function() {
    $("#int-service-list").show(600);
    $("#int-detailed-service-report").hide();
    $("#int-detailed-service-report").html("");
    Bloonix.destroyChartObjects();
};

Bloonix.createReportServiceBox = function(o, service) {
    var reportBox = Utils.create("div")
        .appendTo("#int-detailed-service-report");

    var title = Utils.create("h3")
        .addClass("h3")
        .html(Text.get("text.report.service_has_a_availabilty_of", Utils.escape(service.service_name), true))
        .appendTo(reportBox);

    var avTitle = Utils.create("span")
        .addClass("cit")
        .text(" "+ service.availability.total +"%")
        .appendTo(title);

    if (service.availability.total < 99.5) {
        avTitle.addClass("av-crit");
    } else if (service.availability.total < 99.9) {
        avTitle.addClass("av-warn");
    }

    Bloonix.createServiceAvailabilityPercentBox(service, reportBox);
    Bloonix.createServiceTotalDurationOfEventsBox(service, reportBox);
    Bloonix.createServiceNumerOfEventsBox(service, reportBox);
    Bloonix.createServiceNumberOfEventsByDurationBox(service, reportBox);
    Bloonix.createServiceNumberOfEventsByTags(service, reportBox);
    Bloonix.createServiceDurationOfEventsByHourBox(service, reportBox);
    //Bloonix.createServiceAvailabilityDonut(service, reportBox);
};

Bloonix.createServiceAvailabilityPercentBox = function(service, container) {
    var box = Utils.create("div")
        .addClass("av-service-2c-box")
        .appendTo(container);

    var tableBox = Utils.create("div")
        .addClass("av-service-2c-table-box")
        .appendTo(box);

    var graphBox = Utils.create("div")
        .attr("id", "int-service-availability-percent-box")
        .addClass("av-service-2c-graph-box")
        .appendTo(box);

    Bloonix.pieChart({
        chart: {
            title: null,
            container: "int-service-availability-percent-box"
        },
        legend: false,
        colors: Bloonix.areaStatusColors,
        data: [
            { name: "OK",       y: parseFloat(service.availability.OK)       },
            { name: "INFO",     y: parseFloat(service.availability.INFO)     },
            { name: "WARNING",  y: parseFloat(service.availability.WARNING)  },
            { name: "CRITICAL", y: parseFloat(service.availability.CRITICAL) },
            { name: "UNKNOWN",  y: parseFloat(service.availability.UNKNOWN)  }
        ],
    });

    Utils.create("h3")
        .addClass("h3")
        .html(Text.get("text.report.title.total_availability"))
        .appendTo(tableBox);

    var table = Utils.create("table")
        .addClass("av-table")
        .appendTo(tableBox);

    $.each([ "total", "OK", "INFO", "WARNING", "CRITICAL", "UNKNOWN" ], function(i, stat) {
        var row = Utils.create("tr")
            .appendTo(table);

        Utils.create("th")
            .text(stat)
            .appendTo(row);

        Utils.create("td")
            .addClass("status-text-"+ stat)
            .text(service.availability[stat] +"%")
            .appendTo(row);
    });

    Utils.create("div")
        .addClass("clear")
        .appendTo(box);

    return box;
};

Bloonix.createServiceTotalDurationOfEventsBox = function(service, container) {
    var box = Utils.create("div")
        .addClass("av-service-box")
        .appendTo(container);

    Utils.create("h3")
        .addClass("h3")
        .html(Text.get("text.report.title.total_status_duration"))
        .appendTo(box);

    var table = Utils.create("table")
        .addClass("av-table")
        .appendTo(box);

    var thRow = Utils.create("tr").appendTo(table);
    Utils.create("td").html("").appendTo(thRow);
    Utils.create("td").html(Text.get("word.Days")).appendTo(thRow);
    Utils.create("td").html(Text.get("word.Hours")).appendTo(thRow);
    Utils.create("td").html(Text.get("word.Minutes")).appendTo(thRow);
    Utils.create("td").html(Text.get("word.Seconds")).appendTo(thRow);

    $.each([ "OK", "INFO", "WARNING", "CRITICAL", "UNKNOWN" ], function(i, stat) {
        var row = Utils.create("tr")
            .appendTo(table);

        Utils.create("th")
            .text(stat)
            .appendTo(row);

        $.each(Utils.secondsToStringList(service.duration_of_events[stat]), function(i, time) {
            Utils.create("td")
                .addClass("status-text-"+ stat)
                .text(time)
                .appendTo(row);
        })
    });

    return box;
};

Bloonix.createServiceNumerOfEventsBox = function(service, container) {
    var box = Utils.create("div")
        .addClass("av-service-2c-box")
        .appendTo(container);

    var tableBox = Utils.create("div")
        .addClass("av-service-2c-table-box")
        .appendTo(box);

    var graphBox = Utils.create("div")
        .attr("id", "int-service-number-of-events-box")
        .addClass("av-service-2c-graph-box")  
        .appendTo(box);

    Bloonix.pieChart({
        chart: {
            title: null,
            container: "int-service-number-of-events-box"
        },
        legend: false,
        colors: Bloonix.areaStatusColors,
        data: [
            { name: "OK",       y: parseFloat(service.number_of_events.OK)       },
            { name: "INFO",     y: parseFloat(service.number_of_events.INFO)     },
            { name: "WARNING",  y: parseFloat(service.number_of_events.WARNING)  },
            { name: "CRITICAL", y: parseFloat(service.number_of_events.CRITICAL) },
            { name: "UNKNOWN",  y: parseFloat(service.number_of_events.UNKNOWN)  }
        ],
    });

    Utils.create("h3")
        .addClass("h3")
        .html(Text.get("text.report.title.number_of_events"))
        .appendTo(tableBox);

    var table = Utils.create("table")
        .addClass("av-table")
        .appendTo(tableBox);

    $.each([ "total", "OK", "INFO", "WARNING", "CRITICAL", "UNKNOWN" ], function(i, stat) {
        var row = Utils.create("tr")
            .appendTo(table);

        Utils.create("th")
            .text(stat)
            .appendTo(row);

        Utils.create("td")
            .addClass("status-text-"+ stat)
            .text(service.number_of_events[stat])
            .appendTo(row);
    });

    return box;
};

Bloonix.createServiceNumberOfEventsByDurationBox = function(service, container) {
    var box = Utils.create("div")
        .addClass("av-service-box")
        .appendTo(container);

    Utils.create("h3")
        .addClass("h3")
        .html(Text.get("text.report.title.number_of_events_by_duration"))
        .appendTo(box);

    var table = Utils.create("table")
        .addClass("av-table")
        .appendTo(box);

    $.each([ "lt15", "lt30", "lt60", "lt180", "lt300", "ge300" ], function(i, key) {
        var row = Utils.create("tr")
            .appendTo(table);

        Utils.create("th")
            .html(Text.get("text.report.availability."+ key))
            .appendTo(row);

        $.each([ "OK", "INFO", "WARNING", "CRITICAL", "UNKNOWN" ], function(i, stat) {
            Utils.create("td")
                .addClass("status-text-"+ stat)
                .text(service.number_of_events[key][stat])
                .appendTo(row);
        });
    });

    return box;
};

Bloonix.createServiceNumberOfEventsByTags = function(service, container) {
    var box = Utils.create("div")
        .addClass("av-service-box")
        .appendTo(container);

    Utils.create("h3")
        .addClass("h3")
        .html(Text.get("text.report.title.number_of_events_by_tags"))
        .appendTo(box);

    var table = Utils.create("table")
        .addClass("av-table")
        .appendTo(box);

    $.each([ "flapping", "volatile", "timeout", "agent_dead", "security", "fatal" ], function(i, key) {
        var row = Utils.create("tr")
            .appendTo(table);

        Utils.create("th")
            .html(Text.get("text.report.availability."+ key))
            .appendTo(row);

        var col = Utils.create("td")
            .text(service.number_of_events[key])
            .appendTo(row);

        if (service.number_of_events[key] != "0") {
            col.css({ "font-weight": "bold" })
        }
    });

    return box;
};

Bloonix.createServiceDurationOfEventsByHourBox = function(service, container) {
    var box = Utils.create("div")
        .addClass("av-service-status-duration-box")
        .appendTo(container);

    Utils.create("h3")
        .addClass("h3")
        .html(Text.get("text.report.title.status_duration_by_hour"))
        .appendTo(box);

    var table = Utils.create("table")
        .addClass("av-table")
        .appendTo(box);

    var timeString = [ "d", "h", "m", "s" ];

    $.each([
        "h00", "h01", "h02", "h03", "h04", "h05", "h06", "h07", "h08", "h09", "h10", "h11",
        "h12", "h13", "h14", "h15", "h16", "h17", "h18", "h19", "h20", "h21", "h22", "h23"
    ], function(x, key) {
        var row = Utils.create("tr")
            .appendTo(table);
    
        Utils.create("th")
            .html(Text.get("text.report.availability."+ key))
            .appendTo(row);

        $.each([ "OK", "INFO", "WARNING", "CRITICAL", "UNKNOWN" ], function(y, stat) {
            $.each(Utils.secondsToStringList(service.duration_of_events[key][stat]), function(i, string) {
                var col = Utils.create("td")
                    .text(string + timeString[i])
                    .addClass("status-text-"+ stat)
                    .appendTo(row);

                if (string == "0") {
                    col.css({ "font-weight": "normal", opacity: .3 });
                }
            });
        });
    });

    return box;
};

Bloonix.createServiceAvailabilityDonut = function(service, container) {
    var box = Utils.create("div")
        .attr("id", "int-donut-"+ service.id)
        .addClass("av-service-graph-box")
        .appendTo(container);

    Bloonix.createReportDonutChart({
        container: "int-donut-"+ service.id,
        data: {
            total: service.availability.total,
            OK: service.availability.OK,
            INFO: service.availability.INFO,
            WARNING: service.availability.WARNING,
            CRITICAL: service.availability.CRITICAL,
            UNKNOWN: service.availability.UNKNOWN
        }
    });

    return box;
};

Bloonix.createReportBarChart = function(container, data) {
    var barChart = new $jit.BarChart({
        injectInto: container,
        animate: true,
        orientation: "horizontal",
        barsOffset: 0,
        Margin: {
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
        },
        labelOffset: 0,
        type: "stacked:gradient",
        showAggregates: false,
        showLabels: false,
        Label: {
            type: "Native",
            size: 12,
            family: "Arial",
            color: "#222222"
        },
        Tips: {
            enable: true,
            onShow: function(tip, elem) {
                tip.innerHTML = "<b>" + elem.name + "</b>: " + elem.value;
            }
        }
    });
    barChart.loadJSON(data);
};

Bloonix.createReportDonutChart = function(o) {
    var chartOpts = {
        chart: {
            renderTo: o.container,
            type: "pie",
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false
        },
        title: {
            text: null
        },
        subTitle: {
            text: null
        },
        plotOptions: {
            pie: {
                shadow: false
            }
        },
        tooltip: {
            formatter: function() {
                return "<b>"+ this.point.name +"</b>: "+ this.y +" %";
            }
        },
        colors: Bloonix.areaStatusColors,
        series: [{
            name: "Browsers",
            data: [
                [ "OK", parseFloat(o.data.OK) ],
                [ "INFO", parseFloat(o.data.INFO) ],
                [ "WARNING", parseFloat(o.data.WARNING) ],
                [ "CRITICAL", parseFloat(o.data.CRITICAL) ],
                [ "UNKNOWN", parseFloat(o.data.UNKNOWN) ]
            ],
            size: "100%",
            innerSize: "65%",
            dataLabels: {
                enabled: false
            }
        }]
    };

    var chartFunction = function(chart) {
        var xpos = "50%";
        var ypos = "50%";
        var circleradius = 40;

        chart.renderer.circle(xpos, ypos, circleradius).attr({
            fill: "#ffffff",
        }).add();

        var y = 103,
            x = o.data.total < 10
                ? 74
                : o.data.total < 100
                    ? 70
                    : 64;

        chart.renderer.text(o.data.total +"%", x, y).css({
            width: circleradius * 2,
            color: "#444444",
            fontSize: "19px",
            fontWeight: "bold",
            textAlign: "center"
        }).attr({
            zIndex: 0
        }).add();
    }

    Bloonix.createOrReplaceChart({
        container: o.container,
        chartOpts: chartOpts,
        chartFunction: chartFunction,
        type: "Chart"
    });
};
