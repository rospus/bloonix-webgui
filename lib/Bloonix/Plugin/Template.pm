package Bloonix::Plugin::Template;

use strict;
use warnings;
use base qw(Bloonix::Accessor);

__PACKAGE__->mk_accessors(qw/c/);

sub new {
    my ($class, $c) = @_;

    return bless { c => $c }, $class;
}

sub add_hosts_to_template {
    my ($self, $host_template_id, $host_ids) = @_;
    my $c = $self->c;

    $c->plugin->transaction->begin
        or return undef;

    eval {
        my $host_template_services = $c->model->database->service_parameter->search(
            condition => [ host_template_id => $host_template_id ]
        );  

        foreach my $host_id (@$host_ids) {
            $c->model->database->host_template_host->create({
                host_id => $host_id,
                host_template_id => $host_template_id
            }) or next;

            $c->plugin->log_action->create(
                target => "host_template_host",
                data => {
                    host_id => $host_id,
                    host_template_id => $host_template_id
                }   
            );  

            my $services_added = 0;
            foreach my $hs (@$host_template_services) {
                $self->create_service($hs->{ref_id}, $host_id);
                $services_added++;
            }

            if ($services_added) {
                $c->model->database->host->update(
                    $host_id => { status => "INFO" }
                );
            }
        }
    };

    if ($@) {
        $c->plugin->transaction->rollback;
        return undef;
    }

    $c->plugin->transaction->end
        or return undef;

    return 1;
}

sub add_templates_to_host {
    my ($self, $host_id, $host_template_ids) = @_;
    my $c = $self->c;

    $c->plugin->transaction->begin
        or return undef;

    eval {
        my $services_added = 0;

        foreach my $host_template_id (@$host_template_ids) {
            $c->model->database->host_template_host->create({
                host_id => $host_id,
                host_template_id => $host_template_id
            }) or next;

            $c->plugin->log_action->create(
                target => "host_template_host",
                data => {
                    host_id => $host_id,
                    host_template_id => $host_template_id
                }
            );

            my $host_template_services = $c->model->database->service_parameter->search(
                condition => [ host_template_id => $host_template_id ]
            );

            foreach my $hs (@$host_template_services) {
                $self->create_service($hs->{ref_id}, $host_id);
                $services_added++;
            }
        }

        if ($services_added) {
            $c->model->database->host->update(
                $host_id => { status => "INFO" }
            );
        }
    };

    if ($@) {
        $c->plugin->transaction->rollback;
        return undef;
    }

    $c->plugin->transaction->end
        or return undef;

    return 1;
}

sub remove_hosts_from_template {
    my ($self, $host_template_id, $host_ids) = @_;
    my $c = $self->c;

    $c->plugin->transaction->begin
        or return undef;

    eval {
        my $host_template_services = $c->model->database->service_parameter->search(
            condition => [ host_template_id => $host_template_id ]
        );

        foreach my $host_id (@$host_ids) {
            $c->model->database->host_template_host->delete(
                host_id => $host_id,
                host_template_id => $host_template_id
            );
        
            $c->plugin->log_action->delete(
                target => "host_template_host",
                data => {
                    host_id => $host_id,
                    host_template_id => $host_template_id
                }
            );

            my $services_deleted = 0;
            foreach my $hs (@$host_template_services) {
                $c->model->database->service->delete(
                    service_parameter_id => $hs->{ref_id},
                    host_id => $host_id
                );
                $c->plugin->log_action->delete(
                    target => "service",
                    data => { service_parameter_id => $hs->{ref_id}, host_id => $host_id }
                );
                $services_deleted++;
            }

            if ($services_deleted) {
                $c->model->database->service->update_max_host_status($host_id);
            }
        }
    };

    if ($@) {
        $c->plugin->transaction->rollback;
        return undef;
    }

    $c->plugin->transaction->end
        or return undef;

    return 1;
}

sub remove_templates_from_host {
    my ($self, $host_id, $host_template_ids) = @_;
    my $c = $self->c;

    $c->plugin->transaction->begin
        or return undef;

    eval {
        my $services_deleted = 0;

        foreach my $host_template_id (@$host_template_ids) {
            my $host_template_services = $c->model->database->service_parameter->search(
                condition => [ host_template_id => $host_template_id ]
            );

            $c->model->database->host_template_host->delete(
                host_id => $host_id,
                host_template_id => $host_template_id
            );

            $c->plugin->log_action->delete(
                target => "host_template_host",
                data => {
                    host_id => $host_id,
                    host_template_id => $host_template_id
                }
            );

            foreach my $hs (@$host_template_services) {
                $c->model->database->service->delete(
                    service_parameter_id => $hs->{ref_id},
                    host_id => $host_id
                );
                $c->plugin->log_action->delete(
                    target => "service",
                    data => { service_parameter_id => $hs->{ref_id}, host_id => $host_id }
                );
                $services_deleted++;
            }
        }

        if ($services_deleted) {
            $c->model->database->service->update_max_host_status($host_id);
        }
    };

    if ($@) {
        $c->plugin->transaction->rollback;
        return undef;
    }

    $c->plugin->transaction->end
        or return undef;

    return 1;
}

sub create_service {
    my ($self, $ref_id, $host_id) = @_;

    $self->c->model->database->service->create(
        service_parameter_id => $ref_id,
        updated => 1,
        host_id => $host_id,
        message => "waiting for initialization",
        status => "INFO",
        last_check => time
    );
}

sub parse_variables {
    my ($self, $data) = @_;
    my $c = $self->c;
    my $variables = $data->{variables} // "";
    $data->{variables} = {};

    foreach my $pv (split /[\r\n]+/, $variables) {
        next if $pv =~ /^\s*\z/;
        if ($pv =~ /^\s*([a-zA-Z_0-9\-\.]+)\s*=\s*([^\s].*)\z/) {
            my ($p, $v) = ($1, $2);
            $v =~ s/\s*\z//;
            $data->{variables}->{$p} = $v;
        }
    }

    $data->{variables} = $c->json->encode($data->{variables});
}

sub variables_to_form {
    my ($self, $data) = @_;
    my $c = $self->c;

    my $variables = $c->json->decode($data->{variables});
    $data->{variables} = "";
    foreach my $key (sort keys %$variables) {
        $data->{variables} .= "$key=$variables->{$key}\n";
    }
}

1;
