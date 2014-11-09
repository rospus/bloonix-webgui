var iButton = function(o) {
    Utils.extend(this, o);

    var self = this;

    this.outer = Utils.create("div")
        .addClass("hicons-btn");

    this.icon = Utils.create("div")
        .addClass("hicons info-sign")
        .appendTo(this.outer);

    this.bubble = Utils.create("div")
        .addClass("hicons-bubble")
        .hide()
        .appendTo(this.outer);

    if (this.title) {
        Utils.create("h2")
            .html(this.title)
            .appendTo(this.bubble);
    }

    if (this.desc) {
        Utils.create("p")
            .html(this.desc)
            .appendTo(this.bubble);
    }

    if (this.note) {
        Utils.create("small")
            .html(this.note)
            .appendTo(this.bubble);
    }

    if (this.text) {
        this.bubble.html(this.text);
    }

    if (o.width) {
        this.bubble.css({ width: o.width });
    }

    if (o.css) {
        this.bubble.css(o.css);
    }

    this.bubbleIsVisible = false;

    this.outer.click(function() {
        if (self.bubbleIsVisible == true) {
            self.bubbleIsVisible = false;
            self.bubble.hide();
            self.icon.removeClass("remove");
            self.icon.addClass("info-sign");
        } else {
            self.bubbleIsVisible = true;
            self.bubble.show();
            self.icon.removeClass("info-sign");
            self.icon.addClass("remove");
        }
    });
};

iButton.prototype.appendTo = function(o) {
    this.outer.appendTo(o);
};
