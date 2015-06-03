var Tabs = function(o) {
    this.cache = {};
    Utils.extend(this, o);
};

Tabs.prototype = {
    activeClass: false,
    appendNavTo: false,
    appendContentTo: false,
    tabs: false
};

/*
    <ul>
        <li class="li-active"><a style="cursor: pointer;">Group settings</a></li>
        <li><a style="cursor: pointer;">Host group settings </a></li>
        <li><a style="cursor: pointer;">User group settings</a></li>
    </ul>
    <div class="clear"></div>
*/

Tabs.prototype.create = function() {
    $(this.appendNavTo).html("");

    var self = this,
        ul = Utils.create("ul").appendTo(this.appendNavTo);

    Utils.clear(this.appendNavTo);

    $.each(this.tabs, function(i, tab) {
        var link = Utils.create("a")
            .html(tab.text)
            .css({ cursor: "pointer" });

        var li = Utils.create("li")
            .html(link)
            .appendTo(ul)
            .click(function() { self.switchTab(i) });

        var content = Utils.create("div")
            .hide()
            .html(self.content)
            .appendTo(self.appendContentTo);

        if (tab.id) {
            content.attr("id", tab.id);
        }

        self.cache[i] = { li: li, content: content };
    });

    this.switchTab(0);
};

Tabs.prototype.switchTab = function(i) {
    if (this.activeTab != undefined) {
        this.cache[this.activeTab].content.hide();
        this.cache[this.activeTab].li.removeClass(this.activeClass);
    }
    this.cache[i].content.fadeIn(200);
    this.cache[i].li.addClass(this.activeClass)
    this.activeTab = i;
};
