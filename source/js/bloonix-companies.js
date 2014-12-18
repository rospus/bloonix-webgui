Bloonix.listCompanies = function() {
    Bloonix.setTitle("schema.company.text.list");

    new Table({
        url: "/administration/companies",
        header: {
            title: Text.get("schema.company.text.list"),
            pager: true,
            search: true,
            icons: [{
                type: "create",
                callback: function() { Bloonix.route.to("administration/companies/create") },
                title: Text.get("schema.company.text.create")
            }]
        },
        searchable: {
            url: "/administration/companies/search/",
            result: [
                "id", "alt_company_id", "company", "title", "name",
                "surname", "zipcode", "city", "country", "email"
            ]
        },
        deletable: {
            title: Text.get("schema.company.text.delete"),
            url: "/administration/companies/:id/delete/",
            result: [ "id", "alt_company_id", "company" ]
        },
        sortable: true,
        reloadable: true,
        columnSwitcher: true,
        columns: [
            {
                name: "id",
                text: Text.get("schema.company.attr.id"),
                hide: true
            },{
                name: "alt_company_id",
                text: Text.get("schema.company.attr.alt_company_id"),
                hide: true
            },{
                name: "company",
                text: Text.get("schema.company.attr.company"),
                call: function(row) { return Bloonix.call("administration/companies/"+ row.id +"/edit", row.company) }
            },{
                name: "sla",
                text: Text.get("schema.company.attr.sla"),
                prefix: Text.get("schema.company.attr.sla"),
                wrapNameValueClass: true
            },{
                name: "email",
                text: Text.get("schema.company.attr.email")
            },{
                name: "count_hosts_services",
                text: Text.get("word.Hosts") + "/" + Text.get("word.Services"),
                sortable: false
            },{
                name: "title",
                text: Text.get("schema.company.attr.title"),
                hide: true
            },{
                name: "name",
                text: Text.get("schema.company.attr.name")
            },{
                name: "surname",
                text: Text.get("schema.company.attr.surname"),
                hide: true
            },{
                name: "address1",
                text: Text.get("schema.company.attr.address1"),
                hide: true
            },{
                name: "address2",
                text: Text.get("schema.company.attr.address2"),
                hide: true
            },{
                name: "zipcode",
                text: Text.get("schema.company.attr.zipcode"),
                hide: true
            },{
                name: "city",
                text: Text.get("schema.company.attr.city"),
                hide: true
            },{
                name: "state",
                text: Text.get("schema.company.attr.state"),
                hide: true
            },{
                name: "country",
                text: Text.get("schema.company.attr.country"),
                hide: true
            },{
                name: "phone",
                text: Text.get("schema.company.attr.phone"),
                hide: true
            },{
                name: "fax",
                text: Text.get("schema.company.attr.fax"),
                hide: true
            },{
                name: "active",
                text: Text.get("schema.company.attr.active"),
                bool: "yn"
            },{
                name: "max_services",
                text: Text.get("schema.company.attr.max_services")
            },{
                name: "sms_enabled",
                text: Text.get("schema.company.attr.sms_enabled"),
                bool: "yn"
            },{
                name: "comment",
                text: Text.get("schema.company.attr.comment"),
                hide: true
            }
        ]
    }).create();
};

Bloonix.editCompany = function(o) {
    var company = Bloonix.get("/administration/companies/"+ o.id +"/options/");

    new Header({ title: Text.get("schema.company.text.view", company.values.company, true) }).create();
    Bloonix.setMetaTitle(Text.get("schema.company.text.view", company.values.company));

    new Form({
        url: { submit: "/administration/companies/"+ o.id +"/update/" },
        buttonText: Text.get("action.update"),
        values: company.values,
        options: company.options,
        elements: Bloonix.getCompanyFormElements()
    }).create();
};

Bloonix.createCompany = function() {
    var company = Bloonix.get("/administration/companies/options/");

    new Header({ title: Text.get("schema.company.text.create") }).create();
    Bloonix.setTitle("schema.company.text.create");

    new Form({
        url: { submit: "/administration/companies/create/" },
        buttonText: Text.get("action.create"),
        values: company.values,
        options: company.options,
        elements: Bloonix.getCompanyFormElements()
    }).create();
};

Bloonix.getCompanyFormElements = function() {
    return [
        {
            element: "input",
            type: "text",
            name: "alt_company_id",
            text: Text.get("schema.company.attr.alt_company_id"),
            maxlength: 64,
            required: true
        },{
            element: "input",
            type: "text",
            name: "company",
            text: Text.get("schema.company.attr.company"),
            maxlength: 100,
            required: true
        },{
            element: "select",
            name: "sla",
            text: Text.get("schema.company.attr.sla")
        },{
            element: "input",
            type: "email",
            name: "email",
            text: Text.get("schema.company.attr.email"),
            maxlength: 100,
            required: true
        },{
            element: "input",
            type: "text",
            name: "title",
            text: Text.get("schema.company.attr.title"),
            maxlength: 30
        },{
            element: "input",
            type: "text",
            name: "name",
            text: Text.get("schema.company.attr.name"),
            maxlength: 100
        },{
            element: "input",
            type: "text",
            name: "surname",
            text: Text.get("schema.company.attr.surname"),
            maxlength: 100
        },{
            element: "input",
            type: "text",
            name: "address1",
            text: Text.get("schema.company.attr.address1"),
            maxlength: 100
        },{
            element: "input",
            type: "text",
            name: "address2",
            text: Text.get("schema.company.attr.address2"),
            maxlength: 100
        },{
            element: "input",
            type: "text",
            name: "zipcode",
            text: Text.get("schema.company.attr.zipcode"),
            maxlength: 20
        },{
            element: "input",
            type: "text",
            name: "city",
            text: Text.get("schema.company.attr.city"),
            maxlength: 100
        },{
            element: "input",
            type: "text",
            name: "state",
            text: Text.get("schema.company.attr.state"),
            maxlength: 100
        },{
            element: "input",
            type: "text",
            name: "country",
            text: Text.get("schema.company.attr.country"),
            maxlength: 100
        },{
            element: "input",
            type: "tel",
            name: "phone",
            text: Text.get("schema.company.attr.phone"),
            maxlength: 100
        },{
            element: "input",
            type: "tel",
            name: "fax",
            text: Text.get("schema.company.attr.fax"),
            maxlength: 100
        },{
            element: "radio-yes-no",
            name: "active",
            text: Text.get("schema.company.attr.active"),
            description: Text.get("schema.company.desc.active")
        },{
            element: "input",
            type: "text",
            name: "max_services",
            text: Text.get("schema.company.attr.max_services"),
            description: Text.get("schema.company.desc.max_services"),
            maxlength: 6
        },{
            element: "radio-yes-no",
            name: "sms_enabled",
            text: Text.get("schema.company.attr.sms_enabled")
        },{
            element: "textarea",
            name: "comment",
            text: Text.get("schema.company.attr.comment"),
            maxlength: 500
        }
    ];
};
