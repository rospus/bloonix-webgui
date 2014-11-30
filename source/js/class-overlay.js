var Overlay = function(o) {
    Utils.extend(this, o);
};

Overlay.prototype = {
    outerClass: "overlay-outer",
    innerClass: "overlay-inner",
    titleClass: "overlay-title",
    contentClass: "overlay-content",
    buttonsClass: "overlay-buttons",
    buttonClass: "btn btn-white btn-medium",
    title: false,
    content: false,
    buttons: false,
    closeText: Text.get("action.close"),
    showCloseButton: true,
    width: false,
    height: false,
    visible: false
};

Overlay.prototype.create = function() {
    if ($("#overlay").length) {
        $("#overlay").remove();
    }

    var self = this;

    this.outerContainer = Utils.create("div")
        .attr("id", "overlay")
        .addClass(this.outerClass);

    this.innerContainer = Utils.create("div")
        .addClass(this.innerClass)
        .appendTo(this.outerContainer);

    if (this.width) {
        this.innerContainer.css({ width: this.width });
    }
    if (this.height) {
        this.innerContainer.css({ height: this.height });
    }

    this.titleContainer = Utils.create("div")
        .addClass(this.titleClass)
        .appendTo(this.innerContainer);

    if (this.title) {
        this.titleContainer.html(this.title)
    }

    var contentContainer = Utils.create("div")
        .addClass(this.contentClass)
        .html(this.content)
        .appendTo(this.innerContainer);

    if (this.visible) {
        contentContainer.css({ overflow: "visible" });
    }

    var buttonContainer = Utils.create("div")
        .addClass(this.buttonsClass)
        .appendTo(this.innerContainer);

    if (this.buttons) {
        $.each(this.buttons, function(i, item) {
            Utils.create("div")
                .addClass(self.buttonClass)
                .html(item.content)
                .click(function() {
                    item.callback(item.content, self);
                    if (item.close != false) {
                        self.close();
                    }
                }).appendTo(buttonContainer);
        });
    }

    if (this.closeText == undefined) {
        this.closeText = Text.get("action.close");
    }

    if (this.showCloseButton) {
        var closeButton = Utils.create("div")
            .addClass(this.buttonClass)
            .html(this.closeText)
            .appendTo(buttonContainer);
    
        closeButton.click(function(){
            self.close();
        })
    }

    this.outerContainer.appendTo("body");
    this.outerContainer.fadeIn(400);
    this.innerContainer.fadeIn(400);
    return this;
};

Overlay.prototype.setWidth = function(width) {
    this.innerContainer.css({ width: width });
};

Overlay.prototype.setHeight = function(height) {
    this.innerContainer.css({ height: height });
};

Overlay.prototype.close = function() {
    var self = this;
    this.innerContainer.fadeOut(400);
    this.outerContainer.fadeOut(400);
    setTimeout(function() { self.outerContainer.remove() }, 400);
    if (self.closeCallback) {
        self.closeCallback();
    }
};
