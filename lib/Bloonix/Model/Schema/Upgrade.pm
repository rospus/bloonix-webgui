package Bloonix::Model::Schema::Upgrade;

use strict;
use warnings;
use base qw(Bloonix::DBI::Base);

sub init {
    my $self = shift;

    $self->dbi->reconnect;
    $self->check_service_force_check;
}

sub check_service_force_check {
    my $self = shift;

    if (!$self->exist(service => "force_check")) {
        $self->upgrade("alter table service add column force_check char(1) default '0'");
    }

    if (!$self->exist(host => "data_retention")) {
        $self->upgrade("alter table host add column data_retention smallint default 3650");
    }
}

sub upgrade {
    my ($self, $stmt) = @_;

    $self->log->warning("upgrade table: $stmt");
    $self->dbi->do($stmt);
}

sub exist {
    my ($self, $table, $column) = @_;

    my $stmt = qq{
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = ?
        AND column_name = ?
    };

    return $self->dbi->unique($stmt, $table, $column);
}

1;
