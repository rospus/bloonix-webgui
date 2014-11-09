package Bloonix::Model::Schema::ServiceDowntime;

use strict;
use warnings;
use base qw(Bloonix::DBI::Base);
use base qw(Bloonix::DBI::CRUD);

sub with_service_name {
    my ($self, $host_id) = @_;

    my ($stmt, @bind) = $self->sql->select(
        table => [
            service_downtime => "*",
            service_parameter => "service_name"
        ],
        join => [
            inner => {
                table => "service",
                left => "service_downtime.service_id",
                right => "service.id"
            },
            inner => {
                table => "service_parameter",
                left => "service.service_parameter_id",
                right => "service_parameter.ref_id"
            }
        ],
        condition => [
            where => {
                table => "service",
                column => "host_id",
                value => $host_id
            }
        ],
        order => [
            desc => "id"
        ]
    );

    return $self->dbi->fetch($stmt, @bind);
}

1;
