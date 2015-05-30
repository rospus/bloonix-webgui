var Header = function(o) {
    Utils.extend(this, o);
};

Header.prototype = {
    appendTo: "#content",
    title: false,
    sidetitle: false,
    subtitle: false,
    notice: false,
    pager: false,
    search: false,
    border: false,
    headerClass: "header",
    sidetitleClass: "sidetitle",
    pagerClass: "pager",
    css: false,
    rbox: true,
    replace: false
};

Header.prototype.create = function() {
    var self = this;

    if (this.replace === true) {
        $(this.appendTo).html("");
    }

    this.outer = Utils.create("div")
        .addClass(this.headerClass)
        .appendTo(this.appendTo);

    if (this.css) {
        this.outer.css(this.css);
    }

    //if (this.border) {
    //    this.outer.addClass("border");
    //}

    if (this.title) {
        var title = this.title;
        this.title = Utils.create("h1").appendTo(this.outer);

        if (typeof title == "object") {
            this.title.html( $(title).clone() );
        } else {
            this.title.html(title);
        }
    }

    if (this.smallSubTitle) {
        Utils.create("br").appendTo(this.title);
        Utils.create("small").html(this.smallSubTitle).appendTo(this.title);
    }

    if (this.sidetitle) {
        var sidetitle = Utils.create("span").appendTo(this.title);
        Utils.create("span").html(" (").appendTo(sidetitle);
        Utils.create("span").html(this.sidetitle).appendTo(sidetitle);
        Utils.create("span").html(")").appendTo(sidetitle);
        this.sidetitle = sidetitle;
    }

    if (this.pager == true) {
        this.pager = Utils.create("div")
            .addClass("pager")
            .css({ width: "34%", float: "left" })
            .appendTo(this.outer);
    }

    if (this.rbox === true) {
        this.rbox = Utils.create("div")
            .addClass("rbox")
            .appendTo(this.outer);
    } else {
        // correction for sideBySideBoxes if no buttons exists in the right box
        //this.outer.css({ "padding-bottom": "3px" });
    }

    if (typeof this.pager == "object") {
        this.title.css({ width: "33%" });
        this.pager.css({ width: "34%" });
        this.rbox.css({ width: "33%" });
    } else if (this.rbox === true) {
        this.title.css({ width: "60%" });
        this.rbox.css({ width: "40%" });
    }

    if (this.search) {
        this.search = Utils.create("div")
            .addClass("search")
            .appendTo(this.rbox);
    }

    if (this.icons) {
        $.each(this.icons, function(i, e) {
            var icon = Utils.create("span")
                .css({ float: "right", cursor: "pointer" });

            if (e.type == "create") {
                icon.addClass("gicons-gray gicons circle-plus");
            } else if (e.type == "configure") {
                icon.addClass("gicons-gray gicons cogwheels");
            } else if (e.type == "go-back") {
                icon.addClass("gicons-gray gicons left-arrow");
            } else if (e.type == "help") {
                icon.addClass("gicons-gray gicons circle-question-mark");
            } else if (e.type == "reload") {
                icon.addClass("gicons-gray gicons refresh");
            }

            if (e.title != undefined) {
                icon.attr("title", e.title);
                icon.tooltip();
            }

            if (e.url) {
                Utils.create("a")
                    .attr("href", e.url)
                    .html(icon)
                    .appendTo(self.rbox);
            } else if (e.callback) {
                icon.click(e.callback);
                icon.appendTo(self.rbox);
            }
        });
    }

    if (this.counter) {
        this.counterObject = Utils.create("div")
            .attr("title", Text.get("action.show_selected_objects"))
            .addClass("btn btn-white btn-small")
            .html("0")
            .appendTo(this.rbox)
            .tooltip();
    }

    Utils.create("div")
        .addClass("clear")
        .appendTo(this.outer);

    if (this.subtitle) {
        this.subtitle = Utils.create("h3")
            .html(this.subtitle)
            .appendTo(this.outer);
    }

    if (this.notice) {
        this.notice = Utils.create("h4")
            .html(this.notice)
            .appendTo(this.outer);
    }

    return this;
};

Header.prototype.setTitle = function(title) {
    this.title.html(title);
};

Header.prototype.setSidetitle = function(title) {
    this.sidetitle.html(title);
};

Header.prototype.setSubtitle = function(title) {
    this.subtitle.html(title);
};

Header.prototype.setNotice = function(title) {
    this.notice.html(title);
};
