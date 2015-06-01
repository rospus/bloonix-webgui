Bloonix.editHostTemplates = function(o) {
    var contentContainer = $("#content"),
        host = Bloonix.getHost(o.id),
        data = Bloonix.get("/hosts/"+ o.id +"/templates");

    Bloonix.showHostSubNavigation(
        "templates",
        host.id,
        host.hostname
    );

    var boxes = Bloonix.createSideBySideBoxes({
        container: contentContainer,
        width: "500px"
    });

    new Header({
        title: Text.get("schema.host.text.list_templates", host.hostname, true),
        appendTo: boxes.left,
        rbox: false
    }).create();

    new Table({
        appendTo: boxes.left,
        deletable: {
            title: Text.get("schema.host.action.remove_template"),
            url: "/hosts/"+ o.id +"/templates/remove/:id",
            result: [ "id", "name", "description" ],
            warning: Text.get("schema.host.text.remove_template_warning"),
            successCallback: function() { Bloonix.route.to("monitoring/hosts/"+ o.id +"/templates") }
        },
        values: data.is_member_in,
        columns: [
            {
                name: "id",
                text: Text.get("schema.host_template.attr.id"),
                hide: true
            },{
                name: "name",
                text: Text.get("schema.host_template.attr.name"),
                call: function(row) { return Bloonix.call("monitoring/templates/"+ row.id +"/services", row.name) }
            },{
                name: "description",
                text: Text.get("schema.host_template.attr.description")
            }
        ]
    }).create();

    new Header({
        title: Text.get("schema.host.text.templates_not_assigned"),
        appendTo: boxes.right
    }).create();

    var options = [];
    $.each(data.is_not_member_in, function(i, row) {
        options.push({
            name: row.name,
            value: row.id
        });
    });

    var form = new Form({
        appendTo: boxes.right,
        url: { submit: "/hosts/"+ o.id +"/templates/add" },
        onSuccess: function() { Bloonix.route.to("monitoring/hosts/"+ o.id +"/templates") }
    }).init();

    form.multiselect({
        name: "host_template_id",
        size: 10,
        options: options,
        appendTo: form.getContainer()
    });

    form.button({
        appendTo: form.getContainer(),
        text: Text.get("action.add")
    });
};
