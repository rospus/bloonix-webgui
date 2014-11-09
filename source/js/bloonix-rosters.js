Bloonix.listRosters = function(o) {
    Bloonix.setTitle("schema.roster.text.list");

    var table = new Table({
        url: "/rosters/list/",
        header: {
            title: Text.get("schema.roster.text.list"),
            pager: true,
            search: true
        },
        selectable: {
            result: [ "roster", "description" ]
        },
        searchable: {
            url: "/rosters/search/",
            result: [ "roster", "description" ]
        },
        appendTo: "#content",
        columnSwitcher: true,
        columns: [
            {
                name: "id",
                text: Text.get("schema.roster.attr.id"),
                hide: true
            },{
                name: "roster",
                text: Text.get("schema.roster.attr.roster"),
                call: function(row) { return Bloonix.call("notification/rosters/"+ row.id +"/edit", row.roster) }
            },{
                name: "company",
                text: Text.get("schema.company.attr.company"),
                call: function(row) { return Bloonix.call("administration/companies/"+ row.company_id +"/edit", row.company) },
                hide: true
            },{
                name: "description",
                text: Text.get("schema.roster.attr.description")
            },{
                name: "active",
                text: Text.get("schema.roster.attr.active"),
                bool: "yn"
            }
        ]
    });

    table.create();
};
