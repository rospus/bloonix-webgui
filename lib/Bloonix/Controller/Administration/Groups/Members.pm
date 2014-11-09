package Bloonix::Controller::Administration::Groups::Members;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    my $host_actions = ":action(list|list-non|search|search-non|add|remove)";
    my $user_actions = ":action(list|list-non|add|update|remove)";
    $c->route->map("/administration/groups/:id/members/hosts/$host_actions")->to("hosts");
    $c->route->map("/administration/groups/:id/members/users/$user_actions")->to("users");
}

sub begin {
    my ($self, $c, $opts) = @_;

    if ($c->user->{role} eq "admin") {
        $c->model->database->group->get($opts->{id})
            or return $c->plugin->error->object_does_not_exists;
    } else {
        $c->model->database->group->find(
            condition => [ id => $opts->{id}, company_id => $c->user->{company_id} ]
        ) or return $c->plugin->error->object_does_not_exists;
    }

    return 1;
}

sub hosts {
    my ($self, $c, $opts) = @_;

    if ($opts->{action} eq "list" || $opts->{action} eq "search") {
        return $self->_list_hosts($c, is_in_group => $opts->{id});
    }

    if ($opts->{action} eq "list-non" || $opts->{action} eq "search-non") {
        return $self->_list_hosts($c, is_not_in_group => $opts->{id});
    }

    if ($opts->{action} eq "add" || $opts->{action} eq "remove") {
        return $self->_update_host_groups($c, $opts->{action} => $opts->{id});
    }

    return $c->view->render->json;
}

sub users {
    my ($self, $c, $opts) = @_;

    if ($opts->{action} eq "list") {
        $c->stash->data($c->model->database->user->get_group_member("in", $c->user, $opts->{id}));
    }

    if ($opts->{action} eq "list-non") {
        $c->stash->data($c->model->database->user->get_group_member("non", $c->user, $opts->{id}));
    }

    if ($opts->{action} =~ /^(add|remove|update)\z/) {
        $self->_update_user_groups($c, $opts->{action} => $opts->{id});
    }

    return $c->view->render->json;
}

sub _list_hosts {
    my ($self, $c, $key, $id) = @_;

    my $request = $c->plugin->defaults->request
        or return 1;

    my ($count, $data) = $c->model->database->host->search_group_member(
        user => $c->user,
        offset => $request->{offset},
        limit => $request->{limit},
        query => $request->{query},
        $key => $id
    );

    $c->stash->offset($request->{offset});
    $c->stash->total($count);
    $c->stash->data($data);
    $c->view->render->json;
}

sub _update_host_groups {
    my ($self, $c, $action, $group_id) = @_;

    $c->plugin->token->check
        or return 1;

    my $host_ids = [ $c->req->param("id") ];

    if (!@$host_ids) {
        $c->plugin->error->no_objects_selected;
        return undef;
    }

    $c->plugin->validate->ids($host_ids)
        or return $c->plugin->error->json_parse_params_error("id");

    if ($c->user->{role} ne "admin") {
        $c->model->database->host->validate_host_ids_by_company_id(
            $c->user->{company_id},
            $host_ids
        ) or return $c->plugin->error->object_does_not_exists;
    }

    if ($action eq "remove") {
        $c->model->database->host_group->delete(
            group_id => $group_id,
            host_id => $host_ids
        ) or return $c->plugin->error->action_failed;

        $c->plugin->log_action->delete(
            target => "host_group",
            data => {
                group_id => $group_id,
                host_id => $host_ids
            }
        );
    } elsif ($action eq "add") {
        foreach my $host_id (@$host_ids) {
            $c->model->database->host_group->create(
                group_id => $group_id,
                host_id => $host_id,
            ) or next;

            $c->plugin->log_action->create(
                target => "host_group",
                data => {
                    group_id => $group_id,
                    host_id => $host_id
                }
            );
        }
    }

    $c->stash->data($host_ids);
    $c->view->render->json;
}

sub _update_user_groups {
    my ($self, $c, $action, $group_id) = @_;

    $c->plugin->token->check
        or return 1;

    my $user_id = $c->req->param("id") // $c->req->param("user_id")
        or return $c->plugin->error->form_parse_errors("id");

    if ($user_id !~ /^\d+\z/) {
        return $c->plugin->error->object_does_not_exists;
    }

    if ($c->user->{role} ne "admin") {
        $c->model->database->user->validate_user_ids_by_company_id(
            $c->user->{company_id},
            [$user_id]
        ) or return $c->plugin->error->object_does_not_exists;
    }

    if ($action eq "remove") {
        $c->model->database->user_group->delete(
            group_id => $group_id,
            user_id => $user_id
        ) or return $c->plugin->error->action_failed;

        $c->plugin->log_action->delete(
            target => "user_group",
            data => {
                group_id => $group_id,
                user_id => $user_id
            }
        );
    } elsif ($action eq "add" || $action eq "update") {
        my $data = {};

        my @errors;
        foreach my $key (qw/create_service update_service delete_service/) {
            my $value = $c->req->param($key);
            if ($value =~ /^[01]\z/) {
                $data->{$key} = $value;
            } else {
                push @errors, $key;
            }
        }

        if (@errors) {
            return $c->plugin->error->form_parse_errors(@errors);
        }

        if ($action eq "add") {
            $data->{group_id} = $group_id;
            $data->{user_id} = $user_id;

            my $result = $c->model->database->user_group->create_unique(%$data);

            $c->plugin->action->check_crud($result)
                or return 1;

            $c->plugin->log_action->create(
                target => "user_group",
                data => $result->data
            );
        } else {
            my $old = $c->model->database->user_group->find(
                condition => [
                    user_id => $user_id,
                    group_id => $group_id
                ]
            );

            $c->model->database->user_group->update(
                data => $data,
                condition => [
                    user_id => $user_id,
                    group_id => $group_id
                ]
            ) or return $c->plugin->error->action_failed;

            $data->{group_id} = $group_id;
            $data->{user_id} = $user_id;

            $c->plugin->log_action->update(
                target => "user_group",
                data => $data,
                old => $old
            );
        }
    }
}

1;
