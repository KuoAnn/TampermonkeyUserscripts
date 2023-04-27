// ==UserScript==
// @name         Youdao
// @namespace    http://youdao.com/
// @source       https://github.com/KuoAnn/TampermonkeyUserscripts/raw/main/src/Youdao.user.js
// @version      1.0.1
// @description  try to take over the world!
// @author       KuoAnn
// @match        https://fanyi.youdao.com/*
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/opencc-js@1.0.5/dist/umd/cn2t.min.js
// @require      https://cdn.jsdelivr.net/npm/pangu@4.0.7/dist/browser/pangu.min.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=www.youdao.com
// ==/UserScript==

const converter = OpenCC.Converter({ from: "cn", to: "tw" });
(function () {
    "use strict";
    const delay = (ms) => new Promise((res) => setTimeout(res, ms));

    // 等待畫面loading
    const loadingFinishDom = "tool-button";
    const execute = async () => {
        await delay(100);
        let tbodys = document.querySelectorAll("[class=tool-button]");
        while (tbodys.length == 0) {
            await delay(100);
            tbodys = document.querySelectorAll("[class=tool-button]");
        }
        addCopyBtn();
        addTransBtn();

        // clear ad
        const chkImgClose = setInterval(function () {
            let ele = document.querySelectorAll("img.close");
            if (ele.length > 0) {
                console.log("Dectected img.close");
                clearInterval(chkImgClose);
                ele.forEach((x) => {
                    setTimeout(function(){
                        x.click();
                    },500);
                });
            }
        }, 100);
        const chkNeverShow = setInterval(function () {
            let ele = document.querySelectorAll(".never-show span");
            if (ele.length > 0) {
                console.log("Dectected .never-show span");
                clearInterval(chkNeverShow);
                ele.forEach((x) => {
                    setTimeout(function(){
                        x.click();
                    },500);
                });
            }
        }, 100);
    };
    execute();

    function addTransBtn() {
        const toolBtn = document.querySelector(".tool-button");
        const newButton = document.createElement("button");
        newButton.textContent = "簡轉繁";
        newButton.setAttribute(
            "style",
            "margin-left: 12px;width: 72px;line-height: 36px;background: #248ce0;border-radius: 6px;font-size: 14px;color: #fff;"
        );
        newButton.addEventListener("click", function () {
            var resultOutput = document.getElementById("js_fanyi_output_resultOutput");
            var pElements = resultOutput.getElementsByTagName("p");
            for (var i = 0; i < pElements.length; i++) {
                pElements[i].textContent = cn2Tw(pElements[i].textContent);
            }
        });
        toolBtn.insertAdjacentElement("afterend", newButton);
    }

    function addCopyBtn() {
        const toolBtn = document.querySelector(".tool-button");
        const newButton = document.createElement("button");
        newButton.textContent = "Copy";
        newButton.setAttribute(
            "style",
            "margin-left: 12px;width: 72px;line-height: 36px;background: #248ce0;border-radius: 6px;font-size: 14px;color: #fff;"
        );
        newButton.addEventListener("click", () => {
            const resultOutput = document.getElementById("js_fanyi_output_resultOutput");
            const textarea = document.createElement("textarea");
            textarea.value = resultOutput.innerText.replace(/\n\n\n/g, "\n");
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
        });
        toolBtn.insertAdjacentElement("afterend", newButton);
    }

    function cn2Tw(cnText) {
        let t = converter(cnText);
        t = pangu.spacing(t);
        t = t.replace(/“/g, "「");
        t = t.replace(/”/g, "」");
        t = t.replace(/:/g, "：");
        t = t.replace(/;/g, "；");
        t = t.replace(/…/g, "⋯⋯");
        t = t.replace(/—/g, "──");
        t = t.replace(/你/g, "您");
        return t;
    }
})();
