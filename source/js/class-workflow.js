var Workflow = function(o) {
    Utils.extend(this, o);
    this.steps = {};
};

Workflow.prototype = {};

/*
    workflow.onError(
        function(step) { throw new Error() }
    );

    workflow.add({
        alias: "start",
        callback: function() { },
        nextStep: "foo"
    };
*/

Workflow.prototype.add = function(o) {
    this.stepsByAlias[o.alias] = o;
};

Workflow.prototype.start = function(alias, args) {
    var step = this.stepsByAlias[alias];
    var ret = step.callback(args);

    if (ret) {
        if (step.nextStep) {
            this.start(nextStep, ret);
        }
    } else if (this.errorStep) {
        this.errorStep(alias, args);
    }
};
