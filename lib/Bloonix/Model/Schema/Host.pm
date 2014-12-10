package Bloonix::Model::Schema::Host;

use strict;
use warnings;
use base qw(Bloonix::DBI::Base);
use base qw(Bloonix::DBI::CRUD);

sub init {
    my $self = shift;

    $self->set_unique(and => [ "company_id", "hostname" ]);
}

sub set {
    my ($self, $user) = @_;

    if (!$user || ref $user ne "HASH") {
        die "no user set";
    }

    my (@company, $company);

    if ($user->{role} eq "admin") {
        $company = $self->schema->company->all;
    } else {
        $company = [ $self->schema->company->get($user->{company_id}) ];
    }

    foreach my $comp (@$company) {
        push @company, {
            name  => $comp->{company},
            value => $comp->{id},
        };
    }

    $self->validator->set(
        company_id => {
            options => \@company,
            default => $user->{company_id},
        },
        password => {
            regex => qr/^\w{30,128}\z/,
        },
        hostname =>  {
            regex => qr/^[\w\.\-]{3,64}\z/,
        },
        description => {
            min_size => 1,
            max_size => 100,
        },
        comment => {
            max_size => 100,
            optional => 1,
        },
        sysgroup => {
            regex => qr/^.{0,50}\z/,
            optional => 1,
        },
        sysinfo => {
            regex => qr!^(?:|https{0,1}://[\w\.\-]+(?:/|/[^"'<>\\]+))\z!,
            max_size => 200,
            optional => 1,
        },
        device_class => {
            max_size => 100,
            regex => qr!^/.+!,
            default => "/Server"
        },
        hw_manufacturer => {
            max_size => 50,
            optional => 1,
        },
        hw_product => {
            max_size => 50,
            optional => 1,
        },
        os_manufacturer => {
            max_size => 50,
            optional => 1,
        },
        os_product => {
            max_size => 50,
            optional => 1,
        },
        virt_manufacturer => {
            max_size => 50,
            optional => 1,
        },
        virt_product => {
            max_size => 50,
            optional => 1,
        },
        location => {
            max_size => 100,
            optional => 1,
        },
        coordinates => {
            options => [
                { value => "AD", name => "AD - Andorra" },
                { value => "AE", name => "AE - United Arab Emirates" },
                { value => "AF", name => "AF - Afghanistan" },
                { value => "AG", name => "AG - Antigua and Barbuda" },
                { value => "AI", name => "AI - Anguilla" },
                { value => "AL", name => "AL - Albania" },
                { value => "AM", name => "AM - Armenia" },
                { value => "AO", name => "AO - Angola" },
                { value => "AR", name => "AR - Argentina" },
                { value => "AS", name => "AS - American Samoa" },
                { value => "AT", name => "AT - Austria" },
                { value => "AU", name => "AU - Australia" },
                { value => "AW", name => "AW - Aruba" },
                { value => "AX", name => "AX - Aland Islands" },
                { value => "AZ", name => "AZ - Azerbaijan" },
                { value => "BA", name => "BA - Bosnia and Herzegovina" },
                { value => "BB", name => "BB - Barbados" },
                { value => "BD", name => "BD - Bangladesh" },
                { value => "BE", name => "BE - Belgium" },
                { value => "BF", name => "BF - Burkina Faso" },
                { value => "BG", name => "BG - Bulgaria" },
                { value => "BH", name => "BH - Bahrain" },
                { value => "BI", name => "BI - Burundi" },
                { value => "BJ", name => "BJ - Benin" },
                { value => "BL", name => "BL - Saint Barthelemy" },
                { value => "BN", name => "BN - Brunei Darussalam" },
                { value => "BO", name => "BO - Bolivia" },
                { value => "BM", name => "BM - Bermuda" },
                { value => "BQ", name => "BQ - Bonaire, Saint Eustatius and Saba" },
                { value => "BR", name => "BR - Brazil" },
                { value => "BS", name => "BS - The Bahamas" },
                { value => "BT", name => "BT - Bhutan" },
                { value => "BV", name => "BV - Bouvet Island" },
                { value => "BW", name => "BW - Botswana" },
                { value => "BY", name => "BY - Belarus" },
                { value => "BZ", name => "BZ - Belize" },
                { value => "CA", name => "CA - Canada" },
                { value => "CC", name => "CC - Cocos (Keeling) Islands" },
                { value => "CD", name => "CD - Democratic Republic of the Congo" },
                { value => "CF", name => "CF - Central African Republic" },
                { value => "CG", name => "CG - Republic of the Congo" },
                { value => "CH", name => "CH - Switzerland" },
                { value => "CI", name => "CI - Côte d'Ivoire" },
                { value => "CK", name => "CK - Cook Islands" },
                { value => "CL", name => "CL - Chile" },
                { value => "CM", name => "CM - Cameroon" },
                { value => "CN", name => "CN - China" },
                { value => "CO", name => "CO - Colombia" },
                { value => "CR", name => "CR - Costa Rica" },
                { value => "CU", name => "CU - Cuba" },
                { value => "CV", name => "CV - Cape Verde" },
                { value => "CW", name => "CW - Curaçao" },
                { value => "CX", name => "CX - Christmas Island" },
                { value => "CY", name => "CY - Cyprus" },
                { value => "CZ", name => "CZ - Czech Republic" },
                { value => "DE", name => "DE - Germany" },
                { value => "DJ", name => "DJ - Djibouti" },
                { value => "DK", name => "DK - Denmark" },
                { value => "DM", name => "DM - Dominica" },
                { value => "DO", name => "DO - Dominican Republic" },
                { value => "DZ", name => "DZ - Algeria" },
                { value => "EC", name => "EC - Ecuador" },
                { value => "EG", name => "EG - Egypt" },
                { value => "EE", name => "EE - Estonia" },
                { value => "EH", name => "EH - Western Sahara" },
                { value => "ER", name => "ER - Eritrea" },
                { value => "ES", name => "ES - Spain" },
                { value => "ET", name => "ET - Ethiopia" },
                { value => "FI", name => "FI - Finland" },
                { value => "FJ", name => "FJ - Fiji" },
                { value => "FK", name => "FK - Falkland Islands" },
                { value => "FM", name => "FM - Federated States of Micronesia" },
                { value => "FO", name => "FO - Faroe Islands" },
                { value => "FR", name => "FR - France" },
                { value => "GA", name => "GA - Gabon" },
                { value => "GB", name => "GB - United Kingdom" },
                { value => "GE", name => "GE - Georgia" },
                { value => "GD", name => "GD - Grenada" },
                { value => "GF", name => "GF - French Guiana" },
                { value => "GG", name => "GG - Guernsey" },
                { value => "GH", name => "GH - Ghana" },
                { value => "GI", name => "GI - Gibraltar" },
                { value => "GL", name => "GL - Greenland" },
                { value => "GM", name => "GM - Gambia" },
                { value => "GN", name => "GN - Guinea" },
                { value => "GO", name => "GO - Glorioso Islands" },
                { value => "GP", name => "GP - Guadeloupe" },
                { value => "GQ", name => "GQ - Equatorial Guinea" },
                { value => "GR", name => "GR - Greece" },
                { value => "GS", name => "GS - South Georgia and South Sandwich Islands" },
                { value => "GT", name => "GT - Guatemala" },
                { value => "GU", name => "GU - Guam" },
                { value => "GW", name => "GW - Guinea Bissau" },
                { value => "GY", name => "GY - Guyana" },
                { value => "HK", name => "HK - Hong Kong S.A.R." },
                { value => "HM", name => "HM - Heard Island and McDonald Islands" },
                { value => "HN", name => "HN - Honduras" },
                { value => "HR", name => "HR - Croatia" },
                { value => "HT", name => "HT - Haiti" },
                { value => "HU", name => "HU - Hungary" },
                { value => "ID", name => "ID - Indonesia" },
                { value => "IE", name => "IE - Ireland" },
                { value => "IL", name => "IL - Israel" },
                { value => "IM", name => "IM - Isle of Man" },
                { value => "IN", name => "IN - India" },
                { value => "IO", name => "IO - British Indian Ocean Territory" },
                { value => "IQ", name => "IQ - Iraq" },
                { value => "IR", name => "IR - Iran" },
                { value => "IS", name => "IS - Iceland" },
                { value => "IT", name => "IT - Italy" },
                { value => "JE", name => "JE - Jersey" },
                { value => "JM", name => "JM - Jamaica" },
                { value => "JO", name => "JO - Jordan" },
                { value => "JP", name => "JP - Japan" },
                { value => "JU", name => "JU - Juan De Nova Island" },
                { value => "KE", name => "KE - Kenya" },
                { value => "KG", name => "KG - Kyrgyzstan" },
                { value => "KH", name => "KH - Cambodia" },
                { value => "KI", name => "KI - Kiribati" },
                { value => "KM", name => "KM - Comoros" },
                { value => "KN", name => "KN - Saint Kitts and Nevis" },
                { value => "KP", name => "KP - North Korea" },
                { value => "KR", name => "KR - South Korea" },
                { value => "XK", name => "XK - Kosovo" },
                { value => "KW", name => "KW - Kuwait" },
                { value => "KY", name => "KY - Cayman Islands" },
                { value => "KZ", name => "KZ - Kazakhstan" },
                { value => "LA", name => "LA - Lao People's Democratic Republic" },
                { value => "LB", name => "LB - Lebanon" },
                { value => "LC", name => "LC - Saint Lucia" },
                { value => "LI", name => "LI - Liechtenstein" },
                { value => "LK", name => "LK - Sri Lanka" },
                { value => "LR", name => "LR - Liberia" },
                { value => "LS", name => "LS - Lesotho" },
                { value => "LT", name => "LT - Lithuania" },
                { value => "LU", name => "LU - Luxembourg" },
                { value => "LV", name => "LV - Latvia" },
                { value => "LY", name => "LY - Libya" },
                { value => "MA", name => "MA - Morocco" },
                { value => "MC", name => "MC - Monaco" },
                { value => "MD", name => "MD - Moldova" },
                { value => "MG", name => "MG - Madagascar" },
                { value => "ME", name => "ME - Montenegro" },
                { value => "MF", name => "MF - Saint Martin" },
                { value => "MH", name => "MH - Marshall Islands" },
                { value => "MK", name => "MK - Macedonia" },
                { value => "ML", name => "ML - Mali" },
                { value => "MO", name => "MO - Macau S.A.R" },
                { value => "MM", name => "MM - Myanmar" },
                { value => "MN", name => "MN - Mongolia" },
                { value => "MP", name => "MP - Northern Mariana Islands" },
                { value => "MQ", name => "MQ - Martinique" },
                { value => "MR", name => "MR - Mauritania" },
                { value => "MS", name => "MS - Montserrat" },
                { value => "MT", name => "MT - Malta" },
                { value => "MU", name => "MU - Mauritius" },
                { value => "MV", name => "MV - Maldives" },
                { value => "MW", name => "MW - Malawi" },
                { value => "MX", name => "MX - Mexico" },
                { value => "MY", name => "MY - Malaysia" },
                { value => "MZ", name => "MZ - Mozambique" },
                { value => "NA", name => "NA - Namibia" },
                { value => "NC", name => "NC - New Caledonia" },
                { value => "NE", name => "NE - Niger" },
                { value => "NF", name => "NF - Norfolk Island" },
                { value => "NG", name => "NG - Nigeria" },
                { value => "NI", name => "NI - Nicaragua" },
                { value => "NL", name => "NL - Netherlands" },
                { value => "NO", name => "NO - Norway" },
                { value => "NP", name => "NP - Nepal" },
                { value => "NR", name => "NR - Nauru" },
                { value => "NU", name => "NU - Niue" },
                { value => "NZ", name => "NZ - New Zealand" },
                { value => "OM", name => "OM - Oman" },
                { value => "PA", name => "PA - Panama" },
                { value => "PE", name => "PE - Peru" },
                { value => "PF", name => "PF - French Polynesia" },
                { value => "PG", name => "PG - Papua New Guinea" },
                { value => "PH", name => "PH - Philippines" },
                { value => "PK", name => "PK - Pakistan" },
                { value => "PL", name => "PL - Poland" },
                { value => "PM", name => "PM - Saint Pierre and Miquelon" },
                { value => "PN", name => "PN - Pitcairn Islands" },
                { value => "PR", name => "PR - Puerto Rico" },
                { value => "PS", name => "PS - Palestinian Territories" },
                { value => "PT", name => "PT - Portugal" },
                { value => "PW", name => "PW - Palau" },
                { value => "PY", name => "PY - Paraguay" },
                { value => "QA", name => "QA - Qatar" },
                { value => "RE", name => "RE - Reunion" },
                { value => "RO", name => "RO - Romania" },
                { value => "RS", name => "RS - Serbia" },
                { value => "RU", name => "RU - Russia" },
                { value => "RW", name => "RW - Rwanda" },
                { value => "SA", name => "SA - Saudi Arabia" },
                { value => "SB", name => "SB - Solomon Islands" },
                { value => "SC", name => "SC - Seychelles" },
                { value => "SD", name => "SD - Sudan" },
                { value => "SE", name => "SE - Sweden" },
                { value => "SG", name => "SG - Singapore" },
                { value => "SH", name => "SH - Saint Helena" },
                { value => "SI", name => "SI - Slovenia" },
                { value => "SJ", name => "SJ - Svalbard and Jan Mayen" },
                { value => "SK", name => "SK - Slovakia" },
                { value => "SL", name => "SL - Sierra Leone" },
                { value => "SM", name => "SM - San Marino" },
                { value => "SN", name => "SN - Senegal" },
                { value => "SO", name => "SO - Somalia" },
                { value => "SR", name => "SR - Suriname" },
                { value => "SS", name => "SS - South Sudan" },
                { value => "ST", name => "ST - Sao Tome and Principe" },
                { value => "SV", name => "SV - El Salvador" },
                { value => "SX", name => "SX - Sint Maarten" },
                { value => "SY", name => "SY - Syria" },
                { value => "SZ", name => "SZ - Swaziland" },
                { value => "TC", name => "TC - Turks and Caicos Islands" },
                { value => "TD", name => "TD - Chad" },
                { value => "TF", name => "TF - French Southern and Antarctic Lands" },
                { value => "TG", name => "TG - Togo" },
                { value => "TH", name => "TH - Thailand" },
                { value => "TJ", name => "TJ - Tajikistan" },
                { value => "TK", name => "TK - Tokelau" },
                { value => "TL", name => "TL - Timor-Leste" },
                { value => "TM", name => "TM - Turkmenistan" },
                { value => "TN", name => "TN - Tunisia" },
                { value => "TO", name => "TO - Tonga" },
                { value => "TR", name => "TR - Turkey" },
                { value => "TT", name => "TT - Trinidad and Tobago" },
                { value => "TV", name => "TV - Tuvalu" },
                { value => "TW", name => "TW - Taiwan" },
                { value => "TZ", name => "TZ - Tanzania" },
                { value => "UA", name => "UA - Ukraine" },
                { value => "UG", name => "UG - Uganda" },
                { value => "UM-86", name => "UM-86 - Jarvis Island" },
                { value => "UM-81", name => "UM-81 - Baker Island" },
                { value => "UM-84", name => "UM-84 - Howland Island" },
                { value => "UM-67", name => "UM-67 - Johnston Atoll" },
                { value => "UM-71", name => "UM-71 - Midway Islands" },
                { value => "UM-79", name => "UM-79 - Wake Island" },
                { value => "US", name => "US - United States of America" },
                { value => "UY", name => "UY - Uruguay" },
                { value => "UZ", name => "UZ - Uzbekistan" },
                { value => "VA", name => "VA - Vatican City" },
                { value => "VC", name => "VC - Saint Vincent and the Grenadines" },
                { value => "VE", name => "VE - Venezuela" },
                { value => "VG", name => "VG - British Virgin Islands" },
                { value => "VI", name => "VI - US Virgin Islands" },
                { value => "VN", name => "VN - Vietnam" },
                { value => "VU", name => "VU - Vanuatu" },
                { value => "WF", name => "WF - Wallis and Futuna" },
                { value => "WS", name => "WS - Samoa" },
                { value => "YE", name => "YE - Yemen" },
                { value => "YT", name => "YT - Mayotte" },
                { value => "ZA", name => "ZA - South Africa" },
                { value => "ZM", name => "ZM - Zambia" },
                { value => "ZW", name => "ZW - Zimbabwe" },
            ],
            default => "DE"
        },
        ipaddr =>  {
            constraint => sub {
                return undef unless $_[0];
                $_[0] =~ s/\s//g;

                foreach my $ip (split /,/, $_[0]) {
                    my $check_ip;

                    if ($ip =~ /^IPADDR[\w\.\-]+?=(.+)/) {
                        $check_ip = $1;
                    } else {
                        $check_ip = $ip;
                    }

                    if ($check_ip !~ $self->validator->regex->ipaddr) {
                        return 0;
                    }
                }

                return 1;
            },
        },
        active =>  {
            options  => [1,0],
            default  => 1,
            optional => 1,
        },
        allow_from =>  {
            constraint => sub {
                return undef unless $_[0];
                $_[0] =~ s/\s//g;

                if ($_[0] eq "all") {
                    return 1;
                }

                foreach my $ip (split /,/, $_[0]) {
                    if ($ip !~ $self->validator->regex->ipaddr) {
                        return 0;
                    }
                }

                return 1;
            },
            max_size => 300,
            default  => "all",
        },
        interval => {
            options => [
                ($self->c->config->{webapp}->{check_frequency} eq "high" ? (15, 30) : ()),
                60, 120, 300, 600, 900, 1800, 3600, 7200, 14400, 28800, 43200, 57600, 86400
            ],
            default => 60,
        },
        timeout => {
            options => [
                ($self->c->config->{webapp}->{check_frequency} eq "high" ? (30, 60, 120) : ()),
                180, 300, 600, 900, 1800, 3600
            ],
            default => 300,
        },
        max_sms => {
            # 0 is not unlimited
            min_val => 0,
            max_val => 99999,
            default => 500,
        },
        notification => {
            options => [1,0],
            default => 1,
        },
        max_services => {
            min_val => 0,
            max_val => 9999,
            default => 0,
        },
        variables => {
            constraint => sub {
                return 1 unless $_[0];
                foreach my $pv (split /[\r\n]+/, $_[0]) {
                    next if $pv =~ /^\s*\z/;
                    if ($pv !~ /^\s*[a-zA-Z_0-9\.]+\s*=\s*([^\s].*)\z/) {
                        return undef;
                    }
                }
                return 1;
            },
            default => "{}"
        },
        data_retention => {
            min_val => 0,
            max_val => 32767,
            default => 3650
        }
    );

    $self->action(
        pre_create => sub {
            my ($self, $data) = @_;
            $data->{status_nok_since} = $data->{last_check} = time;
        }
    );
}

sub by_user_id {
    my $self = shift;
    my $opts = {@_};
    my $user = $opts->{user};
    my @condition;

    #if ($user->{role} eq "operator") {
    #    push @condition, (
    #        where => {
    #            table => "host",
    #            column => "company_id",
    #            value => $user->{company_id}
    #        }
    #    );
    #} else {
        push @condition, (
            where => {
                table => "user_group",
                column => "user_id",
                value => $user->{id}
            }
        );
    #}

    if ($opts->{condition}) {
        push @condition, pre => [ and => @{$opts->{condition}} ];
    }

    my @select = (
        distinct => 1,
        table    => [
            host => "*",
            company => [ "id AS company_id", "company" ],
            status_priority => "priority",
        ],
        join => [
            inner => {
                table => "host_group",
                left  => "host.id",
                right => "host_group.host_id",
            },
            inner => {
                table => "user_group",
                left  => "host_group.group_id",
                right => "user_group.group_id",
            },
            inner => {
                table => "company",
                left  => "host.company_id",
                right => "company.id",
            },
            inner => {
                table => "status_priority",
                left  => "host.status",
                right => "status_priority.status",
            },
        ],
        condition => \@condition
    );

    if ($opts->{sort}) {
        push @select, order => [ $opts->{sort}->{type} => $opts->{sort}->{by} ];
    } elsif ($opts->{order}) {
        push @select, order => $opts->{order};
    }

    my ($count, $hosts) = $self->dbi->query(
        offset => $opts->{offset},
        limit => $opts->{limit},
        query => $opts->{query},
        maps => {
            h => "host.hostname", hostname => "host.hostname",
            a => "host.ipaddr", ipaddr => "host.ipaddr",
            s => "host.status", status => "host.status",
            g => "host.sysgroup", sysgroup => "host.sysgroup",
            l => "host.location", location => "host.location",
            c => "host.coordinates", coordinates => "host.coordinates",
            d => "host.device_class", device_class => "host.device_class"
        },
        concat => [
            "host.id", "host.hostname", "host.ipaddr", "host.description",
            "host.status", "host.sysgroup", "host.location"
        ],
        delimiter => " ",
        count => "host.id",
        select => \@select,
    );

    return ($count, $hosts);
}

sub _is_group_member {
    my ($self, $opts) = @_;
    my $user = $opts->{user};

    my %select = (
        join => [
            inner => {
                table => "host_group",
                left  => "host.id",
                right => "host_group.host_id",
            },
        ],
        condition => [
            where => {
                table => "host_group",
                column => "group_id",
                value => $opts->{is_in_group} // $opts->{is_not_in_group}
            }
        ]
    );

    if ($user->{role} ne "admin") {
        push @{$select{condition}}, (
            and => {
                table => "host",
                column => "company_id",
                value => $user->{company_id}
            }
        );
    }

    return \%select;
}

sub _is_not_group_member {
    my ($self, $opts) = @_;
    my $user = $opts->{user};
    my $group_select = $self->_is_group_member($opts);

    my %select = (
        condition => [
            where => {
                table => "host",
                column => "id",
                op => "not in",
                value => {
                    distinct => 1,
                    table => "host",
                    column => "id",
                    %$group_select
                }
            }
        ]
    );

    if ($user->{role} ne "admin") {
        push @{$select{condition}}, (
            and => {
                table => "host",
                column => "company_id",
                value => $user->{company_id}
            }
        );
    }

    return \%select;
}

sub search_group_member {
    my ($self, $opts) = (shift, {@_});

    my $select = defined $opts->{is_in_group}
        ? $self->_is_group_member($opts)
        : $self->_is_not_group_member($opts);

    my @select = (
        distinct => 1,
        table => "host",
        column => [qw(id hostname ipaddr)],
        %$select,
        order => [ asc => "id" ]
    );

    my ($count, $hosts) = $self->dbi->query(
        offset => $opts->{offset},
        limit => $opts->{limit},
        query => $opts->{query},
        maps => {
            h => "host.hostname", hostname => "host.hostname",
            a => "host.ipaddr", ipaddr => "host.ipaddr"
        },
        concat => [
            "host.id", "host.hostname", "host.ipaddr"
        ],
        delimiter => " ",
        count => "host.id",
        select => \@select
    );

    return ($count, $hosts);
}

sub _is_contactgroup_member {
    my ($self, $opts) = @_;
    my $user = $opts->{user};

    my %select = (
        distinct => 1,
        table => "host",
        column => [qw(id hostname ipaddr)],
        join => [
            inner => {
                table => "host_contactgroup",
                left  => "host.id",
                right => "host_contactgroup.host_id"
            },
            inner => {
                table => "host_group",
                left  => "host.id",
                right => "host_group.host_id",
            },
            inner => {
                table => "user_group",
                left  => "host_group.group_id",
                right => "user_group.group_id",
            }
        ],
        condition => [
            where => {
                table => "user_group",
                column => "user_id",
                value => $user->{id}
            },
            and => {
                table => "host_contactgroup",
                column => "contactgroup_id",
                value => $opts->{contactgroup_id}
            }
        ],
        order => [ asc => "id" ]
    );

    if ($user->{role} ne "admin") {
        push @{$select{condition}}, (
            and => {
                table => "host",
                column => "company_id",
                value => $user->{company_id}
            }
        );
    }

    return %select;
}

sub _is_not_contactgroup_member {
    my ($self, $opts) = @_;
    my $user = $opts->{user};

    my %select = (
        distinct => 1,
        table => "host",
        column => [qw(id hostname ipaddr)],
        join => [
            inner => {
                table => "host_group",
                left  => "host.id",
                right => "host_group.host_id"
            },
            inner => {
                table => "user_group",
                left  => "host_group.group_id",
                right => "user_group.group_id"
            }
        ],
        condition => [
            where => {
                table => "user_group",
                column => "user_id",
                value => $user->{id}
            },
            and => {
                table => "host",
                column => "id",
                op => "not in",
                value => {
                    distinct => 1,
                    table => "host_contactgroup",
                    column => "host_id",
                    condition => [
                        where => {
                            table => "host_contactgroup",
                            column => "contactgroup_id",
                            value => $opts->{contactgroup_id}
                        }
                    ]
                }
            }
        ],
        order => [ asc => "id" ]
    );

    if ($user->{role} ne "admin") {
        push @{$select{condition}}, (
            and => {
                table => "host",
                column => "company_id",
                value => $user->{company_id}
            }
        );
    }

    return %select;
}

sub search_contactgroup_member {
    my ($self, $opts) = (shift, {@_});

    my @select = $opts->{is_in_group} 
        ? $self->_is_contactgroup_member($opts)
        : $self->_is_not_contactgroup_member($opts);

    my ($count, $hosts) = $self->dbi->query(
        offset => $opts->{offset},
        limit => $opts->{limit},
        query => $opts->{query},
        maps => {
            hostname => "host.hostname",
            ipaddr => "host.ipaddr"
        },
        concat => [
            "host.id", "host.hostname", "host.ipaddr"
        ],
        delimiter => " ",
        count => "host.id",
        select => \@select
    );

    return ($count, $hosts);
}

sub by_host_and_user_id {
    my ($self, $host_id, $user_id) = @_;

    my @stmt = (
        distinct => 1,
        table => [
            host => "*",
            company => "company",
        ],
        join => [
            inner => {
                table => "host_group",
                left  => "host.id",
                right => "host_group.host_id",
            },
            inner => {
                table => "user_group",
                left  => "host_group.group_id",
                right => "user_group.group_id",
            },
            inner => {
                table => "company",
                left => "host.company_id",
                right => "company.id",
            },
        ],
    );

    if ($host_id =~ /^\d+\z/) {
        push @stmt, condition => [
            "host.id" => $host_id,
            "user_group.user_id" => $user_id,
        ];
    } else {
        push @stmt, condition => [
            "host.hostname" => $host_id,
            "user_group.user_id" => $user_id,
        ];
    }

    my ($stmt, @bind) = $self->sql->select(@stmt);

    return $self->dbi->unique($stmt, @bind);
}

sub ids_by_user_id {
    my ($self, $user_id) = @_;

    my ($stmt, @bind) = $self->sql->select(
        distinct => 1,
        table => "host",
        column => "id",
        join => [
            inner => {
                table => "host_group",
                left  => "host.id",
                right => "host_group.host_id",
            },
            inner => {
                table => "user_group",
                left  => "host_group.group_id",
                right => "user_group.group_id",
            },
        ],
        condition => [
            where => {
                table => "user_group",
                column => "user_id",
                value => $user_id,
            }
        ],
    );

    return $self->dbi->fetch($stmt, @bind);
}

sub ids_of_latest_status_changes {
    my ($self, $user_id, $time, $limit, $host_ids) = @_;
    $limit //= 15;

    my %stmt = (
        distinct => 1,
        table => "host",
        column => [ "id", "status_since" ],
        join => [
            inner => {
                table => "host_group",
                left  => "host.id",
                right => "host_group.host_id",
            },
            inner => {
                table => "user_group",
                left  => "host_group.group_id",
                right => "user_group.group_id",
            },
        ],
        condition => [
            where => {
                table => "user_group",
                column => "user_id",
                value => $user_id,
            },
            and => {
                table => "host",
                column => "status_since",
                op => ">=",
                value => $time
            }
        ],
        order => [
            desc => "host.status_since"
        ],
        limit => $limit
    );

    if ($host_ids) {
        push @{$stmt{condition}}, and => {
            table => "host",
            column => "id",
            value => $host_ids
        };
    }

    my ($stmt, @bind) = $self->sql->select(%stmt);
    return $self->dbi->fetch($stmt, @bind);
}

sub textsearch {
    my ($self, %opts) = @_;

    my ($stmt, @bind) = $self->sql->select(
        distinct => 1,
        table => [ host => "*" ],
        join => [
            inner => {
                table => "host_group",
                left  => "host.id",
                right => "host_group.host_id",
            },
            inner => {
                table => "user_group",
                left  => "host_group.group_id",
                right => "user_group.group_id",
            },
        ],
        condition => [
            where => {
                table => "user_group",
                column => "user_id",
                value => $opts{user_id},
            },
            pre => [
                and => $self->_search($opts{query}),
            ],
        ],
        order => [
            asc => "host.hostname"
        ],
        limit => $opts{limit},
    );

    return $self->dbi->fetch($stmt, @bind);
}

sub stats_count_by_user_id {
    my ($self, $user_id, $key) = @_;

    my ($stmt, @bind) = $self->sql->select(
        table  => "host",
        column => [
            $key,
            { function => "count", column => $key, "alias" => "count" },
        ],
        condition => [
            where => {
                distinct => 1,
                table => "host",
                column => "id",
                op => "in",
                value => {
                    table => "host",
                    column => "id",
                    join => [
                        inner => {
                            table => "host_group",
                            left  => "host.id",
                            right => "host_group.host_id"
                        },
                        inner => {
                            table => "user_group",
                            left  => "host_group.group_id",
                            right => "user_group.group_id"
                        },
                    ],
                    condition => [
                        "user_group.user_id" => $user_id
                    ]
                }
            }
        ],
        group_by => [ $key ]
    );

    return $self->dbi->fetch($stmt, @bind);
}

sub stats_count_country_by_user_id {
    my ($self, $user_id) = @_;

    my ($stmt, @bind) = $self->sql->select(
        distinct => 1,
        table => "host",
        column => [ qw(id status coordinates) ],
        join => [
            inner => {
                table => "host_group",
                left  => "host.id",
                right => "host_group.host_id",
            },
            inner => {
                table => "user_group",
                left  => "host_group.group_id",
                right => "user_group.group_id",
            },
        ],
        condition => [
            where => {
                table => "user_group",
                column => "user_id",
                value => $user_id,
            }
        ]
    );

    my $sth = $self->dbi->execute($stmt, @bind);
    my $data = { };

    while (my $row = $sth->fetchrow_hashref) {
        my $location = "n/a";

        if ($row->{coordinates} =~ /^([a-zA-Z]{2})/) {
            $location = $1;
        }

        if (!exists $data->{$location}) {
            $data->{$location} = { qw(total 0 OK 0 INFO 0 WARNING 0 CRITICAL 0 UNKNOWN 0) };
        }

        $data->{$location}->{total}++;
        $data->{$location}->{ $row->{status} }++;
    }

    return $data;
}

sub simple_search {
    my ($self, $user_id, $string) = @_;

    $string =~ s/[^a-zA-Z0-9\-\.%]//g;
    $string =~ s/^%//;
    $string =~ s/%\z//;

    my ($stmt, @bind) = $self->sql->select(
        distinct => 1,
        table => "host",
        column => [ qw(id hostname ipaddr) ],
        join => [
            inner => {
                table => "host_group",
                left  => "host.id",
                right => "host_group.host_id",
            },
            inner => {
                table => "user_group",
                left  => "host_group.group_id",
                right => "user_group.group_id",
            },
        ],
        condition => [
            where => {
                table => "user_group",
                column => "user_id",
                value => $user_id,
            },
            and => {
                table => "host",
                column => "hostname",
                op => "like",
                value => "%$string%"
            }
        ],
        order => [
            asc => "hostname"
        ],
        limit => 10
    );

    return $self->dbi->fetch($stmt, @bind);
}

sub count_by_company_id {
    my ($self, $id) = @_;

    my ($stmt, @bind) = $self->sql->select(
        table => $self->{table},
        count => "id",
        condition => [ company_id => $id ],
    );

    return $self->dbi->count($stmt, @bind);
}

sub warnings_by_user_id {
    my ($self, $user_id, $offset, $limit) = @_;
    $offset //= 0;
    $limit //= 40;

    my ($stmt, @bind) = $self->sql->select(
        distinct => 1,
        table => [
            host => [ "id", "hostname", "ipaddr", "status", "last_check" ],
            status_priority => "priority"
        ],
        join => [
            inner => {
                table => "host_group",
                left  => "host.id",
                right => "host_group.host_id",
            },
            inner => {
                table => "user_group",
                left  => "host_group.group_id",
                right => "user_group.group_id",
            },
            inner => {
                table => "status_priority",
                left  => "host.status",
                right => "status_priority.status",
            },
        ],
        condition => [
            where => {
                table => "user_group",
                column => "user_id",
                value => $user_id,
            },
            and => {
                table => "host",
                column => "active",
                value => 1,
            },
        ],
        order => [
            desc => [ "status_priority.priority", "host.last_check" ]
        ],
        offset => 0,
        limit => $limit
    );

    return $self->dbi->fetch($stmt, @bind);
}

sub get_invalid_host_ids_by_user_id {
    my ($self, $user_id, $host_ids) = @_;
    my %check_ids = map { $_ => 1 } @$host_ids;
    @$host_ids = grep /^\d+\z/, @$host_ids;

    my ($stmt, @bind) = $self->sql->select(
        distinct => 1,
        table => "host",
        column => "id",
        join => [
            inner => {
                table => "host_group",
                left  => "host.id",
                right => "host_group.host_id"
            },
            inner => {
                table => "user_group",
                left  => "host_group.group_id",
                right => "user_group.group_id"
            }
        ],
        condition => [
            where => {
                table => "user_group",
                column => "user_id",
                value => $user_id
            },
            and => {
                table => "host",
                column => "id",
                op => "in",
                value => $host_ids
            }
        ]
    );

    my $sth = $self->dbi->execute($stmt, @bind);

    while (my $row = $sth->fetchrow_hashref) {
        delete $check_ids{ $row->{id} };
    }

    $sth->finish;
    return scalar keys %check_ids ? [ keys %check_ids ] : undef;
}

sub validate_host_ids_by_company_id {
    my ($self, $company_id, $host_ids) = @_;

    my ($stmt, @bind) = $self->sql->select(
        count => "id",
        table => "host",
        condition => [
            where => {
                table => "host",
                column => "company_id",
                value => $company_id
            },
            and => {
                table => "host",
                column => "id",
                value => $host_ids
            },
        ]
    );

    my $count = $self->dbi->count($stmt, @bind);

    return $count == @$host_ids;
}

sub system_categories {
    my ($self, $company_id) = @_;
    my %data;

    my @cols = qw(
        sysgroup sysinfo device_class hw_manufacturer hw_product os_manufacturer
        os_product virt_manufacturer virt_product location
    );

    foreach my $col (@cols) {
        $data{$col} = [];

        my $sth = $self->dbi->execute(
            $self->sql->select(
                distinct => 1,
                table => "host",
                column => $col,
                condition => [ company_id => $company_id ]
            )
        );

        while (my $row = $sth->fetchrow_hashref) {
            if ($row->{$col}) {
                push @{$data{$col}}, $row->{$col};
            }
        }
    }

    my %device_classes = map { $_ => 0 } (
        @{$data{device_class}}, "/Server", "/vServer", "/Printer", "/Network", "/Database", "/Power"
    );

    $data{device_class} = [ keys %device_classes ];

    return \%data;
}

sub get_template_groups {
    my ($self, $company_id, $host_id) = @_;

    my ($stmt, @bind) = $self->sql->select(
        distinct => 1,
        table => "host_template",
        column => "*",
        join => [
            inner => {
                table => "host_template_host",
                left => "host_template_host.host_template_id",
                right => "host_template.id"
            }
        ],
        condition => [
            where => {
                table => "host_template_host",
                column => "host_id",
                value => $host_id
            }
        ]
    );

    my $host_is_member_in_group = $self->dbi->fetch($stmt, @bind);
    my @host_template_ids = (0);

    foreach my $host_template (@$host_is_member_in_group) {
        push @host_template_ids, $host_template->{id};
    }

    ($stmt, @bind) = $self->sql->select(
        table => "host_template",
        column => "*",
        condition => [
            where => {
                column => "company_id",
                value => $company_id
            },
            and => {
                column => "id",
                op => "not in",
                value => \@host_template_ids
            }
        ]
    );

    my $host_is_not_member_in_group = $self->dbi->fetch($stmt, @bind);

    return {
        is_member_in => $host_is_member_in_group,
        is_not_member_in => $host_is_not_member_in_group
    };
}

sub group_by_device_class {
    my ($self, $user_id) = @_;

    my ($stmt, @bind) = $self->sql->select(
        table => "host",
        column => [
            "device_class", "status",
            { function => "count", column => "id", "alias" => "count" }
        ],
        condition => [
            where => {
                table => "host",
                column => "id",
                op => "in",
                value => {
                    distinct => 1,
                    table => "host",
                    column => "id",
                    join => [
                        inner => {
                            table => "host_group",
                            left  => "host.id",
                            right => "host_group.host_id"
                        },
                        inner => {
                            table => "user_group",
                            left  => "host_group.group_id",
                            right => "user_group.group_id"
                        }
                    ],
                    condition => [
                        where => {
                            table => "user_group",
                            column => "user_id",
                            value => $user_id
                        }
                    ]
                }
            }
        ],
        group_by => [ "device_class", "status" ]
    );

    return $self->dbi->fetch($stmt, @bind);
}

sub no_privileges_to_create_service {
    my $self = shift;
    return $self->_no_privileges(create_service => @_);
}

sub no_privileges_to_modify_service {
    my $self = shift;
    return $self->_no_privileges(update_service => @_);
}

sub no_privileges_to_delete_service {
    my $self = shift;
    return $self->_no_privileges(delete_service => @_);
}

sub no_privileges_to_create_host {
    my $self = shift;
    return $self->_no_privileges(create_host => @_);
}

sub no_privileges_to_modify_host {
    my $self = shift;
    return $self->_no_privileges(update_host => @_);
}

sub no_privileges_to_delete_host {
    my $self = shift;
    return $self->_no_privileges(delete_host => @_);
}

sub _no_privileges {
    my ($self, $action, $user_id, $host_ids) = @_;
    my %check_ids = map { $_ => 1 } @$host_ids;
    @$host_ids = grep /^\d+\z/, @$host_ids;

    my ($stmt, @bind) = $self->sql->select(
        distinct => 1,
        table => "host_group",
        column => "host_id",
        join => [
            inner => {
                table => "user_group",
                left  => "host_group.group_id",
                right => "user_group.group_id"
            }
        ],
        condition => [
            where => {
                table => "user_group",
                column => "user_id",
                value => $user_id
            },
            and => {
                table => "user_group",
                column => $action,
                value => 1
            }
        ]
    );

    my $sth = $self->dbi->execute($stmt, @bind);

    while (my $row = $sth->fetchrow_hashref) {
        delete $check_ids{ $row->{host_id} };
    }

    $sth->finish;
    return scalar keys %check_ids ? [ keys %check_ids ] : undef;
}

# -------------------------------------
# host template member
# -------------------------------------

sub search_template_member {
    my ($self, $opts) = (shift, {@_});

    my @select = $opts->{is_in_group}
        ? $self->_is_template_member($opts)
        : $self->_is_not_template_member($opts);

    my ($count, $hosts) = $self->dbi->query(
        offset => $opts->{offset},
        limit => $opts->{limit},
        query => $opts->{query},
        maps => {
            hostname => "host.hostname",
            ipaddr => "host.ipaddr"
        },
        concat => [
            "host.id", "host.hostname", "host.ipaddr"
        ],
        delimiter => " ",
        count => "host.id",
        select => \@select
    );

    return ($count, $hosts);
}

sub _is_template_member {
    my ($self, $opts) = @_;
    my $user = $opts->{user};

    my %select = (
        distinct => 1,
        table => "host",
        column => [qw(id hostname ipaddr)],
        join => [
            inner => {
                table => "host_template_host",
                left  => "host.id",
                right => "host_template_host.host_id"
            },
            inner => {
                table => "host_group",
                left  => "host.id",
                right => "host_group.host_id",
            },
            inner => {
                table => "user_group",
                left  => "host_group.group_id",
                right => "user_group.group_id",
            }
        ],
        condition => [
            where => {
                table => "user_group",
                column => "user_id",
                value => $user->{id}
            },
            and => {
                table => "host_template_host",
                column => "host_template_id",
                value => $opts->{host_template_id}
            },
            and => {
                table => "host",
                column => "company_id",
                value => $user->{company_id}
            }
        ],
        order => [ asc => "hostname" ]
    );

    return %select;
}

sub _is_not_template_member {
    my ($self, $opts) = @_;
    my $user = $opts->{user};

    my %select = (
        distinct => 1,
        table => "host",
        column => [qw(id hostname ipaddr)],
        join => [
            inner => {
                table => "host_group",
                left  => "host.id",
                right => "host_group.host_id"
            },
            inner => {
                table => "user_group",
                left  => "host_group.group_id",
                right => "user_group.group_id"
            }
        ],
        condition => [
            where => {
                table => "user_group",
                column => "user_id",
                value => $user->{id}
            },
            and => {
                table => "host",
                column => "id",
                op => "not in",
                value => {
                    distinct => 1,
                    table => "host_template_host",
                    column => "host_id",
                    condition => [
                        where => {
                            table => "host_template_host",
                            column => "host_template_id",
                            value => $opts->{host_template_id}
                        }
                    ]
                }
            },
            and => {
                table => "host",
                column => "company_id",
                value => $user->{company_id}
            }
        ],
        order => [ asc => "hostname" ]
    );

    return %select;
}

1;
