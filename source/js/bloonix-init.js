Bloonix.init = function(o) {
    Bloonix.initAjax();
    Bloonix.args = o;
    Bloonix.version = o.version;
    if (o) {
        if (o.chartLibrary) {
            Bloonix.plotChartsWith = o.chartLibrary;
        }
        if (o.screen) {
            Bloonix.forceScreen = 1;
            Bloonix.viewScreen(o);
            return;
        }
    }
    Bloonix.initUser();
    Bloonix.initRoutes();
    Bloonix.initHeader();
    Bloonix.initContent();
    Bloonix.initNavigation();
    Bloonix.initFooter();
    Bloonix.getStats();
    Bloonix.route.to();
};
