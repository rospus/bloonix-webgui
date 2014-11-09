package Bloonix::Model::Schema::Token;

use strict;
use warnings;
use base qw(Bloonix::DBI::Base);
use base qw(Bloonix::DBI::CRUD);

sub delete_expired {
    my ($self, $time) = @_;
    $time ||= time;

    my ($stmt, @bind) = $self->sql->delete(
        table => "token",
        condition => [
            where => {
                column => "expire",
                op     => "<=",
                value  => $time,
            },
        ],
    );

    return $self->dbi->doeval($stmt, @bind);
}

1;
