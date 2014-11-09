package Bloonix::Controller::Contacts::Timeperiods;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/contacts/:id/timeperiods")->to("list");
    $c->route->map("/contacts/:id/timeperiods/options")->to("options");
    $c->route->map("/contacts/:id/timeperiods/add")->to("add");
    $c->route->map("/contacts/:id/timeperiods/:contact_timeperiod_id/remove")->to("remove");
}

sub begin {
    my ($self, $c) = @_;

    $c->model->database->contact_timeperiod->set($c->user);

    return 1;
}

sub list {
    my ($self, $c, $opts) = @_;

    $c->stash->data($c->model->database->contact->get_timeperiods($opts->{id}));
    $c->view->render->json;
}

sub add {
    my ($self, $c, $opts) = @_;

    $c->plugin->token->check
        or return 1;

    my $form = $c->plugin->action->check_form(create => "contact_timeperiod")
        or return 1;

    my $data = $form->data;
    $data->{contact_id} = $opts->{id};

    my $timeperiod = $c->model->database->contact_timeperiod->find(
        condition => [
            contact_id => $opts->{id},
            timeperiod_id => $data->{timeperiod_id}
        ]
    );

    if ($timeperiod) {
        return $c->plugin->error->duplicate_params("timeperiod_id");
    }

    $c->model->database->contact_timeperiod->create($data);

    $c->plugin->log_action->create(
        target => "contact_timeperiod",
        data => $data
    );

    return $c->view->render->json;
}

sub remove {
    my ($self, $c, $opts) = @_;

    $c->plugin->token->check
        or return 1;

    my $timeperiod = $c->model->database->contact_timeperiod->find(
        condition => [
            contact_id => $opts->{id},
            id => $opts->{contact_timeperiod_id}
        ]
    ) or return $c->plugin->error->object_does_not_exists;

    $c->model->database->contact_timeperiod->delete(
        contact_id => $opts->{id},
        id => $opts->{contact_timeperiod_id}
    );

    $c->plugin->log_action->delete(
        target => "contact_timeperiod",
        data => $timeperiod
    );

    return $c->view->render->json;
}

sub options {
    my ($self, $c, $opts) = @_;

    $c->stash->data(options => $c->model->database->contact_timeperiod->validator->options);
    $c->stash->data(values => $c->model->database->contact_timeperiod->validator->defaults);

    return $c->view->render->json;
}

1;
