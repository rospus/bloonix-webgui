Bloonix.highcharts.barChart = function(o) {
    var chartOpts = {
        chart: {
            renderTo: o.chart.container,
            type: "column",
            margin: 50,
            options3d: {
                enabled: true,
                alpha: 10,
                beta: 25,
                depth: 70
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
        xAxis: {
            categories: o.categories,
            title: {
                text: o.chart.xaxisTitle,
                style: {
                    color: "#555555",
                    fontWeight: "normal",
                    fontSize: "12px"
                }
            }
        },
        yAxis: {
            min: 0,
            title: {
                text: o.chart.yaxisTitle,
                align: "high",
                style: {
                    color: "#555555",
                    fontWeight: "normal",
                    fontSize: "12px"
                }
            },
            labels: {
                overflow: "justify"
            }
        },
        tooltip: {
            formatter: function() {
                return ""+
                    this.series.name +": "+ this.y +" services";
            }
        },
        plotOptions: {
            column: {
                dataLabels: {
                    enabled: false
                }
            }
        },
        series: o.series
    };

    if (o.plotOptions && o.plotOptions.animation !== undefined) {
        chartOpts.plotOptions.column.animation = o.plotOptions.animation;
    }

    Bloonix.createOrReplaceChart({
        container: o.chart.container, 
        chartOpts: chartOpts,
        type: "Chart"
    });
};
