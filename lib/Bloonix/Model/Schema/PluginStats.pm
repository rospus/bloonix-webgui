package Bloonix::Model::Schema::PluginStats;

use strict;
use warnings;
use base qw(Bloonix::DBI::Base);
use base qw(Bloonix::DBI::CRUD);

sub get_statkeys_by_plugin {
    my ($self, $plugin_id) = @_;
    my @keys;

    my $rows = $self->dbi->fetch(
        $self->sql->select(
            table => "plugin_stats",
            column => "statkey",
            condition => [ plugin_id => $plugin_id ]
        )
    );

    foreach my $row (@$rows) {
        push @keys, $row->{statkey};
    }

    return \@keys;
}

sub get_plugin_by_statkey {
    my ($self, $plugin_id) = @_;
    my %data;

    my $rows = $self->dbi->fetch(
        $self->sql->select(
            table => "plugin_stats",
            column => "*",
            condition => [ plugin_id => $plugin_id ]
        )
    );

    foreach my $row (@$rows) {
        $data{ $row->{statkey} } = $row;
    }

    return \%data;
}

sub as_hash_by_plugin_ids {
    my ($self, $plugin_ids) = @_;
    my %data;

    my $rows = $self->dbi->fetch(
        $self->sql->select(
            table => "plugin_stats",
            column => "*",
            condition => [ plugin_id => $plugin_ids ]
        )
    );

    foreach my $row (@$rows) {
        $data{$row->{plugin_id}}->{$row->{statkey}} = $row;
    }

    return \%data;
}

1;
