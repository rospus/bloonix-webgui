Bloonix.listContacts = function(o) {
    Bloonix.setTitle("schema.contact.text.list");

    var table = new Table({
        url: "/contacts",
        header: {
            title: Text.get("schema.contact.text.list"),
            pager: true,
            search: true,
            icons: [
                {
                    type: "help",
                    callback: function() { Utils.open("/#help/contacts-and-notifications") },
                    title: Text.get("site.help.doc.contacts-and-notifications")
                },{
                    type: "create",
                    callback: function() { Bloonix.route.to("notification/contacts/create") },
                    title: Text.get("schema.contact.text.create")
                }
            ]
        },
        searchable: {
            url: "/contacts/search",
            result: [ "id", "name" ]
        },
        deletable: {
            title: Text.get("schema.contact.text.delete"),
            url: "/contacts/:id/delete",
            result: [ "id", "name" ]
        },
        appendTo: "#content",
        reloadable: true,
        columns: [
            {
                name: "id",
                text: Text.get("schema.contact.attr.id"),
                hide: true
            },{
                name: "name",
                text: Text.get("schema.contact.attr.name"),
                call: function(row) { return Bloonix.call("notification/contacts/"+ row.id +"/edit", row.name) },
            },{
                name: "company",
                text: Text.get("schema.company.attr.company"),
                call: function(row) {
                    return Bloonix.call(
                        "administration/companies/"+ row.company_id +"/edit", row.company
                    );
                },
                hide: Bloonix.user.role == "admin" ? false : true
            }
        ]
    });

    table.create();
};

Bloonix.createContact = function() {
    var contact = Bloonix.get("/contacts/options");

    Bloonix.setTitle("schema.contact.text.create");

    new Header({
        title: Text.get("schema.contact.text.create"),
        border: true
    }).create();

    new Form({
        url: { submit: "/contacts/create" },
        onSuccess: function(result) { Bloonix.route.to("notification/contacts/"+ result.id +"/edit") },
        action: "create",
        values: contact.values,
        options: contact.options,
        elements: Bloonix.getContactFormElements(contact)
    }).create();
};

Bloonix.editContact = function(o) {
    var contact = Bloonix.get("/contacts/"+ o.id +"/options");

    Bloonix.setTitle("schema.contact.text.settings");

    new Header({
        title: Text.get("schema.contact.text.settings"),
        border: true
    }).create();

    new Form({
        url: { submit: "/contacts/"+ o.id +"/update" },
        title: Text.get("schema.contact.attr.id") + ": "+ o.id,
        values: contact.values,
        options: contact.options,
        elements: Bloonix.getContactFormElements(contact)
    }).create();

    new Header({
        title: Text.get("schema.contact.text.message_services"),
        border: true,
        css: { "margin-top": "20px" }
    }).create();

    var buttonAddMessageServicesToContact = Utils.create("div")
        .addClass("btn btn-white btn-tall")
        .css({ "margin-bottom": "10px" })
        .text(Text.get("schema.contact_message_services.text.add"))
        .appendTo("#content");

    var messageServicesTable = new Table({
        url: "/contacts/"+ o.id +"/message-services",
        width: "inline",
        appendTo: "#content",
        selectable: false,
        searchable: false,
        deletable: {
            url: "/contacts/"+ o.id +"/message-services/:id/remove",
            title: Text.get("schema.contact.text.remove_message_service"),
            result: [ "message_service", "enabled", "send_to", "notification_level" ],
            buttonText: Text.get("action.remove")
        },
        columns: [
            {
                name: "id",
                text: "ID",
                hide: true
            },{
                name: "message_service",
                text: Text.get("schema.contact_message_services.attr.message_service")
            },{
                name: "send_to",
                text: Text.get("schema.contact_message_services.attr.send_to"),
                onClick: function(row) {
                    Bloonix.addOrUpdateContactMessageService({
                        contact_id: o.id,
                        contact_message_services_id: row.id,
                        reloadTable: messageServicesTable,
                        action: "update"
                    });
                }
            },{
                name: "notification_level",
                text: Text.get("schema.contact_message_services.attr.notification_level")
            },{
                name: "enabled",
                text: Text.get("schema.contact_message_services.attr.enabled"),
                bool: "yn"
            }
        ]
    }).create();

    buttonAddMessageServicesToContact.click(function() {
        Bloonix.addOrUpdateContactMessageService({
            contact_id: o.id,
            reloadTable: messageServicesTable,
            action: "add"
        });
    });

    new Header({
        title: Text.get("schema.contact.text.timeperiods"),
        border: true,
        css: { "margin-top": "40px" }
    }).create();

    var buttonAddTimeperiodToContact = Utils.create("div")
        .addClass("btn btn-white btn-tall")
        .css({ "margin-bottom": "10px" })
        .text(Text.get("schema.contact_timeperiod.text.add"))
        .appendTo("#content");

    var timeperiodTable = new Table({
        url: "/contacts/"+ o.id +"/timeperiods",
        width: "inline",
        appendTo: "#content",
        selectable: false,
        searchable: false,
        deletable: {
            url: "/contacts/"+ o.id +"/timeperiods/:id/remove",
            title: Text.get("schema.contact.text.remove_timeperiod"),
            result: [ "name", "description", "message_service", "exclude", "timezone" ],
            buttonText: Text.get("action.remove")
        },
        columns: [
            {
                name: "id",
                text: "ID",
                hide: true
            },{
                name: "name",
                text: Text.get("schema.timeperiod.attr.name")
            },{
                name: "description",
                text: Text.get("schema.timeperiod.attr.description")
            },{
                name: "message_service",
                text: Text.get("schema.contact_timeperiod.attr.message_service")
            },{
                name: "exclude",
                text: Text.get("schema.contact_timeperiod.attr.exclude"),
                bool: "yn"
            },{
                name: "timezone",
                text: Text.get("word.Timezone")
            }
        ]
    }).create();

    buttonAddTimeperiodToContact.click(function() {
        Bloonix.addTimeperiodToContact({
            id: o.id,
            reloadTable: timeperiodTable
        });
    });
};

