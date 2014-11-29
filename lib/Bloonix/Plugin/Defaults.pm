package Bloonix::Plugin::Defaults;

use strict;
use warnings;
use base qw(Bloonix::Accessor);

__PACKAGE__->mk_accessors(qw/c/);

sub new {
    my ($class, $c) = @_;

    return bless { c => $c }, $class;
}

sub request {
    my $self = shift;
    my $c = $self->c;

    my %errors;
    my $offset = $self->c->req->param("offset");
    my $limit = $self->c->req->param("limit");
    my $query = $self->c->req->param("query");
    my $sort_by = $self->c->req->param("sort_by");
    my $sort_type = $self->c->req->param("sort_type");

    if (!defined $offset) {
        $offset = 0;
    } elsif ($offset !~ /^\d+\z/) {
        $errors{offset} = $c->lang->get("err-631");
    }

    if (!defined $limit) {
        $limit = 20;
    } elsif ($limit !~ /^\d{1,4}\z/ || $limit > 1000) {
        $errors{limit} = $c->lang->get("err-632", 500);
    }

    if (defined $sort_by || defined $sort_type) {
        # The maximum length of column names is 63 and
        # the column name must begin with a-z.
        if (!defined $sort_by || $sort_by !~ /^[a-z][a-z_0-9]{0,62}\z/) {
            $errors{sort_by} = $c->lang->get("err-633", 63);
        }
        if (!defined $sort_type) {
            $sort_type = "asc";
        } elsif ($sort_type !~ /^(asc|desc)\z/) {
            $errors{sort_type} = $c->lang->get("err-633");
        }
    }

    if (scalar keys %errors) {
        $c->plugin->error->json_parse_params_error(\%errors);
        return undef;
    }

    my %opts = (
        offset => $offset,
        limit => $limit
    );

    if (defined $query) {
        $opts{query} = $query;
    }

    if (defined $sort_by && defined $sort_type) {
        $opts{sort} = { by => $sort_by, type => $sort_type };
    }

    return \%opts;
}

1;
