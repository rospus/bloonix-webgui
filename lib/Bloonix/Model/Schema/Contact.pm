package Bloonix::Model::Schema::Contact;

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
            #options => $self->schema->company->get_companies_for_selection,
            options => [ $user->{company_id} ],
            default => $user->{company_id}
        },
        name => {
            min_size => 1,
            max_size => 100,
        },
        escalation_level => {
            options => [ 0..10 ],
            default => "0",
        },
        mail_to => {
            regex => $self->validator->regex->email,
            max_size => 100,
            optional => 1,
        },
        sms_to => {
            regex => qr/^\+{0,1}\d{0,99}\z/,
            max_size => 100,
            optional => 1,
        },
        sms_notifications_enabled => {
            options => [1,0],
            default => 1,
        },
        mail_notifications_enabled => {
            options => [1,0],
            default => 1,
        },
        mail_notification_level => {
            multioptions => [qw(ok warning critical unknown)],
            default => "ok,warning,critical,unknown",
            postprod => sub { my $val = shift; $$val = join(",", @$$val); }
        },
        sms_notification_level => {
            multioptions => [qw(ok warning critical unknown)],
            default => "critical,unknown",
            postprod => sub { my $val = shift; $$val = join(",", @$$val); }
        },
    );

}

sub by_user {
    my ($self, %opts) = @_;

    my @select = (
        table => [
            contact => "*",
            company => "company"
        ],
        join => [
            inner => {
                table => "company",
                left => "contact.company_id",
                right => "company.id"
            }
        ],
        condition => [
            where => {
                column => "company_id",
                value => $opts{user}{company_id}
            }
        ]
    );

    #if ($opts{user}{role} ne "admin") {
    #    push @select, condition => [
    #        where => {
    #            column => "company_id",
    #            value => $opts{user}{company_id}
    #        }
    #    ];
    #}

    if ($opts{order}) {
        push @select, order => $opts{order};
    }

    my ($count, $data) = $self->dbi->query(
        offset => $opts{offset},
        limit => $opts{limit},
        query => $opts{query},
        concat => [ "contact.id", "contact.name", "contact.mail_to", "contact.sms_to" ],
        delimiter => " ",
        count => "contact.id",
        select => \@select
    );

    return ($count, $data);
}

sub _is_contactgroup_member {
    my ($self, $opts) = @_;
    my $user = $opts->{user};

    my %select = (
        distinct => 1,
        table => "contact",
        column => [qw(id name mail_to)],
        join => [
            inner => {
                table => "contact_contactgroup",
                left  => "contact.id",
                right => "contact_contactgroup.contact_id"
            }
        ],
        condition => [
            where => {
                table => "contact_contactgroup",
                column => "contactgroup_id",
                value => $opts->{contactgroup_id}
            }
        ],
        order => [ asc => "id" ]
    );

    if ($user->{role} ne "admin") {
        push @{$select{condition}}, (
            and => {
                table => "contact",
                column => "company_id",
                value => $user->{company_id}
            }
        );
    }

    return %select;
}

sub _is_not_contactgroup_member {
    my ($self, $opts) = @_;
    my $user = $opts->{user};

    my %select = (
        distinct => 1,
        table => "contact",
        column => [qw(id name mail_to)],
        condition => [
            where => {
                table => "contact",
                column => "id",
                op => "not in",
                value => {
                    distinct => 1,
                    table => "contact_contactgroup",
                    column => "contact_id",
                    condition => [
                        where => {
                            table => "contact_contactgroup",
                            column => "contactgroup_id",
                            value => $opts->{contactgroup_id}
                        }
                    ]
                }
            }
        ],
        order => [ asc => "id" ]
    );

    if ($user->{role} ne "admin") {
        push @{$select{condition}}, (
            and => {
                table => "contact",
                column => "company_id",
                value => $user->{company_id}
            }
        );
    }

    return %select;
}

sub search_contactgroup_member {
    my ($self, $opts) = (shift, {@_});

    my @select = $opts->{is_in_group} 
        ? $self->_is_contactgroup_member($opts)
        : $self->_is_not_contactgroup_member($opts);

    my ($count, $contacts) = $self->dbi->query(
        offset => $opts->{offset},
        limit => $opts->{limit},
        query => $opts->{query},
        maps => {
            name => "contact.name",
            mail_to => "contact.mail_to"
        },
        concat => [
            "contact.id", "contact.name", "contact.mail_to"
        ],
        delimiter => " ",
        count => "contact.id",
        select => \@select
    );

    return ($count, $contacts);
}

sub get_invalid_contact_ids_by_company_id {
    my ($self, $company_id, $ids) = @_;
    my %check = map { $_ => 1 } @$ids;

    my ($stmt, @bind) = $self->sql->select(
        table => "contact",
        column => "id",
        condition => [
            company_id => $company_id,
            id => $ids
        ]
    );

    my $sth = $self->dbi->execute($stmt, @bind);

    while (my $row = $sth->fetchrow_hashref) {
        delete $check{$row->{id}};
    }

    return scalar keys %check ? [keys %check] : undef;
}

sub get_timeperiods {
    my ($self, $contact_id) = @_;

    my ($stmt, @bind) = $self->sql->select(
        table => [
            contact_timeperiod => [ "id", "type", "timezone" ],
            timeperiod => [ "name", "description" ]
        ],
        join => [
            inner => {
                table => "timeperiod",
                left => "contact_timeperiod.timeperiod_id",
                right => "timeperiod.id"
            }
        ],
        condition => [
            where => {
                table => "contact_timeperiod",
                column => "contact_id",
                value => $contact_id
            }
        ],
        order => [ asc => "timeperiod.name" ]
    );

    return $self->dbi->fetch($stmt, @bind);
}

1;
