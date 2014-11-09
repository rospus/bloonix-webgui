var Search = function(o) {
    this.postdata = {};
    this.cache = { lastSearchStringLength: 0 };
    Utils.extend(this, o);
};

Search.prototype = {
    format: "small",
    helpText: Text.get("info.search_syntax"),
    searchValue: "",
    searchKeyLength: 3,
    searchCallback: false,
    submitCallback: false,
    placeholder: Text.get("action.search"),
    inputClass: false,
    resultClass: "search-result",
    resultWidth: false,
    helpClass: "search-help",
    loadingClass: "loading-small",
    appendTo: false
};

Search.prototype.getInputClass = function() {
    return this.inputClass || "input input-"+ this.format;
};

Search.prototype.create = function() {
    var self = this;

    this.appendTo = $(this.appendTo);

    this.appendTo
        .addClass("search");

    this.formContainer = Utils.create("form")
        .appendTo(this.appendTo);

    this.inputContainer = Utils.create("input")
        .attr("placeholder", this.placeholder)
        .attr("value", this.searchValue)
        .addClass(this.getInputClass())
        .appendTo(this.formContainer);

    this.resultContainer = Utils.create("div")
        .addClass(this.resultClass)
        .appendTo(this.appendTo);

    if (this.resultWidth) {
        this.resultContainer.css({ width: this.resultWidth });
    }

    this.resultBubbleContainer = Utils.create("div")
        .addClass("arrow-box-white")
        .html("")
        .appendTo(this.resultContainer);

    this.helpContainer = Utils.create("div")
        .addClass(this.helpClass)
        .appendTo(this.appendTo);

    Utils.create("div")
        .addClass("arrow-box-white")
        .html(this.helpText)
        .appendTo(this.helpContainer);

    Utils.create("div")
        .addClass("clear")
        .appendTo(this.appendTo);

    this.appendTo.hover(
        function(){
            self.inputContainer.addClass("int-is-hover");
            if (self.cache.hasData != 1) {
                self.helpContainer.fadeIn(400);
            }
        },
        function(){
            self.inputContainer.removeClass("int-is-hover");
            if (!self.inputContainer.is(":focus")) {
                self.resultContainer.hide();
            }
            self.helpContainer.hide();
        }
    );

    this.inputContainer.focus(
        function(){
            if (self.cache.hasData == 1) {
                self.resultContainer.show(400);
            } else if (self.inputContainer.val().length == 0) {
                self.helpContainer.fadeIn(400);
            }
        }
    );

    this.inputContainer.blur(
        function(){
            self.helpContainer.hide(400);
            if (!self.inputContainer.hasClass("int-is-hover")) {
                self.resultContainer.hide(400);
            }
        }
    );

    this.inputContainer.keyup(
        function() {
            self.doSearch(false);
        }
    );

    if (this.submitCallback) {
        this.formContainer.submit(function(event) {
            var value = self.inputContainer.val();
            event.preventDefault();
            self.submitCallback(value);
            self.resultContainer.hide();
        });
    }

    return this;
};

Search.prototype.doSearch = function(force) {
    var self = this;

    $(this.helpContainer).hide();

    var cache = this.cache;
    var value = $(this.inputContainer).val();

    if (value == cache.value) {
        return false;
    }

    if (value.length == 0) {
        $(this.resultContainer).find("div").html("");
        $(this.resultContainer).hide();
        $(this.helpContainer).fadeIn(400);
        cache.value = "";
        cache.hasData = 0;
        cache.lastSearchStringLength = 0;
        return false;
    }

    var strFloorLength = Math.floor(value.length/this.searchKeyLength);

    if (strFloorLength == cache.lastSearchStringLength - 1) {
        cache.lastSearchStringLength = strFloorLength;
        return false;
    }

    if (strFloorLength > cache.lastSearchStringLength || force == true) {
        cache.lastSearchStringLength = strFloorLength;
        cache.value = value;
        this.postdata.query = value;
        this.inputContainer.addClass(this.loadingClass);

        Ajax.post({
            url: this.url,
            data: this.postdata,
            success: function(result) {
                var html = self.searchCallback(result);
                $(self.resultBubbleContainer).html(html);
                Utils.create("span")
                    .addClass("hicons-gray hicons remove result-close-x")
                    .click(function() { self.resultContainer.hide() })
                    .appendTo(self.resultBubbleContainer);
                self.inputContainer.removeClass(self.loadingClass);
                $(self.resultContainer).show(400);
                cache.hasData = 1;
            }
        });
    }
};

Search.prototype.set = function(str) {
    $(this.inputContainer).val(str);
};
