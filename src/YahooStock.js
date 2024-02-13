// ==UserScript==
// @name         Yahoo Stock
// @namespace    http://tampermonkey.net/
// @version      2024-02-05
// @description  try to take over the world!
// @author       You
// @match        https://tw.stock.yahoo.com/quote/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=yahoo.com
// @grant        none
// ==/UserScript==

(function () {
    "use strict";
    let timer = setInterval(function () {
        var ele = document.querySelector("#subscription-banner button");
        if (ele != null && ele != undefined) {
            document.querySelector("#subscription-banner button").click();
            clearInterval(timer);
        }
    }, 500);
})();
