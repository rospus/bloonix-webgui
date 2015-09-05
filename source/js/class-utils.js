var Utils = function() {};

Utils.escape = function(str){
    if (str === undefined) {
        return "";
    }
    if (typeof str === "number") {
        return str;
    }
    str = str.replace(/&/g, "&amp;");
    str = str.replace(/</g, "&lt;");
    str = str.replace(/>/g, "&gt;");
    str = str.replace(/"/g, "&quot;");
    str = str.replace(/'/g, "&#39;");
    return str;
};

Utils.replacePattern = function(str, data) {
    if (/:[a-zA-Z_0-9]+/.test(str)) {
        $.each(str.match(/(:[a-zA-Z_0-9]+)/g), function(i, match) {
            var repKey = match.replace(/:/g, "");
            str = str.replace(match, data[repKey]);
        });
    }
    return str;
};

Utils.joinHashElements = function(str, hash, array) {
    var ret, toJoin = [ ];

    $.each(array, function(i, elem) {
        toJoin.push(hash[elem]);
    });

    return toJoin.join(str);
};

Utils.extendArray = function(a, b) {
    $.each(b, function(i, row) {
        a.push(row);
    });
};

Utils.hexToRGB = function(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    var r = parseInt(result[1], 16),
        g = parseInt(result[2], 16),
        b = parseInt(result[3], 16);

    return [ r, g, b ];
};

Utils.rgbToHex = function(color) {
    if (color.substr(0, 1) === "#") {
        return color;
    }

    var nums = /\((\d+),\s*(\d+),\s*(\d+)/i.exec(color),
        r = parseInt(nums[2], 10).toString(16),
        g = parseInt(nums[3], 10).toString(16),
        b = parseInt(nums[4], 10).toString(16);

    return "#"+ (
        (r.length == 1 ? "0"+ r : r) +
        (g.length == 1 ? "0"+ g : g) +
        (b.length == 1 ? "0"+ b : b)
    );
};

Utils.objectSize = function(obj) {
    var size = 0, key;

    for (key in obj) {
        size++;
    }

    return size;
};

Utils.create = function(e,o,t) {
    return $(document.createElement(e), o, t);
};

Utils.genRandStr = function(len, chars) {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
        str = "";

    if (len == undefined) {
        len = 30;
    }

    for (var i=0; i<len; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return str;
};

Utils.dump = function(data, width, height) {
    var pre;

    if (width == undefined) {
        width = "800px";
    }
    if (height == undefined) {
        height = "800px";
    }

    if ($("#jsondump").length == 0) {
        pre = Utils.create("pre")
            .attr("id", "jsondump")
            .css({
                width: width,
                height: height,
                display: "inline-block",
                position: "fixed",
                top: "130px",
                right: "10px",
                padding: "10px",
                color: "#ffffff",
                "background-color": "rgba(0,0,0,.8)",
                overflow: "scroll",
                "z-index": 1000
            }).appendTo("body");
    } else {
        pre = $("#jsondump");
    }

    pre.html("Dump:<br/><br/>"+ Utils.escape(JSON.stringify(data, null, "\t")) +"<br/><br/>")
};

Utils.toJSON = function(obj) {
    return JSON.stringify(obj);
};

Utils.secondsToString = function(seconds) {
    var list = Utils.secondsToStringList(seconds);
    return list.join(":");
};

Utils.secondsToStringShortReadable = function(seconds) {
    var list = Utils.secondsToStringList(seconds);
    var toReturn = [ ];

    if (list[0] != "0") {
        toReturn.push(list[0] +"d");
    }
    if (list[1] != "0") {
        toReturn.push(list[1] +"h");
    }
    if (list[2] != "0") {
        toReturn.push(list[2] +"m");
    }
    if (list[3] != "0") {
        toReturn.push(list[3] +"s");
    }

    return toReturn.join(", ");
};

Utils.secondsToStringReadable = function(seconds) {
    var list = Utils.secondsToStringList(seconds);
    list[0] += list[0] == "1" ? " "+ Text.get("word.day") : " "+ Text.get("word.days");
    list[1] += list[0] == "1" ? " "+ Text.get("word.hour") : " "+ Text.get("word.hours");
    list[2] += list[0] == "1" ? " "+ Text.get("word.minute") : " "+ Text.get("word.minutes");
    list[3] += list[0] == "1" ? " "+ Text.get("word.second") : " "+ Text.get("word.seconds");
    return list.join(", ");
};

Utils.secondsToStringList = function(seconds) {
    var minutes = 0, hours = 0, days = 0;
    if (seconds >= 86400) {
        days = Math.floor(seconds / 86400);
        seconds = seconds % 86400;
    }
    if (seconds >= 3600) {
        hours = Math.floor(seconds / 3600);
        seconds = seconds % 3600;
    }
    if (seconds >= 60) {
        minutes = Math.floor(seconds / 60);
        seconds = seconds % 60;
    }
    return [ days, hours, minutes, seconds ];
};

Utils.secondsToFormValues = function(a, nullStr) {
    var b = [];
    $.each(a, function(i, n) {
        var unit, value;

        if (nullStr != undefined && n == 0) {
            b.push({
                name: nullStr,
                value: n
            });
            return true;
        }

        if (n >= 86400) {
            value = n / 86400;
            name = value == 1 ? "day" : "days";
        } else if (n >= 3600) {
            value = n / 3600;
            name = value == 1 ? "hour" : "hours";
        } else if (n >= 60) {
            value = n / 60;
            name = value == 1 ? "minute" : "minutes";
        } else {
            value = n;
            name = value == 1 ? "second" : "seconds";
        }

        b.push({
            name: value +" "+ Text.get("word."+ name),
            value: n
        });
    });
    return b;
};

// Extend is used to extend the key-values of the second object
// to the first object. Existing keys of the first object will
// be overwritten.
Utils.extend = function(a, b) {
    if (a == undefined) {
        a = {};
    }
    if (b) {
        var n;
        for (n in b) {
            a[n] = b[n];
        }
    }
    return a;
};

/* Append is used to append the key-values of the second object
   to the first object. Existing keys of the first object will NOT
   be overwritten. In addition the key-values will only be appended
   to the first object if the first object is a object. That means
   if the first object is not an object then nothing happends. */
Utils.append = function(a, b) {
    if (a) {
        var n, c = {};
        // Javascript has no "exists" like in Perl. To check which
        // keys exists in the first object a "c" object is created.
        for (n in a) {
            c[n] = 1;
        }
        for (n in b) {
            if (c[n] != 1) { // if c[n] does not exists
                a[n] = b[n];
            }
        }
    }
};

/* Shift options from b to a new object. a should be an array with
   keys that are delete from b and stored to r. r will be returned
   as a new object. */
Utils.shift = function(a, b) {
    var n, r = {}, c = {};

    if (b) {
        for (n in b) {
            c[n] = 1;
        }
        for (n in a) {
            if (c[n] === 1) {
                r[n] = b[n];
                delete b[n];
            }
        }
    }

    return r;
};

/* Filter empty values from an object.
   Values are filtered if they are

      === undefined
      === false
      === zero length

   As example if the object to filter has

      b = { v: "", w: "a", x: false, y: 0, z: undefined };

  the returned object has

      a = { w: "a", y: 0 };

  as you can see... v, x and z are filtered.
*/
Utils.filterEmptyValues = function(b) {
    var a = {};

    if (b) {
        var n;
        for (n in b) {
            if (IsNot.empty(b[n])) {
                a[n] = b[n];
            }
        }
    }

    return a;
};

// Sort an object by key
Utils.sort = function(object, key) {
    var keys = [],
        sorted = [],
        objectByKey = {};

    $.each(object, function(i, o) {
        keys.push(o[key]);

        if (!objectByKey[o.key]) {
            objectByKey[o.key] = [];
        }

        objectByKey[o.key].push(o);
    });

    $.each(keys.sort(), function(x, k) {
        $.each(objectByKey[k], function(y, o) {
            sorted.push(o);
        });
    });

    return sorted;
};

Utils.bytesToStr = function(value, f) {
    var unit = "";

    if (f == undefined) {
        f = 1;
    }

    if (value >= 1208925819614629174706176) {
        value = value / 1208925819614629174706176;
        unit = "YB";
    } else if (value >= 1180591620717411303424) {
        value = value / 1180591620717411303424;
        unit = "ZB"
    } else if (value >= 1152921504606846976) {
        value = value / 1152921504606846976;
        unit = "EB";
    } else if (value >= 1125899906842624) {
        value = value / 1125899906842624;
        unit = "PB";
    } else if (value >= 1099511627776) {
        value = value / 1099511627776;
        unit = "TB";
    } else if (value >= 1073741824) {
        value = value / 1073741824;
        unit = "GB";
    } else if (value >= 1048576) {
        value = value / 1048576;
        unit = "MB";
    } else if (value >= 1024) {
        value = value / 1024;
        unit = "KB";
    }

    return value.toFixed(f) + unit;
};

Utils.open = function(href, title, opts) {
    window.open(href, title, opts);
};

Utils.syntaxHighlightJSON = function(json) {
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = "color:darkorange;"
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = "color:red";
            } else {
                cls = "color:green";
            }
        } else if (/true|false/.test(match)) {
            cls = "color:blue";
        } else if (/null/.test(match)) {
            cls = "color:magenta";
        }
        return '<span style="' + cls + '">' + match + '</span>';
    });
};

