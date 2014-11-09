Bloonix.highcharts.plotChart = function(o) {
    if (Bloonix.checkEmptyChartData(o)) {
        return false;
    }

    if (o.chart.xAxisType == undefined) {
        o.chart.xAxisType = "datetime";
    }

    if (o.chart.lineMarker == undefined) {
        o.chart.lineMarker = false;
    }

    var chartOpts = {
        chart: {
            zoomType: "x",
            renderTo: o.chart.container,
            type: o.chart.type,
            plotBorderColor: "#e1e1e1",
            plotBorderWidth: 1
        },
        title: {
            text: o.chart.title,
            align: "left",
            style: {
                color: "#333333",
                fontWeight: "normal",
                fontSize: "14px"
            }
        },
        subtitle: {
            text: o.chart.subtitle,
            align: "left",
            style: {
                color: "#555555",
                fontWeight: "normal",
                fontSize: "13px"
            }
        },
        xAxis: {
            type: "datetime",
            title: {
                text: o.chart.xlabel,
                style: {
                    color: "#555555",
                    fontWeight: "normal",
                    fontSize: "13px"
                }
            }
        },
        yAxis: {
            title: {
                text: o.chart.ylabel,
                align: "high",
                style: {
                    color: "#555555",
                    fontWeight: "normal",
                    fontSize: "12px"
                }
            },
            labels: {
                style: {
                    color: "#555555",
                    fontWeight: "normal",
                    fontSize: "12px"
                }
            }
        },
        legend: {
            itemStyle: {
                color: "#333333",
                fontSize: "12px",
                fontWeight: "normal",
            },
            symbolWidth: 20,
            borderWidth: 0
        },
        tooltip: {
            crosshairs: true,
            shared: true,
            valueDecimals: 2,
            formatter: function() {
                var date = new Date(this.x),
                    series = "<b>"+ DateFormat(date, "highchartsTooltip") +"</b>";

                $.each(this.points, function(index, point) {
                    var name = point.series.name,
                        color = o.colors[point.series.name] || Utils.rgbToHex(point.series.color),
                        value = point.y,
                        units = o.chart.units || o.units[name];

                    if (units) {
                        if (/bytes|bits/.test(units)) {
                            value = Bloonix.convertBytesToStr(units, value, true);
                        } else if (units == "default" || units == "null") {
                            value = Bloonix.convertUnitsToStr(units, value, true);
                        }
                    }

                    series += '<br /><span style="color:'+ color +';font-weight:bold;">'+ name +': '+ value +'</span>';
                });         

                return series;
            }
        },
        plotOptions: {
            line: {
                marker: { enabled: false },
                connectNulls: false
            },
            spline: {
                marker: { enabled: false },
                connectNulls: false
            },
            area: {
                stacking : o.hasNegativeValues == true ? null : "normal",
                //lineColor: "#aaaaaa",
                lineWidth: 1,
                marker: { enabled: false },
                connectNulls: false
            }
        },
        series: o.series
    };

    if (o.legend && o.legend.enabled === false) {
        chartOpts.legend.enabled = false;
    }

    if (o.plotOptions && o.plotOptions.animation !== undefined) {
        chartOpts.plotOptions.line.animation = o.plotOptions.animation;
        chartOpts.plotOptions.spline.animation = o.plotOptions.animation;
        chartOpts.plotOptions.area.animation = o.plotOptions.animation;
    }

    if (o.chart.units) {
        if (/bytes|bits/.test(o.chart.units)) {
            chartOpts.yAxis.labels.formatter = function() {
                return Bloonix.convertBytesToStr(o.chart.units, this.value);
            };
        } else {
            chartOpts.yAxis.labels.formatter = function() {
                return Bloonix.convertUnitsToStr(o.chart.units, this.value);
            };
        }
    }

    if (o.hasNegativeValues != true) {
        chartOpts.yAxis.min = 0;
    }

    Bloonix.createOrReplaceChart({
        container: o.chart.container, 
        chartOpts: chartOpts,
        type: "Chart"
    });
};

Bloonix.highcharts.createChartForMTR = function(o) {
    var chartOpts = {
        chart: {
            renderTo: o.chart.container
        },
        title: {
            text: false
        },
        yAxis: [
            { min: 0, title: { text: "time in ms" } },
            { min: 0, max: 100, title: { text: "loss %" }, opposite: true }
        ],
        xAxis: {
            title: "Step",
            categories: o.categories
        },
        tooltip: {
            crosshairs: true,
            shared: true,
            formatter: function() {
                var step = this.x,
                    desc = "<b>"+ step +") IP "+ o.ipaddrByStep[step] +"</b>";

                $.each(this.points, function(index, point) {
                    var name = point.series.name,
                        color = point.series.color,
                        value = point.y;

                    desc += '<br /><span style="color:'
                        + color +'; font-weight: bold;">'
                        + name +'</span>: <b>'
                        + value +'</b>';
                });

                return desc;
            }
        },
        plotOptions: {
            column: {
                stacking: "normal"
            }
        },
        series: o.series
    };

    new Highcharts.Chart(chartOpts);
};

Bloonix.highcharts.createChartForWTRM = function(o) {
    return new Highcharts.Chart({
        chart: {
            type: "area",
            renderTo: o.chart.container
        },
        title: {
            text: o.chart.title,
            align: "left",
            style: {
                color: "#333333",
                fontWeight: "normal",
                fontSize: "14px"
            }
        },
        subtitle: {
            text: o.chart.subtitle,
            align: "left",
            style: {
                color: "#555555",
                fontWeight: "normal",
                fontSize: "13px"
            }
        },
        xAxis: {
            categories: o.categories,
            title: { enabled: false }
        },
        yAxis: { title: { text: "ms" } },
        tooltip: {
            formatter: function() {
                return this.x +" step took <b>"+ this.y +"ms</b>";
            }
        },
        legend: {
            enabled: false
        },
        plotOptions: {
            area: {
                stacking: "normal",
                lineColor: "#005467",
                lineWidth: 1,
                marker: {
                    lineWidth: 1,
                    lineColor: "#005467"
                }
            }
        },
        series: [{
            name: "Steps",
            color: "#005467",
            data: o.seriesData
        }]
    });
};
