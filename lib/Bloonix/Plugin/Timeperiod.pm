package Bloonix::Plugin::Timeperiod;

use strict;
use warnings;
use Bloonix::Timeperiod;

sub new {
    my ($class, $c) = @_;

    return Bloonix::Timeperiod->new();
}

1;
