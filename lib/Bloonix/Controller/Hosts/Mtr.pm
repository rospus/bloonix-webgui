package Bloonix::Controller::Hosts::Mtr;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/hosts/:id/mtr")->to("mtr");
}

sub mtr {
    my ($self, $c, $opts) = @_;

    my $host = $c->stash->object;
    my $output = "";
    my $ipaddr = $host->{ipaddr};
    my $command = "mtr --no-dns -trc 3 $ipaddr";
    my $timeout = 30;

    $c->stash->data(command => $command);

    eval {
        local $SIG{__DIE__} = sub { alarm(0) };
        local $SIG{ALRM} = sub { die "timeout" };
        local $ENV{PATH} = "/usr/bin:/usr/sbin";
        alarm($timeout);
        $output = qx{$command};
        alarm(0);
    };

    if ($@) {
        if ($@ =~ /^timeout/) {
            $c->stash->data(output => "mtr timed out after $timeout seconds");
        } else {
            $c->stash->data(output => "an unexpected error occurs, please contact the administrator");
        }
    } else {
        my @lines = split /\n/, $output;
        my @header = split /\s+/, shift @lines;
        my @output;
        foreach my $line (@lines) {
            $line =~ s/^\s*//;
            my %data;
            @data{qw(step ipaddr loss snt last avg best wrst stdev)}
                =  split /\s+/, $line;
            $data{step} =~ s/\|.+//;
            $data{loss} =~ s/%//;
            push @output, \%data;
        }
        $c->stash->data(output => \@output);
    }

    $c->view->render->json;
}

1;
