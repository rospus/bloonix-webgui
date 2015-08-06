Bloonix.viewHostNotifications = function(o) {
    var object = Utils.extend({}, o);

    object.create = function() {
        this.host = Bloonix.getHost(this.id);
        Bloonix.showHostSubNavigation("notifications", this.id, this.host.hostname);

        this.header = new Header({
            title: Bloonix.setTitle("schema.notification.text.list", this.host.hostname, true),
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
            title: Text.get("schema.notification.text.search"),
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
            placeholder: Text.get("schema.notification.text.filter_message"),
            appendTo: this.form.form
        });

        var type = this.form.input({
            name: "type",
            placeholder: Text.get("schema.notification.text.filter_message_service"),
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
            url: "/hosts/"+ this.id +"/notifications",
            bindForm: this.form,
            appendTo: this.boxes.right,
            headerObject: this.header,
            columns: [
                {
                    name: "time",
                    text: Text.get("schema.notification.attr.time"),
                    convertFromUnixTime: true
                },{
                    name: "message_service",
                    text: Text.get("schema.notification.attr.message_service")
                },{
                    name: "send_to",
                    text: Text.get("schema.notification.attr.send_to")
                },{
                    name: "subject",
                    text: Text.get("schema.notification.attr.subject")
                },{
                    name: "message",
                    text: Text.get("schema.notification.attr.message")
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
