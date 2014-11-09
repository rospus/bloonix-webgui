package Bloonix::Controller::Hosts::Events;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/hosts/:id/events")->to("host");
}

sub host {
    my ($self, $c, $opts) = @_;

    my $host = $c->stash->object;

    my $services = $c->model->database->service->by_host_id_as_hash($opts->{id});
    my $request = $c->plugin->defaults->request
        or return 1;

    my $preset = $c->req->param("preset") // "7d";
    my $from_time = $c->req->param("from");
    my $to_time = $c->req->param("to");

    if ($from_time || $to_time) {
        if ($c->validator->constraint->check_from_to_time($from_time, $to_time, $c->user->{timezone})) {
            $from_time = $c->plugin->util->time2msecs($from_time, $c->user->{timezone});
            $to_time = $c->plugin->util->time2msecs($to_time, $c->user->{timezone});
        } else {
            return $c->plugin->error->form_parse_errors("from", "to");
        }
    } elsif ($preset =~ /^([1-9]\d{0,2})d\z/ && $1 <= 180) {
        my $days = $1;
        my $time = time;
        $to_time = $time * 1000;
        $from_time = ($time - ($days * 86400)) * 1000;
    } else {
        return $c->plugin->error->form_parse_errors("preset");
    }

    my $result = $c->model->rest->event->by_host_ids(
        host_id => $opts->{id},
        from => $request->{offset},
        size => $request->{limit},
        query => $request->{query},
        from_time => $from_time,
        to_time => $to_time,
        order => "desc"
    );

    my @events;

    foreach my $row (@{$result->{hits}->{hits}}) {
        my $event = $row->{_source};
        my $service_id = $event->{service_id};

        if ($services->{$service_id}) {
            $event->{time} = $c->plugin->util->timestamp($event->{time}, $c->user->{timezone});
            $event->{hostname} = $host->{hostname};
            $event->{service_name} = $services->{$service_id}->{service_name};
            $event->{plugin_id} = $services->{$service_id}->{plugin_id};
            push @events, $event;
        }
    }
    
    $c->stash->offset($request->{offset});
    $c->stash->total($result->{hits}->{total});
    $c->stash->data(\@events);
    $c->view->render->json;
}

1;
