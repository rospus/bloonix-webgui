Bloonix.listContactgroups = function(o) {
    Bloonix.setTitle("schema.contactgroup.text.list");

    var table = new Table({
        url: "/contactgroups",
        header: {
            title: Text.get("schema.contactgroup.text.list"),
            pager: true,
            search: true,
            icons: [
                {
                    type: "help",
                    callback: function() { Utils.open("/#help/contacts-and-notifications") },
                    title: Text.get("site.help.doc.contacts-and-notifications")
                },{
                    type: "create",
                    callback: function() { Bloonix.route.to("notification/contactgroups/create") },
                    title: Text.get("schema.contactgroup.text.create")
                }
            ]
        },
        searchable: {
            url: "/contactgroups/search",
            result: [ "name", "description" ]
        },
        deletable: {
            title: Text.get("schema.contactgroup.text.delete"),
            url: "/contactgroups/:id/delete",
            result: [ "id", "name", "description" ]
        },
        appendTo: "#content",
        reloadable: true,
        columnSwitcher: true,
        columns: [
            {
                name: "id",
                text: Text.get("schema.contactgroup.attr.id"),
                hide: true
            },{
                name: "name",
                text: Text.get("schema.contactgroup.attr.name"),
                call: function(row) { return Bloonix.call("notification/contactgroups/"+ row.id +"/edit", row.name) }
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
                name: "description",
                text: Text.get("schema.contactgroup.attr.description")
            }
        ]
    });

    table.create();
};

Bloonix.createContactgroup = function() {
    Bloonix.setTitle("schema.contactgroup.text.create");

    new Header({
        title: Text.get("schema.contactgroup.text.create"),
        border: true
    }).create();

    new Form({
        url: { submit: "/contactgroups/create" },
        onSuccess: function(result) {
            Bloonix.route.to("notification/contactgroups/"+ result.id +"/edit");
        },
        action: "create",
        elements: Bloonix.getContactgroupFormElements()
    }).create();
};

Bloonix.editContactgroup = function(o) {
    Bloonix.setTitle("schema.contactgroup.text.settings");
 
    o.contactgroup = Bloonix.getContactgroup(o.id);
    Bloonix.showContactgroupSubNavigation();
    Bloonix.createContactgroupForm(o);
    Bloonix.createContactgroupContactMemberForm(o);
    Bloonix.createContactgroupHostMemeberForm(o);
    Bloonix.createContactgroupServiceMemberForm(o);
};

Bloonix.createContactgroupForm = function(o) {
    new Header({
        title: Text.get("schema.contactgroup.text.settings"),
        border: true,
        appendTo: "#int-contactgroup-form"
    }).create();

    new Form({
        url: { submit: "/contactgroups/"+ o.id +"/update" },
        action: "update",
        values: o.contactgroup,
        elements: Bloonix.getContactgroupFormElements(),
        appendTo: "#int-contactgroup-form"
    }).create();
};

Bloonix.createContactgroupContactMemberForm = function(o) {
    new Header({
        title: Text.get("schema.contactgroup.text.contact_members"),
        border: true,
        appendTo: "#int-contact-form",
    }).create();

    var form = new Form();

    form.group({
        appendTo: "#int-contact-form",
        title: Text.get("schema.contactgroup.text.group_members", o.contactgroup.name),
        subtitle: Text.get("schema.contactgroup.attr.id") +": "+ o.id,
        left: {
            title: Text.get("schema.contactgroup.text.host_members"),
            listURL: "/contactgroups/"+ o.id +"/contacts/in-group",
            searchURL: "/contactgroups/"+ o.id +"/contacts/in-group",
            updateMember: "/contactgroups/"+ o.id +"/contacts/remove"
        },
        right: {
            title: Text.get("schema.contactgroup.text.host_nonmembers"),
            listURL: "/contactgroups/"+ o.id +"/contacts/not-in-group",
            searchURL: "/contactgroups/"+ o.id +"/contacts/not-in-group",
            updateMember: "/contactgroups/"+ o.id +"/contacts/add"
        },
        columns: [
            {
                name: "id",
                text: Text.get("schema.contact.attr.id")
            },{
                name: "name",
                text: Text.get("schema.contact.attr.name")
            },{
                name: "mail_to",
                text: Text.get("schema.contact.attr.mail_to")
            }
        ],
        selectable: {
            key: "id",
            title: Text.get("schema.contactgroup.text.selected_hosts"),
            result: [ "id", "name", "mail_to" ]
        },
        searchable: {
            result: [ "id", "name", "mail_to" ]
        }
    });
};

