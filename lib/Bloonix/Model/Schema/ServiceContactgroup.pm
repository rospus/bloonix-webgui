package Bloonix::Model::Schema::ServiceContactgroup;

use strict;
use warnings;
use base qw(Bloonix::DBI::Base);
use base qw(Bloonix::DBI::CRUD);

sub init {
    my $self = shift;

    $self->set_unique(and => [ "contactgroup_id", "service_id" ]);
}

1;
