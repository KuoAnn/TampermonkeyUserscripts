// ==UserScript==
// @name         國泰學習網
// @namespace    http://tampermonkey.net/
// @source       https://github.com/KuoAnn/TampermonkeyUserscripts/raw/main/src/Cathay-Learn.user.js
// @version      1.0.2
// @description  try to take over the world!
// @author       KuoAnn
// @match        https://cathay.elearn.com.tw/cltcms/play-index-home.do
// @grant        none
// @icon         https://www.google.com/s2/favicons?sz=64&domain=www.cathaybk.com.tw
// ==/UserScript==
(function () {
    "use strict";
    var body = document.querySelector("body");
    var title = document.createElement("h2");
    title.style.textAlign = "center";
    title.style.position = "fixed";
    title.style.width = "100%";
    title.style.top = "24px";
    title.style.color = "#eee";
    title.style.backgroundColor = "red";
    body.prepend(title);

    var countdownSec = 0; //Sec
    var waitTime = 15; //Sec
    var onloadInt = setInterval(function () {
        try {
            let duration = document
                .querySelector("iframe#content")
                .contentWindow.document.querySelector("iframe#playContent")
                .contentWindow.document.querySelector("iframe#Content")
                .contentWindow.document.querySelector("video").duration;
            countdownSec = Math.round(duration);
        } catch (error) {}
        if (countdownSec > 0) {
            AutoLearn();
        } else if (waitTime <= 0) {
            //default: 5 min
            countdownSec = 5 * 60;
            AutoLearn();
        } else {
            waitTime--;
        }
    }, 1000);

    function AutoLearn() {
        clearInterval(onloadInt);
        // 調整視窗為 400*400
        window.resizeTo(400, 400);
        // 獲取螢幕寬高
        const screenWidth = screen.width;
        const screenHeight = screen.height;
        const windowWidth = window.outerWidth;
        const windowHeight = window.outerHeight;
        // 計算右下角座標
        const rightX = screenWidth - windowWidth;
        const bottomY = screenHeight - windowHeight;
        // 移動視窗到右下角
        window.moveTo(rightX, bottomY);

        var endDate = new Date();
        endDate.setSeconds(endDate.getSeconds() + countdownSec);
        console.log("Countdown to: " + endDate);

        setInterval(function () {
            // re-count countdownSec from endDate
            countdownSec = Math.round((endDate - new Date()) / 1000);
            if (countdownSec > 0) {
                title.innerText = "Auto Learning..." + --countdownSec;
            } else {
                var x = document.querySelector("iframe#banner").contentWindow.document.querySelectorAll("button");
                x[x.length - 1].click();
            }
        }, 1000);
    }
})();
