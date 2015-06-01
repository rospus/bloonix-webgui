Bloonix.helpIndex = function(o) {
    var object = Utils.extend({
        appendTo: "#content",
        doc: false
    }, o);

    object.create = function() {
        this.createHeader();
        this.createBoxes();
        this.getIndex();
        this.createIndex();
    };

    object.createHeader = function() {
        this.header = new Header({
            title: Text.get("site.help.title"),
            border: true
        }).create();
    };

    object.createBoxes = function() {
        this.boxes = Bloonix.createSideBySideBoxes({
            container: this.appendTo,
            width: "350px"
        });

        this.indexContainer = this.boxes.left;
        this.documentContainer = Utils.create("div")
            .addClass("help")
            .appendTo(this.boxes.right);
        this.loading = Utils.create("div")
            .addClass("loading")
            .hide()
            .appendTo(this.boxes.right);
    };

    object.getIndex = function() {
        this.index = Bloonix.get("/help");
    };

    object.createIndex = function() {
        var self = this,
            items = [];

        if (!this.doc) {
            this.doc = this.index[0];
        }

        $.each(this.index, function(i, item) {
            items.push({
                name: Text.get("site.help.doc."+ item),
                value: item,
                default: item == self.doc ? true : false
            });
        });

        this.iconList = Bloonix.createIconList({
            items: items,
            appendTo: this.indexContainer,
            button: false,
            callback: function(value) { self.showDocument(value) }
        });

        this.showDocument(this.doc);
    };

    object.showDocument = function(doc) {
        this.documentContainer.hide();
        this.loading.show();
        var html = Bloonix.get("/help/"+ doc);
        this.documentContainer.html(html);
        this.loading.hide();
        $("#content-outer").scrollTop(0);
        this.documentContainer.fadeIn(300);
        this.addClickEventToLinks();
        location.hash = "#help/"+ doc;
    };

    object.addClickEventToLinks = function() {
        var self = this;
        this.documentContainer.find("a").each(function() {
            var id = $(this).data("id");
            $(this).click(function() { self.iconList.switchTo(id) });
        });
    };

    object.create();
    return object;
};
