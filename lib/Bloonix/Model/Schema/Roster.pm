package Bloonix::Model::Schema::Roster;

use strict;
use warnings;
use base qw(Bloonix::DBI::Base);
use base qw(Bloonix::DBI::CRUD);

sub init {
    my $self = shift;

    $self->validator->set(
        roster => {
            min_size => 1,
            max_size => 100,
        },
        description => {
            max_size => 100,
            optional => 1,
        },
        active => {
            options => [ 1,0 ],
            default => 1,
        }
    );
}

sub by_user {
    my ($self, %opts) = @_;

    my @select = (
        table => [
            roster => "*",
            company => "company"
        ],
        join => [
            inner => {
                table => "company",
                left => "roster.company_id",
                right => "company.id"
            }
        ]
    );

    if ($opts{user}{role} ne "admin") {
        push @select, condition => [
            where => {
                column => "company_id",
                value => $opts{user}{company_id}
            }
        ]
    }

    if ($opts{order}) {
        push @select, order => $opts{order};
    }

    my ($count, $data) = $self->dbi->query(
        offset => $opts{offset},
        limit => $opts{limit},
        query => $opts{query},
        concat => [qw(id roster description active)],
        delimiter => " ",
        count => "roster.id",
        select => \@select
    );

    return ($count, $data);
}

1;
