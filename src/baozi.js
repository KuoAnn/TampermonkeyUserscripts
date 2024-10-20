// ==UserScript==
// @name         Baozi
// @namespace    http://tampermonkey.net/
// @version      2024-10-20
// @description  try to take over the world!
// @author       You
// @match        https://www.twmanga.com/comic/chapter/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=twmanga.com
// @grant        none
// ==/UserScript==
// 個人參數

// 系統參數
let _isLoaded = false;
let _isSubmit = false;

(function () {
    "use strict";

    const observer = new MutationObserver((mo) => {
        mo.forEach((mutation) => {
            if (mutation.type === "childList") {
                console.log("Mutated");
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener("keydown", function (e) {
        if (e.key === "a") {
            const links = document.querySelectorAll(".next_chapter a");
            links.forEach((link) => {
                if (link.textContent.includes("上一")) {
                    link.click();
                }
            });
        } else if (e.key === "d") {
            const links = document.querySelectorAll(".next_chapter a");
            links.forEach((link) => {
                if (link.textContent.includes("下一")) {
                    link.click();
                }
            });
        }
        else if (e.key === "w") {
            window.scrollBy({
                top: -window.innerHeight * 0.92,
                behavior: "smooth",
            });
        }
        else if (e.key === "s") {
            window.scrollBy({
                top: window.innerHeight * 0.92,
                behavior: "smooth",
            });
        }
    });
})();
