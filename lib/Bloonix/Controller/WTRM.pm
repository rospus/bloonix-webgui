package Bloonix::Controller::WTRM;

use strict;
use warnings;
use Time::HiRes qw();
use Bloonix::IO::SIPC;

sub new {
    my ($class, $c) = @_;
    my $self = bless { }, $class;

    if ($c->config->{wtrm_api}) {
        $c->config->{wtrm_api}->{peerport} = delete $c->config->{wtrm_api}->{port};
        $c->config->{wtrm_api}->{peeraddr} = delete $c->config->{wtrm_api}->{host};
        $self->{io} = Bloonix::IO::SIPC->new($c->config->{wtrm_api});
    }

    return $self;
}

sub io {
    my $self = shift;
    return $self->{io};
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

    if (!$self->io) {
        return $c->plugin->error->feature_not_available;
    }

    my $wtrm_api_key = $c->config->{wtrm_api_key};
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

    my $action = $opts && $opts->{quick}
        ? "quick"
        : "test";

    my $res;

    eval {
        $self->io->connect or die $self->io->errstr;
        $self->io->send(
            action => $action,
            wtrm_api_key => $wtrm_api_key,
            data => $data
        ) or die $self->io->errstr;
        $res = $self->io->recv or die $self->io->errstr;
        $self->io->disconnect;
    };

    if (!$res || !ref $res eq "HASH" || $res->{status} ne "ok") {
        return $c->plugin->error->feature_not_available;
    }

    my $key = $res->{data};
    $c->stash->data("/wtrm/result/$key");
    $c->view->render->json;
}

sub result {
    my ($self, $c, $opts) = @_;
    my $wtrm_api_key = $c->config->{wtrm_api_key};
    my $res;

    eval {
        $self->io->connect or die $self->io->errstr;

        $self->io->send(
            action => "result",
            wtrm_api_key => $wtrm_api_key,
            key => $opts->{key},
            num => $opts->{num}
        ) or die $self->io->errstr;

        $res = $self->io->recv or die $self->io->errstr;
        $self->io->disconnect;
    };

    if (!$res || !ref $res eq "HASH" || !$res->{data}) {
        return $c->plugin->error->action_failed;
    }

    $c->stash->data($res->{data});
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
