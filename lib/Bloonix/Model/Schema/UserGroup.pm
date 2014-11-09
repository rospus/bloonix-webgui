package Bloonix::Model::Schema::UserGroup;

use strict;
use warnings;
use base qw(Bloonix::DBI::Base);
use base qw(Bloonix::DBI::CRUD);

sub init {
    my $self = shift;

    $self->set_unique(and => [ "user_id", "group_id" ]);
    $self->has_unique_id(0);
}

sub can_create_service {
    my $self = shift;

    return $self->_can("create_service", @_);
}

sub can_update_service {
    my $self = shift;

    return $self->_can("update_service", @_);
}

sub can_delete_service {
    my $self = shift;

    return $self->_can("delete_service", @_);
}

sub can_create_host {
    my $self = shift;

    return $self->_can("create_host", @_);
}

sub can_update_host {
    my $self = shift;

    return $self->_can("update_host", @_);
}

sub can_delete_host {
    my $self = shift;

    return $self->_can("delete_host", @_);
}

sub _can {
    my ($self, $action, $user_id, $host_id) = @_;

    my ($stmt, @bind) = $self->sql->select(
        table  => "user_group",
        column => "*",
        join   => [
            inner => {
                table => "host_group",
                left  => "user_group.group_id",
                right => "host_group.group_id",
            },
        ],
        condition => [
            "user_group.user_id" => $user_id,
            "host_group.host_id" => $host_id,
            "user_group.$action" => 1,
        ],
    );

    return $self->dbi->unique($stmt, @bind);
}

1;
