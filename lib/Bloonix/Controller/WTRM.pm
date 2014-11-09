package Bloonix::Controller::WTRM;

use strict;
use warnings;
use Time::HiRes qw();
use Bloonix::REST;

sub new {
    my ($class, $c) = @_;
    my $self = bless { }, $class;

    $self->{rest} = Bloonix::REST->new(
        proto => "https",
        host => "agent02.bloonix.de",
        mode => "failover",
        timeout => 30,
        utf8 => "yes",
        ssl_options => {
            ssl_verify_mode => 1,
            ssl_ca_path => "/etc/ssl/certs"
        },
    );

    return $self;
}

sub rest {
    my $self = shift;
    return $self->{rest};
}

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/wtrm/test")->to("test");
    $c->route->map("/wtrm/quick")->to("quick");
    $c->route->map("/wtrm/result/:key([a-zA-Z_0-9]+)/:num([0-9]+)")->to("result");
    $c->route->map("/wtrm/actions")->to("actions");
    $c->route->map("/wtrm/validate/step")->to("validate_step");
    $c->route->map("/wtrm/report/:service_id")->to("report");
}

sub quick {
    my ($self, $c) = @_;

    return $self->test($c, { quick => 1 });
}

sub test {
    my ($self, $c, $opts) = @_;

    my $data = $c->req->jsondata;
    $c->log->notice("execute wtrm workflow");
    $c->log->dump(notice => $data);

    if (!$data || ref $data ne "ARRAY") {
        return $c->plugin->error->json_parse_failure;
    }

    my $errors = $c->plugin->wtrm->validate_steps($data);

    if ($errors) {
        $c->log->dump(error => $errors);
        return $c->plugin->error->json_parse_params_error($errors);
    }

    my $path = $opts && $opts->{quick}
        ? "/ohGoh7Ioz5Yoogh0Eep8ohvaoJu4eeLeigh6rohtabiy4oa8ooM1ahquaehaiSah/quick"
        : "/ohGoh7Ioz5Yoogh0Eep8ohvaoJu4eeLeigh6rohtabiy4oa8ooM1ahquaehaiSah/test";

    local $SIG{__DIE__} = sub {};
    my $result = $self->rest->post(path => $path, data => $data)
        or return $c->plugin->error->action_failed;

    my $key = $result->{data};
    $c->stash->data("/wtrm/result/$key");
    $c->view->render->json;
}

sub result {
    my ($self, $c, $opts) = @_;

    local $SIG{__DIE__} = sub {};
    my $result = $self->rest->get(
        path => "/ohGoh7Ioz5Yoogh0Eep8ohvaoJu4eeLeigh6rohtabiy4oa8ooM1ahquaehaiSah/result",
        data => $opts
    ) or return $c->plugin->error->action_failed;

    $c->stash->data($result->{data});
    $c->view->render->json;
}

sub validate_step {
    my ($self, $c) = @_;

    my $data = $c->req->jsondata;
    $c->log->dump(notice => $data);

    if (!$data || ref $data ne "HASH") {
        return $c->plugin->error->json_parse_failure;
    }

    my $errors = $c->plugin->wtrm->validate_step($data);

    if ($errors) {
        return $c->plugin->error->form_parse_errors($errors);
    }

    $c->view->render->json;
}

sub actions {
    my ($self, $c) = @_;

    $c->stash->data($c->plugin->wtrm->actions);
    $c->view->render->json;
}

sub report {
    my ($self, $c, $opts) = @_;

    my $service = $c->model->database->service->by_service_and_user_id(
        $opts->{service_id}, $c->user->{id}
    ) or return $c->plugin->error->object_does_not_exists;

    my $request = $c->plugin->defaults->request
        or return 1;

    my $from = (time - (86400 * 12)) * 1000;
    my $to = time * 1000;
    my $result = $c->model->rest->results->get(
        service_id => $service->{id},
        from_time => $from,
        to_time => $to,
        from => $request->{offset},
        size => $request->{limit}
    );

    my @data;
    foreach my $row (@{$result->{hits}->{hits}}) {
        push @data, $row->{_source};
        $row->{_source}->{time} = $c->plugin->util->timestamp(
            $row->{_source}->{time},
            $c->user->{timezone}
        );
    }

    $c->stash->offset($request->{offset});
    $c->stash->total($result->{hits}->{total});
    $c->stash->data(\@data);
    $c->view->render->json;
}

1;
