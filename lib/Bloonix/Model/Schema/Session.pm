package Bloonix::Model::Schema::Session;

use strict;
use warnings;
use base qw(Bloonix::DBI::Base);
use base qw(Bloonix::DBI::CRUD);

sub get_user {
    my ($self, $sid, $expire) = @_;

    my ($stmt, @bind) = $self->sql->select(
        table  => [
            session => "*",
            user    => "*",
            company => [ qw(
                company sla
                max_chart_views_per_user
                max_charts_per_user
                max_contacts
                max_contactgroups
                max_dashboards_per_user
                max_dashlets_per_dashboard
                max_dependencies_per_host
                max_downtimes_per_host
                max_hosts
                max_groups
                max_metrics_per_chart
                max_services
                max_services_per_host
                max_templates
                max_timeperiods
                max_timeslices_per_object
                max_users
            ) ]
        ],
        join => [
            inner => {
                table => "user",
                left  => "session.user_id",
                right =>  "user.id",
            },
            inner => {
                table => "company",
                left  => "user.company_id",
                right => "company.id"
            }
        ],
        condition => [
            where => { table => "session", column => "sid", op => "=", value => $sid },
            and   => { table => "session", column => "expire", op => ">=", value => $expire },
        ],
    );

    return $self->dbi->unique($stmt, @bind);
}

sub delete_expired {
    my ($self, $user_id, $time) = @_;

    my ($stmt, @bind) = $self->sql->delete(
        table => $self->{table},
        condition => [
            where => { column => "user_id", op => "=",  value => $user_id },
            and   => { column => "expire",  op => "<=", value => $time },
        ],
    );

    return $self->dbi->doeval($stmt, @bind);
}

sub update_by_sid {
    my ($self, $sid, $expire) = @_;

    my ($stmt, @bind) = $self->sql->update(
        table  => $self->{table},
        column => { expire => $expire },
        condition => [ sid => $sid ],
    );

    return $self->dbi->doeval($stmt, @bind);
}

sub get_active_sessions_by_user_ids {
    my ($self, $user_ids) = @_;

    my ($stmt, @bind) = $self->sql->select(
        table => $self->{table},
        column => [ qw(user_id expire) ],
        condition => [
            where => {
                column => "expire",
                op => ">=",
                value => time
            },
            and => {
                column => "user_id",
                value => $user_ids
            }
        ]
    );

    return $self->dbi->fetchhash("user_id", $stmt, @bind);
}

1;
