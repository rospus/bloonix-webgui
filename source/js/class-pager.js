var Pager = function(o) {
    Utils.extend(this, o);
};

Pager.prototype = {
    appendTo: false,
    format: "default",
    stopIconClass: false,
    backIconClass: false,
    forwardIconClass: false,
    pagerClass: "pager",
    pagerTextClass: false,
    data: false,
    postdata: false
};

Pager.prototype.getPagerTextClass = function() {
    return this.pagerTextClass || "pager-text-"+ this.format;
};

Pager.prototype.getStopIconClass = function() {
    if (this.stopIconClass) {
        return this.stopIconClass;
    }
    return this.format == "default"
        ? "gicons-gray gicons stop"
        : "hicons-gray hicons stop";
};

Pager.prototype.getBackIconClass = function() {
    if (this.backIconClass) {
        return this.backIconClass;
    }
    return this.format == "default"
        ? "gicons-gray gicons chevron-left"
        : "gicons-gray gicons chevron-right";
};

Pager.prototype.getForwardIconClass = function() {
    if (this.forwardIconClass) {
        return this.forwardIconClass;
    }
    return this.format == "default"
        ? "gicons-gray gicons chevron-right"
        : "hicons-gray hicons chevron-right";
};

/*
    <div class="pager">
        <div class="gicons-gray gicons stop"></div>
        <div class="pager-text-default">Displaying 0-9 of 9 hits</div>
        <div class="gicons-gray gicons stop"></div>
    </div>
*/

Pager.prototype.create = function() {
    var postdata = this.postdata;

    var self = this,
        offset = postdata.offset,
        limit = postdata.limit,
        size = this.data.size,
        total = this.data.total;

    var prev = (parseInt(offset) - parseInt(limit)),
        next = (parseInt(offset) + parseInt(limit)),
        to = (parseInt(offset) + parseInt(size)),
        html;

    if (prev < 0) {
        prev = 0;
    }

    var container = $(this.appendTo)
        .addClass(this.pagerClass)
        .html("");

    if (offset > 0) {
        Utils.create("div")
            .addClass(this.getBackIconClass())
            .appendTo(container)
            .css({ cursor: "pointer" })
            .click(function() {
                postdata.offset = prev;
                postdata.size = self.data.size;
                self.callback({ postdata: postdata });
            });
    } else {
        Utils.create("div")
            .addClass(this.getStopIconClass())
            .appendTo(container);
    }

    Utils.create("div")
        .addClass(this.getPagerTextClass())
        .html(Text.get("action.display_from_to_rows", [ offset, to, total ]))
        .appendTo(container);

    if (next < total) {
        Utils.create("div")
            .addClass(this.getForwardIconClass())
            .appendTo(container)
            .css({ cursor: "pointer" })
            .click(function() {
                postdata.offset = next;
                postdata.size = self.data.size;
                self.callback({ postdata: postdata });
            });
    } else {
        Utils.create("div")
            .addClass(this.getStopIconClass())
            .appendTo(container);
    }
};
