package Bloonix::Plugin::Lang;

use strict;
use warnings;
use Bloonix::Language;

sub new {
    my ($class, $c) = @_;

    my $lang = Bloonix::Language->new(
        join("/", $c->config->{heaven}->{base}, "..", "lang")
    );

    return $lang;
}

1;
