// ==UserScript==
// @name         國泰學習網
// @namespace    http://tampermonkey.net/
// @source       https://github.com/KuoAnn/TampermonkeyUserscripts/raw/main/src/Cathay-Learn.user.js
// @version      1.0.1
// @description  try to take over the world!
// @author       KuoAnn
// @match        https://cathay.elearn.com.tw/cltcms/play-index-home.do
// @grant        none
// @icon         https://www.google.com/s2/favicons?sz=64&domain=www.cathaybk.com.tw
// ==/UserScript==

(function () {
  "use strict";

  var body = document.querySelector("body");
  var h1 = document.createElement("H1");
  h1.style.textAlign = "center";
  h1.style.position = "fixed";
  h1.style.width = "100%";
  h1.style.top = "36px";
  h1.style.color = "#eee";
  h1.style.backgroundColor = "red";
  body.prepend(h1);

  var countdown = 0; //Sec

  var waitTime = 30; //Sec
  var onloadInt = setInterval(function () {
    try {
      let duration = document
        .querySelector("iframe#content")
        .contentWindow.document.querySelector("iframe#playContent")
        .contentWindow.document.querySelector("iframe#Content")
        .contentWindow.document.querySelector("video").duration;

      countdown = Math.round(duration);
    } catch (error) {}

    if (countdown > 0) {
      AutoLearn();
    } else if (waitTime <= 0) {
      countdown = 5 * 60; //default: 5 min
      AutoLearn();
    } else {
      waitTime--;
    }
  }, 1000);

  function AutoLearn() {
    clearInterval(onloadInt);
    setInterval(function () {
      if (countdown > 0) {
        h1.innerText = "Auto Learning..." + --countdown;
      } else {
        var x = document
          .querySelector("iframe#banner")
          .contentWindow.document.querySelectorAll("button");
        x[x.length - 1].click();
      }
    }, 1000);
  }
})();
