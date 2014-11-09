package Bloonix::Model::Schema::ContactContactgroup;

use strict;
use warnings;
use base qw(Bloonix::DBI::Base);
use base qw(Bloonix::DBI::CRUD);

sub init {
    my $self = shift;

    $self->set_unique(and => [ "contactgroup_id", "contact_id" ]);
}

1;
