package Bloonix::Controller::Templates::Member;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/templates/hosts/:id/members/list")->to("list_members");
    $c->route->map("/templates/hosts/:id/members/list-non")->to("list_nonmembers");
    $c->route->map("/templates/hosts/:id/members/:action(add|remove)")->to("add_remove_members");
}

sub list {
    my ($self, $c, $opts, $key) = @_;

    my $request = $c->plugin->defaults->request
        or return 1;

    my ($count, $data) = $c->model->database->host->search_template_member(
        user => $c->user,
        offset => $request->{offset},
        limit => $request->{limit},
        query => $request->{query},
        sort => $request->{sort},
        order => [ asc => "hostname" ],
        host_template_id => $opts->{id},
        user => $c->user,
        $key => 1
    );

    $c->stash->offset($request->{offset});
    $c->stash->total($count);
    $c->stash->data($data);
    $c->view->render->json;
}

sub list_members {
    my ($self, $c, $opts) = @_;

    return $self->list($c, $opts, "is_in_group");
}

sub list_nonmembers {
    my ($self, $c, $opts) = @_;

    return $self->list($c, $opts, "is_not_in_group");
}

sub add_remove_members {
    my ($self, $c, $opts) = @_;

    $c->plugin->token->check
        or return 1;

    my $host_ids = [ $c->req->param("id") ];

    if (!@$host_ids) {
        $c->plugin->error->no_objects_selected;
        return undef;
    }

    $c->plugin->validate->ids($host_ids)
        or return $c->plugin->error->json_parse_params_error("id");

    $c->model->database->host->validate_host_ids_by_company_id($c->user->{company_id}, $host_ids)
        or return $c->plugin->error->object_does_not_exists;

    if ($opts->{action} eq "add") {
        $c->plugin->template->add_hosts_to_template($opts->{id}, $host_ids)
            or return;
    } elsif ($opts->{action} eq "remove") {
        $c->plugin->template->remove_hosts_from_template($opts->{id}, $host_ids)
            or return;
    }

    $c->view->render->json;
}

1;
