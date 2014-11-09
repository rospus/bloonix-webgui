var Autocomplete = function(o) {
    Utils.extend(this, o);
};

Autocomplete.prototype = {
    placeholder: "",
    requiredMarkerClass: "rwb",
    required: false,
    containerClass: "select-container",
    inputClass: false,
    listClass: false,
    loadingClass: "loading-small",
    format: "default",
    url: false,
    source: false,
    postdata: false,
    appendTo: false,
    callback: false,
    onClick: false,
    onKeyUp: false,
    start: 0
};

Autocomplete.prototype.getContainerClass = function() {
    return this.containerClass;
};

Autocomplete.prototype.getInputClass = function() {
    return this.inputClass || "input input-"+ this.format;
};

Autocomplete.prototype.getListClass = function() {
    return this.listClass || "select-list-"+ this.format;
};

Autocomplete.prototype.getBorderMarkerClass = function() {
    return this.requiredMarkerClass;
};

Autocomplete.prototype.getLoadingClass = function() {
    return this.loadingClass;
};

Autocomplete.prototype.create = function() {
    var self = this;

    if (this.input == undefined) {
        this.selectContainer = Utils.create("div")
            .addClass(this.getContainerClass());

        if (this.appendTo != undefined) {
            this.selectContainer.appendTo(this.appendTo);
        }

        this.input = Utils.create("input")
            .attr("placeholder", this.placeholder)
            .addClass(this.getInputClass())
            .appendTo(this.selectContainer);
    } else if (this.container) {
        this.selectContainer = this.container;
        this.container.addClass(this.getContainerClass());
    }

    if (this.required == true) {
        this.input.addClass(this.getBorderMarkerClass());
    }

    this.result = Utils.create("ul")
        .addClass(this.getListClass())
        .appendTo(this.selectContainer);

    $(this.input).blur(
        function(){
            setTimeout(function() { $(self.result).fadeOut(200) }, 200);
        }
    );

    $(this.input).focus(
        function() {
            if (self.input.val().length > self.start) {
                self.showResult();
            } else if (self.input.val().length == 0 && self.start == 0) {
                self.search();
            }
        }
    );

    $(this.input).keyup(
        function() {
            if (self.selected != undefined && self.selected != self.input.val()) {
                self.input.attr("data-value", "");
                delete self.selected;
                if (self.required == true) {
                    self.input.addClass(self.getBorderMarkerClass());
                }
            }
            if (self.input.val().length > self.start && self.input.val() != self.selected) {
                if (self.onKeyUp) {
                    self.onKeyUp(self.input.val());
                }
                self.search();
            }
        }
    );
};

Autocomplete.prototype.search = function() {
    if (this.url) {
        this.filterRequest();
    } else if (this.source) {
        this.filterSource();
    }
};

Autocomplete.prototype.filterRequest = function() {
    var self = this;

    if (this.postdata == undefined) {
        this.postdata = { };
    }

    this.postdata.search = this.input.val();
    this.input.addClass(this.getLoadingClass());

    Ajax.post({
        url: this.url,
        data: this.postdata,
        success: function(data) {
            self.input.removeClass(self.getLoadingClass());
            self.result.html("");
            $.each(data.data, function(i, elem) {
                var li = self.callback(elem);
                var name = li.data("name");
                var value = li.data("value");
                if (name == undefined) {
                    name = value;
                }
                self.addOnClickEvent(li, name, value);
                li.appendTo(self.result);
            });
            self.showResult();
        }
    });
};

Autocomplete.prototype.filterSource = function() {
    var self = this;

    var search = this.input.val() || "";
    var regex = new RegExp(search);
    self.result.html("");

    $.each(this.source, function(i, str) {
        if (regex.test(str)) {
            var li = Utils.create("li").text(str).appendTo(self.result);
            self.addOnClickEvent(li, str, str);
        }
    });

    this.showResult();
};

Autocomplete.prototype.addOnClickEvent = function(li, name, value) {
    var self = this;

    li.click(function() {
        self.result.fadeOut(200);
        self.input.val(name);
        self.input.attr("data-value", value);
        self.selected = value;
        if (self.required == true) {
            self.input.removeClass(self.getBorderMarkerClass());
        }
        if (self.onClick) {
            self.onClick(name, value);
        }
    });

    li.css({ cursor: "pointer" });
};

Autocomplete.prototype.showResult = function() {
    if (this.result.find("li").length > 0) {
        this.result.fadeIn(400);
    }
};
