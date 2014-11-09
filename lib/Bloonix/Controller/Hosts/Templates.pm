package Bloonix::Controller::Hosts::Templates;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/hosts/:id/templates")->to("list");
    $c->route->map("/hosts/:id/templates/add")->to("add");
    $c->route->map("/hosts/:id/templates/remove/:host_template_id")->to("remove");
}

sub auto {
    my ($self, $c, $opts) = @_;

    my $host = $c->stash->object;
    $c->stash->object({ host => $host });

    if ($opts && $opts->{host_template_id}) {
        my $host_template = $c->model->database->host_template->find(
            condition => [
                company_id => $c->user->{company_id},
                id => $opts->{host_template_id}
            ]
        );

        if (!$host_template) {
            $c->plugin->error->object_does_not_exists;
            return undef;
        }

        $c->stash->object->{host_template} = $host_template;
    }

    return 1;
}

sub list {
    my ($self, $c, $opts) = @_;

    $c->stash->data(
        $c->model->database->host->get_template_groups(
            $c->user->{company_id},
            $c->stash->object->{host}->{id}
        )
    );

    $c->view->render->json;
}

sub add {
    my ($self, $c, $opts) = @_;

    $c->plugin->token->check
        or return;

    $c->model->database->user_group->can_create_service(
        $c->user->{id}, $opts->{id}
    ) or return $c->plugin->error->no_privileges_on_action(create => "service");

    my $host_template_ids = [ $c->req->param("host_template_id") ];

    if (!$host_template_ids->[0]) {
        shift @$host_template_ids
    }

    if (@$host_template_ids && !$c->model->database->host_template->validate_ids_by_company_id($c->user->{company_id}, $host_template_ids)) {
        return $c->plugin->error->form_parse_errors("host_template_id");
    }

    $c->plugin->template->add_templates_to_host($opts->{id}, $host_template_ids)
        or return;

    $c->view->render->json;
}

sub remove {
    my ($self, $c, $opts) = @_;

    $c->plugin->token->check
        or return;

    $c->model->database->user_group->can_delete_service(
        $c->user->{id}, $opts->{id}
    ) or return $c->plugin->error->no_privileges_on_action(delete => "service");

    $c->plugin->template->remove_templates_from_host(
        $opts->{id}, [ $opts->{host_template_id} ]
    ) or return;

    $c->view->render->json;
}

1;
