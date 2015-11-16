package Bloonix::Plugin::CCodes;

use strict;
use warnings;
use Bloonix::CCodes;

sub new {
    return bless {}, shift;
}

sub country {
    return Bloonix::CCodes->form("country");
}

sub continent {
    return Bloonix::CCodes->form("continent");
}

1;
