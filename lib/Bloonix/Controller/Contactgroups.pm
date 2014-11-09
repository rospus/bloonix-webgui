package Bloonix::Controller::Contactgroups;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/contactgroups")->to("list");
    $c->route->map("/contactgroups/search")->to("list");
    $c->route->map("/contactgroups/create")->to("create");
    $c->route->map("/contactgroups/:id")->to("view");
    $c->route->map("/contactgroups/:id/update")->to("update");
    $c->route->map("/contactgroups/:id/delete")->to("delete");
}

sub auto {
    my ($self, $c, $opts) = @_;

    if (!$c->user->{manage_contacts}) {
        $c->plugin->error->noauth_access;
        return undef;
    }

    if ($opts && $opts->{id}) {
        $c->stash->object(
            $c->model->database->contactgroup->find(
                $c->user->{role} eq "admin"
                    ?  (condition => [ id => $opts->{id} ])
                    :  (condition => [ id => $opts->{id}, company_id => $c->user->{company_id} ])
            )
        );

        if (!$c->stash->object) {
            return $c->plugin->error->object_does_not_exists;
        }
    }

    return 1;
}

sub list {
    my ($self, $c) = @_;

    my $request = $c->plugin->defaults->request
        or return 1;

    my ($count, $data) = $c->model->database->contactgroup->by_user(
        offset => $request->{offset},
        limit => $request->{limit},
        query => $request->{query},
        user => $c->user,
        order => [ asc  => "name" ]
    );

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

sub create {
    my ($self, $c) = @_;

    $c->plugin->action->store_simple("contactgroup");
}

sub update {
    my ($self, $c, $opts) = @_;

    $c->plugin->action->store_simple(contactgroup => $c->stash->object);
}

sub delete {
    my ($self, $c, $opts) = @_;

    $c->plugin->action->delete(contactgroup => $c->stash->object);
}

1;
