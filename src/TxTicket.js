// ==UserScript==
// @name         拓元售票輔助
// @namespace    http://tampermonkey.net/
// @version      2024-09-25
// @description  try to take over the world!
// @author       You
// @match        https://tixcraft.com/ticket/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tixcraft.com
// @grant        none
// ==/UserScript==

(function () {
    "use strict";

    const observer = new MutationObserver((mutationsList) => {
        mutationsList.forEach((mutation) => {
            if (mutation.type === "childList") {
                const ticketAgree = document.getElementById("TicketForm_agree");
                if (ticketAgree) {
                    // observer.disconnect(); // 偵測到後停止監聽
                    ticketAgree.checked = true;
                    const ticketPrice = document.getElementById("TicketForm_ticketPrice_02");
                    if (ticketPrice) {
                        ticketPrice.value = 4;
                    }

                    document.getElementById("TicketForm_verifyCode").focus();
                }

                /*
                 * <a href="/activity/game/24_asmrmaxxx_c" target="_new"><div>立即購票</div></a>
                 */
                const buyTicket = document.querySelector('a[href^="/activity/game/"]');
                if (buyTicket) {
                    buyTicket.click();
                }

                const submit = document.querySelector("button[type=submit],#submitButton");
                if (submit) {
                    // 將 button 變大
                    submit.style.fontSize = "20px";
                    submit.style.height = "100px";
                    submit.style.width = "200px";
                }
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
