package Bloonix::Controller::User;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/user/passwd")->to("passwd");
    $c->route->map("/user/config/save")->to("save");
    $c->route->map("/user/config/stash")->to("stash");
}

sub new {
    my ($class, $c) = @_;
    my $self = bless { }, $class;

    $self->{dashboards} = { map { $_ => 1 } qw(
        hostAvailStatus
        serviceAvailStatus
        hostStatusMap
        serviceNoteStatus
        topHostsEvents
        hostTopStatus
        serviceTopStatus
        serviceChart
        userChart
    ) };

    return $self;
}

sub save {
    my ($self, $c) = @_;

    my $jsondata = $c->req->jsondata;

    if (ref $jsondata ne "HASH" || !defined $jsondata->{key} || !defined $jsondata->{data}) {
        return $c->plugin->error->form_parse_errors("key", "data");
    }

    my $key = $jsondata->{key};
    my $data = $jsondata->{data};
    my $stash = $c->user->{stash};
    my $dashboard = $stash->{dashboard};

    if ($key eq "dashboard") {
        return $self->parse_dashboard_data($c, $data);
    } elsif ($key eq "rename-dashboard") {
        return $self->rename_dashboard($c, $data);
    } elsif ($key eq "delete-dashboard") {
        return $self->delete_dashboard($c, $data);
    } elsif ($key eq "last_open_dashboard") {
        if ($dashboard && exists $dashboard->{$data}) {
            $stash->{last_open_dashboard} = $data;
            $c->model->database->user->update(
                $c->user->{id},
                { stash => $c->json->encode($stash) }
            );
        }
    }

    return $c->plugin->error->form_parse_errors("key");
}

sub rename_dashboard {
    my ($self, $c, $data) = @_;
    my $stash = $c->user->{stash};
    my $dashboard = $stash->{dashboard};

    if (ref $data ne "HASH") {
        return $c->plugin->error->form_parse_errors("data");
    }

    foreach my $key (qw/old new/) {
        if (!defined $data->{$key} || !length $data->{$key}) {
            return $c->plugin->error->form_parse_errors("old", "new");
        }
    }

    $dashboard->{$data->{new}} = delete $dashboard->{$data->{old}};

    $c->model->database->user->update(
        $c->user->{id},
        { stash => $c->json->encode($stash) }
    );

    $c->view->render->json;
}

sub delete_dashboard {
    my ($self, $c, $data) = @_;
    my $stash = $c->user->{stash};
    my $dashboard = $stash->{dashboard};

    if (ref $data ne "HASH") {
        return $c->plugin->error->form_parse_errors("data");
    }

    if (!defined $data->{name}) {
        return $c->plugin->error->form_parse_errors("name");
    }

    delete $dashboard->{$data->{name}};

    $c->model->database->user->update(
        $c->user->{id},
        { stash => $c->json->encode($stash) }
    );

    $c->view->render->json;
}

sub parse_dashboard_data {
    my ($self, $c, $data) = @_;
    my $dashboards = $self->{dashboards};
    my $stash = $c->user->{stash};

    if (ref $data ne "HASH") {
        return $c->plugin->error->form_parse_errors("data");
    }

    foreach my $key (keys %$data) {
        if ($key !~ /^(name|dashlets|scale|count)\z/) {
            return $c->plugin->error->form_parse_errors("data");
        }
    }

    if (length $data->{name} > 100) {
        return $c->plugin->error->form_parse_errors("name");
    }

    if (!defined $data->{dashlets}) {
        $data->{dashlets} = [];
    } elsif (ref $data->{dashlets} ne "ARRAY") {
        return $c->plugin->error->form_parse_errors("dashlets");
    }

    if (!defined $data->{scale}) {
        $data->{scale} = "0.35";
    } elsif ($data->{scale} !~ /^([1-9]|\d\.\d{1,2})\z/ || $data->{scale} < 0.1) {
        return $c->plugin->error->form_parse_errors("scale");
    }

    if (defined $data->{count} && $data->{count} =~ /^\d+\z/) {
        return $c->plugin->error->form_parse_errors("count");
    }

    foreach my $row (@{$data->{dashlets}}) {
        if (ref $row ne "HASH") {
            return $c->plugin->error->form_parse_errors("dashlets");
        }

        foreach my $key (keys %$row) {
            if ($key !~ /^(name|pos|width|height|opts)\z/) {
                return $c->plugin->error->form_parse_errors($key);
            }
        }

        if (!defined $row->{pos} || $row->{pos} !~ /^([1-9]|[1][0-9])\z/) {
            return $c->plugin->error->form_parse_errors("pos"); 
        }

        if (!defined $row->{name} || !exists $dashboards->{$row->{name}}) {
            return $c->plugin->error->form_parse_errors("name");
        }

        if (!defined $row->{width} || $row->{width} !~ /^[1-9]\z/) {
            return $c->plugin->error->form_parse_errors("width");
        }

        if (!defined $row->{height} || $row->{height} !~ /^[1-8]\z/) {
            return $c->plugin->error->form_parse_errors("height");
        }

        if ($row->{name} !~ /^(userChart|serviceChart|hostTopStatus|serviceTopStatus|topHostsEvents)\z/ && exists $row->{opts}) {
            return $c->plugin->error->form_parse_errors("opts");
        }

        if ($row->{name} eq "serviceChart" || $row->{name} eq "userChart") {
            if (defined $row->{opts} && ref $row->{opts} eq "HASH") {
                foreach my $key (keys %{$row->{opts}}) {
                    if ($key !~ /^(chart_id|service_id|subkey|preset)\z/) {
                        return $c->plugin->error->form_parse_errors("opts");
                    }
                }

                my $chart_id = $row->{opts}->{chart_id};
                my $service_id = $row->{opts}->{service_id};
                my $subkey = $row->{opts}->{subkey};
                my $preset = $row->{opts}->{preset};

                if (!$self->check_service_chart($c, $chart_id, $preset, $service_id)) {
                   return $c->plugin->error->form_parse_errors("opts");
                }
            } else {
                return $c->plugin->error->form_parse_errors("opts");
            }
        } elsif ($row->{name} =~ /^(hostTopStatus|serviceTopStatus|topHostsEvents)\z/) {
            if (defined $row->{opts} && (ref $row->{opts} ne "HASH" || scalar keys %{$row->{opts}} > 1 || !exists $row->{opts}->{query})) {
                return $c->plugin->error->form_parse_errors("opts");
            }
        }
    }

    $stash->{dashboard}->{$data->{name}} = {
        dashlets => $data->{dashlets},
        scale => $data->{scale}
    };

    $c->model->database->user->update(
        $c->user->{id},
        { stash => $c->json->encode($stash) }
    );

    $c->stash->data($data);
    $c->view->render->json;
}

