package Bloonix::Model::Schema::Company;

use strict;
use warnings;
use base qw(Bloonix::DBI::Base);
use base qw(Bloonix::DBI::CRUD);

sub init {
    my $self = shift;

    $self->set_unique(or => [ "company" ]);

    $self->validator->set(
        alt_company_id => {
            regex => qr/^\d+\z/,
            default => 0
        },
        company => {
            min_size => 1,
            max_size => 100
        },
        sla => {
            options => [ 0, 1, 2, 3, 4, 5 ],
            default => 0
        },
        email => {
            regex => $self->validator->regex->email
        },
        title => {
            max_size => 30,
            optional => 1
        },
        name => {
            max_size => 100,
            optional => 1
        },
        surname => {
            max_size => 100,
            optional => 1
        },
        address1 => {
            max_size => 100,
            optional => 1
        },
        address2 => {
            max_size => 100,
            optional => 1
        },
        zipcode => {
            regex => qr/^[\w\-]{0,20}\z/,
            optional => 1
        },
        city => {
            max_size => 100,
            optional => 1
        },
        state => {
            max_size => 100,
            optional => 1
        },
        country => {
            max_size => 100,
            optional => 1
        },
        phone => {
            max_size => 100,
            optional => 1
        },
        fax => {
            max_size => 100,
            optional => 1
        },
        active => {
            options => [1,0],
            default => 1
        },
        max_templates => {
            min_val => 0,
            max_val => 2147483647,
            default => 1000
        },
        max_hosts => {
            min_val => 0,
            max_val => 9_999_999_999,
            default => 10000
        },
        max_services => {
            min_val => 0,
            max_val => 9_999_999_999,
            default => 10000 
        },
        max_services_per_host => {
            min_val => 0,
            max_val => 32767,
            default => 100
        },
        max_contacts => {
            min_val => 0,
            max_val => 32767,
            default => 100
        },
        max_contactgroups => {
            min_val => 0,
            max_val => 32767,
            default => 100
        },
        max_timeperiods => {
            min_val => 0,
            max_val => 32767,
            default => 1000
        },
        max_timeslices_per_object => {
            min_val => 0,
            max_val => 32767,
            default => 200
        },
        max_groups => {
            min_val => 0,
            max_val => 32767,
            default => 100
        },
        max_users => {
            min_val => 0,
            max_val => 32767,
            default => 100
        },
        max_dependencies_per_host => {
            min_val => 0,
            max_val => 32767,
            default => 100
        },
        max_downtimes_per_host => {
            min_val => 0,
            max_val => 32767,
            default => 1000
        },
        max_chart_views_per_user => {
            min_val => 0,
            max_val => 999_999_999,
            default => 50
        },
        max_charts_per_user => {
            min_val => 0,
            max_val => 999_999_999,
            default => 1000
        },
        max_metrics_per_chart => {
            min_val => 0,
            max_val => 100,
            default => 50
        },
        max_dashboards_per_user => {
            min_val => 0,
            max_val => 32767,
            default => 50
        },
        max_dashlets_per_dashboard => {
            min_val => 0,
            max_val => 32767,
            default => 50
        },
        max_sms => {
            min_val => 0,
            max_val => 999_999_999,
            default => 10000
        },
        sms_enabled => {
            regex => qr/^\d+\z/,
            default => 0
        },
        comment => {
            max_size => 500,
            optional => 1
        }
    );
}

sub by_company_id {
    my ($self, $opts) = (shift, {@_});

    my @select = (
        table => "company",
        column => "*",
    );

    if ($opts->{sort}) {
        push @select, order => [ $opts->{sort}->{type} => $opts->{sort}->{by} ];
    } elsif ($opts->{order}) {
        push @select, order => $opts->{order};
    }

    my ($count, $data) = $self->dbi->query(
        offset => $opts->{offset},
        limit => $opts->{limit},
        query => $opts->{query},
        concat => [qw(id alt_company_id company title name zipcode city country email)],
        delimiter => " ",
        count => "id",
        select => \@select
    );

    return ($count, $data);
}

sub get_companies_for_selection {
    my $self = shift;

    if ($self->c->user->{role} eq "admin") {
        my $companies = $self->all(order => [ asc => "company" ]);
        my @companies;
        foreach my $company (@$companies) {
            push @companies, {
                name => $company->{company},
                value => $company->{id}
            };
        }
        return \@companies;
    }

    return [ { name => $self->c->user->{company}, value => $self->c->user->{company_id} } ];
}

sub create_new_structure {
    my ($self, $data) = @_;

    my $old = $self->dbi->autocommit(0);
    my $company;

    eval {
        $self->dbi->begin;
        $self->dbi->lock("company");

        my $check_dup = $self->dbi->unique(
            $self->sql->select(
                table => "company",
                column => "*",
                condition => [ company => $data->{company} ]
            )
        );

        if ($check_dup) {
            die "duplicate company";
        }

        ## ****** company ******
        $company = $self->create_and_get($data)
            or die "unable to create company";

        ## ****** 24 x 7 ******
        my $timeperiod = $self->schema->timeperiod->create_and_get(
            company_id => $company->{id},
            name => "24x7",
            description => "Around the clock"
        ) or die "unable to create timeperiod";

        $self->schema->timeslice->create(
            timeperiod_id => $timeperiod->{id},
            timeslice => "Monday - Sunday 00:00 - 23:59"
        ) or die "unable to create timeslice";

        ## ****** Working time ******
        $timeperiod = $self->schema->timeperiod->create_and_get(
            company_id => $company->{id},
            name => "Working time",
            description => "Monday to friday from 9-17"
        ) or die "unable to create timeperiod";

        $self->schema->timeslice->create(
            timeperiod_id => $timeperiod->{id},
            timeslice => "Monday - Friday 09:00 - 17:00"
        ) or die "unable to create timeslice";

        ## ****** Off time ******
        $timeperiod = $self->schema->timeperiod->create_and_get(
            company_id => $company->{id},
            name => "Off time",
            description => "The opposite of the working time"
        ) or die "unable to create timeperiod";

        $self->schema->timeslice->create(
            timeperiod_id => $timeperiod->{id},
            timeslice => "Monday - Friday 17:01 - 23:59"
        ) or die "unable to create timeslice";

        $self->schema->timeslice->create(
            timeperiod_id => $timeperiod->{id},
            timeslice => "Monday - Friday 00:00 - 08:59"
        ) or die "unable to create timeslice";

        $self->schema->timeslice->create(
            timeperiod_id => $timeperiod->{id},
            timeslice => "Saturday - Sunday 00:00 - 23:59"
        ) or die "unable to create timeslice";

        $self->dbi->commit;
    };

    if ($@) {
        if ($@ =~ /^duplicate company/) {
            $company = { status => "dup", data => "company" };
        } else {
            eval { $self->dbi->rollback };
            $company = { status => "err" };
        }
    } else {
        $company = { status => "ok", data => $company };
    }

    $self->dbi->autocommit($old);
    return $company;
}

1;
