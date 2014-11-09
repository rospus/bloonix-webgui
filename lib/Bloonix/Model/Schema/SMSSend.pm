package Bloonix::Model::Schema::SMSSend;

use strict;
use warnings;
use base qw(Bloonix::DBI::Base);
use base qw(Bloonix::DBI::CRUD);

sub by_query {
    my ($self, %opts) = @_;

    my @condition = (
        where => {
            table => "sms_send",
            column => "host_id",
            value => $opts{host_id}
        }
    );

    foreach my $key (qw/from_time to_time/) {
        if ($opts{$key}) {
            push @condition, and => {
                table => "sms_send",
                column => "time",
                op => $key eq "from_time" ? ">=" : "<=",
                value => $opts{$key}
            };
        }
    }

    my ($count, $data) = $self->dbi->query(
        offset => $opts{offset},
        limit => $opts{limit},
        query => $opts{query},
        concat => [qw(send_to message)],
        delimiter => " ",
        count => "*",
        select => [
            table => "sms_send",
            column => "*",
            condition => \@condition,
            order => [ desc => "time" ]
        ]
    );

    return ($count, $data);
}

1;
