package Bloonix::Plugin::Report;

use strict;
use warnings;

sub new {
    my $class = shift;

    return bless { }, $class;
}

sub generate {
    my ($self, $c, $host, $from, $to) = @_;

    my $host_id   = $host->{id};
    my $services = $c->model->database->service->by_host_id($host_id);

    my ($report, $availability) = ({ }, { });

    if (!$services || !@$services) {
        return undef;
    }

    foreach my $service (@$services) {
        my $id = delete $service->{id};

        $report->{$id} = {
            service_name => $service->{service_name},
            last_check   => $service->{last_check},
            status       => $service->{status},
        };

        foreach my $status (qw/ok warning critical unknown info/) {
            $report->{$id}->{"time_$status"} = 0;
        }
    }

    my $events = $c->model->database->event->from_to($host_id, $from, $to);

    foreach my $event (@$events) {
        my $service = $report->{ $event->{service_id} };
        my $lstatus = lc($service->{last_status});
        my $cstatus = $event->{status};
        my $time    = $event->{time};

        if (!exists $service->{start_time}) {
            $service->{last_status} = $cstatus;
            $service->{last_time}   = $time;
            $service->{start_time}  = $time;
            next;
        }

        $service->{"time_$lstatus"} += $time - $service->{last_time};
        $service->{last_time}   = $time;
        $service->{last_status} = $cstatus;
    }

    foreach my $id (keys %$report) {
        my $service = $report->{$id};
        $service->{start_timestring} = $c->plugin->util->datestamp($service->{start_time});
        $service->{last_timestring}  = $c->plugin->util->datestamp($service->{last_time});
        $service->{from_time} = $c->plugin->util->datestamp($service->{start_time});
        $service->{to_time}   = $c->plugin->util->datestamp($service->{end_time});

        foreach my $status (qw/ok warning critical unknown info/) {
            $service->{"timestring_${status}"} = $c->plugin->util->secs2str($service->{"time_$status"});
            $service->{total_time} += $service->{"time_$status"};
        }

        foreach my $status (qw/ok warning critical unknown info/) {
            if ($service->{"time_$status"}) {
                $service->{"availability_${status}"} = 
                    sprintf("%.2f", 100 * $service->{"time_$status"} / $service->{total_time});
            } else {
                $service->{"availability_${status}"} = "0.00";
            }
        }

        $service->{availability_total} = sprintf("%.2f",
            $service->{availability_ok}
            + $service->{availability_warning}
            + $service->{availability_info}
        );

        $availability->{ok}       += $service->{availability_ok};
        $availability->{warning}  += $service->{availability_warning};
        $availability->{critical} += $service->{availability_critical};
        $availability->{unknown}  += $service->{availability_unknown};
        $availability->{info}     += $service->{availability_info};
    }

    foreach my $id (sort keys %$report) {
        $report->{$id}->{id} = $id;
        push @{ $c->stash->{data}->{services} }, $report->{$id};
    }

    my @keys = qw(
        active
        comment
        description
        hostname
        id
        interval
        ipaddr
        last_check
        notification
        status
        sysgroup
        timeout
    );

    foreach my $key (@keys) {
        $c->stash->{data}->{host}->{$key} = $host->{$key};
    }

    my $total;
    foreach my $key (keys %$availability) {
        $availability->{$key} = sprintf("%.2f", $availability->{$key} / scalar keys %$report);
        $total += $availability->{$key};
    }

    if ($total < 100) {
        $availability->{ok} += 100 - $total;
    }

    $availability->{total} = sprintf("%.2f",
        $availability->{ok} + $availability->{warning} + $availability->{info}
    );

    $c->stash->{data}->{availability} = $availability;
}

1;
