Bloonix.editCompanyVariables = function(o) {
    Bloonix.setTitle("schema.company.text.edit_variables");

    new Header({
        title: Text.get("schema.company.text.edit_variables"),
        icons: [
            {
                type: "help",
                callback: function() { Utils.open("/#help/host-variables") },
                title: Text.get("site.help.doc.host-variables")
            }
        ]
    }).create();

    var variables = Bloonix.get("/administration/variables");

    new Form({
        url: { submit: "/administration/variables/update" },
        buttonText: Text.get("action.update"),
        values: { variables: variables },
        elements: [{
            element: "textarea",
            name: "variables",
            text: Text.get("schema.company.attr.variables"),
            desc: Text.get("schema.company.desc.variables"),
            maxlength: 50000
        }]
    }).create();
};
