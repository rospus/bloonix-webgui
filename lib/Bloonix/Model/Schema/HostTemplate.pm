package Bloonix::Model::Schema::HostTemplate;

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
        name => {
            min_size => 1,
            max_size => 100
        },
        description => {
            min_size => 0,
            max_size => 100
        },
        variables => {
            constraint => $self->validator->constraint->param_value,
            default => "{}"
        },
        tags => {
            regex => qr/^[^\/]{0,100}\z/,
            default => ""
        }
    );
}

sub by_user_id {
    my ($self, $opts) = (shift, {@_});

    my @select = (
        table => [ host_template => "*" ],
        condition => [
            where => {
                table => "host_template",
                column => "company_id",
                value => $opts->{user}->{company_id}
            }
        ]
    );

    if ($opts->{sort}) {
        push @select, order => [ $opts->{sort}->{type} => $opts->{sort}->{by} ];
    } elsif ($opts->{order}) {
        push @select, order => $opts->{order};
    }

    my ($count, $hosts) = $self->dbi->query(
        offset => $opts->{offset},
        limit => $opts->{limit},
        query => $opts->{query},
        maps => {
            n => "host_template.name", name => "host_template.name",
            d => "host_template.description", description => "host_template.description"
        },
        concat => [
            "host_template.name", "host_template.description"
        ],
        delimiter => " ",
        count => "host_template.id",
        select => \@select,
    );

    return ($count, $hosts);
}

sub validate_ids_by_company_id {
    my ($self, $company_id, $template_ids) = @_;

    if (!@$template_ids) {
        return undef;
    }

    foreach my $template_id (@$template_ids) {
        if ($template_id !~ /^\d+\z/) {
            return undef;
        }
    }

    my ($stmt, @bind) = $self->sql->select(
        table => "host_template",
        count => "id",
        condition => [
            where => {
                column => "company_id",
                value => $company_id
            },
            and => {
                column => "id",
                value => $template_ids
            }
        ]
    );

    return scalar @$template_ids == $self->dbi->count($stmt, @bind);
}

sub get_members {
    my ($self, $id) = @_;

    my ($stmt, @bind) = $self->sql->select(
        distinct => 1,
        table => "host",
        column => [ qw(id hostname ipaddr) ],
        join => [
            inner => {
                table => "host_template_host",
                left => "host.id",
                right => "host_template_host.host_id"
            }
        ],
        condition => [
            where => {
                table => "host_template_host",
                column => "host_template_id",
                value => $id
            }
        ]
    );

    return $self->dbi->fetch($stmt, @bind);
}

sub get_nonmembers {
    my ($self, $id, $company_id) = @_;

    my $hosts = $self->get_members($id);
    my $host_ids = [ 0 ];
    foreach my $host (@$hosts) {
        push @$host_ids, $host->{id};
    }

    my ($stmt, @bind) = $self->sql->select(
        table => "host",
        column => [ qw(id hostname ipaddr) ],
        condition => [
            where => {
                table => "host",
                column => "company_id",
                value => $company_id
            },
            and => {
                table => "host",
                column => "id",
                op => "not in",
                value => $host_ids
            }
        ]
    );

    return $self->dbi->fetch($stmt, @bind);
}

sub by_tags {
    my ($self, $company_id, $tags) = @_;
    my @pre;

    foreach my $tag (@$tags) {
        my $cond = @pre ? "or" : "and";
        push @pre, (
            $cond => {
                table => "host_template",
                column => "tags",
                op => "like",
                value => "%/$tag/%"
            }
        );
    }

    my ($stmt, @bind) = $self->sql->select(
        table => "host_template",
        column => "id",
        condition => [
            where => {
                table => "host_template",
                column => "company_id",
                value => $company_id
            },
            pre => \@pre
        ]
    );

    my $rows = $self->dbi->fetch($stmt, @bind);
    my @ids;

    foreach my $row (@$rows) {
        push @ids, $row->{id};
    }

    return \@ids;
}

sub get_names_by_host_id {
    my ($self, $host_id) = @_;

    my $rows = $self->dbi->fetch(
        $self->sql->select(
            table => "host_template",
            column => "name",
            join => [
                inner => {
                    table => "host_template_host",
                    left => "host_template.id",
                    right => "host_template_host.host_template_id"
                }
            ],
            condition => [
                where => {
                    table => "host_template_host",
                    column => "host_id",
                    value => $host_id
                }
            ]
        )
    );

    my @names;
    foreach my $row (@$rows) {
        push @names, $row->{name};
    }
    return join(", ", @names);
}

1;
