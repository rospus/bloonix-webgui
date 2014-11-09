var Menu = function(o) {
    Utils.extend(this, o);
};

Menu.prototype = {
    title: false,
    titleClass: "menu-title",
    content: false,
    appendTo: false,
    iconBaseClass: "hicons-gray hicons",
    iconUpClass: "chevron-up",
    iconDownClass: "chevron-down",
    showDelay: 500,
    hideDelay: 500,
    hide: true
};

Menu.prototype.create = function() {
    var self = this;

    this.outerContainer = Utils.create("div");

    this.titleContainer = Utils.create("div")
        .addClass(this.titleClass)
        .appendTo(this.outerContainer);

    this.contentContainer = Utils.create("div")
        .html(this.content)
        .appendTo(this.outerContainer);

    this.icon = Utils.create("div")
        .addClass(this.iconBaseClass)
        .appendTo(this.titleContainer);

    this.title = Utils.create("span")
        .css({ display: "inline-block", padding: "0 0 0 6px" })
        .html(this.title)
        .appendTo(this.titleContainer);

    this.title.click(function() {
        if (self.hide == true) {
            self.contentContainer.show(self.showDelay);
            self.hide = false;
            self.icon.addClass(self.iconUpClass);
            self.icon.removeClass(self.iconDownClass);
        } else {
            self.contentContainer.hide(self.hideDelay);
            self.hide = true;
            self.icon.addClass(self.iconDownClass);
            self.icon.removeClass(self.iconUpClass);
        }
    });

    if (this.hide == true) {
        this.icon.addClass(this.iconDownClass);
        this.contentContainer.hide();
    } else {
        this.icon.addClass(this.iconUpClass);
    }

    if (this.appendTo) {
        this.outerContainer.appendTo(this.appendTo);
    }
};

var SimpleMenu = function(o) {
    Utils.extend(this, o);
    this.links = {};
    this.boxes = {};
    this.active = false;
};

SimpleMenu.prototype = {
    baseClass: "simple-menu",
    linkClass: "simple-menu-link",
    activeClass: "simple-menu-active",
    separatorClass: "simple-menu-separator",
    appendTo: false,
    callback: false,
    store: false
};

SimpleMenu.prototype.create = function() {
    var self = this;
    this.container = Utils.create("div")
        .addClass(this.baseClass);

    if (this.appendTo) {
        this.container.appendTo(this.appendTo);
    }

    if (this.items) {
        $.each(items, function(i, item) {
            self.add(item);
        });
    }

    return this;
};

SimpleMenu.prototype.add = function(item) {
    var self = this;

    if (Utils.objectSize(this.boxes) > 0) {
        Utils.create("span")
            .addClass(this.separatorClass)
            .text("|")
            .appendTo(this.container);
    }

    var link = Utils.create("span")
        .addClass(this.linkClass)
        .html(item.text)
        .appendTo(this.container)
        .click(function() { self.switchItem(item.value) });

    if (item.show == true) {
        item.container.show();
        this.active = item.value;
        link.addClass(this.activeClass);
        if (this.store) {
            this.store.to[this.store.as] = item.value;
        }
    } else {
        item.container.hide();
    }

    this.links[item.value] = link;
    this.boxes[item.value] = item.container;
};

SimpleMenu.prototype.switchItem = SimpleMenu.prototype.switchTo = function(value) {
    if (this.active == value) {
        return;
    }
    this.boxes[this.active].hide(200);
    this.links[this.active].removeClass(this.activeClass);
    this.links[value].addClass(this.activeClass);
    this.boxes[value].show(200);
    this.active = value;
    if (this.store) {
        this.store.to[this.store.as] = value;
    }
    if (this.callback) {
        this.callback(value);
    }
};