Bloonix.createContactgroupHostMemeberForm = function(o) {
    new Header({
        title: Text.get("schema.contactgroup.text.host_members"),
        border: true,
        appendTo: "#int-host-form"
    }).create();

    var form = new Form();

    form.group({
        appendTo: "#int-host-form",
        title: Text.get("schema.contactgroup.text.group_members", o.contactgroup.name),
        subtitle: Text.get("schema.group.attr.id") +": "+ o.id,
        left: {
            title: Text.get("schema.contactgroup.text.host_members"),
            listURL: "/contactgroups/"+ o.id +"/hosts/in-group",
            searchURL: "/contactgroups/"+ o.id +"/hosts/in-group",
            updateMember: "/contactgroups/"+ o.id +"/hosts/remove"
        },
        right: {
            title: Text.get("schema.contactgroup.text.host_nonmembers"),
            listURL: "/contactgroups/"+ o.id +"/hosts/not-in-group",
            searchURL: "/contactgroups/"+ o.id +"/hosts/not-in-group",
            updateMember: "/contactgroups/"+ o.id +"/hosts/add"
        },
        columns: [
            {
                name: "id",
                text: Text.get("schema.host.attr.id")
            },{
                name: "hostname",
                text: Text.get("schema.host.attr.hostname")
            },{
                name: "ipaddr",
                text: Text.get("schema.host.attr.ipaddr")
            }
        ],
        selectable: {
            key: "id",
            title: Text.get("schema.contactgroup.text.selected_hosts"),
            result: [ "id", "hostname", "ipaddr" ]
        },
        searchable: {
            result: [ "id", "hostname", "ipaddr" ]
        }
    });
};

Bloonix.createContactgroupServiceMemberForm = function(o) {
    new Header({
        title: Text.get("schema.contactgroup.text.service_members"),
        border: true,
        appendTo: "#int-service-form"
    }).create();

    var form = new Form();

    form.group({
        appendTo: "#int-service-form",
        title: Text.get("schema.contactgroup.text.group_members", o.contactgroup.name),
        subtitle: Text.get("schema.contactgroup.attr.id") +": "+ o.id,
        left: {
            title: Text.get("schema.contactgroup.text.service_members"),
            listURL: "/contactgroups/"+ o.id +"/services/in-group",
            searchURL: "/contactgroups/"+ o.id +"/services/in-group",
            updateMember: "/contactgroups/"+ o.id +"/services/remove"
        },
        right: {
            title: Text.get("schema.contactgroup.text.service_nonmembers"),
            listURL: "/contactgroups/"+ o.id +"/services/not-in-group",
            searchURL: "/contactgroups/"+ o.id +"/services/not-in-group",
            updateMember: "/contactgroups/"+ o.id +"/services/add"
        },
        columns: [
            {
                name: "id",
                text: Text.get("schema.service.attr.id")
            },{
                name: "hostname",
                text: Text.get("schema.host.attr.hostname")
            },{
                name: "service_name",
                text: Text.get("schema.service.attr.service_name")
            }
        ],
        selectable: {
            key: "id",
            title: Text.get("schema.contactgroup.text.selected_services"),
            result: [ "id", "hostname", "service_name" ]
        },
        searchable: {
            result: [ "id", "hostname", "service_name" ]
        }
    });
};

Bloonix.getContactgroupFormElements = function() {
    return [
        {
            element: "input",
            name: "name",
            maxlength: 40,
            text: Text.get("schema.contactgroup.attr.name"),
            desc: Text.get("schema.contactgroup.desc.name"),
            required: true
        },{
            element: "input",
            name: "description",
            maxlength: 100,
            text: Text.get("schema.contactgroup.attr.description"),
            desc: Text.get("schema.contactgroup.desc.description")
        }
    ];
};

Bloonix.getContactgroup = function(id) {
    return Bloonix.get("/contactgroups/" +id);
};
