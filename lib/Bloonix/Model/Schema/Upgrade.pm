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

    my $stmt = qq{
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = ?
        and column_name = ?
    };

    my $def = qq{
        alter table service add column force_check char(1) default '0'
    };

    my $col = $self->dbi->unique($stmt, "service", "force_check");

    if (!defined $col) {
        $self->log->warning("upgrade table service: $def");
        $self->dbi->do($def);
    }
}

1;
