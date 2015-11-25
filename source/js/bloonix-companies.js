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
        columnSwitcher: {
            table: "company",
            callback: Bloonix.saveUserTableConfig,
            config: Bloonix.getUserTableConfig("company")
        },
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
                call: function(row) { return Bloonix.call("administration/companies/"+ row.id +"/edit", row.company) },
                switchable: false
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
    var company = Bloonix.get("/administration/companies/"+ o.id +"/options/"),
        companyName = company.values.company +" ("+ company.values.id +")";

    new Header({ title: Text.get("schema.company.text.view", companyName, true) }).create();
    Bloonix.setMetaTitle(Text.get("schema.company.text.view", companyName));

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
            desc: Text.get("schema.company.desc.active")
        },{
            element: "input",
            type: "text",
            name: "max_templates",
            text: Text.get("schema.company.attr.max_templates"),
            desc: Text.get("schema.company.desc.max_templates"),
            minvalue: 0, maxvalue: 2147483647
        },{
            element: "input",
            type: "text",
            name: "max_hosts",
            text: Text.get("schema.company.attr.max_hosts"),
            desc: Text.get("schema.company.desc.max_hosts"),
            minvalue: 0, maxvalue: 9999999999
        },{
            element: "input",
            type: "text",
            name: "max_services",
            text: Text.get("schema.company.attr.max_services"),
            desc: Text.get("schema.company.desc.max_services"),
            minvalue: 0, maxvalue: 9999999999
        },{
            element: "input",
            type: "text",
            name: "max_services_per_host",
            text: Text.get("schema.company.attr.max_services_per_host"),
            desc: Text.get("schema.company.desc.max_services_per_host"),
            minvalue: 0, maxvalue: 32767
        },{
            element: "input",
            type: "text",
            name: "max_contacts",
            text: Text.get("schema.company.attr.max_contacts"),
            desc: Text.get("schema.company.desc.max_contacts"),
            minvalue: 0, maxvalue: 32767
        },{
            element: "input",
            type: "text",
            name: "max_contactgroups",
            text: Text.get("schema.company.attr.max_contactgroups"),
            desc: Text.get("schema.company.desc.max_contactgroups"),
            minvalue: 0, maxvalue: 32767
        },{
            element: "input",
            type: "text",
            name: "max_timeperiods",
            text: Text.get("schema.company.attr.max_timeperiods"),
            desc: Text.get("schema.company.desc.max_timeperiods"),
            minvalue: 0, maxvalue: 32767
        },{
            element: "input",
            type: "text",
            name: "max_timeslices_per_object",
            text: Text.get("schema.company.attr.max_timeslices_per_object"),
            desc: Text.get("schema.company.desc.max_timeslices_per_object"),
            minvalue: 0, maxvalue: 32767
        },{
            element: "input",
            type: "text",
            name: "max_groups",
            text: Text.get("schema.company.attr.max_groups"),
            desc: Text.get("schema.company.desc.max_groups"),
            minvalue: 0, maxvalue: 32767
        },{
            element: "input",
            type: "text",
            name: "max_users",
            text: Text.get("schema.company.attr.max_users"),
            desc: Text.get("schema.company.desc.max_users"),
            minvalue: 0, maxvalue: 32767
        },{
            element: "input",
            type: "text",
            name: "max_dependencies_per_host",
            text: Text.get("schema.company.attr.max_dependencies_per_host"),
            desc: Text.get("schema.company.desc.max_dependencies_per_host"),
            minvalue: 0, maxvalue: 32767
        },{
            element: "input",
            type: "text",
            name: "max_downtimes_per_host",
            text: Text.get("schema.company.attr.max_downtimes_per_host"),
            desc: Text.get("schema.company.desc.max_downtimes_per_host"),
            minvalue: 0, maxvalue: 32767
        },{
            element: "input",
            type: "text",
            name: "max_chart_views_per_user",
            text: Text.get("schema.company.attr.max_chart_views_per_user"),
            desc: Text.get("schema.company.desc.max_chart_views_per_user"),
            minvalue: 0, maxvalue: 9999999999
        },{
            element: "input",
            type: "text",
            name: "max_charts_per_user",
            text: Text.get("schema.company.attr.max_charts_per_user"),
            desc: Text.get("schema.company.desc.max_charts_per_user"),
            minvalue: 0, maxvalue: 9999999999
        },{
            element: "input",
            type: "text",
            name: "max_metrics_per_chart",
            text: Text.get("schema.company.attr.max_metrics_per_chart"),
            desc: Text.get("schema.company.desc.max_metrics_per_chart"),
            minvalue: 0, maxvalue: 9999999999
        },{
            element: "input",
            type: "text",
            name: "max_dashboards_per_user",
            text: Text.get("schema.company.attr.max_dashboards_per_user"),
            desc: Text.get("schema.company.desc.max_dashboards_per_user"),
            minvalue: 0, maxvalue: 32767
        },{
            element: "input",
            type: "text",
            name: "max_dashlets_per_dashboard",
            text: Text.get("schema.company.attr.max_dashlets_per_dashboard"),
            desc: Text.get("schema.company.desc.max_dashlets_per_dashboard"),
            minvalue: 0, maxvalue: 32767
        },{
            element: "input",
            type: "text",
            name: "max_sms",
            text: Text.get("schema.company.attr.max_sms"),
            desc: Text.get("schema.company.desc.max_sms"),
            minvalue: 0, maxvalue: 9999999999
        },{
            element: "input",
            type: "text",
            name: "data_retention",
            text: Text.get("schema.company.attr.data_retention"),
            desc: Text.get("schema.company.desc.data_retention"),
            minvalue: 0, maxvalue: 32767
        },{
            element: "radio-yes-no",
            name: "sms_enabled",
            text: Text.get("schema.company.attr.sms_enabled")
        },{
            element: "textarea",
            name: "comment",
            text: Text.get("schema.company.attr.comment"),
            maxlength: 500
        },{
            element: "textarea",
            name: "host_reg_authkey",
            text: Text.get("schema.company.attr.host_reg_authkey"),
            desc: Text.get("schema.company.desc.host_reg_authkey"),
            minlength: 60,
            maxlength: 1000,
            genString: 64
        },{
            element: "radio-yes-no",
            name: "host_reg_enabled",
            text: Text.get("schema.company.attr.host_reg_enabled"),
            desc: Text.get("schema.company.desc.host_reg_enabled")
        },{
            element: "input",
            type: "text",
            name: "max_hosts_in_reg_queue",
            text: Text.get("schema.company.attr.max_hosts_in_reg_queue"),
            desc: Text.get("schema.company.desc.max_hosts_in_reg_queue"),
            minvalue: 0, maxvalue: 9999999999
        },{
            element: "textarea",
            name: "host_reg_allow_from",
            text: Text.get("schema.company.attr.host_reg_allow_from"),
            desc: Text.gets(["schema.company.desc.host_reg_allow_from", "text.allow_from_desc"]),
            maxlength: 300
        }
    ];
};
