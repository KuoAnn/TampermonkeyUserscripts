// ==UserScript==
// @name         TxTicket
// @namespace    http://tampermonkey.net/
// @source       https://github.com/KuoAnn/TampermonkeyUserscripts/raw/main/src/TxTicket.js
// @version      1.0.0
// @description  1. 自動勾選同意條款 2. 自動輸入驗證碼 3. 自動選取購票 n 張 4. 自動點選立即購票 5. 自動選擇付款方式 6. 提交按鈕變大 7. alt+方向鍵下：選擇下一個售票日期 8. Enter 鍵直接送出 9. 自動關閉提醒
// @author       You
// @match        https://tixcraft.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tixcraft.com
// @downloadURL  https://github.com/KuoAnn/TampermonkeyUserscripts/raw/main/src/TxTicket.js
// @updateURL    https://github.com/KuoAnn/TampermonkeyUserscripts/raw/main/src/TxTicket.js
// @grant        GM_xmlhttpRequest
// ==/UserScript==
// 個人參數
const buyDateIndexes = [2, 3, -1]; // 場次優先順序：0=第一場 1=第二場... 負數=任一場
const buyArea = ["VIP"]; // 座位優先順序，建議嚴謹>鬆散；以空白作為 AND 邏輯：空值=任一場
const buyCount = 4; // 購買張數，若無則選擇最大值
const payType = "A"; // 付款方式：A=ATM, C=信用卡

// 系統參數(勿動)
let isAutoMode = (localStorage.getItem("autoMode") || 0) == 1;
let isSetConsole = false;
let session = "";
let isSelectArea = false;
let isSelect2Button = false;
let isClickBuyTicket = false;
let isOcr = false;
let isClickPayType = false;
let isSubmit = false;
let isListenOrder = false;

// 取得當前網址
const triggerUrl = window.location.href;
if (triggerUrl.includes("activity/detail/")) {
    session = "d";
} else if (triggerUrl.includes("ticket/game/")) {
    session = "g";
} else if (triggerUrl.includes("ticket/verify/")) {
    session = "v";
} else if (triggerUrl.includes("ticket/area/")) {
    session = "a";
} else if (triggerUrl.includes("ticket/ticket/")) {
    session = "t";
} else if (triggerUrl.includes("ticket/checkout/")) {
    session = "c";
}

