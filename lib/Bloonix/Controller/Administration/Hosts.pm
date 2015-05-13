package Bloonix::Controller::Administration::Hosts;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/administration/hosts/create")->to("create");
    $c->route->map("/hosts/create")->to("create");
    $c->route->map("/administration/hosts/options")->to("options");
    $c->route->map("/hosts/options")->to("options");
    $c->route->map("/administration/hosts/:id/options")->to("options");
    $c->route->map("/hosts/:id/options")->to("options");
    $c->route->map("/administration/hosts/:id/update")->to("update");
    $c->route->map("/hosts/:id/update")->to("update");
    $c->route->map("/administration/hosts/:id/delete")->to("delete");
    $c->route->map("/hosts/:id/delete")->to("delete");
}

sub auto {
    my ($self, $c, $opts) = @_;

    if ($opts->{id}) {
        if ($c->user->{role} eq "admin") {
            $c->stash->object($c->model->database->host->get($opts->{id}));
        } elsif ($c->user->{role} eq "operator") {
            $c->stash->object(
                $c->model->database->host->find(
                    condition => [ id => $opts->{id}, company_id => $c->user->{company_id} ]
                )
            );
        }

        if (!$c->stash->object) {
            $c->plugin->error->object_does_not_exists;
            return undef;
        }
    }

    return 1;
}

sub begin {
    my ($self, $c) = @_;

    $c->model->database->host->set($c->user);

    return 1;
}

sub options {
    my ($self, $c, $opts) = @_;

    my $options = $c->model->database->host->validator->options;
    my $host;

    if ($opts->{id}) {
        $host = $c->stash->object;

        my $secrets = $c->model->database->host_secret->find(
            condition => [ host_id => $opts->{id} ]
        );

        $host->{password} = $secrets->{password};
    } else {
        $opts->{id} = 0;
        $host = $c->model->database->host->validator->defaults;

        $options->{group_id} = [];
        $options->{contactgroup_id} = [];
        $options->{host_template_id} = [];

        my $groups = $c->model->database->group->search(
            condition => [ company_id => $c->user->{company_id} ],
            order => [ asc => "groupname" ]
        );

        foreach my $group (@$groups) {
            push @{$options->{group_id}}, {
                name => $group->{groupname},
                value => $group->{id}
            };
        }

        my $contactgroups = $c->model->database->contactgroup->search(
            condition => [ company_id => $c->user->{company_id} ],
            order => [ asc => "name" ]
        );

        foreach my $group (@$contactgroups) {
            push @{$options->{contactgroup_id}}, { 
                name => $group->{name}, 
                value => $group->{id}
            };
        }

        my $templates = $c->model->database->host_template->search(
            condition => [ company_id => $c->user->{company_id} ],
            order => [ asc => "name" ]
        );

        foreach my $template (@$templates) {
            push @{$options->{host_template_id}}, {
                name => $template->{name},
                value => $template->{id}
            };
        }
    }

    $c->plugin->util->json_to_pv(variables => $host);
    $c->stash->data(values => $host);
    $c->stash->data(options => $options);
    $c->stash->data(mandatory => $c->model->database->host->validator->mandatory);
    $c->stash->data(optional => $c->model->database->host->validator->optional);

    if (!grep /group_id/, @{$c->stash->data->{mandatory}}) {
        push @{$c->stash->data->{mandatory}}, "group_id";
    }

    $c->view->render->json;
}

