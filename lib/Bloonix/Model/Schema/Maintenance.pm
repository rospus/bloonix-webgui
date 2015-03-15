package Bloonix::Model::Schema::Maintenance;

use strict;
use warnings;
use base qw(Bloonix::DBI::Base);
use base qw(Bloonix::DBI::CRUD);

sub init {
    my $self = shift;

    $self->{schema_version} = 4;

    #$self->log->warning("#", "-" x 50);
    $self->log->warning("start upgrade database schema");
    $self->dbi->reconnect;
    $self->run_upgrade;
    $self->log->warning("upgrade finished");
    #$self->log->warning("#", "-" x 50);
}

sub get_version {
    my $self = shift;

    $self->log->warning("get current schema version");

    return $self->all->[0]->{version};
}

sub update_version {
    my $self = shift;

    $self->log->warning("upgrade schema version to $self->{schema_version}");

    $self->dbi->do(
        $self->sql->update(
            table => $self->{table},
            data => { version => $self->{schema_version} }
        )
    );
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

# ----------------------------
# Upgrade
# ----------------------------

sub run_upgrade {
    my $self = shift;
    my $version = $self->get_version;

    $self->log->warning("found schema version $version");

    if ($version == $self->{schema_version}) {
        $self->log->warning("database schema is on the lastest version");
        return 1;
    }

    if ($version < 1) {
        $self->check_service_force_check;
    }

    if ($version <= 2) {
        $self->check_service_volatile_comment;
    }

    if ($version <= 3) {
        $self->check_company_max_columns;
    }

    $self->update_version;
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

sub check_service_volatile_comment {
    my $self = shift;

    if (!$self->exist(service => "volatile_comment")) {
        $self->upgrade("alter table service add column volatile_comment varchar(400) default 'no comment'");
    }
}


sub check_company_max_columns {
    my $self = shift;

    foreach my $col (qw/templates hosts contacts contactgroups groups timeperiods timeslices groups users/) {
        if (!$self->exist(company => "max_$col")) {
            $self->upgrade("alter table company add column max_$col integer not null default 0");
        }
    }
}

1;
