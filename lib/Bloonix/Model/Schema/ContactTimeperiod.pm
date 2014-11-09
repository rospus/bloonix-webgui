package Bloonix::Model::Schema::ContactTimeperiod;

use strict;
use warnings;
use base qw(Bloonix::DBI::Base);
use base qw(Bloonix::DBI::CRUD);

sub init {
    my $self = shift;

    $self->set_unique(and => [ "timeperiod_id", "contact_id", "timezone" ]);
}

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
        type => {
            options => [
                "send_to_all",
                "send_only_sms",
                "send_only_mail",
                "exclude",
            ],
        },
    );
}

1;