sub check_service_chart {
    my ($self, $c, $chart_id, $preset, $service_id) = @_;

    if (!defined $chart_id || $chart_id !~ /^\d+\z/) {
        return undef;
    }

    if ($preset && $preset !~ /^(3h|6h|12h|18h|1d)\z/) {
        return undef;
    }

    if (defined $service_id) {
        if ($service_id !~ /^\d+\z/ || !$c->model->database->chart->by_user_chart_and_service_id($c->user->{id}, $chart_id, $service_id)) {
            return undef;
        }
    } elsif (!$c->model->database->user_chart->find(condition => [ id => $chart_id, user_id => $c->user->{id} ])) {
        return undef;
    }

    return 1;
}

sub passwd {
    my ($self, $c) = @_;

    if ($c->user->{username} eq "demo") {
        return $c->plugin->error->no_privileges;
    }

    my $cur_password = $c->req->param("current");
    my $new_password = $c->req->param("new");
    my $rep_password = $c->req->param("repeat");
    my @errors;

    if (!$cur_password) {
        push @errors, "current";
    }
    if (!$new_password) {
        push @errors, "new";
    }
    if (!$rep_password) {
        push @errors, "repeat";
    }
    if (@errors) {
        return $c->plugin->error->form_parse_errors(@errors);
    }
    if (length $new_password > 128) {
        return $c->plugin->error->password_is_too_long;
    }
    if (length $new_password < 8) {
        return $c->plugin->error->password_is_too_short;
    }
    if ($new_password ne $rep_password) {
        return $c->plugin->error->passwords_does_not_match;
    }

    # Get the current password settings to diff it with
    # the new password.
    my $secret = $c->model->database->user_secret->find(
        condition => [ user_id => $c->user->{id} ]
    );

    # Check if the current password match the current password.
    my $cur_base64_password = $c->plugin->util->pbkdf2_sha512_base64(
        $cur_password, $secret->{salt}, $secret->{rounds}
    );

    if ($secret->{password} ne $cur_base64_password) {
        return $c->plugin->error->password_is_not_correct;
    }

    # Check if the current password is different from the
    # new password, because the user should be forced to
    # enter a new password.
    my $new_base64_password = $c->plugin->util->pbkdf2_sha512_base64(
        $new_password, $secret->{salt}, $secret->{rounds}
    );

    if ($secret->{password} eq $new_base64_password) {
        return $c->plugin->error->passwords_must_be_different;
    }

    # Generate a complete new base64 hash + salt + rounds.
    my ($base64, $salt, $rounds) = $c->plugin->util->pbkdf2_sha512_base64($new_password);

    $c->model->database->user_secret->update(
        data => {
            password => $base64,
            salt => $salt,
            rounds => $rounds
        },
        condition => [
            user_id => $c->user->{id}
        ]
    ) or return $c->plugin->error->action_failed;

    $c->plugin->log_action->update(
        target => "user_secret",
        data => { password => "xxx" },
        old => { password => "xxx" }
    );

    $c->model->database->user->update(
        $c->user->{id} => {
            password_changed => 1
        }
    ) or return $c->plugin->error->action_failed;

    $c->view->render->json;
}

sub stash {
    my ($self, $c) = @_;

    $c->stash->data($c->user->{stash});
    $c->view->render->json;
}

1;
