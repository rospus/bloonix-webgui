package Bloonix::Model::Schema::Location;

use strict;
use warnings;
use base qw(Bloonix::DBI::Base);
use base qw(Bloonix::DBI::CRUD);

sub as_object {
    my $self = shift;

    my $locations = $self->all;
    my %locations;

    foreach my $location (@$locations) {
        $locations{$location->{id}} = $location;
        $locations{$location->{hostname}} = $location;
    }

    return \%locations;
}

1;
