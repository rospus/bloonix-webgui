package Bloonix::Model::Schema::HostContactgroup;

use strict;
use warnings;
use base qw(Bloonix::DBI::Base);
use base qw(Bloonix::DBI::CRUD);

sub init {
    my $self = shift;

    $self->set_unique(and => [ "contactgroup_id", "host_id" ]);
}

1;
