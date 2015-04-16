package Bloonix::Model::Schema::ServiceParameter;

use strict;
use warnings;
use base qw(Bloonix::DBI::Base);
use base qw(Bloonix::DBI::CRUD);

sub init {
    my $self = shift;

    $self->{sequence} = "service_parameter_ref_id_seq";
    $self->{unique_id_column} = "ref_id";
}

sub find_location {
    my ($self, $id) = @_;

    return $self->dbi->unique(
        $self->sql->select(
            table => "service_parameter",
            column => "ref_id",
            condition => [
                where => {
                    column => "location_options",
                    op => "like",
                    value => '%"'. $id .'"%'
                }
            ]
        )
    );
}

1;
