package Bloonix::Controller::Hosts::Report;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/hosts/:id/report")->to("view");
}

sub view {
    my ($self, $c, $opts) = @_;

    my $host = $c->stash->object;
    my $time = $self->get_from_to_time($c)
        or return 1;

    $host = {
        id => $host->{id},
        hostname => $host->{hostname},
        ipaddr => $host->{ipaddr},
        description => $host->{description}
    };

    $self->generate_report($c, $host, $time);
    $c->view->render->json;
}

sub get_from_to_time {
    my ($self, $c) = @_;

    my $from = $c->req->param("from") || "";
    my $to = $c->req->param("to") || "";

    if ($from && $to) {
        if ($from =~ /^\d\d\d\d\z/) {
            $from = "$from-01";
        }

        eval {
            $from = $c->plugin->util->time2secs(
                "$from-01 00:00:00",
                $c->user->{timezone}
            );
        };

        if ($@) {
            $c->plugin->error->form_errors("from");
            return undef;
        }

        if ($to =~ /^\d\d\d\d\z/) {
            $to = "$to-12";
        }

        $to = $c->plugin->util->convert_year_month_to_max_date($to);

        eval {
            $to = $c->plugin->util->time2secs(
                "$to 23:59:59",
                $c->user->{timezone}
            );
        };

        if ($@) {
            $c->plugin->error->form_errors("to");
            return undef;
        }
        if ($to < $from) {
            $c->plugin->error->form_errors("from", "to");
            return undef;
        }
    } else {
        $from = $to = time;

        my $datetime = $c->plugin->util->timestamp($to, $c->user->{timezone});
        my ($year, $month, $day, $hour, $min, $sec) = split /\D/, $datetime;

        $from -= ($day - 1) * 86400;
        $from -= $hour * 3600;
        $from -= $min * 60;
        $from -= $sec;
    }

    return { from => $from, to => $to };
}

sub generate_report {
    my ($self, $c, $host, $time) = @_;

    my $service_by_id = { };

    my $services = $c->model->database->service->by_host_id(
        id => $host->{id},
        order => [
            asc => "service_name"
        ]
    );

    $host->{from} = $c->plugin->util->short_datestamp($time->{from});
    $host->{to} = $c->plugin->util->short_datestamp($time->{to});
    $host->{services} = $services;

    foreach my $service (@$services) {
        $service_by_id->{ $service->{id} } = $service;
        $service->{number_of_events} = $self->create_number_of_events_struct;
        $service->{duration_of_events} = $self->create_duration_of_events_struct;
        $service->{availability} = $self->create_status_struct;
    }

    my $events = $c->model->rest->event->by_host_ids(
        host_id => $host->{id},
        from => 0,
        size => 10_000_000,
        from_time => $time->{from} * 1000,
        to_time => $time->{to} * 1000,
        order => "asc"
    );

    my $events_by_service_id = { };

    foreach my $hit (@{$events->{hits}->{hits}}) {
        my $event = $hit->{_source};
        next unless exists $service_by_id->{$event->{service_id}};
        push @{$events_by_service_id->{$event->{service_id}}}, $event;
    }

    $self->calculate_service_event_durations($c, $host, $service_by_id, $events_by_service_id, $time);
    $self->calculate_availability($c, $host);

    $c->stash->data($host);
}

sub calculate_service_event_durations {
    my ($self, $c, $host, $services, $events, $time) = @_;
    my $to_time = $time->{to} * 1000;

    foreach my $service_id (keys %$events) {
        my $start_time = $time->{from} * 1000;
        my $last_event = $events->{$service_id}->[-1];

        push @{$events->{$service_id}}, {
            time => $to_time,
            status => "XXX", # "last_status ne status" must match to process the last event
            last_status => $last_event->{status},
            message => "",
            duration => int(($to_time - $last_event->{time}) / 1000)
        };

        foreach my $event (@{$events->{$service_id}}) {
            my $service = $services->{$service_id};

            if ($event->{last_status} ne $event->{status}) {
                if (($event->{time} / 1000) - $event->{duration} < $time->{from}) {
                    $event->{duration} = ($event->{time} / 1000) - $time->{from};
                }

                $self->parse_tags($service, $event);
                $self->count_status_and_duration($service, $event->{last_status}, $event->{duration});
                $self->calculate_time_range($c, $service, $event->{last_status}, $start_time, $event->{time});
                $self->calculate_time_range_total($c, $service);
                $start_time = $event->{time};
            }
        }
    }
}

