package Bloonix::Plugin::Timezone;

use strict;
use warnings;
use Bloonix::Timezone;

sub new {
    my ($class, $c) = @_;

    return Bloonix::Timezone->new();
}

1;
