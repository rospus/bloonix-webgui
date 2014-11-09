package Bloonix::Controller::Events;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/events")->to("list");
    $c->route->map("/events/top")->to("top");
}

sub top {
    my ($self, $c) = @_;

    my ($count, $hosts) = $c->model->database->host->by_user_id(
        user => $c->user,
        offset => 0,
        limit => 100,
        query => $c->req->param("query"),
        order => [
            desc => "priority",
            desc => "last_check"
        ]
    );

    my @host_ids = (0);

    foreach my $host (@$hosts) {
        push @host_ids, $host->{id};
    }

    return $self->list($c, \@host_ids);
}

sub list {
    my ($self, $c, $host_ids) = @_;

    my $time = time;
    my $to_time = $time * 1000;
    my $from_time = (time - 604800) * 1000;
    my $hosts = $c->model->database->host->ids_of_latest_status_changes($c->user->{id}, $from_time / 1000, 15, $host_ids);
    my $by_host_ids = {};

    foreach my $host (@$hosts) {
        $by_host_ids->{$host->{id}} = $host->{hostname};
    }

    my $result = $c->model->rest->event->by_host_ids(
        host_id => [ keys %$by_host_ids ],
        from => 0,
        size => 100,
        from_time => $from_time,
        to_time => $to_time,
        order => "desc"
    );

    my (@events, @filtered_events);
    my %service_ids = (0 => 0);

    foreach my $row (@{$result->{hits}->{hits}}) {
        my $event = $row->{_source};
        push @events, $event;
        $service_ids{ $event->{service_id} } = 0;
    }

    my $services = $c->model->database->service->by_service_ids_as_hash([ keys %service_ids ]);

    foreach my $event (@events) {
        my $service_id = $event->{service_id};

        if ($services->{$service_id}) {
            $event->{time} = $c->plugin->util->timestamp($event->{time}, $c->user->{timezone});
            $event->{hostname} = $services->{$service_id}->{hostname};
            $event->{service_name} = $services->{$service_id}->{service_name};
            push @filtered_events, $event;
        }
    }

    $c->stash->data(\@filtered_events);
    $c->view->render->json;
}

1;
