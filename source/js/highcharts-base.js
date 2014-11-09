if (window.Highcharts) {
    // Highcharts global options.
    Highcharts.setOptions({
        credits: { enabled: false },
        global: { useUTC: false },
        chart: {
            style: {
                fontFamily: '"Helvetica Neue",Arial,Helvetica,sans-serif,Serif'
            }
        }
    });
}

Bloonix.highcharts = {};
