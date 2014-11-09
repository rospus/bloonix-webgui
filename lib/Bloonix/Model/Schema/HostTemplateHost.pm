package Bloonix::Model::Schema::HostTemplateHost;

use strict;
use warnings;
use base qw(Bloonix::DBI::Base);
use base qw(Bloonix::DBI::CRUD);

sub init {
    my $self = shift;

    $self->set_unique(and => [ "host_id", "host_template_id" ]);
}

1;
