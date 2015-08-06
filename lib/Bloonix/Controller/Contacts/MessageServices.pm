package Bloonix::Controller::Contacts::MessageServices;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/contacts/:id/message-services")->to("list");
    $c->route->map("/contacts/:id/message-services/options")->to("options");
    $c->route->map("/contacts/:id/message-services/add")->to("add");
    $c->route->map("/contacts/:id/message-services/:contact_message_services_id/update")->to("update");
    $c->route->map("/contacts/:id/message-services/:contact_message_services_id/remove")->to("remove");
    $c->route->map("/contacts/:id/message-services/:contact_message_services_id/options")->to("options");
}

sub list {
    my ($self, $c, $opts) = @_;

    $c->stash->data($c->model->database->contact_message_services->get_message_services($opts->{id}));
    $c->view->render->json;
}

sub add {
    my ($self, $c, $opts) = @_;

    $c->plugin->token->check
        or return 1;

    my $form = $c->plugin->action->check_form(create => "contact_message_services")
        or return 1;

    my $data = $form->data;
    $data->{contact_id} = $opts->{id};

    $c->model->database->contact_message_services->create($data);

    $c->plugin->log_action->create(
        target => "contact_message_services",
        data => $data
    );

    return $c->view->render->json;
}

sub update {
    my ($self, $c, $opts) = @_;

    my $message_service = $c->model->database->contact_message_services->find(
        condition => [
            contact_id => $opts->{id},
            id => $opts->{contact_message_services_id}
        ]
    ) or return $c->plugin->error->object_does_not_exists;

    $c->plugin->token->check
        or return 1;

    my $form = $c->plugin->action->check_form(update => "contact_message_services")
        or return 1;

    my $data = $form->data;
    $data->{contact_id} = $opts->{id};

    $c->model->database->contact_message_services->update(
        data => $data,
        condition => [
            contact_id => $opts->{id},
            id => $opts->{contact_message_services_id}
        ]
    );

    $c->plugin->log_action->update(
        target => "contact_message_services",
        data => $data,
        old => $message_service
    );

    return $c->view->render->json;
}

sub remove {
    my ($self, $c, $opts) = @_;

    $c->plugin->token->check
        or return 1;

    my $message_service = $c->model->database->contact_message_services->find(
        condition => [
            contact_id => $opts->{id},
            id => $opts->{contact_message_services_id}
        ]
    ) or return $c->plugin->error->object_does_not_exists;

    $c->model->database->contact_message_services->delete(
        contact_id => $opts->{id},
        id => $opts->{contact_message_services_id}
    );

    $c->plugin->log_action->delete(
        target => "contact_message_services",
        data => $message_service
    );

    return $c->view->render->json;
}

sub options {
    my ($self, $c, $opts) = @_;

    if ($opts->{contact_message_services_id}) {
        my $message_service = $c->model->database->contact_message_services->find(
            condition => [
                contact_id => $opts->{id},
                id => $opts->{contact_message_services_id}
            ]
        ) or return $c->plugin->error->object_does_not_exists;
        $c->stash->data(values => $message_service);
    } else {
        $c->stash->data(values => $c->model->database->contact_message_services->validator->defaults);
    }

    $c->stash->data(options => $c->model->database->contact_message_services->validator->options);
    $c->stash->data(mandatory => $c->model->database->contact_message_services->validator->mandatory);
    $c->stash->data(optional => $c->model->database->contact_message_services->validator->optional);

    return $c->view->render->json;
}

1;
