package Bloonix::Model::Schema::ContactTimeperiod;

use strict;
use warnings;
use base qw(Bloonix::DBI::Base);
use base qw(Bloonix::DBI::CRUD);

sub set {
    my ($self, $user) = @_;

    if (!$user) {
        die "missing user";
    }

    $self->validator->set(
        timeperiod_id => {
            options => $self->schema->timeperiod->by_company_id_for_form($user->{company_id})
        },
        timezone => {
            options => $self->c->plugin->timezone->form,
            default => $user->{timezone},
        },
        message_service => {
            options => [qw(all mail sms)],
            default => "all"
        },
        exclude => {
            regex => qr/^(0|1)\z/,
            default => 0
        }
    );
}

1;
