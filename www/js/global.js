/**
 * @file    js/global.js
 *
 * copyright (c) 2006-2009 Frank Hellenkamp [jonas@depagecms.net]
 *
 * @author    Frank Hellenkamp [jonas@depagecms.net]
 */

// global helpers
// {{{ getHexColorFromString()
function getHexColorFromString(colorString) {
    if (colorString == "transparent") {
	var hexCode = "000000";
    } else if (colorString.substr(0, 3) == "rgb") {
        var components = colorString.match(/[0-9]+/g);
        var r = parseInt(components[0]).toString(16);
        var g = parseInt(components[1]).toString(16);
        var b = parseInt(components[2]).toString(16);

        if (r.length < 2) r = "0" + r;
        if (g.length < 2) g = "0" + g;
        if (b.length < 2) b = "0" + b;

        var hexCode = r + g + b;
    } else if (colorString.charAt(0) == "#") {
        var hexCode = colorString.substring(1);
    }

    return "0x" + hexCode;
}
/* }}} */

// javascript flash detection
// {{{ jquery.browser.flash
jQuery.extend(jQuery.browser, {
    flash: (function (neededVersion) {
        var found = false;
	var version = "0,0,0";

	try {
	    // get ActiveX Object for Internet Explorer
	    version = new ActiveXObject("ShockwaveFlash.ShockwaveFlash").GetVariable('$version').replace(/\D+/g, ',').match(/^,?(.+),?$/)[1];
	} catch(e) {
	    // check plugins for Firefox, Safari, Opera etc.
	    try {
		if (navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin) {
		    version = (navigator.plugins["Shockwave Flash 2.0"] || navigator.plugins["Shockwave Flash"]).description.replace(/\D+/g, ",").match(/^,?(.+),?$/)[1];
		}
	    } catch(e) {
		return false;
	    }		
	}

	var pv = version.match(/\d+/g);
	var rv = neededVersion.match(/\d+/g);

	for (var i = 0; i < 3; i++) {
	    pv[i] = parseInt(pv[i] || 0);
	    rv[i] = parseInt(rv[i] || 0);

	    if (pv[i] < rv[i]) {
		// player is less than required
	       	return false;
	    } else if (pv[i] > rv[i]) {
		// player is greater than required
		return true;
	    }
	}
	// major version, minor version and revision match exactly
	return true;
    })
});
// }}}
// {{{ jquery.flash
jQuery.fn.flash = function(params) {
    var html1 = "";
    var html2 = "";
    var flashParam = [];

    for (var p in params.params) {
	flashParam.push(p + "=" + encodeURI(params.params[p]));
    }

    //object part
    html1 += "<object type=\"application/x-shockwave-flash\" ";
    html1 += "data=\"" + params.src + "?" + flashParam.join("&amp;") + "\" ";
    if (params.width !== undefined) {
	html1 += "width=\"" + params.width + "\" ";
    }
    if (params.height !== undefined) {
	html1 += "height=\"" + params.height + "\" ";
    }
    if (params.className !== undefined) {
	html1 += "class=\"" + params.className + "\" ";
    }
    if (params.id !== undefined) {
	html1 += "id=\"" + params.id + "\" ";
    }
    html1 +="allowFullScreen=\"true\" ";

    //param part
    html2 += "<param name=\"movie\" value=\"" + params.src + "?" + flashParam.join("&amp;") + "\" />";
    html2 += "<param name=\"allowFullScreen\" value=\"true\" />";

    if (params.transparent === true) {
	html1 += "mwmode=\"transparent\"";
	html2 += "<param name=\"wmode\" value=\"transparent\" />";
    }
    html1 += ">";

    var value = $( html1 + html2 + "</object>");
    value.plainhtml = html1 + html2 + "</object>";

    return value;
};
// }}}

