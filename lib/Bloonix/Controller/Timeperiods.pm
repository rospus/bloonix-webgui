package Bloonix::Controller::Timeperiods;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/timeperiods")->to("list");
    $c->route->map("/timeperiods/search")->to("list");
    $c->route->map("/timeperiods/:id")->to("view");
    $c->route->map("/timeperiods/:id/update/")->to("update");
    $c->route->map("/timeperiods/:id/delete/")->to("delete");
    $c->route->map("/timeperiods/:id/timeslices")->to("timeslices");
    $c->route->map("/timeperiods/:id/timeslices/create")->to("create_timeslice");
    $c->route->map("/timeperiods/:id/timeslices/:timeslice_id/delete")->to("delete_timeslice");
    $c->route->map("/timeperiods/create/")->to("create");
}

sub auto {
    my ($self, $c, $opts) = @_;

    if (!$c->user->{manage_contacts}) {
        $c->plugin->error->noauth_access;
        return undef;
    }

    if ($opts && $opts->{id}) {
        $c->stash->object(
            $c->model->database->timeperiod->find(
                condition => [ id => $opts->{id}, company_id => $c->user->{company_id} ]
            )
        );
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

    my ($count, $data) = $c->model->database->timeperiod->by_user(
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

    $c->plugin->action->store_simple("timeperiod");
}

sub update {
    my ($self, $c, $opts) = @_;

    $c->plugin->action->store_simple(timeperiod => $c->stash->object);
}

sub delete {
    my ($self, $c, $opts) = @_;

    $c->plugin->action->delete(timeperiod => $c->stash->object);
}

sub timeslices {
    my ($self, $c, $opts) = @_;

    $c->stash->data(
        $c->model->database->timeslice->search(
            condition => [ timeperiod_id => $opts->{id} ]
        )
    );

    $c->view->render->json;
}

sub create_timeslice {
    my ($self, $c, $opts) = @_;

    my $timeslice = $c->req->param("timeslice");
    my ($date, $time) = $c->plugin->timeperiod->parse($timeslice);

    if (!$timeslice || !$date) {
        return $c->plugin->error->form_parse_errors("timeslice");
    }

    $c->model->database->timeslice->create({
        timeperiod_id => $opts->{id},
        timeslice => $timeslice
    });

    $c->plugin->log_action->create(
        target => "timeslice",
        data => {
            timeperiod_id => $opts->{id},
            timeslice => $timeslice
        }
    );

    $c->view->render->json;
}

sub delete_timeslice {
    my ($self, $c, $opts) = @_;

    my $timeslice = $c->model->database->timeslice->find(
        condition => [ timeperiod_id => $opts->{id}, id => $opts->{timeslice_id} ]
    ) or return $c->plugin->error->object_does_not_exists;

    $c->model->database->timeslice->delete($opts->{timeslice_id});

    $c->plugin->log_action->delete(
        target => "timeslice",
        data => $timeslice
    );

    $c->view->render->json;
}

1;
