// ==UserScript==
// @name         拓元售票輔助
// @namespace    http://tampermonkey.net/
// @version      2024-09-25
// @description  try to take over the world!
// @author       You
// @match        https://tixcraft.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tixcraft.com
// @grant        none
// ==/UserScript==

(function () {
    "use strict";
    let checkCode = "40637634";
    let isClickBuyTicket = false;

    const observer = new MutationObserver((mutationsList) => {
        mutationsList.forEach((mutation) => {
            if (mutation.type === "childList") {
                // observer.disconnect(); // 偵測到後停止監聽

                // 勾選同意條款
                const ticketAgree = document.getElementById("TicketForm_agree");
                if (ticketAgree) {
                    ticketAgree.checked = true;
                }
                const verifyCodeInput = document.getElementById("TicketForm_verifyCode");
                if (verifyCodeInput) {
                    verifyCodeInput.focus();
                    // 於輸入框按下 enter 點選 submit
                    verifyCodeInput.addEventListener("keydown", function (e) {
                        if (e.key === "Enter") {
                            const submit = document.querySelector("button[type=submit],#submitButton");
                            if (submit) {
                                submit.click();
                            }
                        }
                    });
                }

                // 購票 4 張
                const ticketPrice = document.querySelector("#TicketForm_ticketPrice_01,#TicketForm_ticketPrice_02");
                if (ticketPrice) {
                    ticketPrice.value = 4;
                }

                // 點選關閉提醒
                const closeAlert = document.querySelector("button.close-alert");
                if (closeAlert) {
                    closeAlert.click();
                }

                // 點選立即購票
                const buyTicket = document.querySelector('a[href^="/activity/game/"]');
                if (buyTicket && !isClickBuyTicket) {
                    isClickBuyTicket = true;
                    buyTicket.click();
                }

                // 輸入驗證碼：信用卡卡號
                const checkCodeInput = document.querySelector(".greyInput[name=checkCode]");
                if (checkCodeInput) {
                    checkCodeInput.value = checkCode;
                }

                // submit button 變大
                const submit = document.querySelector("button[type=submit],#submitButton");
                if (submit) {
                    submit.style.fontSize = "20px";
                    submit.style.height = "100px";
                    submit.style.width = "200px";
                }
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // alt+方向鍵下：選擇下一個售票日期
    document.addEventListener("keydown", function (e) {
        if (e.altKey && e.key === "ArrowDown") {
            let select = document.querySelector("#gameId");
            if (select) {
                let selectedIndex = select.selectedIndex;
                let optionsLength = select.options.length;

                // Move to next option, or wrap around to the first one
                select.selectedIndex = (selectedIndex + 1) % optionsLength;

                // Trigger the change event
                let event = new Event("change", { bubbles: true });
                select.dispatchEvent(event);
            }
        }
    });
})();
