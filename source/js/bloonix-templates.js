Bloonix.listHostTemplates = function(o) {
    Bloonix.setTitle("schema.host_template.text.list");

    var table = new Table({
        url: "/templates/hosts/",
        header: {
            title: Text.get("schema.host_template.text.list"),
            pager: true,
            search: true,
            icons: [
                {
                    type: "help",
                    callback: function() { Utils.open("/#help/host-templates") },
                    title: Text.get("site.help.doc.host-templates")
                },{
                    type: "create",
                    callback: function() { Bloonix.route.to("monitoring/templates/create") },
                    title: Text.get("schema.host_template.text.create")
                }
            ]
        },
        searchable: {
            url: "/templates/hosts/search/",
            result: [ "name", "description" ]
        },
        deletable: {
            title: Text.get("schema.host_template.text.delete"),
            url: "/templates/hosts/:id/delete",
            result: [ "id", "name", "description" ]
        },
        reloadable: true,
        rowHoverIcons: [{
            title: Text.get("schema.host_template.text.clone"),
            icon: "share",
            onClick: function(row) {
                var content = Utils.create("div"),
                    overlay = new Overlay();

                var form = new Form({
                    format: "medium",
                    url: { submit: "/templates/hosts/"+ row.id +"/clone" },
                    onSuccess: function() { overlay.close(); Bloonix.route.to("monitoring/templates") },
                    appendTo: content,
                    showButton: false,
                    elements: [
                        {
                            element: "input",
                            type: "text",
                            name: "name",
                            text: Text.get("schema.host_template.attr.name"),
                            desc: Text.get("schema.host_template.desc.name"),
                            maxlength: 100
                        },{
                            element: "input",
                            type: "text",
                            name: "description",
                            text: Text.get("schema.host_template.attr.description"),
                            desc: Text.get("schema.host_template.desc.description"),
                            maxlength: 100
                        }
                    ]
                }).create();

                overlay.title = Text.get("schema.host_template.text.clone_title", row.name, true),
                overlay.content = content,
                overlay.buttons = [{
                    content: Text.get("action.clone"),
                    callback: function() { form.submit() },
                    close: false
                }];
                overlay.create();
            }
        }],
        columns: [
            {
                name: "id",
                text: Text.get("schema.host_template.attr.id"),
                hide: true
            },{
                name: "name",
                text: Text.get("schema.host_template.attr.name"),
                call: function(row) { return Bloonix.call("monitoring/templates/"+ row.id, row.name) }
            },{
                name: "description",
                text: Text.get("schema.host_template.attr.description")
            }
        ]
    });

    table.create();
};

Bloonix.createHostTemplate = function() {
    var template = Bloonix.get("/templates/hosts/options");

    Bloonix.setTitle("schema.host_template.text.create");
    new Header({ title: Text.get("schema.host_template.text.create") }).create();

    new Form({
        url: { submit: "/templates/hosts/create" },
        action: "create",
        onSuccess: function(result) { Bloonix.route.to("monitoring/templates/"+ result.id) },
        values: template.values,
        options: template.options,
        elements: Bloonix.getHostTemplateFormElements()
    }).create();
};

Bloonix.editHostTemplate = function(o) {
    Bloonix.showTemplateSubNavigation("settings", o.id);
    var template = Bloonix.get("/templates/hosts/"+ o.id +"/options");

    Bloonix.setTitle("schema.host_template.text.view", template.values.name);
    new Header({ title: Text.get("schema.host_template.text.view", template.values.name, true) }).create();

    new Form({
        url: { submit: "/templates/hosts/"+ o.id +"/update" },
        title: Text.get("schema.host_template.attr.id") +": "+ o.id,
        action: "update",
        values: template.values,
        options: template.options,
        elements: Bloonix.getHostTemplateFormElements()
    }).create();
};

Bloonix.getHostTemplateFormElements = function() {
    return [
        {
            element: "input",
            type: "text",
            name: "name",
            text: Text.get("schema.host_template.attr.name"),
            desc: Text.get("schema.host_template.desc.name"),
            maxlength: 100
        },{
            element: "input",
            type: "text",
            name: "description",
            text: Text.get("schema.host_template.attr.description"),
            desc: Text.get("schema.host_template.desc.description"),
            maxlength: 100
        },{
            element: "textarea",
            name: "variables",
            text: Text.get("schema.host.attr.variables"),
            desc: Text.get("schema.host.desc.variables")
        }
    ];
};

Bloonix.listHostTemplateServices = function(o) {
    Bloonix.showTemplateSubNavigation("services", o.id);
    var template = Bloonix.get("/templates/hosts/"+ o.id);
    Bloonix.setTitle("schema.host_template.text.view", template.name);

    new Table({
        url: "/templates/hosts/"+ o.id +"/services",
        header: {
            title: Text.get("schema.host_template.text.view", template.name, true),
            icons: [{
                type: "create",
                callback: function() { Bloonix.route.to("monitoring/templates/"+ o.id +"/services/create") },
                title: Text.get("schema.service.text.create")
            }]
        },
        deletable: {
            title: Text.get("schema.host_template.text.delete_service"),
            url: "/templates/hosts/:host_template_id/services/:ref_id/delete",
            result: [ "ref_id", "service_name", "description" ],
            warning: Text.get("schema.host_template.text.delete_service_warning")
        },
        columns: [
            {
                name: "ref_id",
                text: Text.get("schema.service.attr.ref_id"),
                hide: true
            },{
                name: "service_name",
                text: Text.get("schema.service.attr.service_name"),
                call: function(row) { return Bloonix.call("monitoring/templates/"+ o.id +"/services/"+ row.ref_id +"/edit", row.service_name) }
            },{
                name: "plugin",
                text: Text.get("schema.service.attr.plugin")
            },{
                name: "agent_id",
                text: Text.get("schema.service.attr.agent_id")
            },{
                name: "attempt_max",
                text: Text.get("schema.service.attr.attempt_max")
            },{
                name: "host_alive_check",
                text: Text.get("schema.service.text.host_alive_check"),
                bool: "yn"
            }
        ]
    }).create();
};

Bloonix.listHostTemplateMembers = function(o) {
    Bloonix.showTemplateSubNavigation("members", o.id);
    var template = Bloonix.get("/templates/hosts/"+ o.id);

    var form = new Form();

    form.group({
        appendTo: "#content",
        title: Text.get("schema.host_template.text.view", template.name),
        subtitle: Text.get("schema.group.attr.id") +": "+ template.id,
        left: {
            title: Text.get("schema.group.text.host_members"),
            listURL: "/templates/hosts/"+ o.id +"/members/list/",
            searchURL: "/templates/hosts/"+ o.id +"/members/list/",
            updateMember: "/templates/hosts/"+ o.id +"/members/remove/"
        },
        right: {
            title: Text.get("schema.group.text.host_nonmembers"),
            listURL: "/templates/hosts/"+ o.id +"/members/list-non/",
            searchURL: "/templates/hosts/"+ o.id +"/members/list-non/",
            updateMember: "/templates/hosts/"+ o.id +"/members/add/"
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
            title: Text.get("schema.host_template.text.selected_hosts"),
            result: [ "id", "hostname", "ipaddr" ]
        },
        searchable: {
            result: [ "id", "hostname", "ipaddr" ]
        }
    });
};

Bloonix.getTemplateById = function(id) {
    return Bloonix.get("/templates/hosts/"+ id);
};
