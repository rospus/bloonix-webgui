package Bloonix::Controller::Hosts::Register;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/hosts/registered/count")->to("count");
    $c->route->map("/hosts/registered/list")->to("list");
    $c->route->map("/hosts/registered/search")->to("list");
    $c->route->map("/hosts/registered/update")->to("update");
    $c->route->map("/hosts/registered/delete")->to("delete");
}

sub auto {
    my ($self, $c) = @_;

    if ($c->user->{role} !~ /^(operator|admin)\z/) {
        $c->plugin->error->no_privileges;
        return undef;
    }

    return 1;
}

sub count {
    my ($self, $c) = @_;

    if ($c->user->{role} ne "operator") {
        $c->stash->{data} = 0;
    } else {
        $c->stash->{data} = $c->model->database->host->count(
            "id", condition => [
                company_id => $c->user->{company_id},
                register => 1
            ]
        );
    }

    $c->view->render->json;
}

sub list {
    my ($self, $c) = @_;

    my $util = $c->plugin->util;
    my $request = $c->plugin->defaults->request
        or return 1;

    my ($count, $data) = $c->model->database->host->by_user_id(
        user => $c->user,
        offset => $request->{offset},
        limit => $request->{limit},
        query => $request->{query},
        sort => $request->{sort},
        registered => 1,
        order => [
            asc  => "host.hostname"
        ]
    );

    foreach my $row (@$data) {
        $row->{host_templates} = $c->model->database->host_template->get_names_by_host_id($row->{id});
    }

    $c->stash->offset($request->{offset});
    $c->stash->total($count);
    $c->stash->data($data);
    $c->view->render->json;
}

sub update {
    my ($self, $c) = @_;

    $c->plugin->token->check
        or return 1;

    my $host_ids = [ $c->req->param("host_id") ];
    if (
        @$host_ids &&
        !$c->model->database->host->validate_host_ids_by_company_id(
            $c->user->{company_id}, $host_ids, 1
        )
    ) {
        return $c->plugin->error->form_parse_errors("host_id");
    }

    my $group_ids = [ $c->req->param("group_id") ];
    if (!$c->model->database->group->validate_ids_by_company_id($c->user->{company_id}, $group_ids)) {
        return $c->plugin->error->form_parse_errors("group_id");
    }

    my $contactgroup_ids = [ $c->req->param("contactgroup_id") ];
    if (
        @$contactgroup_ids &&
        !$c->model->database->contactgroup->validate_ids_by_company_id(
            $c->user->{company_id}, $contactgroup_ids
        )
    ) {
        return $c->plugin->error->form_parse_errors("contactgroup_id");
    }

    my $host_template_ids = [ $c->req->param("host_template_id") ];
    if (
        @$host_template_ids &&
        !$c->model->database->host_template->validate_ids_by_company_id(
            $c->user->{company_id}, $host_template_ids
        )
    ) {
        return $c->plugin->error->form_parse_errors("host_template_id");
    }

    push @$group_ids, 1;

    foreach my $group_id (@$group_ids) {
        foreach my $host_id (@$host_ids) {
            $c->model->database->host_group->create({
                host_id => $host_id,
                group_id => $group_id
            }) or next;

            $c->plugin->log_action->create(
                target => "host_group",
                data => {
                    host_id => $host_id,
                    group_id => $group_id
                }
            );
        }
    }

    if (@$contactgroup_ids) {
        foreach my $host_id (@$host_ids) {
            foreach my $group_id (@$contactgroup_ids) {
                $c->model->database->host_contactgroup->create({
                    host_id => $host_id,
                    contactgroup_id => $group_id
                }) or next;

                $c->plugin->log_action->create(
                    target => "host_contactgroup",
                    data => {
                        host_id => $host_id,
                        contactgroup_id => $group_id
                    }
                );
            }
        }
    }

    if (@$host_template_ids) {
        foreach my $host_id (@$host_ids) {
            $c->plugin->template->add_templates_to_host($host_id, $host_template_ids);
        }
    }

    if (@$group_ids > 1) {
        $c->model->database->host->update(
            data => { register => 0 },
            condition => [ id => $host_ids ]
        );
    }

    $c->view->render->json;
}

sub delete {
    my ($self, $c) = @_;

    $c->plugin->token->check
        or return 1;

    my $host_ids = [ $c->req->param("host_id") ];
    if (
        @$host_ids &&
        !$c->model->database->host->validate_host_ids_by_company_id(
            $c->user->{company_id}, $host_ids, 1
        )
    ) {
        return $c->plugin->error->form_parse_errors("host_id");
    }

    $c->model->database->host->delete(
        id => $host_ids
    );

    $c->view->render->json;
}

1;
