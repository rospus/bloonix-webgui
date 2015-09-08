package Bloonix::Controller::Administration::Groups;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/administration/groups")->to("list");
    $c->route->map("/administration/groups/for-host-creation")->to("groups_for_host_creation");
    $c->route->map("/administration/groups/search")->to("list");
    $c->route->map("/administration/groups/options")->to("options");
    $c->route->map("/administration/groups/create")->to("create");
    $c->route->map("/administration/groups/:id")->to("view");
    $c->route->map("/administration/groups/:id/options")->to("options");
    $c->route->map("/administration/groups/:id/update")->to("update");
    $c->route->map("/administration/groups/:id/delete")->to("delete");
}

sub auto {
    my ($self, $c, $opts) = @_;

    if ($opts && $opts->{id}) {
        $c->stash->object(
            $c->user->{role} eq "admin"
                ? $c->model->database->group->get($opts->{id})
                : $c->model->database->group->find(condition => [ id => $opts->{id}, company_id => $c->user->{company_id} ])
        );

        if (!$c->stash->object) {
            return $c->plugin->error->object_does_not_exists;
        }
    }

    return 1;
}

sub list {
    my ($self, $c) = @_;

    my $request = $c->plugin->defaults->request
        or return 1;

    my ($count, $data) = $c->model->database->group->by_user(
        offset => $request->{offset},
        limit => $request->{limit},
        query => $request->{query},
        user => $c->user,
        sort => $request->{sort},
        order => [ asc  => "groupname" ]
    );

    $c->stash->offset($request->{offset});
    $c->stash->total($count);
    $c->stash->data($data);
    $c->view->render->json;
}

sub groups_for_host_creation {
    my ($self, $c) = @_;

    $c->stash->data(
        $c->model->database->group->by_user_id_for_host_creation(
            $c->user->{id}
        )
    );

    $c->view->render->json;
}

sub view {
    my ($self, $c, $opts) = @_;

    $c->stash->data($c->stash->object);
    $c->view->render->json;
}

sub options {
    my ($self, $c, $opts) = @_;

    $c->model->database->group->set($c->user);

    if ($c->stash->object) {
        $c->stash->data(values => $c->stash->object);
    } else {
        $c->stash->data(values => $c->model->database->group->validator->defaults);
    }

    $c->stash->data(options => $c->model->database->group->validator->options);
    $c->stash->data(mandatory => $c->model->database->group->validator->mandatory);
    $c->stash->data(optional => $c->model->database->group->validator->optional);
    $c->view->render->json;
}

sub create {
    my ($self, $c) = @_;

    my $count_groups = $c->model->database->group->count(
        id => condition => [ company_id => $c->user->{company_id} ]
    );

    if ($count_groups >= $c->user->{max_groups}) {
        return $c->plugin->error->limit_error("err-845" => $c->user->{max_groups});
    }

    $c->plugin->action->store_simple("group");
}

sub update {
    my ($self, $c) = @_;

    $c->plugin->action->store_simple(group => $c->stash->object);
}

sub delete {
    my ($self, $c, $opts) = @_;

    if ($opts->{id} == 1) {
        return $c->plugin->error->no_privileges;
    }

    $c->plugin->action->delete(group => $c->stash->object);
}

1;
