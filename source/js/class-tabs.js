var Tabs = function(o) {
    this.cache = {};
    Utils.extend(this, o);
};

Tabs.prototype = {
    activeClass: "nav-sub-active",
    appendNavTo: "#nav-sub",
    appendContentTo: "#content",
    tabs: false
};

/*
    <nav id="nav-sub" style="display: block;">
        <nav>
            <ul>
                <li class="nav-sub-active"><a style="cursor: pointer;">Group settings</a></li>
                <li><a style="cursor: pointer;">Host group settings </a></li>
                <li><a style="cursor: pointer;">User group settings</a></li>
            </ul>
            <div class="clear"></div>
        </nav>
    </nav>
*/

Tabs.prototype.create = function() {
    $(this.appendNavTo).html("");

    var self = this,
        list = Utils.create("ul").appendTo(this.appendNavTo);

    Utils.create("div")
        .addClass("clear")
        .appendTo(this.appendNavTo);

    $.each(this.tabs, function(i, tab) {
        var link = Utils.create("a")
            .html(tab.text)
            .css({ cursor: "pointer" });

        var li = Utils.create("li")
            .html(link)
            .appendTo(list)
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
