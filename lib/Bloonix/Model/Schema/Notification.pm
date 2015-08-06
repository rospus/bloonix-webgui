package Bloonix::Model::Schema::Notification;

use strict;
use warnings;
use base qw(Bloonix::DBI::Base);
use base qw(Bloonix::DBI::CRUD);

sub by_query {
    my ($self, %opts) = @_;

    my @condition = (
        where => {
            table => "notification",
            column => "host_id",
            value => $opts{host_id}
        }
    );

    foreach my $key (qw/from_time to_time/) {
        if ($opts{$key}) {
            push @condition, and => {
                table => "notification",
                column => "time",
                op => $key eq "from_time" ? ">=" : "<=",
                value => $opts{$key}
            };
        }
    }

    if ($opts{type}) {
        $opts{type} =~ s/\s//g;
        $opts{type} =~ s/,+/,/g;

        if ($opts{type} ne ",") {
            if ($opts{type} =~ /,/) {
                push @condition, and => {
                    table => "notification",
                    column => "message_service",
                    op => "in",
                    value => [ split /,/, $opts{type} ]
                };
            } else {
                push @condition, and => {
                    table => "notification",
                    column => "message_service",
                    op => "=",
                    value => $opts{type}
                };
            }
        }
    }

    my ($count, $data) = $self->dbi->query(
        offset => $opts{offset},
        limit => $opts{limit},
        query => $opts{query},
        concat => [qw(send_to subject message)],
        delimiter => " ",
        count => "*",
        select => [
            table => "notification",
            column => "*",
            condition => \@condition,
            order => [ desc => "time" ]
        ]
    );

    return ($count, $data);
}

1;
