Bloonix.viewHostDowntimes = function(o) {
    var object = o;
    object.host = Bloonix.getHost(o.id);

    object.init = function() {
        var self = this;
        this.container = $("#content");
        this.container.html("");

        Bloonix.showHostSubNavigation(
            "downtimes",
            this.host.id,
            this.host.hostname
        );

        this.boxes = Bloonix.createSideBySideBoxes({
            container: this.container
        });

        new Header({
            title: Text.get("schema.hs_downtime.text.create"),
            appendTo: this.boxes.left,
            rbox: false
        }).create();

        this.form = Bloonix.createScheduledDowntime({
            url: "/hosts/"+ this.host.id +"/downtimes/create",
            services: Bloonix.getServicesByHostId(this.host.id),
            callback: function() { Bloonix.viewHostDowntimes({ id: self.host.id }) }
        });

        this.form.container.appendTo(this.boxes.left);

        this.hostTable = new Table({
            url: "/hosts/"+ this.host.id +"/downtimes",
            appendTo: this.boxes.right,
            header: {
                appendTo: this.boxes.right,
                title: Text.get("schema.host_downtime.text.title", this.host.hostname, true),
                icons: [
                    {
                        type: "help",
                        callback: function() { Utils.open("/#help/scheduled-downtimes") },
                        title: Text.get("site.help.doc.scheduled-downtimes")
                    }
                ]
            },
            deletable: {
                title: Text.get("schema.hs_downtime.text.delete"),
                url: "/hosts/"+ this.host.id +"/downtimes/:id/delete",
                result: [ "id", "description" ]
            },
            columns: [
                {
                    name: "id",
                    text: Text.get("schema.hs_downtime.attr.id")
                },{
                    name: "begin",
                    text: Text.get("schema.hs_downtime.attr.begin_time")
                },{
                    name: "end",
                    text: Text.get("schema.hs_downtime.attr.end_time")
                },{
                    name: "timeslice",
                    text: Text.get("schema.hs_downtime.attr.timeslice")
                },{
                    name: "description",
                    text: Text.get("schema.hs_downtime.attr.description")
                },{
                    name: "active",
                    text: "",
                    activeFlag: true
                }
            ]
        }).create();

        this.serviceTable = new Table({
            url: "/hosts/"+ this.host.id +"/services/downtimes",
            appendTo: this.boxes.right,
            header: {
                appendTo: this.boxes.right,
                title: Text.get("schema.service_downtime.text.title", this.host.hostname, true),
                css: { "margin-top": "30px" },
            },
            deletable: {
                title: Text.get("schema.hs_downtime.text.delete"),
                url: "/hosts/"+ this.host.id +"/services/:service_id/downtimes/:id/delete",
                result: [ "id", "service_name", "description" ]
            },
            columns: [
                {
                    name: "id",
                    text: Text.get("schema.hs_downtime.attr.id")
                },{
                    name: "service_name",
                    text: Text.get("schema.service.attr.service_name")
                },{
                    name: "begin",
                    text: Text.get("schema.hs_downtime.attr.begin_time")
                },{
                    name: "end",
                    text: Text.get("schema.hs_downtime.attr.end_time")
                },{
                    name: "timeslice",
                    text: Text.get("schema.hs_downtime.attr.timeslice")
                },{
                    name: "description",
                    text: Text.get("schema.hs_downtime.attr.description")
                },{
                    name: "active",
                    text: "",
                    activeFlag: true
                }
            ]
        }).create();
    };

    object.init();
};