sub create {
    my ($self, $c) = @_;

    $c->plugin->token->check
        or return 1;

    my $count_hosts = $c->model->database->host->count(
        id => condition => [ company_id => $c->user->{company_id} ]
    );

    if ($c->user->{max_hosts} && $count_hosts >= $c->user->{max_hosts}) {
        return $c->plugin->error->limit_error("err-831" => $c->user->{max_hosts});
    }

    my $group_ids = [ $c->req->param("group_id") ];
    if (!$c->model->database->group->validate_ids_by_company_id($c->user->{company_id}, $group_ids)) {
        return $c->plugin->error->form_parse_errors("group_id");
    }

    my $contactgroup_ids = [ $c->req->param("contactgroup_id") ];
    if (@$contactgroup_ids && !$c->model->database->contactgroup->validate_ids_by_company_id($c->user->{company_id}, $contactgroup_ids)) {
        return $c->plugin->error->form_parse_errors("contactgroup_id");
    }

    my $host_template_ids = [ $c->req->param("host_template_id") ];
    if (@$host_template_ids && !$c->model->database->host_template->validate_ids_by_company_id($c->user->{company_id}, $host_template_ids)) {
        return $c->plugin->error->form_parse_errors("host_template_id");
    }

    my $form = $c->plugin->action->check_form(create => "host")
        or return 1;

    my $data = $form->data;
    my $password = delete $data->{password};

    $c->plugin->util->pv_to_json(variables => $data);
    my $result = $c->model->database->host->create_unique($data);

    $c->plugin->action->check_crud($result)
        or return 1;

    # The host was successfully created.
    $c->plugin->log_action->create(
        target => "host",
        data => $result->data
    );

    # Create the password.
    $c->model->database->host_secret->create({
        host_id => $result->data->{id},
        password => $password
    });

    $c->plugin->log_action->create(
        target => "host_secret",
        data => {
            host_id => $result->data->{id},
            password => $password
        }
    );

    # Add the host to the admin group
    $c->model->database->host_group->create({
        host_id => $result->data->{id},
        group_id => 1
    }) or return $c->plugin->error->action_failed;

    $c->plugin->log_action->create(
        target => "host_group",
        data => {
            host_id => $result->data->{id},
            group_id => 1 
        }
    );

    foreach my $group_id (@$group_ids) {
        next if $group_id == 1;

        $c->model->database->host_group->create({
            host_id => $result->data->{id},
            group_id => $group_id
        }) or return $c->plugin->error->action_failed;

        $c->plugin->log_action->create(
            target => "host_group",
            data => {
                host_id => $result->data->{id},
                group_id => $group_id
            }
        );
    }

    if (@$contactgroup_ids) {
        foreach my $group_id (@$contactgroup_ids) {
            $c->model->database->host_contactgroup->create({
                host_id => $result->data->{id},
                contactgroup_id => $group_id
            }) or return $c->plugin->error->action_failed;
            $c->plugin->log_action->create(
                target => "host_contactgroup",
                data => {
                    host_id => $result->data->{id},
                    contactgroup_id => $group_id
                }
            );
        }
    }

    if (@$host_template_ids) {
        $c->plugin->template->add_templates_to_host($result->data->{id}, $host_template_ids)
            or return;
    }

    $c->stash->data($result->data);
    $c->view->render->json;
}

sub update {
    my ($self, $c, $opts) = @_;

    $c->plugin->token->check
        or return 1;

    my $host = $c->stash->object;
    my $host_secret = $c->model->database->host_secret->find(
        condition => [ host_id => $host->{id} ]
    ) or return $c->plugin->error->object_does_not_exists;
    my $form = $c->plugin->action->check_form(update => "host")
        or return 1;

    my $data = $form->data;
    my $password = delete $data->{password};
    my $timestamp = $c->plugin->util->timestamp;
    my $user_id = $c->user->{user_id};
    my $username = $c->user->{username};

    if (exists $data->{active} && $host->{active} != $data->{active}) {
        $data->{active_comment} = $data->{active} == 0
            ? "host deactivated by $username($user_id) at $timestamp"
            : "host activated by $username($user_id) at $timestamp";
    }

    if (exists $data->{notification} && $host->{notification} != $data->{notification}) {
        $data->{notification_comment} = $data->{notification} == 0
            ? "host notification disabled by $username($user_id) at $timestamp"
            : "host notification enabled by $username($user_id) at $timestamp";
    }

    if (exists $data->{variables}) {
        $c->plugin->util->pv_to_json(variables => $data);
    }

    my $result = $c->model->database->host->update_unique($opts->{id} => $data);

    $c->plugin->action->check_crud($result)
        or return 1;

    $c->plugin->log_action->update(
        target => "host",
        data => $result->data,
        old => $host
    );

    if (defined $password && $host_secret->{password} ne $password) {
        $c->model->database->host_secret->update(
            data => { password => $password },
            condition => [ host_id => $opts->{id} ]
        );  
    }   

    $host = $c->model->database->host->get($opts->{id});
    $c->plugin->util->json_to_pv(variables => $host);
    $c->stash->data($host);
    $c->view->render->json;
}

sub delete {
    my ($self, $c, $opts) = @_;

    $c->plugin->token->check
        or return 1;

    my $host = $c->stash->object;

    $c->model->database->host->delete($host->{id});
    $c->plugin->log_action(target => "host", data => $host);
    $c->view->render->json;
}

1;
