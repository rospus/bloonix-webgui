Bloonix.viewHostNotifications = function(o) {
    var object = Utils.extend({}, o);

    object.create = function() {
        this.host = Bloonix.getHost(this.id);
        Bloonix.showHostSubNavigation("notifications", this.id, this.host.hostname);

        this.header = new Header({
            title: Bloonix.setTitle("schema.sms_send.text.list", this.host.hostname, true),
            pager: true
        }).create();

        this.boxes = Bloonix.createSideBySideBoxes({
            container: $("#content"),
            width: "300px"
        });

        this.createForm();
        this.getNotifications();
    };

    object.createForm = function() {
        var self = this;

        this.form = new Form({
            format: "medium",
            showButton: false,
            appendTo: this.boxes.left,
            title: Text.get("schema.sms_send.text.search"),
            onSuccess: function() { self.table.getData() }
        }).create();

        var fromTime = this.form.datetime({
            name: "from",
            placeholder: Text.get("word.From"),
            appendTo: this.form.form
        });

        var toTime = this.form.datetime({
            name: "to",
            placeholder: Text.get("word.To"),
            appendTo: this.form.form
        });

        var query = this.form.input({
            name: "query",
            placeholder: Text.get("word.Filter"),
            appendTo: this.form.form
        });

        this.form.button({
            text: Text.get("action.search"),
            appendTo: this.form.form,
            callback: function() { self.table.getData({ resetOffset: true }) }
        });

        this.form.button({
            text: Text.get("action.clear"),
            appendTo: this.form.form,
            callback: function() {
                fromTime.clear();
                toTime.clear();
                query.clear();
                self.table.getData({ resetOffset: true });
            }
        });
    };

    object.getNotifications = function() {
        var self = this;

        this.table = new Table({
            url: "/hosts/"+ this.id +"/sms-notifications",
            bindForm: this.form,
            appendTo: this.boxes.right,
            headerObject: this.header,
            columns: [
                {
                    name: "time",
                    text: Text.get("schema.sms_send.attr.time"),
                    convertFromUnixTime: true
                },{
                    name: "send_to",
                    text: Text.get("schema.sms_send.attr.send_to")
                },{
                    name: "message",
                    text: Text.get("schema.sms_send.attr.message")
                }
            ]
        }).create();

        /*
        this.table.onFormError = function(failed) {
            self.form.markErrors(failed);
        };

        this.table.postdata = function() {
            var data = self.form.getData();
            data.offset = 0;
            data.limit = Bloonix.requestSize;
            return data;
        };

        this.table.create();
        */
    };

    object.create();
};
