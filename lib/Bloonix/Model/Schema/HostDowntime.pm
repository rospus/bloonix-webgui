package Bloonix::Model::Schema::HostDowntime;

use strict;
use warnings;
use base qw(Bloonix::DBI::Base);
use base qw(Bloonix::DBI::CRUD);

sub by_host_id {
    my ($self, $host_id) = @_;

    return $self->search(
        condition => [ host_id => $host_id ],
        order => [ desc => "id" ]
    );
}

1;
