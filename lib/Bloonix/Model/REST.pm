package Bloonix::Model::REST;

use strict;
use warnings;
use Bloonix::REST;
use base qw(Bloonix::Accessor);

sub new {
    my ($class, $c) = @_;

    my $self = bless {
        config => $c->config->{elasticsearch},
        rest => Bloonix::REST->new($c->config->{elasticsearch}),
        log => $c->log,
        c => $c,
    }, $class;

    $self->_load(
        base => "Bloonix::Model::REST::Base",
        event => "Bloonix::Model::REST::Event",
        stats => "Bloonix::Model::REST::Stats",
        results => "Bloonix::Model::REST::Results",
    );

    return $self;
}

sub _load {
    my $self = shift;
    my $class = ref $self;

    while (@_) {
        my $accessor = shift;
        my $module = shift;
        eval "use $module";
        die $@ if $@;

        $self->{$accessor} = bless {
            schema => $self,
            rest => $self->{rest},
            log => $self->{log},
            c => $self->{c}
         }, $module;

        foreach my $method (qw/schema rest log c/) {
            no strict 'refs';
            *{"${module}::${method}"} = sub {
                my $self = shift;
                return $self->{$method};
            };
        }

        if ($module->can("init")) {
            $self->{$accessor}->init();
        }

        $class->mk_accessors($accessor);
    }
}

1;
