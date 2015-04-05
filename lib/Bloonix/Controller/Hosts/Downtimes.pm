package Bloonix::Controller::Hosts::Downtimes;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/hosts/:id/downtimes")->to("list_host_downtimes");
    $c->route->map("/hosts/:id/downtimes/create")->to("create");
    $c->route->map("/hosts/:id/downtimes/:downtime_id/delete")->to("delete");
    $c->route->map("/hosts/:id/services/downtimes")->to("list_service_downtimes");
    $c->route->map("/hosts/:id/services/:service_id/downtimes/:downtime_id/delete")->to("delete");
}

sub list_host_downtimes {
    my ($self, $c, $opts) = @_;

    my $downtimes = $c->model->database->host_downtime->by_host_id($opts->{id});

    $self->parse_downtimes($c, $downtimes);
}

sub list_service_downtimes {
    my ($self, $c, $opts) = @_;

    my $downtimes = $c->model->database->service_downtime->with_service_name($opts->{id});

    $self->parse_downtimes($c, $downtimes);
}

sub parse_downtimes {
    my ($self, $c, $downtimes) = @_;

    foreach my $downtime (@$downtimes) {
        if ($downtime->{timeslice}) {
            $downtime->{active} = $c->plugin->timeperiod->check(
                $downtime->{timeslice},
                time,
                $c->user->{timezone}
            ) ? 1 : 0;
        } else {
            my $begin_time = $c->plugin->util->time2secs($downtime->{begin}, $c->user->{timezone});
            my $end_time = $c->plugin->util->time2secs($downtime->{end}, $c->user->{timezone});
            $downtime->{active} = time > $begin_time && time < $end_time ? 1 : 0;
        }
    }

    $c->stash->data($downtimes);
    $c->view->render->json;
}

sub create {
    my ($self, $c, $opts) = @_;

    my $noauth = $c->model->database->host->no_privileges_to_modify_service(
        $c->user->{id}, [ $opts->{id} ]
    );

    if ($noauth) {
        return $c->plugin->error->no_privileges_on_action(modify => $noauth);
    }

    my $data = $c->plugin->downtime->validate
        or return;

    my @service_ids = $c->req->param("service_id");

    if (@service_ids && !$service_ids[0]) {
        shift @service_ids
    }

    my $count_downtimes = $c->model->database->host->count_downtimes($opts->{id});
    $count_downtimes += scalar @service_ids ? scalar @service_ids : 1;

    if ($count_downtimes > $c->user->{max_downtimes_per_host}) {
        return $c->plugin->error->limit_error("err-821" => $c->user->{max_downtimes_per_host});
    }

    if (@service_ids) {
        my $services = $c->model->database->service->by_host_id_as_hash($opts->{id});
        my @invalid;

        foreach my $service_id (@service_ids) {
            if (!exists $services->{$service_id}) {
                push @invalid, $service_id;
            }
        }

        if (@invalid) {
            return $c->plugin->error->objects_does_not_exists(@invalid);
        }

        foreach my $service_id (@service_ids) {
            $data->{service_id} = $service_id;
            $data->{host_id} = $opts->{id};
            $c->model->database->service_downtime->create($data)
                or return $c->plugin->error->action_failed;
        }
    } else {
        $data->{host_id} = $opts->{id};
        $c->model->database->host_downtime->create($data)
            or return $c->plugin->error->action_failed;
    }

    $c->view->render->json;
}

sub delete {
    my ($self, $c, $opts) = @_;

    my $noauth = $c->model->database->host->no_privileges_to_modify_service(
        $c->user->{id}, [ $opts->{id} ]
    );

    if ($noauth) {
        return $c->plugin->error->no_privileges_on_action(modify => $noauth);
    }

    if ($opts->{service_id}) {
        my $downtime = $c->model->database->service_downtime->find(
            condition => [
                service_id => $opts->{service_id},
                host_id => $opts->{id},
                id => $opts->{downtime_id}
            ]
        ) or return $c->plugin->error->object_does_not_exists;
        $c->model->database->service_downtime->delete($opts->{downtime_id});
        $c->plugin->log_action->delete(target => "service_downtime", data => $downtime);
    } else {
        my $downtime = $c->model->database->host_downtime->find(
            condition => [
                host_id => $opts->{id},
                id => $opts->{downtime_id}
            ]
        ) or return $c->plugin->error->object_does_not_exists;
        $c->model->database->host_downtime->delete($opts->{downtime_id});
        $c->plugin->log_action->delete(target => "host_downtime", data => $downtime);
    }

    $c->view->render->json;
}

1;
