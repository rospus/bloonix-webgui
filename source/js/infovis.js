Bloonix.createInfovisGraph = function(o) {
    var graphFunction;

    o.width = $("#"+ o.container).innerWidth(),
    o.height = $("#"+ o.container).innerHeight();

    if (o.type == "radialGraph") {
        graphFunction = Bloonix.createInfovisRadialGraph;
    } else if (o.type == "hyperTree") {
        graphFunction = Bloonix.createInfovisHyperTree;
    } else if (o.type == "spaceTree") {
        graphFunction = Bloonix.createInfovisSpaceTree;
    }

    $("#"+ o.container).html("");
    graphFunction(o);
};

Bloonix.createInfovisRadialGraph = function(o) {
    var graph = new $jit.RGraph({
        injectInto: o.container,
        width: o.width,
        height: o.height,
        background: {
            CanvasStyles: {
                strokeStyle: "#aaaaaa"
            }
        },
        Navigation: {
            enable: true,
            panning: true
        },
        Node: {
            dim: 5,
            color: "#aaaaaa",
            overridable: true
        },
        Edge: {
            color: "#c17878",
            lineWidth: 1.2
        },
        Tips: {
            enable: false,
            offsetX: 20,
            offsetY: 20
        },
        Label: {
            type: "HTML",
            size: 11,
            style: "bold",
            color: "#222222"
        },
        onBeforeCompute: function(node){
            o.onClick(node.data);
        },
        onCreateLabel: function(domElement, node){
            domElement.innerHTML = node.name;
            domElement.onclick = function(){
                graph.onClick(node.id, {
                    onComplete: function() {
                    }
                });
            };
        },
        onPlaceLabel: function(domElement, node){
            var style = domElement.style;
            style.display = "";
            style.cursor = "pointer";
            if (node._depth <= 1) {
                style.fontSize = "11px";
                style.color = "#333333";
            } else if(node._depth == 2){
                style.fontSize = "10px";
                style.color = "#494949";
            } else {
                style.fontSize = "8px";
                style.color = "#494949";
            }
            var left = parseInt(style.left);
            var w = domElement.offsetWidth;
            style.left = (left - w / 2) + "px";
        }
    });
    graph.loadJSON(o.data);
    graph.graph.eachNode(function(n) {
        var pos = n.getPos();
        pos.setc(-200, -200);
    });
    graph.compute("end");
    graph.fx.animate({
        modes:["polar"],
        duration: 1000
    });
    //$jit.id("inner-details").innerHTML = graph.graph.getNode(graph.root).data.relation;
};

Bloonix.createInfovisHyperTree = function(o) {
    var graph = new $jit.Hypertree({
        injectInto: o.container,
        width: o.width,
        height: o.height,
        duration: 1500,
        Node: {
            dim: 5,
            color: "#aaaaaa",
            overridable: true
        },
        Edge: {
            color: "#008888",
            lineWidth: 1.2
        },
        Tips: {
            enable: false,
            offsetX: 20,
            offsetY: 20,
            //onShow: function(tip, elem) {
            //    tip.innerHTML = "<div class="infovis-node-tip">" + elem.data.description + "</div>";
            //},
        },
        onBeforeCompute: function(node){
            o.onClick(node.data);
        },
        onCreateLabel: function(domElement, node){
            domElement.innerHTML = node.name;
            $jit.util.addEvent(domElement, "click", function () {
                graph.onClick(node.id, {
                    onComplete: function() {
                    }
                });
            });
        },
        onPlaceLabel: function(domElement, node){
            var style = domElement.style;
            style.display = "";
            style.cursor = "pointer";
            if (node._depth <= 1) {
                style.fontSize = "11px";
                style.color = "#333333";
            } else if(node._depth == 2){
                style.fontSize = "10px";
                style.color = "#333333";
            } else {
                style.fontSize = "8px";
                style.color = "#333333";
            }
            var left = parseInt(style.left);
            var w = domElement.offsetWidth;
            style.left = (left - w / 2) + "px";
        },
    });
    graph.loadJSON(o.data);
    graph.refresh();
    graph.controller.onComplete();
};

Bloonix.createInfovisSpaceTree = function(o) {
    var graph = new $jit.ST({
        injectInto: o.container,
        width: o.width,
        height: o.height,
        duration: 600,
        levelsToShow: 10,
        transition: $jit.Trans.Quart.easeInOut,
        //transition: $jit.Trans.linear,
        levelDistance: 30,
        orientation: "bottom",
        Navigation: {
            enable: true,
            panning: true,
        },
        Node: {
            height: 40,
            width: 200,
            type: "rectangle",
            color: "#cccccc",
            overridable: true
        },
        Edge: {
            type: "bezier",
            overridable: true,
            lineWidth: 1.2
        },
        Tips: {
            enable: false,
            offsetX: 20,
            offsetY: 20,
            //onShow: function(tip, elem) {
            //    tip.innerHTML = "<div class="infovis-node-tip">" + elem.data.description + "</div>";
            //},
        },
        onBeforeCompute: function(node){
        },
        onAfterCompute: function(){
        },
        onCreateLabel: function(label, node){
            label.id = node.id;
            label.innerHTML = node.name;
            label.onclick = function(){
                graph.onClick(node.id);
                o.onClick(node.data);
                //graph.setRoot(node.id, "animate");
            };
            var style = label.style;
            style.width = "200px";
            style.height = "40px";
            style.cursor = "pointer";
            style.color = "#333333";
            style.fontSize = "12px";
            style.textAlign= "center";
            style.paddingTop = "3px";
            style.paddingLeft = "3px";
        },
        onBeforePlotNode: function(node){
            if (node.selected) {
                node.data.$color = "#ffff77";
            }
            else {
                delete node.data.$color;
                if(!node.anySubnode("exist")) {
                    var count = 0;
                    node.eachSubnode(function(n) { count++; });
                    node.data.$color = ["#aaa", "#baa", "#caa", "#daa", "#eaa", "#faa"][count];
                }
            }
        },
        onBeforePlotLine: function(adj){
            if (adj.nodeFrom.selected && adj.nodeTo.selected) {
                adj.data.$color = "#eeeedd";
                adj.data.$lineWidth = 3;
            }
            else {
                delete adj.data.$color;
                delete adj.data.$lineWidth;
            }
        }
    });
    graph.loadJSON(o.data);
    graph.compute();
    graph.geom.translate(new $jit.Complex(-200, 0), "current");
    graph.onClick(graph.root);
};