Utils.escapeAndSyntaxHightlightJSON = function(json) {
    json = JSON.stringify(json, null, "  ");
    json = json.replace(/</g, "&lt;");
    json = json.replace(/>/g, "&gt;");
    json = json.replace(/\\r/g, "");
    json = json.replace(/\\n/g, "<br/>");
    json = Utils.syntaxHighlightJSON(json);
    return json;
};

Utils.clear = function(o) {
    Utils.create("div")
        .addClass("clear")
        .appendTo(o);
};

Utils.linebreak = function(o) {
    Utils.create("br")
        .appendTo(o);
};

Utils.createInfoIcon = function(o) {
    var span = Utils.create("span"),
        icon = Utils.create("span")
            .addClass("hicons-white hicons")
            .appendTo(span);

    if (o.type != undefined) {
        if (o.type == "OK") {
            span.addClass("circle green");
            icon.addClass("ok");
        } else if (o.type == "INFO") {
            span.addClass("circle blue");
            icon.addClass("info-sign");
        } else if (o.type == "WARNING") {
            span.addClass("circle yellow");
            icon.addClass("warning-sign");
        } else if (o.type == "CRITICAL") {
            span.addClass("circle red");
            icon.addClass("fire");
        } else if (o.type == "UNKNOWN") {
            span.addClass("circle orange");
            icon.addClass("question-sign");
        }
    } else {
        span.addClass("circle");
        if (o.color) {
            span.addClass(o.color);
        }
        if (o.backgroundColor) {
            span.css({ "background-color": o.backgroundColor });
        }
        icon.addClass(o.icon);
    }

    if (o.size === "small") {
        span.addClass("circle-small");
    }

    return span;
};
