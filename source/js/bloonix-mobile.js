var Bloonix = function(o) {
    var B = Utils.extend({
        appendTo: "body",
        postdata: {
            offset: 0,
            limit: 10
        }
    });

    B.init = function() {
        this.createHeaderBox();
        this.createContentBox();
        this.loadDashboard();
    };

    B.createHeaderBox = function() {
        this.headerBox = Utils.create("div")
            .attr("id", "header")
            .appendTo(this.appendTo);

        this.navIcon = Utils.create("div")
            .attr("id", "nav-icon")
            .addClass("gicons-gray gicons justify")
            .appendTo(this.headerBox);

        this.logo = Utils.create("div")
            .attr("id", "logo")
            .appendTo(this.headerBox);

        Utils.create("img")
            .attr("src", "/public/img/Bloonix-Black-3.png")
            .attr("alt", "Bloonix")
            .appendTo(this.logo);

        this.logoutIcon = Utils.create("div")
            .attr("id", "logout-icon")
            .addClass("gicons-gray gicons power pointer")
            .appendTo(this.headerBox);

        this.logoutIcon.click(function() {
            window.location = "/logout";
        });
    };

    B.createContentBox = function() {
        this.contentBox = Utils.create("div")
            .attr("id", "content")
            .appendTo(this.appendTo);
    };

    B.loadDashboard = function() {
        var self = this;

        Ajax.post({
            url: "/hosts/stats/status",
            success: function(response) {
                var table = new Table({
                    width: "100%"
                }).create();

                $.each([ "UNKNOWN", "CRITICAL", "WARNING", "INFO", "OK" ], function(i, status) {
                    table.addRow({
                        columns: [
                            { value: response.data[status] +" "+ status, addClass: "column-"+ status },
                        ]
                    });
                });
            }
        });
    };

    return B;
};

var Table = function(o) {
    var T = Utils.extend({
        appendTo: "#content",
        addClass: "maintab"
    }, o);

    T.create = function() {
        this.table = Utils.create("table");

        if (this.width) {
            this.table.css({ width: this.width });
        }

        if (this.addClass) {
            this.table.addClass(this.addClass);
        }

        if (this.appendTo) {
            this.table.appendTo(this.appendTo);
        }

        return this;
    };

    T.addRow = function(o) {
        var row = { td: [] };

        row.tr = Utils.create("tr")
            .appendTo(this.table);

        $.each(o.columns, function(i, column) {
            var td = Utils.create("td")
                .text(column.value)
                .appendTo(row.tr);

            if (column.addClass) {
                td.addClass(column.addClass);
            }

            row.td.push(td);
        });

        return row;
    };

    return T;
};
