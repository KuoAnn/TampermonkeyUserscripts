// ==UserScript==
// @name         國泰學習網
// @namespace    http://tampermonkey.net/
// @source       https://github.com/KuoAnn/TampermonkeyUserscripts/raw/main/src/Cathay-Learn.user.js
// @version      1.0.3
// @description  try to take over the world!
// @author       KuoAnn
// @match        https://cathay.elearn.com.tw/cltcms/play-index-home.do
// @grant        none
// @icon         https://www.google.com/s2/favicons?sz=64&domain=www.cathaybk.com.tw
// ==/UserScript==
(function () {
    ("use strict");
    let countdownInterval;
    const body = document.querySelector("body");
    const countdown = document.createElement("div");
    setStyles(countdown, {
        textAlign: "center",
        position: "fixed",
        width: "100%",
        top: "0",
        color: "#eee",
        backgroundColor: "red",
    });
    body.prepend(countdown);
    
    const countdownText = document.createElement("span");
    countdownText.innerText = "";
    countdown.appendChild(countdownText);
    
    const cancelBtn = document.createElement("a");
    setStyles(cancelBtn, {
        color: "#eee",
        backgroundColor: "red",
        cursor: "pointer",
        textDecoration: "underline",
    });
    cancelBtn.innerText = "取消";
    cancelBtn.onclick = function () {
        clearInterval(onloadInterval);
        if (countdownInterval) clearInterval(countdownInterval);
        countdown.remove();
    };
    countdown.appendChild(cancelBtn);

    var countdownSec = 0;
    var totalSec = 0;
    var waitTime = 15;
    const onloadInterval = setInterval(() => {
        try {
            const contentIframe = document.querySelector("iframe#content");
            const playContentIframe = contentIframe.contentWindow.document.querySelector("iframe#playContent");
            const contentVideoIframe = playContentIframe.contentWindow.document.querySelector("iframe#Content");
            const video = contentVideoIframe.contentWindow.document.querySelector("video");

            const duration = video.duration;
            countdownSec = Math.round(duration);
            totalSec = countdownSec;
        } catch (error) {
            console.log("Not ready yet: " + error);
        }

        if (countdownSec > 0) {
            AutoLearn();
        } else if (waitTime <= 0) {
            // default: 5 min
            countdownSec = 5 * 60;
            totalSec = countdownSec;
            AutoLearn();
        } else {
            waitTime--;
        }
    }, 1000);

    function setStyles(element, styles) {
        for (const property in styles) {
            element.style[property] = styles[property];
        }
    }

    function AutoLearn() {
        clearInterval(onloadInterval);
        window.resizeTo(400, 400);
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

        countdownInterval = setInterval(function () {
            // re-count countdownSec from endDate
            countdownSec = Math.round((endDate - new Date()) / 1000);
            if (countdownSec > 0) {
                countdownText.innerText = --countdownSec + "/" + totalSec;
            } else {
                var x = document.querySelector("iframe#banner").contentWindow.document.querySelectorAll("button");
                x[x.length - 1].click();
            }
        }, 1000);
    }
})();
