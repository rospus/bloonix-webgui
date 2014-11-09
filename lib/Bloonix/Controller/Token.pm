package Bloonix::Controller::Token;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("csrf")->to("csrf");
}

sub csrf {
    my ($self, $c, $opts) = @_;

    $c->stash->data($c->plugin->token->set);
    $c->view->render->json;
}

1;
