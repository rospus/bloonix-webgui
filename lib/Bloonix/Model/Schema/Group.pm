package Bloonix::Model::Schema::Group;

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
            default => $user->{company_id},
        },
        groupname => {
            min_size => 1,
            max_size => 64,
        },
        description => {
            max_size => 100,
            optional => 1,
        },
    );
}

sub by_user {
    my ($self, $opts) = (shift, {@_});

    my @select = (
        table => [
            group => "*",
            company => "company"
        ],
        join => [
            inner => {
                table => "company",
                left => "group.company_id",
                right => "company.id"
            }
        ]
    );

    if ($opts->{user}->{role} ne "admin") {
        push @select, condition => [
            where => {
                column => "company_id",
                value => $opts->{user}->{company_id}
            }
        ];
    }

    if ($opts->{sort}) {
        push @select, order => [ $opts->{sort}->{type} => $opts->{sort}->{by} ];
    } elsif ($opts->{order}) {
        push @select, order => $opts->{order};
    }

    my ($count, $data) = $self->dbi->query(
        offset => $opts->{offset},
        limit => $opts->{limit},
        query => $opts->{query},
        concat => [qw(group.id group.groupname group.description company.company)],
        delimiter => " ",
        count => "group.id",
        select => \@select
    );

    return ($count, $data);
}

sub validate_ids_by_company_id {
    my ($self, $company_id, $group_ids) = @_;

    if (!defined $group_ids || ref $group_ids ne "ARRAY") {
        return undef;
    }

    if (!@$group_ids) {
        return undef;
    }

    foreach my $group_id (@$group_ids) {
        if ($group_id !~ /^\d+\z/) {
            return undef;
        }
    }

    my ($stmt, @bind) = $self->sql->select(
        table => "group",
        count => "id",
        condition => [
            where => {
                column => "company_id",
                value => $company_id
            },
            and => {
                column => "id",
                value => $group_ids
            }
        ]
    );

    return scalar @$group_ids == $self->dbi->count($stmt, @bind);
}

1;
