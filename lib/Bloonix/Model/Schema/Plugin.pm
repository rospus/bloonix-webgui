package Bloonix::Model::Schema::Plugin;

use strict;
use warnings;
use base qw(Bloonix::DBI::Base);
use base qw(Bloonix::DBI::CRUD);

sub init {
    my $self = shift;

    $self->set_unique(or => [ "plugin" ]);
}

sub get_by_plugin {
    my ($self, $plugin) = @_;

    return $self->dbi->unique(
        $self->sql->select(
            table => "plugin",
            column => "*",
            condition => [ plugin => $plugin ]
        )
    );
}

sub query {
    my ($self, $opts) = (shift, {@_});

    $opts->{order} ||= [ asc => "plugin" ];

    my @select = (
        table => "plugin",
        column => "*",
        condition => [
            where => {
                column => "company_id",
                value => [ 1, $opts->{user}->{company_id} ]
            }
        ]
    );

    if ($opts->{sort}) {
        push @select, order => [ $opts->{sort}->{type} => $opts->{sort}->{by} ];
    } elsif ($opts->{order}) {
        push @select, order => $opts->{order};
    }

    my ($count, $data) = $self->dbi->query(
        offset => $opts->{offset},
        limit => $opts->{limit},
        query => $opts->{query},
        concat => [qw(plugin.id plugin.plugin plugin.command plugin.category plugin.description)],
        delimiter => " ",
        count => "plugin.id",
        select => \@select
    );

    return ($count, $data);
}

1;
