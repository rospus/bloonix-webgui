// Define encapsulated variables.
var Bloonix = {

    // Pre-defined status colors.
    defaultStatusColor: {
        OK: "#5ec15e",
        INFO: "#339ab8",
        //WARNING: "#edc951",
        WARNING: "#e4af00",
        CRITICAL: "#cc333f",
        UNKNOWN: "#eb6841"
    },

    areaStatusColors: [
        "#4b9768", // ok
        "#2f96b4", // info
        "#f89406", // warning
        "#ca2146", // critical 
        "#eb582a"  // unknown
    ],

    // Store all interval and timeout objects.
    intervalObjects: [],
    timeoutObjects: [],

    // Store ajax objects.
    xhrPool: [],

    // How many rows to request by default.
    requestSize: 50,
    searchSize: 10,

    // The default interval to reload charts and content
    // and the maximum count of selected charts.
    chartReloadInterval: 30000,
    chartMaxSelected: 100,

    // Store ajax postdata from different functions.
    postdata: {},

    // Global caching for different purposes.
    cache: {
        // The chart data must be cached to destroy the
        // highcharts object or the container. So each
        // highcharts object is stored by the id of the
        // div container:
        //
        //      charts = {
        //          "#id": {
        //              chart: new Highcharts.Chart(...),
        //              intervalObject: setInterval(...),
        //          }
        //      }
        charts: {}
    },

    // Store different statistics. As example global
    // host and service statistics to display them
    // in the footer.
    stats: {
        hosts: {
            unknown: 0,
            critical: 0,
            warning: 0,
            info: 0,
            ok: 0
        },
        services: {
            unknown: 0,
            critical: 0,
            warning: 0,
            info: 0,
            ok: 0
        }
    },

    // Store objects like #ids for a faster access.
    objects: {},

    // Destroy function that is called every time
    // the page is switched.
    destroy: undefined,

    // The default plot library for charts and maps to use.
    plotChartsWith: "other",
    //plotChartsWith: "highcharts",

// End
};
