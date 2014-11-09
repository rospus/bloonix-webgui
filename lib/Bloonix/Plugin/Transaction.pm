package Bloonix::Plugin::Transaction;

use strict;
use warnings;
use base qw(Bloonix::Accessor);

__PACKAGE__->mk_accessors(qw/c/);

sub new {
    my ($class, $c) = @_;

    return bless { c => $c }, $class;
}

sub begin {
    my $self = shift;
    my $c = $self->c;

    $c->log->notice("BEGIN TRANSACTION");
    if ($c->model->database->begin_transaction) {
        return 1;
    }

    $c->plugin->error->action_failed;
    return undef;
}

sub rollback {
    my $self = shift;
    my $c = $self->c;

    $c->log->notice("ROLLBACK TRANSACTION");
    $c->model->database->rollback_transaction;
    $c->plugin->error->action_failed;

    return undef;
}

sub end {
    my $self = shift;
    my $c = $self->c;

    $c->log->notice("END TRANSACTION");
    if ($c->model->database->end_transaction) {
        return 1;
    }

    $c->plugin->error->action_failed;
    return undef;
}

1;
