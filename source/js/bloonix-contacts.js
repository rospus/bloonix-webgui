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
            result: [ "id", "name", "mail_to", "sms_to" ]
        },
        deletable: {
            title: Text.get("schema.contact.text.delete"),
            url: "/contacts/:id/delete",
            result: [ "id", "name", "mail_to" ]
        },
        appendTo: "#content",
        reloadable: true,
        columnSwitcher: true,
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
                hide: true
            },{
                name: "mail_to",
                text: Text.get("schema.contact.attr.mail_to")
            },{
                name: "sms_to",
                text: Text.get("schema.contact.attr.sms_to")
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
        elements: Bloonix.getContactFormElements()
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
        elements: Bloonix.getContactFormElements()
    }).create();

    new Header({
        title: Text.get("schema.contact.text.timeperiods"),
        border: true
    }).create();

    var boxes = Bloonix.createSideBySideBoxes({
        container: $("#content"),
        width: "300px"
    });

    var timeperiodTable = new Table({
        url: "/contacts/"+ o.id +"/timeperiods",
        width: "inline",
        appendTo: boxes.right,
        selectable: false,
        searchable: false,
        deletable: {
            url: "/contacts/"+ o.id +"/timeperiods/:id/remove",
            title: Text.get("schema.contact.text.remove_timeperiod"),
            result: [ "name", "description", "type", "timezone" ],
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
                name: "type",
                text: Text.get("schema.contact.text.timeperiod_type"),
                value: function(row) {
                    return Text.get("schema.contact.text.timeperiod_type_"+ row.type);
                }
            },{
                name: "timezone",
                text: Text.get("word.Timezone")
            }
        ]
    });

    var timeperiodContainer = Utils.create("div").appendTo("#content");

    var timeperiodForm = new Form({
        url: { submit: "/contacts/"+ o.id +"/timeperiods/add" },
        format: "medium",
        appendTo: boxes.left,
        showButton: false,
        onSuccess: function() { timeperiodTable.getData() }
    });     

    timeperiodForm.create();

    var options = Bloonix.get("/contacts/"+ o.id +"/timeperiods/options/");

    timeperiodForm.select({
        name: "timeperiod_id",
        placeholder: Text.get("schema.timeperiod.attr.name"),
        options: options.options.timeperiod_id,
        selected: options.values.timeperiod_id,
        appendTo: timeperiodForm.form
    });

    timeperiodForm.select({
        name: "type",
        placeholder: Text.get("schema.contact.text.timeperiod_type"),
        options: options.options.type,
        selected: options.values.type,
        appendTo: timeperiodForm.form,
        getValueName: function(value) {
            return Text.get("schema.contact.text.timeperiod_type_"+ value);
        }
    });

    timeperiodForm.select({
        name: "timezone",
        placeholder: Text.get("word.Timezone"),
        options: options.options.timezone,
        selected: options.values.timezone,
        appendTo: timeperiodForm.form
    });

    timeperiodForm.button({
        css: { "margin-right": "10px" },
        text: Text.get("action.add"),
        appendTo: timeperiodForm.form,
        onSuccess: function() { timeperiodTable.getData() }
    });         

    timeperiodTable.create();
};

Bloonix.getContactFormElements = function() {
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
            element: "input",
            type: "email",
            name: "mail_to",
            text: Text.get("schema.contact.attr.mail_to"),
            desc: Text.get("schema.contact.desc.mail_to"),
            maxlength: 100,
            required: true
        },{
            element: "radio-yes-no",
            name: "mail_notifications_enabled",
            text: Text.get("schema.contact.attr.mail_notifications_enabled"),
            desc: Text.get("schema.contact.desc.mail_notifications_enabled"),
            required: true
        },{
            element: "checkbox",
            name: "mail_notification_level",
            text: Text.get("schema.contact.attr.mail_notification_level"),
            desc: Text.get("schema.contact.desc.mail_notification_level"),
            commaSeparatedList: true,
            required: true
        },{
            element: "input",
            type: "tel",
            name: "sms_to",
            text: Text.get("schema.contact.attr.sms_to"),
            desc: Text.get("schema.contact.desc.sms_to"),
            maxlength: 100
        },{
            element: "radio-yes-no",
            name: "sms_notifications_enabled",
            text: Text.get("schema.contact.attr.sms_notifications_enabled"),
            desc: Text.get("schema.contact.desc.sms_notifications_enabled"),
            required: true
        },{
            element: "checkbox",
            name: "sms_notification_level",
            text: Text.get("schema.contact.attr.sms_notification_level"),
            desc: Text.get("schema.contact.desc.sms_notification_level"),
            commaSeparatedList: true,
            required: true
        },{
            element: "select",
            name: "escalation_level",
            text: Text.get("schema.contact.attr.escalation_level"),
            desc: Text.get("schema.contact.desc.escalation_level"),
            getValueName: function(value) {
                if (value == 0) {
                    return Text.get("schema.contact.text.escalation_level_event.0");
                }
                if (value == 1) {
                    return Text.get("schema.contact.text.escalation_level_event.1");
                }
                return Text.get("schema.contact.text.escalation_level_event.x", value);
            },
            required: true
        }
    ];
};
