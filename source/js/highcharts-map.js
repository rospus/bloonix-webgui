Bloonix.highcharts.mapChart = function(o) {
    var data = [],
        seriesBackgroundColor = "#c9c9c9",
        seriesBorderColor = "#f9f9f9";

    if (o.data.GB) {
        o.data.UK = o.data.GB;
        delete o.data.GB;
    }

    $.each(Bloonix.highcharts.mapCodes, function (code, name) {
        var country = code.toUpperCase(),
            value = 0;

        if (o.data[country]) {
            if (o.data[country].UNKNOWN > 0) {
                value = 5;
            } else if (o.data[country].CRITICAL > 0) {
                value = 4;
            } else if (o.data[country].WARNING > 0) {
                value = 3;
            } else if (o.data[country].INFO > 0) {
                value = 2;
            } else if (o.data[country].OK > 0) {
                value = 1;
            }
        }

        data.push({
            flag: code,
            code: country,
            name: name,
            value: value,
            borderColor: seriesBorderColor
        });
    });

    var chartOpts = {
        chart: {
            renderTo: o.chart.container
        },
        title: {
            text: o.chart.title,
            style: {
                color: "#444444",
                fontWeight: "normal",
                fontSize: "15px"
            }
        },
        subtitle: {
            text: o.chart.subtitle,
            style: {
                color: "#555555",
                fontWeight: "normal",
                fontSize: "13px"
            }
        },
        legend: {
            enabled: false
        },
        mapNavigation: {
            enabled: true,
            //enableDoubleClickZoom: true,
            //enableDoubleClickZoomTo: true,
            enableMouseWheelZoom: true,
            enableTouchZoom: true,
            enableButtons: false
        },
        tooltip: {
            backgroundColor: "none",
            borderWidth: 0,
            shadow: false,
            useHTML: true,
            padding: 0,
            formatter: function() {
                if (!this.point.flag) {
                    return "";
                }
                if (!o.data[this.point.code]) {
                    o.data[this.point.code] = { UNKNOWN: 0, CRITICAL: 0, WARNING: 0, INFO: 0, OK: 0 };
                }
                return '<div class="map-tooltip"><span class="f32"><span class="flag '+ this.point.flag +'"></span></span> '+ this.point.name
                    +'<br/><b>Unknown: </b>'+ o.data[this.point.code].UNKNOWN
                    +'<br/><b>Critical: </b>'+ o.data[this.point.code].CRITICAL
                    +'<br/><b>Warning: </b>'+ o.data[this.point.code].WARNING
                    +'<br/><b>Info: </b>'+ o.data[this.point.code].INFO
                    +'<br/><b>Ok: </b>'+ o.data[this.point.code].OK
                    +'</div>';
            }
            //positioner: function () {
            //    return { x: 0, y: 160 }
            //}
        },
        plotOptions: {
            series: {
                point: {
                    events: {
                        click: function () {
                            Bloonix.route.to("monitoring/hosts", { query: "c:"+ this.flag.toUpperCase() });
                        }
                    }
                }
            }
        },
        colorAxis: {
            dataClasses: [
                { from: 0, to: 0, color: seriesBackgroundColor },
                { from: 1, to: 1, color: "#5fbf5f" },
                { from: 2, to: 2, color: "#339ab8" },
                { from: 3, to: 3, color: "#edc951" },
                { from: 4, to: 4, color: "#cc333f" },
                { from: 5, to: 5, color: "#eb6841" }
            ]
        },
        series: [{
            data: data,
            name: "Host availability",
            mapData: Highcharts.maps.world,
            joinBy: "code",
            valueRanges: [
                { from: 0, to: 0, color: seriesBackgroundColor },
                { from: 1, to: 1, color: "#5fbf5f" },
                { from: 2, to: 2, color: "#339ab8" },
                { from: 3, to: 3, color: "#edc951" },
                { from: 4, to: 4, color: "#cc333f" },
                { from: 5, to: 5, color: "#eb6841" }
            ],
            states: {
                hover: {
                    color: "#68a4a3"
                }
            }
        }]
    };

    if (o.plotOptions && o.plotOptions.animation !== undefined) {
        chartOpts.series[0].animation = o.plotOptions.animation;
    }

    Bloonix.createOrReplaceChart({
        container: "#"+ o.chart.container,
        chartOpts: chartOpts,
        type: "Map"
    });
};

