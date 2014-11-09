package Bloonix::Controller::Administration;

use strict;
use warnings;

sub auto {
    my ($self, $c) = @_;

    if ($c->user->{role} !~ /^(operator|admin)\z/) {
        $c->plugin->error->no_privileges;
        return undef;
    }

    return 1;
}

1;
