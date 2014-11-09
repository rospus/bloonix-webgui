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

1;
