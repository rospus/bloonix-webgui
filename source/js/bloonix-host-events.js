Bloonix.listHostEvents = function(o) {
    o.url = "/hosts/"+ o.id +"/events";
    o.host = Bloonix.getHost(o.id);
    o.services = Bloonix.getServicesByHostId(o.id);

    Bloonix.showHostSubNavigation("events", o.id, o.host.hostname);

    o.cache = {
        selected: { }
    };

    o.postdata = {
        offset: 0,
        limit: Bloonix.requestSize
    };

    Bloonix.initEventList(o);
};

Bloonix.initEventList = function(o) {
    Bloonix.setTitle("schema.event.text.list", o.host.hostname);

    var header = Utils.create("div").appendTo("#content"),
        form = new Form({ format: "small" });

    var dataContainer = Utils.create("div")
        .attr("id", "data-container")
        .appendTo("#content");

    var dataOptions = Utils.create("div")
        .attr("id", "data-options")
        .appendTo(dataContainer);

    var dataList = Utils.create("div")
        .attr("id", "data-list")
        .appendTo(dataContainer);

    var dataSelectTime = Utils.create("div")
        .attr("id", "data-select-time")
        .appendTo(dataOptions);

    var dataTimeTypeSelectBox = Utils.create("div")
        .attr("id", "data-select-time-type")
        .appendTo(dataSelectTime);

    var dataRelativeTime = Utils.create("div")
        .attr("id", "data-relative")
        .appendTo(dataSelectTime)

    var dataAbsoluteTime = Utils.create("div")
        .attr("id", "data-absolute")
        .hide()
        .appendTo(dataSelectTime);

    var dataRelativeLink = Utils.create("span")
        .attr("id", "data-relative-box")
        .css({ "font-weight": "bold", cursor: "pointer" })
        .html(Text.get("word.Relative"))
        .hover(
            function(){ $(this).css({ "text-decoration": "underline" }) },
            function(){ $(this).css({ "text-decoration": "none" }) }
        ).appendTo(dataTimeTypeSelectBox);

    $(dataTimeTypeSelectBox).append(" | ");

    var dataAbsoluteLink = Utils.create("span")
        .attr("id", "data-absolute-box")
        .css({ cursor: "pointer" })
        .html(Text.get("word.Absolute"))
        .hover(
            function(){ $(this).css({ "text-decoration": "underline" }) },
            function(){ $(this).css({ "text-decoration": "none" }) }
        ).appendTo(dataTimeTypeSelectBox);

    dataRelativeLink.click(function() {
        dataAbsoluteTime.hide(200);
        dataAbsoluteLink.css({ "font-weight": "normal" });
        dataRelativeTime.show(200);
        dataRelativeLink.css({ "font-weight": "bold" });
        o.cache.selected.type = "relative";
    });

    dataAbsoluteLink.click(function() {
        dataRelativeTime.hide(200);
        dataRelativeLink.css({ "font-weight": "normal" });
        dataAbsoluteTime.show(200);
        dataAbsoluteLink.css({ "font-weight": "bold" });
        o.cache.selected.type = "absolute";
    });

    var searchButton1 = Utils.create("div")
        .addClass("btn btn-white btn-default")
        .html(Text.get("action.search"));
    var searchButton2 = searchButton1.clone();
    searchButton1.click(function() { o.table.getData({ resetOffset: true }) });
    searchButton2.click(function() { o.table.getData({ resetOffset: true }) });

    // The default
    o.cache.selected.type = "relative";

    Bloonix.createIconList({
        items: [
            { name: "30d",  value: "30d",  title: Text.get("text.last_30d"), default: true },
            { name: "60d",  value: "60d",  title: Text.get("text.last_60d") },
            { name: "90d",  value: "90d",  title: Text.get("text.last_90d") },
            { name: "180d", value: "180d", title: Text.get("text.last_180d") }
        ],
        store: { to: o.cache.selected, as: "preset" },
        callback: function() { o.table.getData({ resetOffset: true }) },
        appendTo: dataRelativeTime
    });

    var searchBox = Utils.create("div")
        .attr("id", "data-search-box")
        .appendTo(dataOptions);

    var dateBox = Utils.create("div")
        .attr("id", "date")
        .addClass("date")
        .appendTo(dataAbsoluteTime);

    var dateFrom = Utils.create("input")
        .attr("type", "text")
        .attr("id", "date1-input")
        .attr("placeholder", Text.get("word.From"))
        .attr("value", "")
        .addClass("input input-small")
        .css({ "z-index": 3 })
        .appendTo(dateBox);

    var dateTo = Utils.create("input")
        .attr("type", "text")
        .attr("id", "date2-input")
        .attr("placeholder", Text.get("word.To"))
        .attr("value", "")
        .addClass("input input-small")
        .css({ "z-index": 3 })
        .appendTo(dateBox);

    searchButton1.appendTo(dataAbsoluteTime);

    $.each([ dateFrom, dateTo ], function(i, obj) {
        obj.datetimepicker({
            ampm: false,
            timeFormat: "hh:mm:ss",
            dateFormat: "yy-mm-dd",
            stepMinute: 15
        });
    });

    var statusFilterBox = Bloonix.createIconList({
        items: [
            { name: "OK", value: "OK", title: "OK" },
            { name: "INFO", value: "INFO", title: "INFO" },
            { name: "WARNING", value: "WARNING", title: "WARNING" },
            { name: "CRITICAL", value: "CRITICAL", title: "CRITICAL" },
            { name: "UNKNOWN", value: "UNKNOWN", title: "UNKNOWN" }
        ],
        store: { to: o.cache.selected, as: "status" },
        callback: function() { o.table.getData({ resetOffset: true }) },
        multiple: true,
        format: "default"
    });

    new Menu({
        title: "Filter by status",
        content: statusFilterBox.getContainer(),
        hide: true,
        appendTo: searchBox
    }).create();

    var durationFilterBox = Bloonix.createIconList({
        items: [
            { name: "LT-15",  value: "lt15m", title: Text.get("text.report.availability.LT15") },
            { name: "LT-30",  value: "lt30m", title: Text.get("text.report.availability.LT30") },
            { name: "LT-60",  value: "lt60m", title: Text.get("text.report.availability.LT60") },
            { name: "LT-180", value: "lt3h",  title: Text.get("text.report.availability.LT180") },
            { name: "LT-300", value: "lt5h",  title: Text.get("text.report.availability.LT300") },
            { name: "GE-300", value: "ge5h",  title: Text.get("text.report.availability.GE300") }
        ],
        store: { to: o.cache.selected, as: "duration" },
        callback: function() { o.table.getData({ resetOffset: true }) }
    });

    new Menu({
        title: "Filter by duration",
        content: durationFilterBox.getContainer(),
        hide: true,
        appendTo: searchBox
    }).create();

    var messageBoxOuter = Utils.create("div");

    var form = new Form({ format: "small" });
    form.input({
        id: "event-search-message-input",
        placeholder: Text.get("schema.event.text.filter_message"),
        description: Text.get("info.search_syntax"),
        bubbleAlignment: "center right",
        appendTo: messageBoxOuter
    });

    new Menu({
        title: "Filter messages by query",
        content: [ messageBoxOuter, searchButton2 ],
        hide: true,
        appendTo: searchBox
    }).create();

    var services = [ ];
    $.each(o.services, function(i, service) {
        services.push({
            name: service.service_name,
            value: service.id
        });
    });

    var serviceFilterBox = Bloonix.createIconList({
        format: "even-full",
        items: services,
        store: { to: o.cache.selected, as: "services" },
        callback: function() { o.table.getData({ resetOffset: true }) },
        multiple: true
    });

    new Menu({
        title: "Filter by services",
        content: serviceFilterBox.getContainer(),
        hide: true,
        appendTo: searchBox
    }).create();

    var clearButton = Utils.create("div")
        .addClass("btn btn-white btn-default")
        .html(Text.get("action.clear"))
        .css({ "margin-top": "20px" })
        .click(function() { Bloonix.route.to("monitoring/hosts/"+ o.host.id +"/events") })
        .appendTo(dataOptions);

    var getQueryParams = function(postdata) {
        postdata.query = {
            message: $("#event-search-message-input").val(),
            status: o.cache.selected.status,
            duration: o.cache.selected.duration,
            services: o.cache.selected.services
        };

        if (o.cache.selected.type == "relative") {
            o.postdata.preset = o.cache.selected.preset;
            delete o.postdata.from;
            delete o.postdata.to;
        } else {
            postdata.from = dateFrom.val();
            postdata.to = dateTo.val();
            delete postdata.preset;
        }

        return postdata;
    };

    o.table = new Table({
        url: "/hosts/"+ o.id +"/events",
        appendTo: dataList,
        postdata: o.postdata,
        postdataCallback: getQueryParams,
        searchable: false,
        selectable: false,
        header: {
            title: Text.get("schema.event.text.list", o.host.hostname, true),
            pager: true,
            appendTo: header
        },
        columns: [
            {
                name: "time",
                text: Text.get("schema.event.attr.time")
            },{
                name: "hostname",
                text: Text.get("schema.host.attr.hostname"),
                hide: true
            },{
                name: "service_name",
                text: Text.get("schema.service.attr.service_name")
            },{
                icons: [
                    {
                        check: function(row) {
                            if (row.plugin_id == "58") {
                                return false;
                            }
                            return typeof row.result === "object" ? true : false;
                        },
                        icon: "cicons robot",
                        title: Text.get("schema.service.info.has_result"),
                        onClick: function(row) { Bloonix.showServiceResultData(row.plugin, row.result) }
                    },{
                        check: function(row) { return typeof row.debug === "object" ? true : false },
                        icon: "cicons light-on",
                        title: Text.get("schema.service.info.has_result"),
                        onClick: function(row) { Bloonix.showServiceDebugData(row.debug) }
                    }
                ]
            },{
                name: "last_status",
                text: Text.get("schema.event.attr.last_status"),
                wrapValueClass: true
            },{
                name: "status",
                text: Text.get("schema.event.attr.status"),
                wrapValueClass: true
            },{
                name: "attempts",
                text: Text.get("schema.event.attr.attempts"),
                notNull: "n/a"
            },{
                name: "duration",
                text: Text.get("schema.event.attr.duration"),
                convertToTimeString: true
            },{
                name: "tags",
                text: Text.get("schema.event.attr.tags"),
                empty: "none"
            },{
                name: "message",
                text: Text.get("schema.service.attr.message")
            }
        ]
    }).create();

    Utils.create("div")
        .addClass("clear")
        .appendTo(dataContainer);
};
