Bloonix.highcharts.pieChart = function(o) {
    var chartOpts = {
        chart: {
            renderTo: o.chart.container,
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: true,
            type: "pie",
            options3d: {
                enabled: true,
                alpha: 45,
                beta: 0
            }
        },
        title: {
            text: o.chart.title,
            style: {
                color: "#444444",
                fontWeight: "normal",
                fontSize: "15px"
            }
        },
        subtitle: {
            text: o.chart.subtitle,
            style: {
                color: "#555555",
                fontWeight: "normal",
                fontSize: "13px"
            }
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
            //pointFormat: "{series.name}: <b>{point.y}</b>",
            //percentageDecimals: 1
        },
        legend: {
            itemStyle: {
                color: "#444444",
                fontSize: "12px"
            },
            itemHoverStyle: { color: "#000000" },
            borderWidth: 0
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: "pointer",
                showInLegend: true,
                depth: 35,
                dataLabels: {
                    enabled: true,
                    //format: '{point.name}'
                    //color: "#444444",
                    //connectorColor: "#444444",
                    //connectorPadding: 1,
                    //overflow: "justify",
                    formatter: function() {
                        return "<b>"+ this.point.name +"</b>: "+ this.percentage.toFixed(2) +" %";
                    }
                }
            },
        },
        series: [{
            data: o.data
        }]
    };

    if (o.plotOptions && o.plotOptions.animation !== undefined) {
        chartOpts.plotOptions.pie.animation = o.plotOptions.animation;
    }

    if (o.legend == false) {
        chartOpts.plotOptions.pie.showInLegend = false;
        chartOpts.plotOptions.pie.dataLabels.enabled = false;
    }

    if (o.onClick != undefined) {
        chartOpts.plotOptions.series = {
            cursor: "pointer",
            point: {
                events: {
                    click: function() {
                        o.onClick(this.name);
                    }
                }
            }
        };
    }

    if (o.colors) {
        if (o.gradient == true || o.gradient == undefined) {
            chartOpts.colors = [ ];
            $.each(o.colors, function(index, color) {
                var rgb = "rgb("+ Utils.hexToRGB(color).join(",") +")";
                chartOpts.colors.push({
                    radialGradient: { cx: 0.5, cy: 0.3, r: 0.7 },
                    stops: [
                        [ 0, Highcharts.Color(rgb).brighten(0.2).get("rgb") ],
                        [ 1, Highcharts.Color(rgb).brighten(-0.1).get("rgb") ]
                    ]
                });
            });
        } else {
            chartOpts.colors = o.colors;
        }
    }

    Bloonix.createOrReplaceChart({
        container: o.chart.container, 
        chartOpts: chartOpts,
        type: "Chart"
    });
};