Bloonix.addTimeperiodToContact = function(o) {
    var options = Bloonix.get("/contacts/"+ o.id +"/timeperiods/options/"),
        content = Utils.create("div");

    var overlay = new Overlay({
        title: Text.get("schema.contact_timeperiod.text.add"),
        content: content
    });

    var form = new Form({
        url: { submit: "/contacts/"+ o.id +"/timeperiods/add" },
        appendTo: content,
        showButton: false,
        onSuccess: function() {
            overlay.close();
            o.reloadTable.getData();
        }
    }).init();

    form.table = new Table({
        type: "form",
        appendTo: form.form
    }).init().getTable();

    form.createElement({
        element: "select",
        name: "timezone",
        text: Text.get("word.Timezone"),
        options: options.options.timezone,
        selected: options.values.timezone
    });

    form.createElement({
        element: "select",
        name: "timeperiod_id",
        text: Text.get("schema.timeperiod.attr.name"),
        options: options.options.timeperiod_id,
        selected: options.values.timeperiod_id
    });

    form.createElement({
        element: "select",
        name: "message_service",
        text: Text.get("schema.contact_timeperiod.attr.message_service"),
        options: options.options.message_service,
        selected: options.values.message_service
    });

    form.createElement({
        element: "radio-yes-no",
        name: "exclude",
        text: Text.get("schema.contact_timeperiod.attr.exclude"),
        checked: options.values.exclude
    });

    form.button({
        css: { "margin-right": "10px", "margin-bottom": "50px" },
        text: Text.get("action.add"),
        appendTo: form.form
    });

    overlay.create();
};

Bloonix.addOrUpdateContactMessageService = function(o) {
    var content = Utils.create("div");

    var overlay = new Overlay({
        title: Text.get("schema.contact_message_services.text.add"),
        content: content
    });

    var options = o.action === "add"
        ? Bloonix.get("/contacts/"+ o.contact_id +"/message-services/options/")
        : Bloonix.get("/contacts/"+ o.contact_id +"/message-services/"+ o.contact_message_services_id +"/options/");

    var submit = o.action === "add"
        ? "/contacts/"+ o.contact_id +"/message-services/add"
        : "/contacts/"+ o.contact_id +"/message-services/"+ o.contact_message_services_id +"/update";

    var form = new Form({
        url: { submit: submit },
        appendTo: content,
        showButton: false,
        onSuccess: function() {
            overlay.close();
            o.reloadTable.getData();
        }
    }).init();

    form.table = new Table({
        type: "form",
        appendTo: form.form
    }).init().getTable();

    form.createElement({
        element: "select",
        name: "message_service",
        text: Text.get("schema.contact_message_services.attr.message_service"),
        desc: Text.get("schema.contact_message_services.desc.message_service"),
        options: options.options.message_service,
        selected: options.values.message_service
    });

    form.createElement({
        element: "radio-yes-no",
        name: "enabled",
        text: Text.get("schema.contact_message_services.attr.enabled"),
        desc: Text.get("schema.contact_message_services.desc.enabled"),
        checked: options.values.enabled
    });

    form.createElement({
        element: "input",
        type: "text",
        name: "send_to",
        text: Text.get("schema.contact_message_services.attr.send_to"),
        desc: Text.get("schema.contact_message_services.desc.send_to"),
        maxlength: 100,
        required: true,
        value: options.values.send_to
    });

    form.createElement({
        element: "checkbox",
        name: "notification_level",
        text: Text.get("schema.contact_message_services.attr.notification_level"),
        desc: Text.get("schema.contact_message_services.desc.notification_level"),
        commaSeparatedList: true,
        required: true,
        options: options.options.notification_level,
        checked: options.values.notification_level
    });

    form.button({
        css: { "margin-right": "10px", "margin-bottom": "50px" },
        text: o.action === "add" ? Text.get("action.add") : Text.get("action.update"),
        appendTo: form.form
    });

    overlay.create();
};

Bloonix.getContactFormElements = function(o) {
    return [
        {
            element: "input",
            type: "text",
            name: "name",
            text: Text.get("schema.contact.attr.name"),
            desc: Text.get("schema.contact.desc.name"),
            maxlength: 100,
            required: true
        },{
            element: "slider",
            name: "escalation_time",
            text: Text.get("schema.contact.attr.escalation_time"),
            desc: Text.get("schema.contact.desc.escalation_time"),
            options: o.options.escalation_time,
            checked: o.values.escalation_time,
            secondsToFormValues: true,
            nullString: Text.get("schema.contact.text.escalation_time_null")
        }
    ];
};
