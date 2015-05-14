package Bloonix::Controller::Administration::Companies;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/administration/companies")->to("list");
    $c->route->map("/administration/companies/search")->to("list");
    $c->route->map("/administration/companies/create")->to("create");
    $c->route->map("/administration/companies/options")->to("options");
    $c->route->map("/administration/companies/:id")->to("view");
    $c->route->map("/administration/companies/:id/options")->to("options");
    $c->route->map("/administration/companies/:id/update")->to("update");
    $c->route->map("/administration/companies/:id/delete")->to("delete");
    $c->route->map("/administration/companies/delete-api-test")->to("delete_api_test");
}

sub auto {
    my ($self, $c, $opts) = @_;

    if ($c->user->{role} ne "admin") {
        $c->plugin->error->noauth_access;
        return undef;
    }

    if ($opts->{id}) {
        $c->stash->object($c->model->database->company->get($opts->{id}));

        if (!$c->stash->object) {
            $c->plugin->error->object_does_not_exists;
            return undef;
        }
    }

    return 1;
}

sub list {
    my ($self, $c) = @_;

    my $request = $c->plugin->defaults->request
        or return 1;

    my ($count, $data) = $c->model->database->company->by_company_id(
        offset => $request->{offset},
        limit => $request->{limit},
        query => $request->{query},
        company_id => $c->user->{company_id},
        sort => $request->{sort},
        order => [ asc => "id" ]
    );

    foreach my $row (@$data) {
        my $count_hosts = $c->model->database->host->count_by_company_id($row->{id});
        my $count_services = $c->model->database->service->count_by_company_id($row->{id});
        $row->{count_hosts_services} = "$count_hosts/$count_services";
    }

    $c->stash->offset($request->{offset});
    $c->stash->total($count);
    $c->stash->data($data);
    $c->view->render->json;
}

sub view {
    my ($self, $c, $opts) = @_;

    $c->stash->data($c->stash->object);
    $c->view->render->json;
}

sub options {
    my ($self, $c, $opts) = @_;

    if ($opts && $opts->{id}) {
        return $c->plugin->action->options(company => $opts->{id});
    }

    return $c->plugin->action->options("company");
}

sub create {
    my ($self, $c) = @_;

    $c->plugin->token->check
        or return 1;

    my $result = $c->model->database->company->validator->validate(
        $c->req, force_defaults => 1
    );

    if ($result->has_failed) {
        return $c->plugin->error->form_parse_errors($result->failed);
    }

    my $data = $c->model->database->company->create_new_structure($result->data);

    if ($data->{status} ne "ok") {
        return $c->plugin->error->action_failed(create => $data);
    }

    $c->plugin->log_action->create(
        target => "company",
        data => $data->{data}
    );

    $c->stash->data($data->{data});
    $c->view->render->json;
}

sub update {
    my ($self, $c, $opts) = @_;

    return $c->plugin->action->store(company => $c->stash->object);
}

sub delete {
    my ($self, $c, $opts) = @_;

    if ($opts->{id} == 1) {
        return $c->plugin->error->no_privileges;
    }

    $c->plugin->action->delete(company => $c->stash->object);
}

sub delete_api_test {
    my ($self, $c) = @_;

    $c->model->database->company->delete(
        company => "bloonix-webgui-api-test-tohdeeg7bae3"
    );

    $c->model->database->location->delete(
        hostname => "bloonix-webgui-api-test-tohdeeg7bae3"
    );
}

1;
