package Bloonix::Controller::Contacts;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/contacts")->to("list");
    $c->route->map("/contacts/options")->to("options");
    $c->route->map("/contacts/create")->to("create");
    $c->route->map("/contacts/search")->to("list");
    $c->route->map("/contacts/:id")->to("view");
    $c->route->map("/contacts/:id/options")->to("options");
    $c->route->map("/contacts/:id/update")->to("update");
    $c->route->map("/contacts/:id/delete")->to("delete");
}

sub auto {
    my ($self, $c) = @_;

    if (!$c->user->{manage_contacts}) {
        $c->plugin->error->noauth_access;
        return undef;
    }

    return 1;
}

sub begin {
    my ($self, $c) = @_;

    $c->model->database->contact->set($c->user);

    return 1;
}

sub view {
    my ($self, $c, $opts) = @_;

    $c->stash->data(
        $c->model->database->contact->find(
            condition => [ id => $opts->{id}, company_id => $c->user->{company_id} ]
        )
    ) or return $c->plugin->error->object_does_not_exists;

    $c->view->render->json;
}

sub list {
    my ($self, $c) = @_;

    my $request = $c->plugin->defaults->request
        or return 1;

    my ($count, $data) = $c->model->database->contact->by_user(
        offset => $request->{offset},
        limit => $request->{limit},
        query => $request->{query},
        user => $c->user,
        order => [ asc  => "name" ],
    );

    $c->stash->offset($request->{offset});
    $c->stash->total($count);
    $c->stash->data($data);
    $c->view->render->json;
}

sub options {
    my ($self, $c, $opts) = @_;
    $opts->{id} ||= 0;

    if ($opts->{id}) {
        my $contact = $c->user->{role} eq "admin"
            ? $c->model->database->contact->get($opts->{id})
            : $c->model->database->contact->find(
                condition => [ id => $opts->{id}, company_id => $c->user->{company_id} ]
              );

        if (!$contact) {
            return $c->plugin->error->object_does_not_exists;
        }

        $c->stash->data(values => $contact);
    } else {
        $c->stash->data(values => $c->model->database->contact->validator->defaults);
    }

    my $action = $opts->{id} ? "update" : "create";
    $c->stash->data(options => $c->model->database->contact->validator->options);
    $c->view->render->json;
}

sub create {
    my ($self, $c) = @_;

    my $count_contacts = $c->model->database->contact->count(
        id => condition => [ company_id => $c->user->{company_id} ]
    );

    if ($count_contacts >= $c->user->{max_contacts}) {
        return $c->plugin->error->limit_error("err-835" => $c->user->{max_contacts});
    }

    return $c->plugin->action->store("contact");
}

sub update {
    my ($self, $c, $opts) = @_;

    my $contact = $c->user->{role} eq "admin"
        ? $c->model->database->contact->get($opts->{id})
        : $c->model->database->contact->find(condition => [ id => $opts->{id}, company_id => $c->user->{company_id} ]);

    if (!$contact) {
        return $c->plugin->error->object_does_not_exists;
    }

    return $c->plugin->action->store(contact => $contact);
}

sub delete {
    my ($self, $c, $opts) = @_;

    my $contact = $c->user->{role} eq "admin"
        ? $c->model->database->contact->get($opts->{id})
        : $c->model->database->contact->find(condition => [ id => $opts->{id}, company_id => $c->user->{company_id} ]);

    if (!$contact) {
        return $c->plugin->error->object_does_not_exists;
    }

    $c->model->database->contact->delete($opts->{id});

    $c->plugin->log_action->delete(
        target => "contact",
        data => $contact
    );

    $c->view->render->json;
}

1;
