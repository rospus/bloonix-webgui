package Bloonix::Plugin::Action;

use strict;
use warnings;

sub new {
    my ($class, $c) = @_;

    my $self = bless { c => $c }, $class;
    $self->{init} = {
        user => 1
    };

    return bless { c => $c }, $class;
}

sub options {
    my ($self, $schema, $object, $callback) = @_;
    my $c = $self->{c};

    if ($c->model->database->$schema->can("set")) {
        $c->model->database->$schema->set($c->user);
    }

    if (ref $object eq "HASH") {
        $c->stash->data(values => $object);
    } elsif ($object) {
        $c->stash->{data}->{values} = $c->model->database->$schema->get($object)
            or return $c->plugin->error->object_does_not_exists;
    } else {
        $c->stash->data(values => $c->model->database->$schema->validator->defaults);
    }

    my $options = $c->model->database->$schema->validator->options;

    if ($callback) {
        &$callback($c->stash->{data}->{values});
    }

    $c->stash->data(options => $options);
    $c->stash->data(mandatory => $c->model->database->$schema->validator->mandatory);
    $c->stash->data(optional => $c->model->database->$schema->validator->optional);
    $c->view->render->json;
}

sub store {
    my ($self, $schema, $object, @dup_keys) = @_;
    my $c = $self->{c};
    my $action = $object ? "update" : "create";
    my $object_id = $object ? $object->{id} : 0;

    $c->plugin->token->check
        or return 1;

    my $form = $self->check_form($action, $schema)
        or return 1;

    foreach my $key (@dup_keys) {
        if (!exists $form->data->{$key}) {
            $form->data->{$key} = $object->{$key};
        }
    }

$c->log->dump(notice => $form->data);

    my $result = $object
        ? $c->model->database->$schema->update_unique($object->{id} => $form->data)
        : $c->model->database->$schema->create_unique($form->data);

    $self->check_crud($result)
        or return 1;

    if ($object) {
        $c->plugin->log_action->update(
            target => $schema,
            data => $result->data,
            old => $object
        );
    } else {
        $c->plugin->log_action->create(
            target => $schema,
            data => $result->data,
        );
    }

    $c->stash->{status} = "ok";
    $c->stash->{data} = $result->data;
    $c->view->render->json;
}

sub store_simple {
    my ($self, $schema, $object, $callback_in, $callback_out) = @_;
    my $c = $self->{c};
    my $action = $object ? "update" : "create";

    $c->plugin->token->check 
        or return 1;

    if ($c->model->database->$schema->can("set")) {
        $c->model->database->$schema->set($c->user);
    }

    my $form = $self->check_form($action, $schema)
        or return 1;

    if ($callback_in) {
        &$callback_in($form->data);
    }

    if ($object) {
        $c->model->database->$schema->update($object->{id} => $form->data)
            or return $c->plugin->error->action_failed;

        $c->stash->{data} = $c->model->database->$schema->get($object->{id});

        $c->plugin->log_action->update(
            target => $schema,
            data => $form->data,
            old => $object
        );
    } else {
        $c->stash->{data} = $c->model->database->$schema->create_and_get($form->data)
            or return $c->plugin->error->action_failed;

        $c->plugin->log_action->create(
            target => $schema,
            data => $form->data
        );
    }

    if ($callback_out) {
        &$callback_out($c->stash->{data});
    }

    $c->view->render->json;
}

sub delete {
    my ($self, $schema, $object) = @_;
    my $c = $self->{c};

    $c->plugin->token->check
        or return 1;

    if (ref $object ne "HASH") { # then $object is the ID
        $object = $c->model->database->$schema->get($object)
            or return $c->plugin->error->object_does_not_exists;
    }

    $c->model->database->$schema->delete($object->{id});
    $c->plugin->log_action->delete(target => $schema, data => $object);
    $c->view->render->json;
}

sub check_form {
    my ($self, $action, $schema) = @_;
    my $c = $self->{c};

    my @opts = $action eq "create"
        ? (force_defaults => 1)
        : (ignore_missing => 1);

    my $form = $c->model->database->$schema->validator->validate($c->req, @opts);

    if ($form->has_failed) {
        $c->plugin->error->form_parse_errors($form->failed);
        return undef;
    }

    return $form;
}

sub check_crud {
    my ($self, $result) = @_;
    my $c = $self->{c};

    if ($result->is_dup) {
        $c->plugin->error->duplicate_params($result->data);
        return undef;
    } elsif ($result->has_failed) {
        $c->plugin->error->action_failed;
        return undef;
    }

    return 1;
}

1;
