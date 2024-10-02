// ==UserScript==
// @name         log.kuoann
// @namespace    http://tampermonkey.net/
// @source       https://github.com/KuoAnn/TampermonkeyUserscripts/raw/main/src/LogKuoann.js
// @version      1.0.0
// @description  try to take over the world!
// @author       You
// @match        https://log.kuoann.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=kuoann.com
// @grant        none
// ==/UserScript==

(function() {
    const userName = "xxx";
    const password = "ooo";

    const inputNgText = function (ele, text) {
        ele.focus();
        ele.value = text;
        ele.blur();
        ele.dispatchEvent(new Event("input", { bubbles: true }));
    };

    const observer = new MutationObserver((mutationsList) => {
        mutationsList.forEach((mutation) => {
            if (mutation.type === 'childList') {
                const eleUserName = document.querySelector("[label=Username] input");
                const elePassword = document.querySelector("[label=Password] input");
                if(eleUserName && elePassword){
                    observer.disconnect(); // 偵測到後停止監聽
                    inputNgText(document.querySelector("[label=Username] input"), userName);
                    inputNgText(document.querySelector("[label=Password] input"), password);
                    setTimeout(() => {
                        document.querySelector("button[type=submit]").click();
                    }, 200);
                }
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    let count=0;
    while(count++ <=10){
        const eleUserName = document.querySelector("[label=Username] input");

    }
})();
