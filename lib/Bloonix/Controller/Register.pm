package Bloonix::Controller::Register;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/register/host")->to("host");
}

sub host {
    my ($self, $c) = @_;

    $c->model->database->host->set_register;

    my $form = $c->plugin->action->check_form(create => "host")
        or return 1;

    my $data = $form->data;
    my $id = $data->{company_id};
    my $authkey = delete $data->{company_authkey};
    my $addr = $c->req->remote_addr;

    my $company = $c->model->database->company->check_host_reg($id, $authkey, $addr);

    if (!$company) {
        $c->log->warning("access denied: host registration $addr");
        return $c->plugin->error->noauth_access;
    }

    $c->user({
        id => 1,
        username => "admin",
        company_id => $id,
        max_hosts => $company->{max_hosts},
        max_services => $company->{max_services},
        max_services_per_host => $company->{max_services_per_host}
    });

    my $password = $c->plugin->util->pwgen(30);
    my $queue_size = $c->model->database->host->get_host_reg_queue_size($id);
    my $count_hosts = $c->model->database->host->count_by_company_id($id);

    if ($queue_size >= $company->{max_hosts_in_reg_queue}) {
        return $c->plugin->error->max_host_req_exceeded;
    }
    if ($count_hosts >= $company->{max_hosts}) {
        return $c->plugin->error->limit_error("err-831" => $c->user->{max_hosts});
    }

    $c->plugin->util->pv_to_json(variables => $data);
    $data->{register} = 1;
    $data->{active} = 0;

    my $result = $c->model->database->host->create_unique($data);

    $c->plugin->action->check_crud($result)
        or return 1;

    $c->plugin->log_action->create(
        target => "host",
        data => $result->data
    );

    $c->model->database->host_secret->create({
        host_id => $result->data->{id},
        password => $password
    });

    $c->plugin->log_action->create(
        target => "host_secret",
        data => {
            host_id => $result->data->{id},
            password => $password
        }
    );

    $c->stash->data({
        host_id => $result->data->{id},
        password => $password
    });

    my $host_template_tags = $c->req->param("host_template_tags");

    if ($host_template_tags) {
        my @tags;

        foreach my $tag (split /,/, $host_template_tags) {
            $tag =~ s/\s//g;
            if ($tag =~ /\w/) {
                push @tags, $tag;
            }
        }

        if (@tags) {
            my $host_template_ids = $c->model->database->host_template->by_tags(
                $id, \@tags
            );

            if (@$host_template_ids) {
                $c->plugin->template->add_templates_to_host(
                    $result->data->{id}, $host_template_ids
                );
            }
        }
    }

    $c->view->render->json;
}

1;
