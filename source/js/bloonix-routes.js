Bloonix.initRoutes = function() {
    var route = Bloonix.route = new Route();
    route.log = Log.debug;

    route.defaultRoute("dashboard", function(req) {
        window.location.hash = "dashboard";
        Bloonix.dashboard();
    });
    route.add("dashboard", function(req) {
        Bloonix.dashboard(req);
    });
    route.add("dashboard/:name", function(req) {
        Bloonix.dashboard(req);
    });
    route.add("wtrm", function(req) {
        Bloonix.WTRM(req);
    });
    route.add("monitoring/hosts", function(req) {
        Bloonix.listHosts(req);
    });
    route.add("monitoring/hosts/:id", function(req) {
        Bloonix.viewHostDashboard(req);
    });
    route.add("monitoring/hosts/create", function(req) {
        Bloonix.createHost(req);
    });
    route.add("monitoring/hosts/:id/edit", function(req) {
        Bloonix.editHost(req);
    });
    route.add("monitoring/hosts/:id/events", function(req) {
        Bloonix.listHostEvents(req);
    });
    route.add("monitoring/hosts/:id/charts", function(req) {
        Bloonix.listCharts(req);
    });
    route.add("monitoring/hosts/:id/reports", function(req) {
        Bloonix.viewHostReport(req);
    });
    route.add("monitoring/hosts/:id/dependencies", function(req) {
        Bloonix.viewHostDependencies(req);
    });
    route.add("monitoring/hosts/:id/templates", function(req) {
        Bloonix.editHostTemplates(req);
    });
    route.add("monitoring/hosts/:id/downtimes", function(req) {
        Bloonix.viewHostDowntimes(req);
    });
    route.add("monitoring/hosts/:id/mtr", function(req) {
        Bloonix.viewMtrResult(req);
    });
    route.add("monitoring/hosts/:id/notifications", function(req) {
        Bloonix.viewHostNotifications(req);
    });
    route.add("monitoring/hosts/:id/services/create", function(req) {
        Bloonix.createService(req);
    });
    route.add("monitoring/hosts/:id/services/:service_id/edit", function(req) {
        Bloonix.editService(req);
    });
    route.add("monitoring/hosts/:id/services/:service_id/clone-to/:clone_to", function(req) {
        Bloonix.cloneService(req);
    });
    route.add("monitoring/hosts/:id/services/:service_id/report", function(req) {
        Bloonix.viewServiceLocationReport(req);
    });
    route.add("monitoring/hosts/:id/services/:service_id/wtrm-report", function(req) {
        Bloonix.viewServiceWtrmReport(req);
    });
    route.add("monitoring/services", function(req) {
        Bloonix.listServices(req);
    });
    route.add("monitoring/charts", function(req) {
        Bloonix.listCharts(req);
    });
    route.add("monitoring/charts/editor", function(req) {
        Bloonix.listUserCharts(req);
    });
    route.add("monitoring/charts/editor/create", function(req) {
        Bloonix.createUserChart(req);
    });
    route.add("monitoring/charts/editor/:id/update", function(req) {
        Bloonix.createUserChart(req);
    });
    route.add("monitoring/templates", function(req) {
        Bloonix.listHostTemplates(req);
    });
    route.add("monitoring/templates/:id", function(req) {
        Bloonix.editHostTemplate(req);
    });
    route.add("monitoring/templates/:id/members", function(req) {
        Bloonix.listHostTemplateMembers(req);
    });
    route.add("monitoring/templates/:id/services", function(req) {
        Bloonix.listHostTemplateServices(req);
    });
    route.add("monitoring/templates/:id/services/create", function(req) {
        Bloonix.createService({ id: req.id, template: true });
    });
    route.add("monitoring/templates/:id/services/:ref_id/edit", function(req) {
        Bloonix.showTemplateSubNavigation("services", req.id);
        Bloonix.editService({ id: req.id, refId: req.ref_id, template: true });
    });
    route.add("monitoring/templates/create", function(req) {
        Bloonix.createHostTemplate(req);
    });
    route.add("monitoring/screen", function(req) {
        Bloonix.viewScreen(
            Utils.extend({ dashboard: true }, req)
        );
    });
    route.add("monitoring/screen/:opts", function(req) {
        Bloonix.viewScreen(
            Utils.extend({ dashboard: true }, req)
        );
    });
    route.add("notification/contacts", function(req) {
        Bloonix.listContacts(req);
    });
    route.add("notification/contacts/:id/edit", function(req) {
        Bloonix.editContact(req);
    });
    route.add("notification/contacts/create", function(req) {
        Bloonix.createContact(req);
    });
    route.add("notification/contactgroups", function(req) {
        Bloonix.listContactgroups(req);
    });
    route.add("notification/contactgroups/:id/edit", function(req) {
        Bloonix.editContactgroup(req);
    });
    route.add("notification/contactgroups/create", function(req) {
        Bloonix.createContactgroup(req);
    });
    route.add("notification/timeperiods", function(req) {
        Bloonix.listTimeperiods(req);
    });
    route.add("notification/timeperiods/:id/edit", function(req) {
        Bloonix.editTimeperiod(req);
    });
    route.add("notification/timeperiods/create", function(req) {
        Bloonix.createTimeperiod(req);
    });
    route.add("notification/rosters", function(req) {
        Bloonix.listRosters(req);
    });
    route.add("notification/rosters/:id/edit", function(req) {
        Bloonix.notImplemented(req);
    });
    route.add("notification/rosters/create", function(req) {
        Bloonix.notImplemented(req);
    });
    route.add("administration/companies", function(req) {
        Bloonix.listCompanies();
    });
    route.add("administration/companies/:id/edit", function(req) {
        new Bloonix.editCompany(req);
    });
    route.add("administration/companies/create", function(req) {
        new Bloonix.createCompany();
    });
    route.add("administration/locations", function(req) {
        Bloonix.listLocations();
    });
    route.add("administration/locations/:id/edit", function(req) {
        new Bloonix.editLocation(req);
    });
    route.add("administration/locations/create", function(req) {
        new Bloonix.createLocation();
    });
    route.add("administration/variables", function(req) {
        new Bloonix.editCompanyVariables();
    });
    route.add("administration/users", function(req) {
        Bloonix.listUsers(req);
    });
    route.add("administration/users/:id/edit", function(req) {
        Bloonix.editUser(req);
    });
    route.add("administration/users/create", function(req) {
        Bloonix.createUser(req);
    });
    route.add("administration/groups", function(req) {
        Bloonix.listGroups(req);
    });
    route.add("administration/groups/:id/edit", function(req) {
        Bloonix.editGroup(req);
    });
    route.add("administration/groups/create", function(req) {
        Bloonix.createGroup(req);
    });
    route.add("help", function(req) {
        Bloonix.helpIndex(req);
    });
    route.add("help/:doc", function(req) {
        Bloonix.helpIndex(req);
    });

    route.setPreRoutingCallback(function() {
        if (Bloonix.user && Bloonix.user.change_password == "0") {
            Bloonix.changeUserPassword({ force: true });
        }
    });

    route.setPreCallback(function(route, args) {
        var path = route.split("/");

        Bloonix.clearAll();
        $("#content").html("").removeClass("content-no-padding");
        Bloonix.showNavigation(route, args);
        Bloonix.resizeContent();

        if (path[0] == "administration" && Bloonix.user.role == "user") {
            Bloonix.noAuth();
            return false;
        }
        if (path[0] == "notification" && Bloonix.user.manage_contacts == false) {
            Bloonix.noAuth();
            return false;
        }
        if (path[0] == "monitoring" && path[1] == "templates" && Bloonix.user.manage_templates == false) {
            Bloonix.noAuth();
            return false;
        }

        return true;
    });
};
