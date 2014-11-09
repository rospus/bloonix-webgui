package Bloonix::Plugin::Validate;

use strict;
use warnings;
use base qw(Bloonix::Accessor);

__PACKAGE__->mk_accessors(qw/c/);

sub new {
    my ($class, $c) = @_;

    return bless { c => $c }, $class;
}

sub form {
    my ($self, $validator, @opts) = @_;
    my $c = $self->c;

    my $params = $c->req->params($validator->params);
    my $result = $validator->validate($params, @opts);

    if ($result->has_failed) {
        $c->plugin->error->form_keys_failed($result->failed);
        return undef;
    }

    return $result;
}

sub ids {
    my ($self, $ids) = @_;

    foreach my $id (@$ids) {
        if (!defined $id || $id !~ /^\d+\z/) {
            return undef;
        }
    }

    return 1;
}

1;
