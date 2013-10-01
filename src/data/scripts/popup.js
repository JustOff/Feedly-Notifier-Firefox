"use strict";

var popupGlobal = {
    feeds: []
}

window.onresize = resizeWindows;

self.port.on("feedsUpdated", function (feedsData) {
    renderFeeds(feedsData);
});

self.port.on("feedMarkedAsRead", function (feedsData) {
    removeFeedFromList(feedsData);
});

self.port.on("showLoader", function () {
    showLoader();
    resizeWindows();
});

$("#login").click(function () {
    self.port.emit("updateToken", null);
});

$("#feed").on("mousedown", "a.title", function (event) {
    var inBackground;
    if (event.which === 1 || event.which === 2) {
        inBackground = (event.ctrlKey || event.which === 2);
    }
    var self = $(this);
    openFeedTab(self.data("link"), inBackground, self.closest(".item").data("id"));
});

$("#feed").on("click", ".mark-read", function (event) {
    var feed = $(this).closest(".item");
    markAsRead([feed.data("id")]);
});

$("#feed").on("click", ".show-content", function () {
    var $this = $(this);
    var feed = $this.closest(".item");
    var contentContainer = feed.find(".content");
    var feedId = feed.data("id");
    if (contentContainer.html() === "") {
        var content;
        for (var i = 0; i < popupGlobal.feeds.length; i++) {
            if (popupGlobal.feeds[i].id === feedId) {
                content = popupGlobal.feeds[i].content
            }
        }
        if (content) {
            contentContainer.html(content);
            //For open links in new tab
            contentContainer.find("a").each(function (key, value) {
                var link = $(value);
                link.attr("target", "_blank");
            });
        }
    }
    contentContainer.slideToggle(function () {
        $this.css("background-position", contentContainer.is(":visible") ? "-288px -120px" : "-313px -119px");
        if (contentContainer.is(":visible") && contentContainer.text().length > 350) {
            $(".item").css("width", "700px");
            $("#feedly").css("width", "700px");
            $(".article-title").css("width", "650px");
        } else {
            $(".item").css("width", "350px");
            $("#feedly").css("width", "350px");
            $(".article-title").css("width", "300px");
        }
        resizeWindows();
    });
});

$("#popup-content").on("click", "#mark-all-read", function (event) {
    var feedIds = [];
    $(".item").each(function (key, value) {
        feedIds.push($(value).data("id"));
    });
    markAsRead(feedIds);
});

function openFeedTab(url, inBackground, feedId) {
    self.port.emit("openFeedTab", {url: url, inBackground: inBackground, feedId: feedId});
}

function requestFeeds() {
    self.port.emit("getFeeds", null);
}

function markAsRead(feedIds) {
    self.port.emit("markRead", feedIds);
}

function removeFeedFromList(feedIds) {
    for (var i = 0; i < feedIds.length; i++) {
        $(".item[data-id='" + feedIds[i] + "']").fadeOut("fast", function () {
            $(this).remove();
            resizeWindows();
            if ($("#feed").find(".item").size() === 0) {
                requestFeeds();
            }
        });
    }
}

function showLoader() {
    $("body").children("div").hide();
    $("#loading").show();
}

function showLogin() {
    $("body").children("div").hide();
    $("#login").show();
}

function showContent() {
    $("body").children("div").hide();
    $("#popup-content").show();
}

function renderFeeds(data) {

    $("#feed").empty();

    popupGlobal.feeds = data.feeds;
    if (data.isLoggedIn === false) {
        showLogin();
    } else {
        if (data.feeds.length === 0) {
            $("#feed-empty").show();
            $("#all-read-section").hide();
        } else {
            $("#all-read-section").show();
            $("#feed-empty").hide();
            $("#feed").append($("#feed-template").mustache({feeds: data.feeds}));
            $(".timeago").timeago();
        }
        showContent();
    }
    resizeWindows();
}

function resizeWindows() {
    var maxHeight = 600;
    var width = $("body").outerWidth(true);
    var height = $("body").outerHeight(true);
    if (height > maxHeight) {
        height = maxHeight;
        width += getScrollbarWidth();
    }
    var height = height > maxHeight ? maxHeight : height;

    //For fix bug with scroll on Mac
    var verticalMargin = 2;
    self.port.emit("resizePanel", {width: width, height: height + verticalMargin});
}

function getScrollbarWidth() {
    var div = document.createElement('div');

    div.style.overflowY = 'scroll';
    div.style.width =  '50px';
    div.style.height = '50px';

    div.style.visibility = 'hidden';

    document.body.appendChild(div);
    var scrollWidth = div.offsetWidth - div.clientWidth;
    document.body.removeChild(div);

    return scrollWidth;
}