sub calculate_availability {
    my ($self, $c, $host) = @_;
    my $duration_of_events = $self->create_status_struct;
    my $services = delete $host->{services};

    foreach my $service (@$services) {
        my $ok = $service->{duration_of_events}->{OK};
        my $info = $service->{duration_of_events}->{INFO};
        my $warning = $service->{duration_of_events}->{WARNING};
        my $unknown = $service->{duration_of_events}->{UNKNOWN};
        my $total = $service->{duration_of_events}->{total};

        if ($total) {
            push @{$host->{services}}, $service;

            $service->{availability}->{total} = sprintf("%.2f",
                ($ok + $info + $warning + $unknown) * 100 / $total
            );

            foreach my $status (qw/OK WARNING CRITICAL UNKNOWN INFO/) {
                $service->{availability}->{$status} = sprintf("%.2f",
                    $service->{duration_of_events}->{$status} * 100 / $total
                );
            }

            foreach my $status (keys %$duration_of_events) {
                $duration_of_events->{$status} += $service->{duration_of_events}->{$status};
            }
        } else {
            push @{$host->{no_data}}, $service;
        }
    }
}

sub parse_tags {
    my ($self, $service, $event) = @_;

    my $message = $event->{message} || "";
    my $tags = $event->{tags} || "";

    # For backward compabilities!
    # The events before this time does not have tags
    # so we try to fetch the tags from the message.
    # 1391209200 = 2014-02-01 00:00:00
    if ($event->{time} < 1391209200 * 1000) {
        if ($message =~ /^\[.+FLAPPING.+\]/) {
            $service->{number_of_events}->{tags}->{flapping}++;
        }

        if ($message =~ /^\[.*VOLATILE.*?\]/) {
            $service->{number_of_events}->{tags}->{volatile}++;
        }

        if ($message =~ /agent\s+dead\?/) {
            $service->{number_of_events}->{tags}->{agent_dead}++;
        }

        if ($message =~ /(timeout|timed out)/) {
            $service->{number_of_events}->{tags}->{timeout}++;
        }

        if ($message =~ /fatal/i) {
            $service->{number_of_events}->{tags}->{fatal}++;
        }

        if ($message =~ /security/i) {
            $service->{number_of_events}->{tags}->{security}++;
        }
    }

    foreach my $tag (split /,/, $tags) {
        $tag =~ s/^\s+//;
        $tag =~ s/\s+\z//;
        $tag =~ s/\s+/_/g;
        $service->{number_of_events}->{tags}->{$tag}++;
    }
}

sub count_status_and_duration {
    my ($self, $service, $status, $duration) = @_;

    my $key;

    if ($duration < 900) {
        $key = "lt15";
    } elsif ($duration < 1800) {
        $key = "lt30";
    } elsif ($duration < 3600) {
        $key = "lt60";
    } elsif ($duration < 10800) {
        $key = "lt180";
    } elsif ($duration < 18000) {
        $key = "lt300";
    } else {
        $key = "ge300";
    }

    $service->{number_of_events}->{$key}->{total}++;
    $service->{number_of_events}->{$key}->{$status}++;

    $service->{number_of_events}->{total}++;
    $service->{number_of_events}->{$status}++;

    $service->{duration_of_events}->{total} += $duration;
    $service->{duration_of_events}->{$status} += $duration;
}

