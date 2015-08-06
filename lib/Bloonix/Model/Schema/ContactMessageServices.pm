package Bloonix::Model::Schema::ContactMessageServices;

use strict;
use warnings;
use base qw(Bloonix::DBI::Base);
use base qw(Bloonix::DBI::CRUD);

sub init {
    my $self = shift;

    $self->validator->set(
        enabled => {
            options => [1,0],
            default => 1,
        },
        notification_level => {
            multioptions => [qw(ok warning critical unknown)],
            default => "ok,warning,critical,unknown",
            postprod => sub { my $val = shift; $$val = join(",", @$$val); }
        },
        message_service => {
            options => [qw(mail sms)],
            default => "all"
        },
        send_to => {
            min_size => 1,
            max_size => 100
        },
        enabled => {
            regex => qr/^(0|1)\z/,
            default => 1
        }
    );

    $self->validator->postcheck(sub {
        my $data = shift;

        if ($data->{message_service}) {
            return "send_to"
                if ($data->{message_service} eq "mail" && $data->{send_to} !~ $self->validator->regex->email)
                || ($data->{message_service} eq "sms" && $data->{send_to} !~ qr/^\+{0,1}\d{0,99}\z/);
        }

        return ();
    });
}

sub get_message_services {
    my ($self, $contact_id) = @_;

    return $self->dbi->fetch(
        $self->sql->select(
            table => "contact_message_services",
            column => "*",
            condition => [ contact_id => $contact_id ]
        )
    );
}

1;
