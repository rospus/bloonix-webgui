package Bloonix::Model::Schema::UserChart;

use strict;
use warnings;
use base qw(Bloonix::DBI::Base);
use base qw(Bloonix::DBI::CRUD);

sub init {
    my $self = shift;

    $self->validator->set(
        title => {
            min_size => 1,
            max_size => 50,
        },
        subtitle => {
            min_size => 0,
            max_size => 50,
            optional => 1
        },
        yaxis_label => {
            min_size => 0,
            max_size => 30,
            optional => 1
        },
        description => {
            min_size => 0,
            max_size => 100,
            optional => 1
        },
        options => {
            type => "array",
            constraint => sub {
                my $opts = shift;

                if (!$opts || ref $opts ne "ARRAY") {
                    return undef;
                }

                foreach my $opt (@$opts) {
                    if (!$opt || ref $opt ne "HASH") {
                        return undef;
                    }

                    foreach my $key (keys %$opt) {
                        if ($key !~ /^(plugin_id|service_id|color|statkey)\z/) {
                            return undef;
                        }
                    }

                    foreach my $key (qw/plugin_id service_id/) {
                        if (!$opt->{$key} || $opt->{$key} !~ /^\d+\z/) {
                            return undef;
                        }
                    }

                    if ($opt->{color} && $opt->{color} !~ /^#{0,1}[0-9a-fA-F]{6}\z/) {
                        return undef;
                    }

                    if (!$opt->{statkey} || $opt->{statkey} !~ /^[a-zA-Z_0-9\-\.]+\z/) {
                        return undef;
                    }
                }

                return 1;
            }
        }
    );
}

sub by_user_id {
    my $self = shift;
    my $opts = {@_};
    my $user = $opts->{user};
    my @condition;

    my @select = (
        table => "user_chart",
        column => "*",
        condition => [
            where => {
                column => "user_id",
                value => $user->{id}
            }
        ]
    );

    if ($opts->{sort}) {
        push @select, order => [ $opts->{sort}->{type} => $opts->{sort}->{by} ];
    } elsif ($opts->{order}) {
        push @select, order => $opts->{order};
    }

    my ($count, $charts) = $self->dbi->query(
        offset => $opts->{offset},
        limit => $opts->{limit},
        query => $opts->{query},
        maps => { t => "user_chart.title", title => "user_chart.title" },
        concat => [ "user_chart.title", "user_chart.yaxis_label", "user_chart.description" ],
        delimiter => " ",
        count => "user_chart.id",
        select => \@select,
    );

    return ($count, $charts);
}

1;
