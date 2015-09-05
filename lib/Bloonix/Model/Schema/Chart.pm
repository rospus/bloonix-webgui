package Bloonix::Model::Schema::Chart;

use strict;
use warnings;
use base qw(Bloonix::DBI::Base);
use base qw(Bloonix::DBI::CRUD);

sub init {
    my $self = shift;

    $self->set_unique(or=> [ "gid" ]);
}

sub by_user_id {
    my ($self, %opts) = @_;

    my ($join, $condition) = $self->_by_user_id($opts{user_id});

    if ($opts{host_id}) {
        push @$condition, and => {
            table => "service",
            column => "host_id",
            value => $opts{host_id}
        };
    }

    my @select = (
        distinct => 1,
        table => [
            service => [ "id AS service_id", "subkeys" ],
            service_parameter => "service_name",
            host => [ "id AS host_id", qw(hostname ipaddr) ],
            chart => [ "id AS chart_id", qw(title options) ],
            plugin => [ "id AS plugin_id", "plugin" ]
        ],
        join => $join,
        condition => $condition,
        order => [ asc => [ qw(host.hostname service_parameter.service_name) ] ]
    );

    my ($count, $charts) = $self->dbi->query(
        offset => $opts{offset},
        limit => $opts{limit},
        query => $opts{query},
        concat => [
            "host.hostname", "host.ipaddr", "service_parameter.service_name",
            "plugin.plugin", "chart.title"
        ],
        delimiter => " ",
        count => [ "service.id", "host.id", "chart.id" ],
        select => \@select
    );

    return ($count, $charts);
}

sub by_user_chart_and_service_id {
    my ($self, $user_id, $chart_id, $service_id) = @_;

    my ($join, $condition) = $self->_by_user_id($user_id);

    push @$condition, and => {
        table => "service",
        column => "id",
        value => $service_id
    };

    push @$condition, and => {
        table => "chart",
        column => "id",
        value => $chart_id
    };

    my ($stmt, @bind) = $self->sql->select(
        distinct => 1,
        table => [
            service => [ "id AS service_id", "subkeys" ],
            service_parameter => [qw(interval timeout service_name) ],
            host => [ "id AS host_id", "interval AS host_interval", "timeout AS host_timeout", qw(hostname ipaddr) ],
            chart => [ "id AS chart_id", qw(title options) ],
            plugin => [ "id AS plugin_id", qw(plugin command category datatype description), "subkey AS subkey_name" ],
        ],
        join => $join,
        condition => $condition
    );

    return $self->dbi->unique($stmt, @bind);
}

sub check_by_chart_service_and_user_id {
    my ($self, $chart_id, $service_id, $user_id) = @_;

    my ($join, $condition) = $self->_by_user_id($user_id);

    push @$condition, and => {
        table => "service",
        column => "id",
        value => $service_id
    };

    push @$condition, and => {
        table => "chart",
        column => "id",
        value => $chart_id
    };

    my ($stmt, @bind) = $self->sql->select(
        table => [
            service => ["id AS service_id"],
            host => ["id AS host_id"],
            chart => ["id AS chart_id"]
        ],
        join => $join,
        condition => $condition
    );

    return $self->dbi->unique($stmt, @bind);
}

sub textsearch {
    my ($self, %opts) = @_;

    my ($join, $condition) = $self->_by_user_id($opts{user_id});
    push @$condition, pre => [ and => $self->_search($opts{query}) ];

    my ($stmt, @bind) = $self->sql->select(
        distinct => 1,
        table => [
            service_parameter => [ "service_name" ],
            host => [ qw(hostname ipaddr) ],
            chart => [ qw(title) ],
            plugin => [ qw(plugin) ]
        ],
        join => $join,
        condition => $condition,
        order => [ asc => [qw(host.hostname service_parameter.service_name)] ],
        limit => $opts{limit},
    );

    return $self->dbi->fetch($stmt, @bind);
}

sub _search {
    my ($self, $query) = @_;

    return $self->sql->search(
        concat => [
            "host.hostname", "host.ipaddr", "service_parameter.service_name",
            "chart.plugin", "chart.title"
        ],
        query => $query,
        delimiter => " "
    );
}

sub _by_user_id {
    my ($self, $user_id) = @_;

    my $join = [
        inner => {
            table => "service_parameter",
            left => "service.service_parameter_id",
            right => "service_parameter.ref_id"
        },
        inner => {
            table => "host",
            left => "service.host_id",
            right => "host.id"
        },
        inner => {
            table => "host_group",
            left => "host.id",
            right => "host_group.host_id"
        },
        inner => {
            table => "user_group",
            left => "host_group.group_id",
            right => "user_group.group_id"
        },
        inner => {
            table => "chart",
            left => "service_parameter.plugin_id",
            right => "chart.plugin_id"
        },
        inner => {
            table => "plugin",
            left => "service_parameter.plugin_id",
            right => "plugin.id"
        }
    ];

    my $condition = [
        where => {
            table => "user_group",
            column => "user_id",
            value => $user_id,
        },
    ];

    return ($join, $condition);
}

1;
