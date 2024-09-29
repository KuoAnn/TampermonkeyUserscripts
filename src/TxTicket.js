// ==UserScript==
// @name         拓元售票輔助
// @namespace    http://tampermonkey.net/
// @version      2024-09-25
// @description  1. 自動勾選同意條款 2. 自動輸入驗證碼 3. 自動選取購票 n 張 4. 自動點選立即購票 5. 自動選擇付款方式 6. 提交按鈕變大 7. alt+方向鍵下：選擇下一個售票日期 8. Enter 鍵直接送出 9. 自動關閉提醒
// @author       You
// @match        https://tixcraft.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tixcraft.com
// @grant        none
// ==/UserScript==

(function () {
    ("use strict");
    // 個人參數
    let url = "*"; // 指定啟用網址：*=永久啟用, ""=停用
    let buyDate = "2024/11/22,2024/11/23"; // 購票日期：依順序以,隔開，*=不限 Ex. "2024/11/22,2024/11/23," // 先搶 11/22, 再搶 11/23, 都沒有則任一日期
    let buyCount = 4;
    let payType = "C"; // 付款方式：A=ATM, C=信用卡

    // 系統參數
    let checkCode = "40637634"; // 國泰世華信用卡驗證
    let isClickBuyTicket = false;
    let isClickPayType = false;
    let isSubmit = false;

    // 取得當前網址
    const triggerUrl = window.location.href;
    if (url == "*") {
    } else if (triggerUrl.includes("tixcraft.com/activity/game/")) {
        url = "game";
    } else if (triggerUrl.includes("tixcraft.com/activity/perform/")) {
        url = "perform";
    } else if (triggerUrl.includes("tixcraft.com/activity/other/")) {
        url = "other";
    } else {
        return;
    }

    function autoSubmit() {
        const submit = document.querySelector("button[type=submit],#submitButton");
        if (submit && !isSubmit) {
            isSubmit = true;
            submit.click();
        }
    }

    const observer = new MutationObserver((mutationsList) => {
        mutationsList.forEach((mutation) => {
            if (mutation.type === "childList") {
                // observer.disconnect(); // 偵測到後停止監聽

                const gameList = document.querySelector("#gameList table tbody");
                if (gameList) {
                    /*
                    <table class="table table-bordered"><thead>
<tr><th>演出時間</th><th>場次名稱</th><th>場地</th><th>購買狀態</th></tr>
</thead>
<tbody>
<tr class="gridc fcTxt" data-key="17676"><td>2024/11/22 (五)  20:00</td><td>2024 YUGYEOM TOUR [TRUSTY] IN TAIPEI</td><td>Zepp New Taipei</td><td><button type="button" class="btn btn-primary text-bold m-0" data-href="https://tixcraft.com/ticket/area/24_yugyeom/17676">立即訂購</button></td></tr>
</tbody></table>
                    */
                    // const gameRows = gameList.querySelectorAll("tr");

                    // gameRows.forEach((row) => {
                    //     const gameDate = row.querySelector("td").textContent;
                    //     console.log(gameDate);
                    //     if (gameDate.includes(buyDate)) {
                    //         const gameButton = row.querySelector("button");
                    //         if (gameButton && !isSubmit) {
                    //             isSubmit = true;
                    //             console.log("click");
                    //             // gameButton.click();
                    //         }
                    //     }
                    // });
                }

                // 勾選同意條款
                const ticketAgree = document.getElementById("TicketForm_agree");
                if (ticketAgree) {
                    ticketAgree.checked = true;
                }

                // 輸入驗證碼：國泰信用卡卡號
                const promoTitle = document.querySelector(".promo-title");
                const promoDesc = document.querySelector(".promo-desc");
                if (promoTitle && promoTitle.textContent.includes("國泰世華") && promoDesc && promoDesc.textContent.includes("卡號前8碼")) {
                    const checkCodeInput = document.querySelector(".greyInput[name=checkCode]");
                    if (checkCodeInput && checkCode.length > 0) {
                        checkCodeInput.value = checkCode;
                    }
                }

                // 輸入圖形驗證碼
                const verifyCodeInput = document.getElementById("TicketForm_verifyCode");
                if (verifyCodeInput) {
                    verifyCodeInput.focus();
                }

                // 選取購票 4 張
                const ticketPrice = document.querySelector('[id^="TicketForm_ticketPrice_"]');
                if (ticketPrice) {
                    ticketPrice.value = buyCount;
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

                if (payType == "A") {
                    // 選擇 ATM 付款
                    const atmRadio = document.getElementById("CheckoutForm_paymentId_54");
                    if (atmRadio && !isClickPayType) {
                        isClickPayType = true;
                        atmRadio.click();
                    }
                } else if (payType == "C") {
                    // 選擇信用卡付款
                    const creditCardRadio = document.getElementById("CheckoutForm_paymentId_36");
                    if (creditCardRadio && !isClickPayType) {
                        isClickPayType = true;
                        creditCardRadio.click();
                    }
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
        if (e.key === "Enter") {
            autoSubmit();
        } else if (e.altKey && e.key === "ArrowDown") {
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
