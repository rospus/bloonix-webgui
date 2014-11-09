package Bloonix::Controller::Rosters;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("list")->to("list");
    $c->route->map("search")->to("list");
}

sub auto {
    my ($self, $c) = @_;

    if (!$c->user->{manage_contacts}) {
        $c->plugin->error->noauth_access;
        return undef;
    }

    return 1;
}

sub list {
    my ($self, $c) = @_;

    my $request = $c->plugin->defaults->request
        or return 1;

    my ($count, $data) = $c->model->database->roster->by_user(
        offset => $request->{offset},
        limit => $request->{limit},
        query => $request->{query},
        user => $c->user,
        order => [ asc  => "roster" ]
    );

    $c->stash->offset($request->{offset});
    $c->stash->total($count);
    $c->stash->data($data);
    $c->view->render->json;
}

1;
