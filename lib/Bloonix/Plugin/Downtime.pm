package Bloonix::Plugin::Downtime;

use strict;
use warnings;
use base qw(Bloonix::Accessor);
use Bloonix::Timeperiod;

__PACKAGE__->mk_accessors(qw/c/);

sub new {
    my ($class, $c) = @_;

    return bless { c => $c }, $class;
}

sub validate {
    my ($self, %opts) = @_;
    my $c = $self->c;

    my $data = {
        username => $c->user->{username},
        description => $c->req->param("description"),
        timezone => $c->req->param("timezone"),
        flag => $c->req->param("flag") // "none"
    };

    foreach my $key (keys %opts) {
        $data->{$key} = $opts{$key};
    }

    my $type = $c->req->param("type") || "";
    my $begin = $c->req->param("begin") || "";
    my $end = $c->req->param("end") || "";
    my $timeslice = $c->req->param("timeslice");
    my $preset = $c->req->param("preset");
    my @errors;

    if ($type !~ /^(absolute|timeslice|preset)\z/) {
        push @errors, "type";
    }

    if (!$data->{description}) {
        push @errors, "description";
    }

    if (!$data->{timezone} || !$c->plugin->timezone->exists($data->{timezone})) {
        push @errors, "timezone";
        # set the timezone for the begin/end time check
        $data->{timezone} = "Europe/Berlin";
    }

    if ($type eq "absolute") {
        if ($begin && $end) {
            eval { $begin = $c->plugin->util->time2secs($begin, $data->{timezone}) };
            if ($@) {
                push @errors, "begin";
            } else {
                $data->{begin} = $c->plugin->util->timestamp($begin);
            }
            eval { $end = $c->plugin->util->time2secs($end, $data->{timezone}) };
            if ($@) {
                push @errors, "end";
            } else {
                $data->{end} = $c->plugin->util->timestamp($end);
            }
        } else {
            if (!$begin) {
                push @errors, "begin";
            }
            if (!$end) {
                push @errors, "end";
            }
        }
    }

    if ($type eq "timeslice") {
        if ($timeslice && Bloonix::Timeperiod->parse($timeslice)) {
            $data->{timeslice} = $timeslice;
        } else {
            push @errors, "timeslice";
        }
    }

    if ($type eq "preset") {
        if ($preset && $preset =~ /^(\d+)([mhd])\z/) {
            my ($preset_time, $unit) = ($1, $2);
            if ($unit eq "m") {
                $preset_time *= 60;
            } elsif ($unit eq "h") {
                $preset_time *= 3600;
            } elsif ($unit eq "d") {
                $preset_time *= 86400;
            }
            my $time = time;
            $data->{begin} = $c->plugin->util->timestamp($time);
            $data->{end} = $c->plugin->util->timestamp($time + $preset_time);
        } else {
            push @errors, "preset";
        }
    }

    if (@errors) {
        $c->plugin->error->form_parse_errors(\@errors);
        return undef;
    }

    return $data;
}

1;
