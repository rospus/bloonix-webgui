package Bloonix::Controller::Hosts::Dependencies;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/hosts/:id/dependencies")->to("get");
    $c->route->map("/hosts/:id/dependencies/create")->to("create");
    $c->route->map("/hosts/:id/dependencies/:dependency_id/delete")->to("delete");
}

sub get {
    my ($self, $c, $opts) = @_;

    $c->stash->data($self->generate_dependencies($c, $opts->{id}));
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

    my $form = $c->plugin->action->check_form(create => "dependency")
        or return 1;

    if ($form->data->{type} =~ /^service/) {
        if (!defined $form->data->{service_id}) {
            return $c->plugin->error->form_parse_errors("service_id");
        }

        $c->model->database->service->by_host_service_and_user_id(
            $opts->{id}, $form->data->{service_id}, $c->user->{id}
        ) or return $c->plugin->error->object_does_not_exists;
    }

    if ($form->data->{type} =~ /service\z/) {
        if (!defined $form->data->{on_service_id}) {
            return $c->plugin->error->form_parse_errors("on_service_id");
        }

        $c->model->database->service->by_host_service_and_user_id(
            $form->data->{on_host_id}, $form->data->{on_service_id}, $c->user->{id}
        ) or return $c->plugin->error->object_does_not_exists;
    }

    delete $form->data->{type};
    $c->model->database->dependency->create($form->data)
        or return $c->plugin->error->action_failed;

    $c->plugin->log_action->create(target => "dependency", data => $form->data);
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

    my $dependency = $c->model->database->dependency->find(
        condition => [
            id => $opts->{dependency_id},
            host_id => $opts->{id}
        ]
    ) or return $c->plugin->error->object_does_not_exists;

    $c->model->database->dependency->delete($opts->{dependency_id})
        or return $c->plugin->error->action_failed;

    $c->plugin->log_action->create(target => "dependency", data => $dependency);
    $c->view->render->json;
}

sub generate_dependencies {
    my ($self, $c, $host_id, $service_id, $stash, $deep) = @_;
    $service_id //= 0;
    $deep //= 0;

    $stash //= {
        host => { },
        service => { },
        seen => { }
    };

    # RETURN IF SEEN >= 2 !!!

    my $dependencies = $service_id
        ? $c->model->database->dependency->by_host_and_service_id($host_id, $service_id)
        : $c->model->database->dependency->by_host_id($host_id);

    foreach my $dependency (@$dependencies) {
        my $host_id = $dependency->{host_id};
        my $on_host_id = $dependency->{on_host_id};
        my $service_id = $dependency->{service_id};
        my $on_service_id = $dependency->{on_service_id};
        my @seen = ($host_id);

        foreach my $id ($host_id, $on_host_id) {
            next unless $id;
            if (!$stash->{host}->{$id}) {
                $stash->{host}->{$id} = $c->model->database->host->get(
                    $id => [ "hostname", "ipaddr", "status" ]
                );
            }
        }

        foreach my $id ($service_id, $on_service_id) {
            next unless $id;
            if (!$stash->{service}->{$id}) {
                $stash->{service}->{$id} = $c->model->database->service->by_service_id($id);
            }
        }

        $dependency->{hostname} = $stash->{host}->{$host_id}->{hostname};
        $dependency->{ipaddr} = $stash->{host}->{$host_id}->{ipaddr};
        $dependency->{on_hostname} = $stash->{host}->{$on_host_id}->{hostname};
        $dependency->{on_ipaddr} = $stash->{host}->{$on_host_id}->{ipaddr};
        $dependency->{host_status} = $stash->{host}->{$host_id}->{status};
        $dependency->{on_host_status} = $stash->{host}->{$on_host_id}->{status};

        if ($service_id) {
            push @seen, $service_id;
            $dependency->{service_name} = $stash->{service}->{$service_id}->{service_name};
            $dependency->{service_status} = $stash->{service}->{$service_id}->{status};
        } else {
            push @seen, 0;
        }

        push @seen, $on_host_id;

        if ($on_service_id) {
            push @seen, $on_service_id;
            $dependency->{on_service_name} = $stash->{service}->{$on_service_id}->{service_name};
            $dependency->{on_service_status} = $stash->{service}->{$on_service_id}->{status};
        } else {
            push @seen, 0;
        }

        my $seen_key = join("-", @seen);
        $stash->{seen}->{$seen_key}++;

        if ($stash->{seen}->{$seen_key} < 2) {
            $dependency->{dependencies} = $self->generate_dependencies($c, $on_host_id, $on_service_id, $stash, $deep);
        } else {
            $dependency->{dependencies} = [ ];
        }
    }

    return $dependencies;
}

1;