Bloonix.createScheduledDowntime = function(o) {
    var object = Utils.extend({
        url: false,
        callback: false
    }, o);

    object.create = function() {
        var self = this;
        this.cache = {};

        var outerContainer = Utils.create("div")
            .addClass("form-options");

        var menu = new SimpleMenu({
            appendTo: outerContainer,
            store: { to: this.cache, as: "timetype" }
        }).create();

        var formContainer = Utils.create("form")
            .appendTo(outerContainer);

        var form = new Form({ format: "medium" });

        // absolute time
        var absoluteTimeContainer = Utils.create("div")
            .addClass("form-row")
            .appendTo(formContainer);

        Utils.create("p")
            .addClass("form-row-desc")
            .html(Text.get("schema.hs_downtime.attr.begin_time"))
            .appendTo(absoluteTimeContainer);

        form.datetime({
            name: "begin",
            appendTo: absoluteTimeContainer,
            placeholder: Text.get("schema.hs_downtime.attr.begin_time")
        });

        Utils.create("p")
            .addClass("form-row-desc")
            .html(Text.get("schema.hs_downtime.attr.end_time"))
            .appendTo(absoluteTimeContainer);

        form.datetime({
            name: "end",
            appendTo: absoluteTimeContainer,
            placeholder: Text.get("schema.hs_downtime.attr.end_time")
        });

        menu.add({
            text: Text.get("word.Absolute"),
            value: "absolute",
            container: absoluteTimeContainer,
            show: true
        });

        // timeslice
        var timesliceContainer = Utils.create("div")
            .addClass("form-row")
            .appendTo(formContainer);

        Utils.create("p")
            .addClass("form-row-desc")
            .html(Text.get("schema.hs_downtime.attr.timeslice"))
            .appendTo(timesliceContainer);

        form.input({
            name: "timeslice",
            placeholder: Text.get("schema.hs_downtime.attr.timeslice"),
            bubbleAlignment: "center right",
            bubbleWidth: "650px",
            description: Text.get("schema.timeperiod.examples"),
            maxlength: 200,
            appendTo: timesliceContainer
        });

        menu.add({
            text: Text.get("word.Timeslice"),
            value: "timeslice",
            container: timesliceContainer
        });

        // preset
        var presetContainer = Utils.create("div")
            .addClass("form-row")
            .appendTo(formContainer);

        Utils.create("p")
            .addClass("form-row-desc")
            .html(Text.get("word.Preset"))
            .appendTo(presetContainer);

        form.iconList({
            name: "preset",
            checked: "1h",
            appendTo: presetContainer,
            even: true,
            buttonsPerRow: 4,
            options: [
                { value: "1h", title: Text.get("text.from_now_to_1h"), checked: true },
                { value: "2h", title: Text.get("text.from_now_to_2h") },
                { value: "4h", title: Text.get("text.from_now_to_4h") },
                { value: "8h", title: Text.get("text.from_now_to_8h") },
                { value: "12h", title: Text.get("text.from_now_to_12h") },
                { value: "16h", title: Text.get("text.from_now_to_16h") },
                { value: "20h", title: Text.get("text.from_now_to_20h") },
                { value: "1d", title: Text.get("text.from_now_to_1d") },
                { value: "2d", title: Text.get("text.from_now_to_2d") },
                { value: "4d", title: Text.get("text.from_now_to_4d") },
                { value: "7d", title: Text.get("text.from_now_to_7d") },
                { value: "14d", title: Text.get("text.from_now_to_14d") }
            ]
        });

        menu.add({
            text: "Preset",
            value: "preset",
            container: presetContainer
        });

        // timezone
        var timezoneContainer = Utils.create("div")
            .addClass("form-row")
            .appendTo(formContainer);

        Utils.create("p")
            .addClass("form-row-desc")
            .html(Text.get("schema.hs_downtime.attr.timezone"))
            .appendTo(timezoneContainer);

        form.select({
            name: "timezone",
            selected: Bloonix.user.timezone,
            options: Timezones(),
            maxHeight: "126px", // 6 items
            appendTo: timezoneContainer
        });

        // description
        var descriptionContainer = Utils.create("div")
            .addClass("form-row")
            .appendTo(formContainer);

        Utils.create("p")
            .addClass("form-row-desc")
            .html(Text.get("schema.hs_downtime.attr.description"))
            .appendTo(descriptionContainer);

        form.input({
            name: "description",
            maxlength: 300,
            appendTo: descriptionContainer,
            placeholder: Text.get("schema.hs_downtime.attr.description")
        });

        // services
        if (this.services) {
            var serviceContainer = Utils.create("div")
                .addClass("form-row")
                .appendTo(formContainer);

            Utils.create("p")
                .addClass("form-row-desc")
                .html(Text.get("schema.hs_downtime.text.select_services"))
                .appendTo(serviceContainer);

            var services = [];
            $.each(this.services, function(i, service) {
                services.push({
                    name: service.service_name,
                    value: service.id
                });
            });

            form.multiselect({
                name: "service_id",
                options: services,
                appendTo: serviceContainer
            });
        }

        // button
        var buttonContainer = Utils.create("div")
            .addClass("form-row")
            .appendTo(formContainer);

        form.button({
            text: Text.get("action.create"),
            appendTo: buttonContainer,
            callback: function() { self.submit() }
        });

        form.form = formContainer;
        this.container = outerContainer;
        this.form = form;
        this.menu = menu;
    };

    object.submit = function() {
        var self = this,
            formData = this.form.getData();

        var data = Utils.extend({
            description: formData.description,
            timezone: formData.timezone,
            type: this.cache.timetype
        }, this.data);

        if (formData.service_id) {
            data.service_id = formData.service_id;
        }

        if (this.cache.timetype == "absolute") {
            data.begin = formData.begin;
            data.end = formData.end;
        } else if (this.cache.timetype == "timeslice") {
            data.timeslice = formData.timeslice;
        } else if (this.cache.timetype == "preset") {
            data.preset = formData.preset;
        }

        if (this.url) {
            Ajax.post({
                url: this.url,
                data: data,
                token: true,
                success: function(result) {
                    if (result.status == "err-610") {
                        self.form.markErrors(result.data.failed);
                    } else if (self.callback) {
                        self.callback(result, data);
                    }
                }
            });
        } else if (this.callback) {
            this.callback(data);
        }
    };

    object.create();
    return object;
};
