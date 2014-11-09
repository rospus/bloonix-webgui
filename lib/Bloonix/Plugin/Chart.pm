package Bloonix::Plugin::Chart;

use strict;
use warnings;
use base qw(Bloonix::Accessor);

__PACKAGE__->mk_accessors(qw/c/);

sub new {
    my ($class, $c) = @_;

    return bless { c => $c }, $class;
}

sub shrink {
    my $self = shift;
    my $opts = @_ == 1 ? shift : {@_};
    my $rows = $opts->{rows};
    my $avg = $opts->{avg};
    my $opposite = $opts->{opposite} // {};
    my $timeout = $opts->{timeout} // 600000;
    my ($avgtime, %avgsum, %minsum, %maxsum, $last_time);
    my ($avgstats, $minstats, $maxstats) = ({}, {}, {});
    my ($count, $total) = (0, 0);

    foreach my $row (@$rows) {
        my $source = $row->{_source};
        my $time = $source->{time};
        my $sdata = $source->{data};
        my $redo = 0;

        if (!$last_time) {
            $last_time = $time;
        }

        if ($last_time + $timeout < $time) {
            $redo = 1;
            $time = $last_time + $timeout;
            $sdata = { map { $_ => undef } keys %$sdata };
        }

        if (!$avg) {
            foreach my $key (keys %$sdata) {
                if (!defined $sdata->{$key}) {
                    # null values
                    push @{$avgstats->{$key}}, [ $time + 0, undef ];
                } elsif ($sdata->{$key} =~ /^(-{0,1}\d+|-{0,1}\d+\.\d+)\z/) {
                    if ($opposite->{$key}) {
                        push @{$avgstats->{$key}}, [ $time + 0, $sdata->{$key} * -1 ];
                        push @{$minstats->{$key}}, [ $time + 0, $sdata->{$key} * -1 ];
                        push @{$maxstats->{$key}}, [ $time + 0, $sdata->{$key} * -1 ];
                    } else {
                        push @{$avgstats->{$key}}, [ $time + 0, $sdata->{$key} + 0 ];
                        push @{$minstats->{$key}}, [ $time + 0, $sdata->{$key} + 0 ];
                        push @{$maxstats->{$key}}, [ $time + 0, $sdata->{$key} + 0 ];
                    }
                }
            }
            $last_time = $time;
            next;
        }

        if (!$avgtime) {
            $avgtime = $time;
        }

        if ($time > $avgtime + $avg) {
            if (scalar keys %avgsum) {
                foreach my $key (keys %avgsum) {
                    my $value = sprintf("%.3f", $avgsum{$key} / $count);
                    if ($opposite->{$key}) {
                        push @{$avgstats->{$key}}, [ $avgtime + 0, $value * -1 ];
                        push @{$minstats->{$key}}, [ $avgtime + 0, $minsum{$key} * -1 ];
                        push @{$maxstats->{$key}}, [ $avgtime + 0, $maxsum{$key} * -1 ];
                    } else {
                        push @{$avgstats->{$key}}, [ $avgtime + 0, $value + 0 ];
                        push @{$minstats->{$key}}, [ $avgtime + 0, $minsum{$key} + 0 ];
                        push @{$maxstats->{$key}}, [ $avgtime + 0, $maxsum{$key} + 0 ];
                    }
                }
            } else {
                # null values
                foreach my $key (keys %$sdata) {
                    push @{$avgstats->{$key}}, [ $avgtime + 0, undef ];
                    push @{$minstats->{$key}}, [ $avgtime + 0, undef ];
                    push @{$maxstats->{$key}}, [ $avgtime + 0, undef ];
                }
            }
            $avgtime = $time;
            %avgsum = ();
            %minsum = ();
            %maxsum = ();
            $count = 0;
            $total++;
        }

        $count++;
        foreach my $key (keys %$sdata) {
            if (defined $sdata->{$key} && $sdata->{$key} =~ /^(-{0,1}\d+|-{0,1}\d+\.\d+)\z/) {
                $avgsum{$key} += $sdata->{$key};
                if (!defined $minsum{$key} || $sdata->{$key} < $minsum{$key}) {
                    $minsum{$key} = $sdata->{$key};
                }
                if (!defined $maxsum{$key} || $sdata->{$key} > $maxsum{$key}) {
                    $maxsum{$key} = $sdata->{$key};
                }
            }
        }

        $last_time = $time;

        if ($redo) {
            redo;
        }
    }

    if (scalar keys %avgsum) {
        $total++;
        foreach my $key (keys %avgsum) {
            my $value = sprintf("%.3f", $avgsum{$key} / $count);
            if ($opposite->{$key}) {
                push @{$avgstats->{$key}}, [ $avgtime + 0, $value * -1 ];
                push @{$minstats->{$key}}, [ $avgtime + 0, $minsum{$key} * -1 ];
                push @{$maxstats->{$key}}, [ $avgtime + 0, $maxsum{$key} * -1 ];
            } else {
                push @{$avgstats->{$key}}, [ $avgtime + 0, $value + 0 ];
                push @{$minstats->{$key}}, [ $avgtime + 0, $minsum{$key} + 0 ];
                push @{$maxstats->{$key}}, [ $avgtime + 0, $maxsum{$key} + 0 ];
            }
        }
    }

    $self->c->log->info("averaged down to $total rows");

    return wantarray ? ($avgstats, $minstats, $maxstats) : $avgstats;
}

1;
