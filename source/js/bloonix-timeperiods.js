Bloonix.listTimeperiods = function() {
    Bloonix.setTitle("schema.timeperiod.text.list");

    var table = new Table({
        url: "/timeperiods",
        header: {
            title: Text.get("schema.timeperiod.text.list"),
            pager: true,
            search: true,
            icons: [{
                type: "create",
                callback: function() { Bloonix.route.to("notification/timeperiods/create") },
                title: Text.get("schema.timeperiod.text.create")
            }]
        },
        searchable: {
            url: "/timeperiods/search",
            result: [ "id", "name", "description" ]
        },
        deletable: {
            title: Text.get("schema.timeperiod.text.delete"),
            url: "/timeperiods/:id/delete",
            result: [ "name", "description" ]
        },
        appendTo: "#content",
        reloadable: true,
        columnSwitcher: true,
        columns: [
            {
                name: "id",
                text: Text.get("schema.timeperiod.attr.id"),
                hide: true
            },{
                name: "name",
                text: Text.get("schema.timeperiod.attr.name"),
                call: function(row) { return Bloonix.call("notification/timeperiods/"+ row.id +"/edit", row.name) }
            },{
                name: "company",
                text: Text.get("schema.company.attr.company"),
                call: function(row) {
                    return Bloonix.call(
                        "administration/companies/settings/"+ row.company_id, row.company
                    );
                },
                hide: true
            },{
                name: "description",
                text: Text.get("schema.timeperiod.attr.description")
            }
        ]
    });

    table.create();
};

Bloonix.createTimeperiod = function() {
    Bloonix.setTitle("schema.timeperiod.text.create");

    new Header({ title: Text.get("schema.timeperiod.text.create") }).create();

    new Form({
        url: { submit: "/timeperiods/create" },
        onSuccess: function(result) {
            Bloonix.route.to("notification/timeperiods/"+ result.id +"/edit");
        },
        action: "create",
        elements: Bloonix.getTimeperiodFormElements()
    }).create();
};

Bloonix.editTimeperiod = function(o) {
    Bloonix.setTitle("schema.timeperiod.text.settings");

    new Header({ title: Text.get("schema.timeperiod.text.settings"), border: true }).create();

    new Form({
        url: { submit: "/timeperiods/"+ o.id +"/update" },
        action: "update",
        values: Bloonix.getTimeperiod(o.id),
        elements: Bloonix.getTimeperiodFormElements()
    }).create();

    new Header({ title: Text.get("schema.timeslice.text.list"), border: true }).create();

    var timesliceTable = new Table({
        url: "/timeperiods/"+ o.id +"/timeslices",
        width: "inline",
        selectable: false,
        searchable: false,
        deletable: {
            title: Text.get("schema.timeslice.text.delete"),
            url: "/timeperiods/"+ o.id +"/timeslices/:id/delete",
            result: [ "id", "timeslice" ]
        },
        columns: [
            {
                name: "id",
                text: Text.get("schema.timeslice.attr.id"),
                hide: true
            },{
                name: "timeperiod_id",
                text: Text.get("schema.timeperiod.attr.id"),
                hide: true
            },{
                name: "timeslice",
                text: Text.get("schema.timeslice.attr.timeslice")
            }
        ]
    });

    var timesliceContainer = Utils.create("div").appendTo("#content");
    var timesliceForm = new Form({
        url: { submit: "/timeperiods/"+ o.id +"/timeslices/create" },
        format: "medium",
        appendTo: "#content",
        showButton: false,
        onSuccess: function() { timesliceTable.getData() }
    });

    timesliceForm.init();
    var timesliceBox = Utils.create("div")
        .css({ position: "relative" })
        .appendTo(timesliceForm.form);

    timesliceForm.button({
        css: { "margin-right": "10px" },
        text: Text.get("action.add"),
        appendTo: timesliceBox
    });

    timesliceForm.input({
        name: "timeslice",
        value: "",
        placeholder: "Monday - Sunday 00:00 - 23:59",
        appendTo: timesliceBox
    });

    timesliceForm.desc({
        title: Text.get("schema.timeperiod.text.examples"),
        desc: Text.get("schema.timeperiod.examples"),
        width: "600px",
        appendTo: timesliceBox
    });

    timesliceTable.create();
};

Bloonix.getTimeperiodFormElements = function() {
    return [
        {
            element: "input",
            name: "name",
            maxlength: 40,
            text: Text.get("schema.timeperiod.attr.name"),
            desc: Text.get("schema.timeperiod.desc.name"),
            required: true
        },{
            element: "input",
            name: "description",
            maxlength: 100,
            text: Text.get("schema.timeperiod.attr.description"),
            desc: Text.get("schema.timeperiod.desc.description")
        }
    ];
};

Bloonix.getTimeperiod = function(id) {
    return Bloonix.get("/timeperiods/"+ id);
};
