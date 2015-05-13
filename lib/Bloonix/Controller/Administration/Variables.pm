package Bloonix::Controller::Administration::Variables;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/administration/variables")->to("get");
    $c->route->map("/administration/variables/update")->to("update");
}

sub auto {
    my ($self, $c, $opts) = @_;

    if ($c->user->{role} !~ /^(operator|admin)\z/) {
        $c->plugin->error->noauth_access;
        return undef;
    }

    $c->stash->object(
        $c->model->database->company->get(
            $c->user->{company_id}
        )
    );

    return 1;
}

sub get {
    my ($self, $c) = @_;

    $c->plugin->util->json_to_pv(variables => $c->stash->object);
    $c->stash->data($c->stash->object->{variables});
    $c->view->render->json;
}

sub update {
    my ($self, $c) = @_;

    $c->plugin->token->check
        or return;

    my $variables = $self->validate($c)
        or return $c->plugin->error->form_parse_errors("variables");

    $c->model->database->company->update(
        $c->user->{company_id} => $variables
    );

    $c->plugin->log_action->update(
        target => "company",
        data => $variables,
        old => { variables => $c->stash->object->{variables} }
    );

    $c->stash->data(variables => $c->plugin->util->json_to_pv($variables->{variables}));
    $c->view->render->json;
}

sub validate {
    my ($self, $c) = @_;

    my $variables = $c->req->param("variables") || "";
    my $data = { variables => $variables };

    foreach my $pv (split /[\r\n]+/, $variables) {
        next if $pv =~ /^\s*\z/;
        if ($pv !~ /^\s*[a-zA-Z_0-9\.]+\s*=\s*([^\s].*)\z/) {
            return undef;
        }
    }

    $c->plugin->util->pv_to_json(variables => $data);
    return $data;
}

1;
