package Bloonix::Model::Schema::Maintenance;

use strict;
use warnings;
use base qw(Bloonix::DBI::Base);
use base qw(Bloonix::DBI::CRUD);

sub init {
    my $self = shift;

    $self->{schema_version} = 4;

    $self->log->warning("start upgrade database schema");
    $self->dbi->reconnect;
    $self->run_upgrade;
    $self->log->warning("upgrade finished");
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
        $self->check_company_limits;
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


sub check_company_limits {
    my $self = shift;

    my %limit = (
        max_templates               => [ qw(integer 1000) ],
        max_hosts                   => [ qw(bigint 10000) ],
        max_services                => [ qw(bigint 10000) ],
        max_services_per_host       => [ qw(smallint 100) ],
        max_contacts                => [ qw(smallint 100) ],
        max_contactgroups           => [ qw(smallint 100) ],
        max_timeperiods             => [ qw(smallint 1000) ],
        max_timeslices_per_object   => [ qw(smallint 200) ],
        max_groups                  => [ qw(smallint 100) ],
        max_users                   => [ qw(smallint 100) ],
        max_sms                     => [ qw(bigint 10000) ],
        max_dependencies_per_host   => [ qw(smallint 100) ],
        max_downtimes_per_host      => [ qw(smallint 1000) ],
        max_chart_views_per_user    => [ qw(bigint 50) ],
        max_charts_per_user         => [ qw(bigint 1000) ],
        max_metrics_per_chart       => [ qw(smallint 50) ],
        max_dashboards_per_user     => [ qw(smallint 50) ],
        max_dashlets_per_dashboard  => [ qw(smallint 50) ]
    );

    while (my ($col, $val) = each %limit) {
        if (!$self->exist(company => $col)) {
            $self->upgrade("alter table company add column $col $val->[0] not null default $val->[1]");
        }
    }
}

1;
