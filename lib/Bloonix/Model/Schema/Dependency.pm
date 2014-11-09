package Bloonix::Model::Schema::Dependency;

use strict;
use warnings;
use base qw(Bloonix::DBI::Base);
use base qw(Bloonix::DBI::CRUD);

sub init {
    my $self = shift;

    $self->set_unique(and => [ "service_id", "on_service_id" ]);

    $self->validator->set(
        type => {
            regex => qr/^(host|service)_to_(host|service)\z/
        },
        host_id => {
            regex => qr/^\d+\z/
        },
        on_host_id => {
            regex => qr/^\d+\z/
        },
        service_id => {
            regex => qr/^\d+\z/,
            optional => 1
        },
        on_service_id => {
            regex => qr/^\d+\z/,
            optional => 1
        },
        status => {
            regexcl => qr/^(OK|WARNING|CRITICAL|UNKNOWN|INFO)\z/
        },
        on_status => {
            regexcl => qr/^(OK|WARNING|CRITICAL|UNKNOWN|INFO)\z/
        },
        inherit => {
            regex => qr/^[01]\z/
        },
        timezone => {
            options => $self->c->plugin->timezone->form,
            default => "Europe/Berlin",
        },
        timeslice => {
            constraint => $self->validator->constraint->timeperiod
        }
    );
}

sub by_host_id {
    my ($self, $host_id) = @_;

    my ($stmt, @bind) = $self->sql->select(
        table => "dependency",
        column => "*",
        condition => [
            where => {
                table  => "dependency",
                column => "host_id",
                op     => "=",
                value  => $host_id,
            },
        ],
    );

    return $self->dbi->fetch($stmt, @bind);
}

sub by_host_and_service_id {
    my ($self, $host_id, $service_id) = @_;

    my ($stmt, @bind) = $self->sql->select(
        table => "dependency",
        column => "*",
        condition => [
            where => {
                table  => "dependency",
                column => "host_id",
                op     => "=",
                value  => $host_id,
            },
            and => {
                table  => "dependency",
                column => "service_id",
                op     => "=",
                value  => $service_id,
            },
        ],
    );

    return $self->dbi->fetch($stmt, @bind);
}

1;
