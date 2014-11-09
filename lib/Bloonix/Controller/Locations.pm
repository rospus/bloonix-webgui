package Bloonix::Controller::Locations;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/locations")->to("list");
}

sub list {
    my ($self, $c) = @_;

    my $locations = $c->model->database->location->search(
        order => [
            asc => [ "continent", "country", "city", "ipaddr" ]
        ]
    );

    foreach my $location (@$locations) {
        $location->{coordinates} = $c->json->decode($location->{coordinates});
    }

    $c->stash->data($locations);
    $c->view->render->json;
}

1;
