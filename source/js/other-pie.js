Bloonix.other.pieChart = function(o) {
    var data = [];

    var chartOuterId = o.chart.container,
        chartOuterBox = "#"+ o.chart.container,
        chartContentId = chartOuterId +"-content",
        chartContentBox = chartOuterBox +"-content",
        chartLegendId = chartOuterId +"-legend",
        chartLegendBox = chartOuterBox +"-legend";

    $(chartOuterBox).html("");

    var chartContent = Utils.create("div")
        .attr("id", chartContentId)
        .appendTo(chartOuterBox);

    var chartLegend = Utils.create("div")
        .attr("id", chartLegendId)
        .addClass("chart-legend")
        .appendTo(chartOuterBox);

    if (o.legend === false) {
        chartLegend.hide();
    }

    $.each(o.data, function(i, s) {
        data.push({
            label: s.name,
            data: s.y,
            color: o.colors[i]
            //color: "rgba("+ Utils.hexToRGB(o.colors[i]) +", 0.9)",
        });

        var legendItem = Utils.create("div")
            .addClass("chart-legend-box")
            .appendTo(chartLegend);

        Utils.create("div")
            .addClass("chart-legend-label")
            .css({ background: o.colors[i] })
            .appendTo(legendItem);

        Utils.create("div")
            .addClass("chart-legend-text")
            .text(s.name)
            .appendTo(legendItem);
    });

    var resizeContent = function() {
        var chartContentHeight = $(chartOuterBox).height() - chartLegend.outerHeight() - 1;

        chartContent.css({
            height: chartContentHeight +"px"
        });
    };

    resizeContent();

    $(chartContentBox).html("");
    var plot = $.plot(chartContentBox, data, {
        series: {
            pie: {
                show: true,
                radius: 3/4,
                highlight: {
                    opacity: 0.1
                },
                stroke: {
                    color: "#ffffff",
                    width: 1
                },
                label: {
                    show: o.legend === false ? false : true,
                    radius: 3/4,
                    formatter: function(label, series) {
                        return "<div style='font-size:12px; text-align:center; padding:4px; color:white;'>"
                            + label + "<br/>" + Math.round(series.percent) + "%</div>";
                    },
                    background: {
                        opacity: 0.5,
                        color: '#000'
                    }
                }
            }
        },
        grid: {
            clickable: true,
            hoverable: true
        },
        legend: {
            show: false
        }
    });

    $(chartContentBox).resize(function() {
        resizeContent();
        plot.resize();
    });

    $(chartContentBox).bind("plotclick", function (event, pos, item) {
        if (item && o.onClick) {
            o.onClick(item.series.label);
        }
    });

    $(chartContentBox).bind("plothover", function (event, pos, item) {
        if (item) {
            document.body.style.cursor = 'pointer';
        } else {
            document.body.style.cursor = 'default';
        }
    });
};