Bloonix.highcharts.createLocationMap = function(o) {
    return new Highcharts.Map({
        chart: {
            renderTo: o.container
        },
        title: {
            text: o.title,
            style: {
                color: "#444444",
                fontWeight: "normal",
                fontSize: "15px"
            }
        },
        subtitle: {
            text: o.subtitle,
            style: {
                color: "#555555",
                fontWeight: "normal",
                fontSize: "13px"
            }
        },
        legend: {
            enabled: false
        },
        tooltip: {
            formatter: function () {
                if (!this.point.ipaddr) {
                    return false;
                }
                return "<b>"+ this.point.name +"</b><br/><span>"+ this.point.ipaddr +"</span>";
            }
        },
        mapNavigation: {
            enabled: true,
            enableDoubleClickZoom: true,
            enableDoubleClickZoomTo: true,
            enableMouseWheelZoom: true,
            enableTouchZoom: true,
            enableButtons: false
        },
        series: [{
            name: "Country",
            mapData: Highcharts.maps.world,
            joinBy: "code",
            borderColor: "#b1b1b1",
            states: {
                hover: {
                    color: "#aad7d6"
                }
            }
        },{
            type: "mappoint",
            id: "clicks",
            name: "Location",
            data: o.data
        }]
    });
};

Bloonix.highcharts.mapCodes = {
    "af": "Afghanistan",
    "al": "Albania",
    "dz": "Algeria",
    "as": "American Samoa",
    "ad": "Andorra",
    "ao": "Angola",
    "ai": "Antigua and Barbuda",
    "ar": "Argentina",
    "am": "Armenia",
    "aw": "Aruba",
    "au": "Australia",
    "at": "Austria",
    "az": "Azerbaijan",
    "bs": "Bahamas, The",
    "bh": "Bahrain",
    "bd": "Bangladesh",
    "bb": "Barbados",
    "by": "Belarus",
    "be": "Belgium",
    "bz": "Belize",
    "bj": "Benin",
    "bm": "Bermuda",
    "bt": "Bhutan",
    "bo": "Bolivia",
    "ba": "Bosnia and Herzegovina",
    "bw": "Botswana",
    "br": "Brazil",
    "bn": "Brunei Darussalam",
    "bg": "Bulgaria",
    "bf": "Burkina Faso",
    "bi": "Burundi",
    "kh": "Cambodia",
    "cm": "Cameroon",
    "ca": "Canada",
    "cv": "Cape Verde",
    "ky": "Cayman Islands",
    "cf": "Central African Republic",
    "td": "Chad",
    "cl": "Chile",
    "cn": "China",
    "co": "Colombia",
    "km": "Comoros",
    "cd": "Congo, Dem. Rep.",
    "cg": "Congo, Rep.",
    "cr": "Costa Rica",
    "ci": "Cote d'Ivoire",
    "hr": "Croatia",
    "cu": "Cuba",
    "cw": "Curacao",
    "cy": "Cyprus",
    "cz": "Czech Republic",
    "dk": "Denmark",
    "dj": "Djibouti",
    "dm": "Dominica",
    "do": "Dominican Republic",
    "ec": "Ecuador",
    "eg": "Egypt, Arab Rep.",
    "sv": "El Salvador",
    "gq": "Equatorial Guinea",
    "er": "Eritrea",
    "ee": "Estonia",
    "et": "Ethiopia",
    "fo": "Faeroe Islands",
    "fj": "Fiji",
    "fi": "Finland",
    "fr": "France",
    "pf": "French Polynesia",
    "ga": "Gabon",
    "gm": "Gambia, The",
    "ge": "Georgia",
    "de": "Germany",
    "gh": "Ghana",
    "gr": "Greece",
    "gl": "Greenland",
    "gd": "Grenada",
    "gu": "Guam",
    "gt": "Guatemala",
    "gn": "Guinea",
    "gw": "Guinea-Bissau",
    "gy": "Guyana",
    "ht": "Haiti",
    "hn": "Honduras",
    "hk": "Hong Kong SAR, China",
    "hu": "Hungary",
    "is": "Iceland",
    "in": "India",
    "id": "Indonesia",
    "ir": "Iran, Islamic Rep.",
    "iq": "Iraq",
    "ie": "Ireland",
    "im": "Isle of Man",
    "il": "Israel",
    "it": "Italy",
    "jm": "Jamaica",
    "jp": "Japan",
    "jo": "Jordan",
    "kz": "Kazakhstan",
    "ke": "Kenya",
    "ki": "Kiribati",
    "kp": "Korea, Dem. Rep.",
    "kr": "Korea, Rep.",
    "xk": "Kosovo",
    "kw": "Kuwait",
    "kg": "Kyrgyz Republic",
    "la": "Lao PDR",
    "lv": "Latvia",
    "lb": "Lebanon",
    "ls": "Lesotho",
    "lr": "Liberia",
    "ly": "Libya",
    "li": "Liechtenstein",
    "lt": "Lithuania",
    "lu": "Luxembourg",
    "mo": "Macao SAR, China",
    "mk": "Macedonia, FYR",
    "mg": "Madagascar",
    "mw": "Malawi",
    "my": "Malaysia",
    "mv": "Maldives",
    "ml": "Mali",
    "mt": "Malta",
    "mh": "Marshall Islands",
    "mr": "Mauritania",
    "mu": "Mauritius",
    "yt": "Mayotte",
    "mx": "Mexico",
    "fm": "Micronesia, Fed. Sts.",
    "md": "Moldova",
    "mc": "Monaco",
    "mn": "Mongolia",
    "me": "Montenegro",
    "ma": "Morocco",
    "mz": "Mozambique",
    "mm": "Myanmar",
    "na": "Namibia",
    "np": "Nepal",
    "nl": "Netherlands",
    "nc": "New Caledonia",
    "nz": "New Zealand",
    "ni": "Nicaragua",
    "ne": "Niger",
    "ng": "Nigeria",
    "mp": "Northern Mariana Islands",
    "no": "Norway",
    "om": "Oman",
    "pk": "Pakistan",
    "pw": "Palau",
    "pa": "Panama",
    "pg": "Papua New Guinea",
    "py": "Paraguay",
    "pe": "Peru",
    "ph": "Philippines",
    "pl": "Poland",
    "pt": "Portugal",
    "pr": "Puerto Rico",
    "wa": "Qatar",
    "ro": "Romania",
    "ru": "Russian Federation",
    "rw": "Rwanda",
    "ws": "Samoa",
    "sm": "San Marino",
    "st": "Sao Tome and Principe",
    "sa": "Saudi Arabia",
    "sn": "Senegal",
    "rs": "Serbia",
    "sc": "Seychelles",
    "sl": "Sierra Leone",
    "sg": "Singapore",
    "sk": "Slovak Republic",
    "si": "Slovenia",
    "sb": "Solomon Islands",
    "so": "Somalia",
    "za": "South Africa",
    "ss": "South Sudan",
    "es": "Spain",
    "lk": "Sri Lanka",
    "kn": "St. Kitts and Nevis",
    "lc": "St. Lucia",
    "mf": "St. Martin (French part)",
    "vc": "St. Vincent and the Grenadines",
    "sd": "Sudan",
    "sr": "Suriname",
    "sz": "Swaziland",
    "se": "Sweden",
    "ch": "Switzerland",
    "sy": "Syrian Arab Republic",
    "tj": "Tajikistan",
    "tz": "Tanzania",
    "th": "Thailand",
    "tp": "Timor-Leste",
    "tg": "Togo",
    "to": "Tonga",
    "tt": "Trinidad and Tobago",
    "tn": "Tunisia",
    "tr": "Turkey",
    "tm": "Turkmenistan",
    "tc": "Turks and Caicos Islands",
    "tv": "Tuvalu",
    "ug": "Uganda",
    "ua": "Ukraine",
    "ae": "United Arab Emirates",
    "uk": "United Kingdom",
    "us": "United States",
    "uy": "Uruguay",
    "uz": "Uzbekistan",
    "vu": "Vanuatu",
    "ve": "Venezuela, RB",
    "vn": "Vietnam",
    "vi": "Virgin Islands (U.S.)",
    "ps": "West Bank and Gaza",
    "eh": "Western Sahara",
    "ye": "Yemen, Rep.",
    "zm": "Zambia",
    "zw": "Zimbabwe"
};