(function () {
    "use strict";
    const observer = new MutationObserver((mutationsList) => {
        mutationsList.forEach((mutation) => {
            if (mutation.type === "childList") {
                if (session != "d" && session != "g") {
                    observer.disconnect();
                }

                // 自動模式提示
                SetConsole();

                // 自動關閉提醒
                const closeAlert = document.querySelector("button.close-alert");
                if (closeAlert) {
                    closeAlert.click();
                }

                switch (session) {
                    case "d":
                    case "g":
                        // 活動頁
                        // 點選立即購票
                        const buyTicket = document.querySelector('a[href^="/activity/game/"]');
                        if (buyTicket && !isClickBuyTicket) {
                            isClickBuyTicket = true;
                            buyTicket.click();
                        }

                        if (isAutoMode) {
                            const gameList = document.querySelector("#gameList table tbody");
                            if (gameList && !isSubmit && !isListenOrder) {
                                isListenOrder = true;
                                const listenInterval = setInterval(() => {
                                    const gameList = document.querySelector("#gameList table tbody");
                                    if (gameList) {
                                        const isOk = goOrder(gameList);
                                        const isAutoMode = (localStorage.getItem("autoMode") || 0) == 1;
                                        if (isOk || !isAutoMode) {
                                            clearInterval(listenInterval);
                                        } else {
                                            console.log("重新點選立即購票");
                                            buyTicket.click();
                                        }
                                    }
                                }, 400);
                            }
                        }

                        break;
                    case "v":
                        // 輸入驗證碼：
                        const promoDesc = document.querySelector(".promo-desc");
                        if (promoDesc) {
                            // 國泰信用卡卡號
                            if (promoDesc.textContent.includes("國泰世華") && promoDesc.textContent.includes("卡號前8碼")) {
                                const checkCodeInput = document.querySelector(".greyInput[name=checkCode]");
                                if (checkCodeInput) {
                                    checkCodeInput.value = "40637634";
                                    autoSubmit();
                                }
                            } else if (promoDesc.textContent.includes("中國信託") && promoDesc.textContent.includes("卡號前6碼")) {
                                const checkCodeInput = document.querySelector(".greyInput[name=checkCode]");
                                if (checkCodeInput) {
                                    checkCodeInput.value = "431195";
                                    autoSubmit();
                                }
                            }
                        }
                        break;
                    case "a":
                        // 自動選位
                        if (isAutoMode && !isSelectArea) {
                            isSelectArea = true;
                            const isOk = selectArea();
                            if (!isOk) {
                                setTimeout(() => {
                                    window.location.reload();
                                }, 100);
                            }
                        }
                        // 選單按鈕化
                        select2Button();
                        // 隱藏已售完
                        removeSoldOut();
                        break;
                    case "t":
                        // 確認訂單
                        // 勾選同意條款
                        const ticketAgree = document.getElementById("TicketForm_agree");
                        if (ticketAgree) {
                            ticketAgree.checked = true;
                        }

                        // 選取購票張數
                        const ticketPrice = document.querySelector('[id^="TicketForm_ticketPrice_"]');
                        if (ticketPrice) {
                            const options = ticketPrice.querySelectorAll("option");
                            let hasBuyCount = false;
                            options.forEach((o) => {
                                if (o.value == buyCount) {
                                    hasBuyCount = true;
                                    ticketPrice.value = buyCount;
                                }
                            });
                            if (!hasBuyCount) {
                                ticketPrice.value = options[options.length - 1].value;
                            }
                        }

                        // 輸入圖形驗證碼
                        const verifyCodeInput = document.getElementById("TicketForm_verifyCode");
                        if (verifyCodeInput) {
                            verifyCodeInput.addEventListener("input", (e) => {
                                if (e.target.value.length == 4) {
                                    autoSubmit();
                                }
                            });

                            verifyCodeInput.focus();

                            if (isAutoMode && !isOcr) {
                                isOcr = true;
                                setCaptcha();
                            }
                        }
                        break;
                    case "c":
                        // 付款
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
                        break;
                }

                // 放大提交按鈕
                largerSubmit();
            }
        });

        function select2Button() {
            const select = document.querySelector("#gameId");
            if (select && !isSelect2Button) {
                isSelect2Button = true;
                // select.style.display = "none";
                const title = document.querySelector(".activityT.title");
                if (title) {
                    title.style.display = "none";
                }
                const selectOptions = select.querySelectorAll("option");
                selectOptions.forEach((option) => {
                    const b = document.createElement("button");
                    const dateText = option.textContent.match(/\d{4}\/\d{2}\/\d{2} \(\S+\)/);
                    b.textContent = dateText ? dateText[0] : option.textContent;
                    b.onclick = () => {
                        select.value = option.value;
                        select.dispatchEvent(new Event("change", { bubbles: true }));
                    };
                    b.style.padding = "2px 6px";
                    b.style.margin = "2px";
                    b.style.border = "1px solid #ccc";
                    if (option.selected) {
                        b.style.backgroundColor = "#007bff";
                        b.style.color = "#fff";
                    }

                    select.before(b);
                });
            }
        }

        function selectArea() {
            const areas = document.querySelectorAll(".area_select li a");
            if (areas && areas.length > 0) {
                for (let i = 0; i < buyArea.length; i++) {
                    if (isSubmit) {
                        break;
                    }
                    const buyAreaKeys = buyArea[i].split(" ");
                    for (let j = 0; j < areas.length; j++) {
                        const a = areas[j];
                        const text = a.textContent;
                        const remainFont = a.querySelector("font");
                        if (remainFont) {
                            const remainCount = remainFont.textContent.replace("剩餘 ", "");
                            if (remainCount < buyCount) {
                                continue;
                            }
                        }
                        let matchCount = 0;
                        buyAreaKeys.forEach((key) => {
                            if (text.includes(key)) {
                                matchCount++;
                            }
                        });
                        if (!isSubmit && matchCount > 0 && matchCount == buyAreaKeys.length) {
                            isSubmit = true;
                            a.click();
                            return true;
                        }
                    }
                }
            }
            return false;
        }

        function goOrder(gameList) {
            let gameRows = gameList.querySelectorAll("tr");

            for (let i = 0; i < buyDateIndexes.length; i++) {
                let index = buyDateIndexes[i];
                if (index >= gameRows.length) {
                    // 預設最後一場
                    index = gameRows.length - 1;
                }

                if (index < 0) {
                    // 隨機場次
                    const gameButtons = gameList.querySelectorAll("button");
                    if (gameButtons.length > 0) {
                        const randomIndex = Math.floor(Math.random() * gameButtons.length);
                        gameButtons[randomIndex].click();
                        return true;
                    }
                } else if (gameRows[index]) {
                    const gameButton = gameRows[index].querySelector("button");
                    if (gameButton && !isSubmit) {
                        isSubmit = true;
                        gameButton.click();
                        return true;
                    }
                }
            }
            return false;
        }

        function setCaptcha() {
            const img = document.getElementById("TicketForm_verifyCode-image");
            if (img) {
                const imgSrc = img.src;
                fetch(imgSrc)
                    .then((response) => response.blob())
                    .then((blob) => {
                        const formData = new FormData();
                        const file = new File([blob], "c.png", { type: "image/png" });
                        formData.append("image", file);

                        const ocr = GM_xmlhttpRequest({
                            method: "POST",
                            url: "https://asia-east1-futureminer.cloudfunctions.net/ocr",
                            data: formData,
                            onload: function (r) {
                                isOcr = false;
                                if (r.status == 200) {
                                    const captcha = r.responseText;
                                    if (captcha.length == 4) {
                                        const verifyCodeInput = document.getElementById("TicketForm_verifyCode");
                                        if (verifyCodeInput) {
                                            verifyCodeInput.value = captcha;
                                            autoSubmit();
                                        }
                                    }
                                } else {
                                    console.error("上傳失敗", r.statusText + "|" + r.responseText);
                                }
                            },
                            onerror: function (error) {
                                console.error("Error:", error);
                            },
                        });
                    })
                    .catch((error) => console.error("Fetch error:", error));
            }
        }

        function largerSubmit() {
            const submit = document.querySelector("button[type=submit],#submitButton");
            if (submit) {
                submit.style.fontSize = "24px";
                submit.style.height = "100px";
                submit.style.width = "100%";
                const reSelect = document.getElementById("reSelect");
                if (reSelect) {
                    const parentDiv = reSelect.parentNode;
                    parentDiv.insertBefore(submit, reSelect);
                }
            }
        }

        function removeSoldOut() {
            const listItems = document.querySelectorAll("li");
            const soldOutItems = Array.from(listItems).filter((li) => li.textContent.includes("已售完"));
            soldOutItems.forEach((soldOut) => {
                soldOut.remove();
            });
        }

        function SetConsole() {
            if (isSetConsole) {
                return;
            }
            isSetConsole = true;
            const isLogin = !!document.querySelector(".user-name");

            const divConsole = document.createElement("div");
            document.body.appendChild(divConsole);
            divConsole.id = "divConsole";
            divConsole.style.position = "fixed";
            divConsole.style.top = "0";
            divConsole.style.left = "0";
            divConsole.style.padding = "10px";
            divConsole.style.textAlign = "center";
            divConsole.style.zIndex = "9999";
            divConsole.style.color = "white";
            divConsole.style.cursor = "pointer";
            setDivConsoleText(divConsole, isAutoMode, isLogin);
            divConsole.addEventListener("click", () => {
                let isAutoMode = (localStorage.getItem("autoMode") || 0) == 1;
                localStorage.setItem("autoMode", isAutoMode ? 0 : 1);
                setDivConsoleText(divConsole, isAutoMode, isLogin, true);
            });

            function setDivConsoleText(divConsole, isAutoMode, isLogin, isToggle) {
                console.log(isAutoMode, isToggle);
                if (isToggle) {
                    isAutoMode = !isAutoMode;
                }
                console.log(`isAutoMode: ${isAutoMode}`);
                if (isAutoMode) {
                    divConsole.style.backgroundColor = "green";
                    if (isLogin) {
                        divConsole.textContent = "🤖";
                        if (isToggle) window.location.reload(true);
                    } else {
                        divConsole.textContent = "🤖 未登入";
                        if (isToggle) {
                            const loginBtn = document.querySelector(".account-login a");
                            if (loginBtn) {
                                loginBtn.click();
                            }
                        }
                    }
                } else {
                    divConsole.style.backgroundColor = "red";
                    divConsole.textContent = !isLogin ? "💪 未登入" : "💪";
                }
            }
        }
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

function autoSubmit() {
    const submit = document.querySelector("button[type=submit],#submitButton");
    if (submit && !isSubmit) {
        isSubmit = true;
        submit.click();
    }
}
