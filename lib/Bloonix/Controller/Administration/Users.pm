package Bloonix::Controller::Administration::Users;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/administration/users")->to("list");
    $c->route->map("/administration/users/search")->to("list");
    $c->route->map("/administration/users/create")->to("create");
    $c->route->map("/administration/users/options")->to("options");
    $c->route->map("/administration/users/:id")->to("view");
    $c->route->map("/administration/users/:id/options")->to("options");
    $c->route->map("/administration/users/:id/update")->to("update");
    $c->route->map("/administration/users/:id/delete")->to("delete");
}

sub auto {
    my ($self, $c, $opts) = @_;

    if ($opts && $opts->{id}) {
        if ($c->user->{role} eq "admin") {
            $c->stash->object($c->model->database->user->get($opts->{id}));
        } else {
            $c->stash->object(
                $c->model->database->user->find(
                    condition => [ company_id => $c->user->{company_id}, id => $opts->{id} ]
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

    $c->model->database->user->set($c->user);

    return 1;
}

sub list {
    my ($self, $c) = @_;

    my $request = $c->plugin->defaults->request
        or return 1;

    my ($count, $rows) = $c->model->database->user->by_user(
        offset => $request->{offset},
        limit => $request->{limit},
        query => $request->{query},
        user => $c->user,
        sort => $request->{sort},
        order => [ asc  => "id" ]
    );

    my @user_ids = (0);
    foreach my $row (@$rows) {  
        $row->{last_login} = $row->{last_login}
            ? $c->plugin->util->timestamp($row->{last_login}, $c->user->{timezone})
            : "none";
        push @user_ids, $row->{id};
    }

    my $sessions = $c->model->database->session->get_active_sessions_by_user_ids(\@user_ids);
    foreach my $row (@$rows) {
        if ($sessions->{$row->{id}}) {
            $row->{is_logged_in} = 1;
            $row->{session_expires} = $c->plugin->util->timestamp(
                $sessions->{$row->{id}}->{expire}, $c->user->{timezone}
            );
        } else {
            $row->{is_logged_in} = 0;
            $row->{session_expires} = "n/a";
        }
    }

    $c->stash->offset($request->{offset});
    $c->stash->total($count);
    $c->stash->data($rows);
    $c->view->render->json;
}

sub view {
    my ($self, $c, $opts) = @_;

    $c->stash->data($c->stash->object);
    $c->view->render->json;
}

sub options {
    my ($self, $c, $opts) = @_;

    if ($opts->{id}) {
        $c->stash->object->{password} = "****************";
        $c->stash->object->{authentication_key} = "****************";
        $c->stash->data(values => $c->stash->object);
    } else {
        $c->stash->data(values => $c->model->database->user->validator->defaults);
    }

    $c->stash->data(options => $c->model->database->user->validator->options);
    $c->view->render->json;
}

sub create {
    my ($self, $c) = @_;

    return $self->_store($c);
}

sub update {
    my ($self, $c, $opts) = @_;

    $c->plugin->token->check
        or return 1;

    return $self->_store($c, $c->stash->object);
}

sub delete {
    my ($self, $c, $opts) = @_;

    $c->plugin->action->delete(user => $c->stash->object);
}

sub _store {
    my ($self, $c, $user) = @_;

    my $action = $user ? "update" : "create";
    my $user_id = $user ? $user->{id} : 0;

    my $form = $c->plugin->action->check_form($action => "user")
        or return 1;

    my $data = $form->data;
    my $no_crypt = $c->req->param("no_crypt");
    my (%secrets, $new_user);

    if ($data->{username}) {
        $data->{username} = lc($data->{username});
    }

    if ($data->{password} && $data->{password} !~ /^\*+\z/) {
        if ($no_crypt) {
            if ($data->{password} !~ /^.{1,128}\$.{1,128}\$\d{1,10}\z/) {
                return $c->plugin->error->form_parse_errors("password");
            }
            @secrets{qw(password salt rounds)} = split /\$/, $data->{password};
        } else {
            @secrets{qw(password salt rounds)} = $c->plugin->util->pbkdf2_sha512_base64($data->{password});
        }
    }

    if ($data->{authentication_key} && $data->{authentication_key} !~ /^\*+\z/) {
        $secrets{authentication_key} = $data->{authentication_key};
    }

    delete $data->{password};
    delete $data->{authentication_key};
    delete $data->{id};

    my $result = $user
        ? $c->model->database->user->update_unique($user->{id}, $data)
        : $c->model->database->user->create_unique($data);

    $c->plugin->action->check_crud($result)
        or return 1;

    if ($user) {
        $c->plugin->log_action->update(
            target => "user",
            data => $result->data,
            old => $user
        );
    } else {
        $c->plugin->log_action->create(
            target => "user",
            data => $result->data
        );
    }

    if (scalar keys %secrets) {
        $secrets{crypt_type} = 1;

        if ($user) {
            $c->model->database->user_secret->update(
                data => \%secrets,
                condition => [ user_id => $user->{id} ]
            );

            foreach my $key (qw/password authentication_key/) {
                if ($secrets{$key}) {
                    $secrets{$key} = "xxx";
                }
            }

            $c->plugin->log_action->update(
                target => "user_secret",
                data => \%secrets
            );
        } else {
            $secrets{user_id} = $result->data->{id};

            $c->model->database->user_secret->create(\%secrets)
                or return $c->plugin->error->action_failed;

            foreach my $key (qw/password authentication_key/) {
                if ($secrets{$key}) {
                    $secrets{$key} = "xxx";
                }
            }

            $c->plugin->log_action->create(
                target => "user_secret",
                data => \%secrets
            );
        }
    }

    $c->stash->data($result->data);
    $c->view->render->json;
}

1;
