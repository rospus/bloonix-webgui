package Bloonix::Model::Schema::Timeperiod;

use strict;
use warnings;
use base qw(Bloonix::DBI::Base);
use base qw(Bloonix::DBI::CRUD);

sub set {
    my ($self, $user) = @_;

    if (!$user || ref $user ne "HASH") {
        die "missing user";
    }

    $self->validator->set(
        company_id => {
            options => $self->schema->company->get_companies_for_selection,
            default => $user->{company_id}
        },
        name => {
            min_size => 1,
            max_size => 40
        },
        description => {
            max_size => 100
        }
    );
}

sub by_user {
    my ($self, %opts) = @_;

    my @select = (
        table => [
            timeperiod => "*",
            company => "company"
        ],
        join => [
            inner => {
                table => "company",
                left => "timeperiod.company_id",
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
        concat => [ "timeperiod.name", "timeperiod.description" ],
        delimiter => " ",
        count => "timeperiod.id",
        select => \@select
    );

    return ($count, $data);
}

sub by_company_id_for_form {
    my ($self, $company_id) = @_;
    my @timeperiod;

    my $timeperiod = $self->search(
        condition => [ company_id => $company_id ]
    );

    foreach my $t (@$timeperiod) {
        push @timeperiod, {
            name  => $t->{name},
            value => $t->{id},
        };
    }

    return \@timeperiod;
}

1;