// replace content, depending on reader capabilities
// {{{ replaceEmailChars()
function replaceEmailChars(mail) {
    mail = unescape(mail);
    mail = mail.replace(/ \*at\* /g, "@");
    mail = mail.replace(/ \*dot\* /g, ".");
    mail = mail.replace(/ \*punkt\* /g, ".");
    mail = mail.replace(/ \*underscore\* /g, "_");
    mail = mail.replace(/ \*unterstrich\* /g, "_");
    mail = mail.replace(/ \*minus\* /g, "-");
    mail = mail.replace(/mailto: /, "mailto:");

    return mail;
}
// }}}
// {{{ replaceEmailRefs()
function replaceEmailRefs() {
    $("a[href*='mailto:']").each(function() {
        // replace attribute
        $(this).attr("href", replaceEmailChars($(this).attr("href")));
        
        //replace content if necessary
        if ($(this).text().indexOf(" *at* ") > 0) {
            $(this).text(replaceEmailChars($(this).text()));
        }
    });
}
// }}}
// {{{ replaceFlashContent()
function replaceFlashContent() {
    /* {{{ replace flash images */
    $("img.flash_repl").each(function() {
	var parent = $(this).parent().prepend( 
	    $().flash({
		src:		this.src.replace(/\.jpg|\.gif|\.png/, ".swf").replace(/\&/, "&amp;"),
		width:		$(this).width(),
		height:		$(this).height(),
		className:	"flash",
		id:		this.id ? this.id + "_flash" : null,
		transparent:    $(this).hasClass("trans")
	    }) 
	);
	if (parent[0].nodeName == "A") {
	    // deactivate link for surrounding a-node in safari
	    parent[0].href = "javascript:return false;";
	}
    });
    /* }}} */
    /* {{{ replace flash videos */
    var vidIdCount = 0;

    $(".video").each(function() {
        var videoDiv = this;

        $(videoDiv).wrapInner("<div class=\"wrapper\"></div>");

        var placeholder = $("a img", this);
        var videoURL = $("<a href=\"" + $("a", this)[0].href + "\"></a>")[0].toString();
        var playerId = "dpPlayer" + vidIdCount++;
        var flashPlayer;

        // {{{ click-event on placeholder
        $("a", videoDiv).click(function() {
            videoDiv.data.player.play();

            return false;
        });
        // }}}
        // {{{ floatToTime
        function floatToTime(value) {
            var min = Math.floor(value / 60);
            var sec = Math.floor(value) % 60; 
            if (min < 10) {
                min = "0" + min;
            }
            if (sec < 10) {
                sec = "0" + sec;
            }
            return min + ":" + sec;
        }
        // }}}
        // {{{ inititalize dummy function until flash player is loaded
        videoDiv.data = {};
        videoDiv.data.player = {
            initialized: false
        };

        var apifuncs = ["load", "play", "pause", "seek"];
        
        for (var i = 0; i < apifuncs.length; i++) {
            videoDiv.data.player[apifuncs[i]] = function(func) {
                return function() {
                    var args = arguments;
                    var code = "";

                    if (!videoDiv.data.player.initialized) {
                        insertPlayer();
                    }

                    code += func + "(";
                    for (j = 0; j < args.length; j++) {
                        if (j > 0) {
                            code += ",";
                        }
                        code += "\"" + args[j] + "\"";
                    }
                    code += ");";

                    try {
                        // try on flash player
                        if ($.browser.msie) {
                            eval("window['" + playerId + "'].f" + code);
                        } else {
                            eval("document['" + playerId + "'].f" + code);
                        }
                        //eval("flashPlayer.f" + code);
                        //$("#info").append("<p>flashPlayer." + code + "</p>");
                    } catch (e) {
                        // defer call
                        setTimeout(function() {
                            //$("#info").append("<p>defer call of " + func + " - exception: " + e + "</p>");
                            eval("videoDiv.data.player." + code);
                        }, 300);
                    }
                }
            }(apifuncs[i]);
        }
        // }}}
        // {{{ insertPlayer()
        function insertPlayer() {
            videoDiv.data.player.initialized = true;

            var html = $().flash({
                src:		scriptPath + "/depage_player/depage_player.swf",
                width:		placeholder.width(),
                height:		placeholder.height(),
                id:             playerId,
                params: {
                    id: playerId
                }
            });
            $("div:first", videoDiv)[0].innerHTML = html.plainhtml;

            placeholder.parent().hide();

            // {{{ setPlayerVar
            window.setPlayerVar = function(playerId, name, value) {
                var flashPlayer = $("#" + playerId)[0];
                var videoDiv = $("#" + playerId).parent().parent()[0];

                var player = videoDiv.data.player;

                player[name] = value;
                //$("#info").append("<p>player[" + name + "] = " + value + "</p>");

                // {{{ paused
                if (name == "paused") {
                    if (player.paused) {
                        $(".play", videoDiv).show();
                        $(".pause", videoDiv).hide();
                        $(".rewind", videoDiv).show();
                    } else {
                        $(".play", videoDiv).hide();
                        $(".pause", videoDiv).show();
                        $(".rewind", videoDiv).show();
                    }
                // }}}
                // {{{ currentTime
                } else if (name == "currentTime") {
                    $(".current", videoDiv).html(floatToTime(player.currentTime) + "/");
                    $(".progress .position", videoDiv).width(player.currentTime / duration * 100 + "%");
                // }}}
                // {{{ percentLoaded
                } else if (name == "percentLoaded") {
                    $(".progress .buffer", videoDiv).width(player.percentLoaded * 100 + "%");
                // }}}
                // {{{ duration
                } else if (name == "duration") {
                    $(".duration", videoDiv).html(floatToTime(player.duration));
                }
                // }}}
            }
            /* }}} */

            videoDiv.data.player.load(videoURL);
        }
        // }}}
        // {{{ add controls
        var duration = $("a", videoDiv).attr("data-video-duration");
        var size = $("a", videoDiv).attr("data-video-size");

        var controls = $("<div class=\"controls\"></div>").appendTo(videoDiv);
        $("<a class=\"play\"><img src=\"" + scriptPath + "/depage_player/play_button.png\" alt=\"play\"></a>").appendTo(controls).click( function() {
            videoDiv.data.player.play();
        });
        $("<a class=\"pause\" style=\"display: none\"><img src=\"" + scriptPath + "/depage_player/pause_button.png\" alt=\"pause\"></a>").appendTo(controls).click( function() {
            videoDiv.data.player.pause();
        });
        $("<a class=\"rewind\"><img src=\"" + scriptPath + "/depage_player/rewind_button.png\" alt=\"rewind\"></a>").appendTo(controls).click( function() {
            videoDiv.data.player.seek(0);
        });
        $("<span class=\"progress\"><span class=\"buffer\"></span><span class=\"position\"></span></span>").appendTo(controls).mouseup( function(e) {
            var offset = (e.pageX - $(this).offset().left) / $(this).width() * duration;

            videoDiv.data.player.seek(offset);
        });
        $("<span class=\"time\"><span class=\"current\">00:00/</span><span class=\"duration\">" + floatToTime(duration) + "</span></span>").appendTo(controls);
        // }}}

        // call autoload/-start
        if ($(this).hasClass("autostart")) {
            if (placeholder[0].complete) {
                insertPlayer();
            } else {
                placeholder.load(function() {
                    insertPlayer();
                });
            }
        }
    });
    /* }}} */
}
// }}}
// {{{ replaceInteractiveContent()
function replaceInteractiveContent() {
    // {{{ add click event for teaser
    $(".teaser").click( function() {
        document.location = $("a", this)[0].href;
    });
    // }}}
    // {{{ add handlers for zoom images
    var zoomRatio;
    var thumbMoveRatio;

    $(".zoom").each( function() {
        var hoverText = "Zum \"Zoomen\" mit der Maus über das Bild fahren.";
        if ($(".back img", this).length == 1) {
            hoverText += " Klicken, um zwischen Vorder- und Rückseite zu wechseln.";
        }

        $(this).append("<p class=\"info\">(" + hoverText + ")</p>");
        $(this).append("<span class=\"thumb\"><span class=\"border\"></span><img src=\"" + $(".front img", this)[0].src + "\"></span>");
    });

    $(".zoom").click( function() {
        if ($(".back img", this).length == 1) {
            var frontsrc = $(".front img", this)[0].src;
            var backsrc = $(".back img", this)[0].src;

            $(".front img", this)[0].src = backsrc;
            $(".thumb img", this)[0].src = backsrc;
            $(".back img", this)[0].src = frontsrc;
        }
    });
    $(".zoom").mouseover( function() {
        $(this).addClass("zoomed");

        if ($(".back img", this).length == 1) {
            $(".front img", this).css("cursor", "pointer");
        } else {
            $(".front img", this).css("cursor", "crosshair");
        }

        $(".front", this).height($(".front img", this).height());

        var oldWidth = $(".front img", this).width();
        $(".front img", this).css("width", "auto");
        var newWidth = $(".front img", this).width();

        $(".thumb", this).dequeue();
        $(".thumb", this).fadeIn(200);

        zoomRatio = newWidth / oldWidth;
        thumbMoveRatio = ($(".thumb img", this).width() - $(".thumb img", this).width() / zoomRatio) / oldWidth;

        $(".thumb .border", this).css({
            width: $(".thumb img", this).width() / zoomRatio,
            height: $(".thumb img", this).height() / zoomRatio,
            background: $.browser.msie ? "none": "#ffffff"
        });
    });
    $(".zoom").mouseout( function() {
        $(this).removeClass("zoomed");

        $(".front img", this).css({
            "width": null,
            "marginLeft": null,
            "marginTop": null
        });

        $(".thumb", this).dequeue();
        $(".thumb", this).css("opacity", 1);
        $(".thumb", this).fadeOut(200);
    });
    $(".zoom").mousemove( function(e) {
        var offsetX = $(this).offset().left - e.pageX;
        var offsetY = $(this).offset().top - e.pageY;
        
        $(".front img", this).css({
            marginLeft: offsetX * (zoomRatio - 1),
            marginTop: offsetY * (zoomRatio - 1)
        });
        $(".thumb .border", this).each( function() {
            $(this).css({
                left: - (offsetX * thumbMoveRatio),
                top: - (offsetY * thumbMoveRatio)
            });
        });
    });
    // }}}
    // {{{ add handlers for compare images
    $(".compare").each( function() {
        var divs = $("div", this);
        var perc = 100 / divs.length;
        var percZoomed = 40 / (divs.length - 1);

        for (var i = 0; i < divs.length; i++) {
            $(divs[i]).css({
                left: i * perc + "%",
                top: 0
            });
        }
        $(this).mouseover( function(e) {
            var activeDiv = $(e.target).parent()[0];

            if (activeDiv.nodeName == "DIV") {
                var xpos = 0;

                for (var i = 0; i < divs.length; i++) {
                    $(divs[i]).dequeue();
                    $(divs[i]).animate({
                        left: xpos + "%"
                    });

                    if (divs[i] == activeDiv) {
                        xpos += 60;
                    } else {
                        xpos += percZoomed;
                    }
                }
            }
        });
        $(this).mouseout( function() {
            for (var i = 0; i < divs.length; i++) {
                $(divs[i]).dequeue();
                $(divs[i]).animate({
                    left: i * perc + "%"
                });
            }
        });
    });
    // }}}
    // {{{ add handlers for slideshow images
    $(".slideshow").each( function() {
        var divs = $("div", this);
        var speed = 3000;
        var pause = 3000;

        divs.css({
            top: 0
        });
        var fadeIn = function(n) {
            // wait
            $(divs[n]).animate({top: 0}, pause, function() {
                // fade in
                $(this).fadeIn(speed, function() {
                    if (n < divs.length - 1) {
                        // fade in next image
                        fadeIn(n + 1);
                    } else {
                        // hide all images, fade out last
                        for (var i = 1; i < divs.length - 1; i++) {
                            $(divs[i]).hide();
                        }
                        $(divs[n]).animate({top: 0}, pause, function() {
                            $(divs[n]).fadeOut(speed, function() {
                                fadeIn(1);
                            });
                        });
                    }
                });
            });
        }
        fadeIn(1);
    });
    // }}}
}
// }}}

// fix browser behaviours
// {{{ fixFlashDisplayOpera()
function fixFlashDisplayOpera(numcall) {
    numcall++;
    if (numcall < 20) {
	setTimeout("fixFlashDisplayOpera(" + numcall + ")", 200);
    }

    if (numcall % 2 == 0) {
	$("object").css({ border: "0px solid" });
    } else {
	$("object").css({ border: "none" });
    }
}
// }}}

// {{{ register events
$(document).ready(function() {
    // init global vars
    // {{{ get language from content tag in header
    window.lang = $("meta[name = 'Content-Language']")[0].content;
    // }}}
    // {{{ get script path for relative links
    window.scriptPath = $("script[src *= 'global.js']")[0].src.match(/^.*\//).toString();
    // }}}
    
    // replace content
    replaceEmailRefs();
    replaceInteractiveContent();

    // add flash content
    if ($.browser.flash("8,0,0")) {
        replaceFlashContent();

	$("body").addClass("flash");

        if ($.browser.opera) {
            fixFlashDisplayOpera(0);
        }
    }

});
// }}}
    
/* vim:set ft=javascript sw=4 sts=4 fdm=marker : */

