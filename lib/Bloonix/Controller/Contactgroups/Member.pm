package Bloonix::Controller::Contactgroups::Member;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    # contacts
    $c->route->map("/contactgroups/:id/contacts/in-group")->to("contacts_in_group");
    $c->route->map("/contactgroups/:id/contacts/not-in-group")->to("contacts_not_in_group");
    $c->route->map("/contactgroups/:id/contacts/add/")->to("add_contacts_to_group");
    $c->route->map("/contactgroups/:id/contacts/remove")->to("remove_contacts_from_group");
    # hosts
    $c->route->map("/contactgroups/:id/hosts/in-group")->to("hosts_in_group");
    $c->route->map("/contactgroups/:id/hosts/not-in-group")->to("hosts_not_in_group");
    $c->route->map("/contactgroups/:id/hosts/add")->to("add_hosts_to_group");
    $c->route->map("/contactgroups/:id/hosts/remove")->to("remove_hosts_from_group");
    # services
    $c->route->map("/contactgroups/:id/services/in-group")->to("services_in_group");
    $c->route->map("/contactgroups/:id/services/not-in-group")->to("services_not_in_group");
    $c->route->map("/contactgroups/:id/services/add")->to("add_services_to_group");
    $c->route->map("/contactgroups/:id/services/remove")->to("remove_services_from_group");
}

sub contacts_in_group {
    my ($self, $c, $opts) = @_;
    $self->list($c, $opts, "contact", "is_in_group");
}

sub contacts_not_in_group {
    my ($self, $c, $opts) = @_;
    $self->list($c, $opts, "contact", "is_not_in_group");
}

sub hosts_in_group {
    my ($self, $c, $opts) = @_;
    $self->list($c, $opts, "host", "is_in_group");
}

sub hosts_not_in_group {
    my ($self, $c, $opts) = @_;
    $self->list($c, $opts, "host", "is_not_in_group");
}

sub services_in_group {
    my ($self, $c, $opts) = @_;
    $self->list($c, $opts, "service", "is_in_group");
}

sub services_not_in_group {
    my ($self, $c, $opts) = @_;
    $self->list($c, $opts, "service", "is_not_in_group");
}

sub list {
    my ($self, $c, $opts, $schema, $key) = @_;

    my $request = $c->plugin->defaults->request
        or return 1;

    my ($count, $data) = $c->model->database->$schema->search_contactgroup_member(
        user => $c->user,
        offset => $request->{offset},
        limit => $request->{limit},
        query => $request->{query},
        contactgroup_id => $opts->{id},
        $key => 1
    );

    $c->stash->offset($request->{offset});
    $c->stash->total($count);
    $c->stash->data($data);
    $c->view->render->json;
}

sub add_contacts_to_group {
    my ($self, $c, $opts) = @_;

    my $ids = $self->validate($c, "contact")
        or return;

    foreach my $id (@$ids) {
        $c->model->database->contact_contactgroup->create({
            contactgroup_id => $opts->{id},
            contact_id => $id
        });
    }

    $c->view->render->json;
}

sub remove_contacts_from_group {
    my ($self, $c, $opts) = @_;

    my $ids = $self->validate($c, "contact")
        or return;

    foreach my $id (@$ids) {
        $c->model->database->contact_contactgroup->delete(
            contactgroup_id => $opts->{id},
            contact_id => $id
        );
    }

    $c->view->render->json;
}

sub add_hosts_to_group {
    my ($self, $c, $opts) = @_;

    my $ids = $self->validate($c, "host")
        or return;

    foreach my $id (@$ids) {
        $c->model->database->host_contactgroup->create({
            contactgroup_id => $opts->{id},
            host_id => $id
        });
    }

    $c->view->render->json;
}

sub remove_hosts_from_group {
    my ($self, $c, $opts) = @_;

    my $ids = $self->validate($c, "host")
        or return;

    foreach my $id (@$ids) {
        $c->model->database->host_contactgroup->delete(
            contactgroup_id => $opts->{id},
            host_id => $id
        );
    }

    $c->view->render->json;
}

sub add_services_to_group {
    my ($self, $c, $opts) = @_;

    my $ids = $self->validate($c, "service")
        or return;

    foreach my $id (@$ids) {
        $c->model->database->service_contactgroup->create({
            contactgroup_id => $opts->{id},
            service_id => $id
        });
    }

    $c->view->render->json;
}

sub remove_services_from_group {
    my ($self, $c, $opts) = @_;

    my $ids = $self->validate($c, "service")
        or return;

    foreach my $id (@$ids) {
        $c->model->database->service_contactgroup->delete(
            contactgroup_id => $opts->{id},
            service_id => $id
        );
    }

    $c->view->render->json;
}

sub validate {
    my ($self, $c, $schema) = @_;

    my $ids = [ $c->req->param("id") ];
    my $invalid;

    if (!@$ids) {
        $c->plugin->error->no_objects_selected;
        return undef;
    }

    if ($schema eq "contact") {
        $invalid = $c->model->database->contact->get_invalid_contact_ids_by_company_id($c->user->{company_id}, $ids);
    } elsif ($schema eq "host") {
        $invalid = $c->model->database->host->get_invalid_host_ids_by_user_id($c->user->{id}, $ids);
    } elsif ($schema eq "service") {
        $invalid = $c->model->database->service->get_invalid_service_ids_by_user_id($c->user->{id}, $ids);
    }

    if ($invalid) {
        $c->plugin->error->objects_does_not_exists($invalid);
        return undef;
    }

    return $ids;
}

1;