sub calculate_time_range {
    my ($self, $c, $service, $status, $start_time, $end_time) = @_;
    my $stats = $service->{duration_of_events};

    $start_time = int($start_time / 1000);
    $end_time = int($end_time / 1000);
    my $diff = $end_time - $start_time;

    if ($diff >= 86400) {
        my $times = int($diff / 86400);
        my $seconds = $times * 3600;

        foreach my $h (0..23) {
            my $stat_key = sprintf("h%02d", $h);
            $stats->{$stat_key}->{$status} += $seconds;
        }

        $start_time += ($times * 86400);
    }

    # NOTE:
    # the difference between the start and end time cannot be
    # larger the 24 hours from here!
    my ($start_sec, $start_min, $start_hour) = (localtime($start_time))[0,1,2];
    my ($end_sec, $end_min, $end_hour) = (localtime($end_time))[0,1,2];
    my $start_hour_key = sprintf("h%02d", $start_hour);
    my $end_hour_key = sprintf("h%02d", $end_hour);

    if ($start_hour == $end_hour) {
        if ($start_min == $end_min) {
            $stats->{$start_hour_key}->{$status} += $end_sec - $start_sec;
        } else {
            $stats->{$start_hour_key}->{$status} += (60 - $start_sec) + $end_sec;
            if ($start_min + 1 != $end_min) {
                $stats->{$start_hour_key}->{$status} += (($end_min - $start_min + 1) * 60);
            }
        }
    } else {
        $stats->{$end_hour_key}->{$status} += $end_sec;
        $stats->{$end_hour_key}->{$status} += ($end_min * 60);

        $stats->{$start_hour_key}->{$status} += 60 - $start_sec;
        $start_min++;

        if ($start_min < 60) {
            $stats->{$start_hour_key}->{$status} += ((60 - $start_min) * 60);
        }

        if ($start_hour + 1 == 24) {
            $start_hour = 0;
        } else {
            $start_hour += 1;
        }

        my @hours;

        if ($start_hour < $end_hour) {
            push @hours, ($start_hour .. $end_hour - 1);
        } elsif ($start_hour > $end_hour) {
            push @hours, ($start_hour .. 23);
            if ($end_hour - 1 >= 0) {
                push @hours, (0 .. $end_hour - 1);
            }
        }

        foreach my $h (@hours) {
            my $stat_key = sprintf("h%02d", $h);
            $stats->{$stat_key}->{$status} += 3600;
        }
    }
}

sub calculate_time_range_total {
    my ($self, $c, $service) = @_;
    my $stats = $service->{duration_of_events};

    foreach my $hour (0..23) {
        my $stat_key = sprintf("h%02d", $hour);
        $stats->{$stat_key}->{total} =
            $stats->{$stat_key}->{OK}
            + $stats->{$stat_key}->{INFO}
            + $stats->{$stat_key}->{WARNING}
            + $stats->{$stat_key}->{CRITICAL}
            + $stats->{$stat_key}->{UNKNOWN}
    }
}

sub create_number_of_events_struct {
    my $self = shift;

    my $struct = $self->create_status_struct;

    $struct->{flapping} = 0;
    $struct->{volatile} = 0;
    $struct->{timeout} = 0;
    $struct->{agent_dead} = 0;
    $struct->{security} = 0;
    $struct->{fatal} = 0;

    foreach my $key (qw/lt15 lt30 lt60 lt180 lt300 ge300/) {
        $struct->{$key} = $self->create_status_struct;
    }

    return $struct;
}

sub create_duration_of_events_struct {
    my $self = shift;

    my $struct = $self->create_status_struct;

    foreach my $hour (0..23) {
        my $stat_key = sprintf("h%02d", $hour);
        $struct->{$stat_key} = $self->create_status_struct;
    }

    return $struct;
}

sub create_status_struct {
    return {
        total    => 0,
        OK       => 0,
        WARNING  => 0,
        CRITICAL => 0,
        UNKNOWN  => 0,
        INFO     => 0,
    };
}

1;
