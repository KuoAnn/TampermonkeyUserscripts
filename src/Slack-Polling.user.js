// ==UserScript==
// @name         Slack pulling mode
// @namespace    http://tampermonkey.net/
// @source       https://github.com/KuoAnn/TampermonkeyUserscripts/raw/main/src/Slack-Polling.user.js
// @version      1.0.0
// @description  try to take over the world!
// @author       KuoAnn
// @match        https://app.slack.com/client/*
// @icon         https://www.google.com/s2/favicons?domain=slack.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    setInterval(function () {
        var x = document.getElementsByClassName("p-message_pane__degraded_banner__reload_cta");
        if (x.length > 0) {
            console.log('pulling...')
            x[0].click();
        }
    }, 35000)
})();