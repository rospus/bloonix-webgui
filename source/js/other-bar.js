Bloonix.other.barChart = function(o) {
    var chartContentBox = "#"+ o.chart.container,
        data = [];

    $.each(o.series, function(x, s) {
        $.each(s.data, function(y, d) {
            data.push({ data: [[ o.categories[y], d ]], color: s.color });
        });
    });

    $.plot(chartContentBox, data, {
        series: {
            bars: {
                show: true,
                barWidth: 0.6,
                align: "center"
            }
        },
        xaxis: {
            mode: "categories",
            tickLength: 0
        },
        legend: {
            show: true
        },
        grid: {
            show: true,
            color: "#222222",
            borderWidth: 1,
            borderColor: "#e1e1e1",
            hoverable: true,
            autoHighlight: false
        }
    });
};
