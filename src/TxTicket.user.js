// ==UserScript==
// @name         TxTicket
// @namespace    http://tampermonkey.net/
// @source       https://github.com/KuoAnn/TampermonkeyUserscripts/raw/main/src/TxTicket.user.js
// @version      1.0.5
// @description  強化UI/勾選同意條款/銀行辨識/選取購票/點選立即購票/選擇付款方式/alt+↓=切換日期/Enter送出/關閉提醒/移除廣告/執行倒數
// @author       You
// @match        https://tixcraft.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tixcraft.com
// @grant        GM_xmlhttpRequest
// ==/UserScript==
// 個人參數
const BUY_DATE_INDEXS = [1, 2, -1]; // 場次優先順序：1=第一場 2=第二場... 負數=隨機 (搶票瞬間因無法確認售完，基本上就是選第一順位)
const BUY_AREA_GROUPS = ["3600", "3400", "3000"]; // 座位群組(通常是價位)：""=全部 (座位會被鎖定在此群內；安全機制：若查無群組則預設全選)
const BUY_AREA_SEATS = ["紫"]; // 座位優先順序；""=隨機 空白分隔=AND邏輯 (需注意是否和座位群組互斥)
const BUY_COUNT = 4; // 購買張數，若無則選擇最大值
const PAY_TYPE = "A"; // 付款方式：A=ATM, C=信用卡
const EXECUTE_TIME = "2024/10/10 23:31:30"; // 啟動時間：HH:mm:ss，"" OR 重整頁面=立即執行

// 系統參數(勿動)
let isAutoMode = (localStorage.getItem("autoMode") || 0) == 1;
let countdownInterval = null;
let isSetConsole = false;
let session = "";
let isSelectArea = false;
let isSelect2Button = false;
let isClickBuyTicket = false;
let isOcr = false;
let isClickPayType = false;
let isSubmit = false;
let isListenOrder = false;
let isGetCaptcha = false;

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

                const ad = document.getElementById("ad-footer");
                if (ad) {
                    ad.remove();
                }

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
                                if (o.value == BUY_COUNT) {
                                    hasBuyCount = true;
                                    ticketPrice.value = BUY_COUNT;
                                }
                            });
                            if (!hasBuyCount) {
                                ticketPrice.value = options[options.length - 1].value;
                            }
                        }

                        // 輸入圖形驗證碼
                        const captchaInput = document.getElementById("TicketForm_verifyCode");
                        if (captchaInput) {
                            if (isAutoMode && !isOcr) {
                                isOcr = true;
                                setCaptcha();
                            }

                            captchaInput.focus();
                            captchaInput.addEventListener("input", (e) => {
                                if (e.target.value.length == 4) {
                                    autoSubmit();
                                }
                            });
                        }
                        break;
                    case "c":
                        // 付款
                        if (PAY_TYPE == "A") {
                            // 選擇 ATM 付款
                            const atmRadio = document.getElementById("CheckoutForm_paymentId_54");
                            if (atmRadio && !isClickPayType) {
                                isClickPayType = true;
                                atmRadio.click();
                            }
                        } else if (PAY_TYPE == "C") {
                            // 選擇信用卡付款
                            const creditCardRadio = document.getElementById("CheckoutForm_paymentId_36");
                            if (creditCardRadio && !isClickPayType) {
                                isClickPayType = true;
                                creditCardRadio.click();
                            }
                        }
                        break;
                }

                // 共用優化 UI
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
            // areaGroup
            const groups = document.querySelectorAll(".zone-label");
            const selectedGroups = [];
            if (groups && groups.length > 0 && BUY_AREA_GROUPS.length > 0 && BUY_AREA_GROUPS[0] != "") {
                for (let i = 0; i < BUY_AREA_GROUPS.length; i++) {
                    for (let j = 0; j < groups.length; j++) {
                        const group = groups[j];
                        if (group.textContent.includes(BUY_AREA_GROUPS[i])) {
                            // push data-id to selectedGroups
                            const dataId = group.getAttribute("data-id");
                            if (dataId) selectedGroups.push(dataId);
                        }
                    }
                }
            }

            // areaSeat
            if (selectedGroups.length > 0) {
                for (let i = 0; i < selectedGroups.length; i++) {
                    const eleAreas = document.querySelectorAll(`#${selectedGroups[i]} li a`);
                    console.log(selectedGroups[i], eleAreas);
                    if (selectAreaSeat(eleAreas)) return true;
                }
                return false;
            } else {
                return selectAreaSeat(document.querySelectorAll(".zone-label li a"));
            }

            function selectAreaSeat(elements) {
                if (elements && elements.length > 0) {
                    elements = Array.from(elements).sort(() => Math.random() - 0.5);
                    console.log("elements", elements);

                    for (let i = 0; i < BUY_AREA_SEATS.length; i++) {
                        if (isSubmit) {
                            break;
                        }
                        const buyAreaKeys = BUY_AREA_SEATS[i].split(" ");
                        for (let j = 0; j < elements.length; j++) {
                            const a = elements[j];
                            const text = a.textContent;
                            if (
                                text.includes("輪椅") ||
                                text.includes("身障") ||
                                text.includes("障礙") ||
                                text.includes("Restricted") ||
                                text.includes("遮蔽") ||
                                text.includes("視線不完整")
                            ) {
                                continue;
                            }
                            const remainFont = a.querySelector("font");
                            if (remainFont) {
                                const remainCount = remainFont.textContent.replace("剩餘 ", "");
                                if (remainCount < BUY_COUNT) {
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
                                // a.click();
                                console.log("pick up", text);
                                return true;
                            }
                        }
                    }
                }
                return false;
            }
        }

        function goOrder(gameList) {
            let gameRows = gameList.querySelectorAll("tr");

            for (let i = 0; i < BUY_DATE_INDEXS.length; i++) {
                let index = BUY_DATE_INDEXS[i] - 1;
                if (index >= gameRows.length) {
                    index = -1; // 預設隨機
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

        function get_ocr_image() {
            let image_data = "";
            let img = document.querySelector("#TicketForm_verifyCode-image");
            if (img != null) {
                let canvas = document.createElement("canvas");
                let context = canvas.getContext("2d");
                canvas.height = img.naturalHeight;
                canvas.width = img.naturalWidth;
                context.drawImage(img, 0, 0);
                let img_data = canvas.toDataURL();
                if (img_data) {
                    image_data = img_data.split(",")[1];
                }
            }
            return image_data;
        }

        function setCaptcha() {
            const image_data = get_ocr_image();
            if (image_data) {
                try {
                    getCaptcha("http://maxbot.dropboxlike.com:16888/ocr", image_data);
                    getCaptcha("https://asia-east1-futureminer.cloudfunctions.net/ocr", image_data);
                } catch (error) {
                    console.error("Error:", error);
                }
            }
        }

        function getCaptcha(url, image_data) {
            GM_xmlhttpRequest({
                method: "POST",
                url: url,
                headers: {
                    "Content-Type": "application/json",
                },
                data: JSON.stringify({ image_data: image_data }),
                onload: function (r) {
                    console.log(url, r.responseText);
                    isOcr = false;
                    if (r.status == 200) {
                        const answer = JSON.parse(r.responseText).answer;
                        if (answer.length == 4) {
                            if (!isGetCaptcha) {
                                console.log(url + " return " + answer);
                                isGetCaptcha = true;
                                const verifyCodeInput = document.getElementById("TicketForm_verifyCode");
                                if (verifyCodeInput) {
                                    verifyCodeInput.value = answer;
                                    autoSubmit();
                                }
                            } else {
                                console.log(url + " unuse " + answer);
                            }
                        } else if (!isGetCaptcha) {
                            isGetCaptcha = true;
                            console.log(url + " retry");
                            refreshCaptcha(url);
                        }
                    } else {
                        console.error(url + " Fail", r.statusText + "|" + r.responseText);
                    }
                },
                onerror: function (error) {
                    console.error(url + " Error:", error);
                },
            });
        }

        function refreshCaptcha(url) {
            const imgCaptcha = document.getElementById("TicketForm_verifyCode-image");
            if (imgCaptcha) {
                imgCaptcha.click();
                // 輪詢 TicketForm_verifyCode-image 查看 src 屬性是否有變化
                const src = imgCaptcha.src;
                console.log("src", src);
                const interval = setInterval(() => {
                    if (src != imgCaptcha.src) {
                        console.log("src changed", imgCaptcha.src);
                        const image_data = get_ocr_image();
                        if (image_data) {
                            clearInterval(interval);
                            isGetCaptcha = false;
                            getCaptcha(url, image_data);
                        } else {
                            console.log("image_data is empty");
                        }
                    }
                }, 100);
            }
        }

        function largerSubmit() {
            const submit = document.querySelector("button[type=submit],#submitButton");
            if (submit) {
                submit.style.fontSize = "24px";
                submit.style.height = "100px";
                submit.style.width = "100%";
                submit.style.margin = "4px";
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

            function countdown() {
                // 判斷距離執行時間剩餘秒數，若大於 0 則進行秒數倒數，並即時將剩餘秒數印出，否則重新整理
                console.log("countdown:", EXECUTE_TIME);
                const now = new Date();
                const executeDate = new Date(EXECUTE_TIME);
                let diff = executeDate - now;
                if (diff > 0) {
                    let seconds = Math.floor(diff / 1000);
                    countdownInterval = setInterval(() => {
                        seconds--;
                        if (seconds <= 0) {
                            clearInterval(countdownInterval);
                            window.location.reload(true);
                        } else {
                            divConsole.textContent = `🤖 ${seconds} 秒`;
                        }
                    }, 1000);
                } else {
                    window.location.reload(true);
                }
            }

            function setDivConsoleText(divConsole, isAutoMode, isLogin, isToggle) {
                console.log(isAutoMode, isToggle);
                if (isToggle) {
                    isAutoMode = !isAutoMode;
                }
                if (isAutoMode) {
                    divConsole.style.backgroundColor = "green";
                    if (isLogin) {
                        divConsole.textContent = "🤖";
                        if (isToggle) {
                            if (EXECUTE_TIME && EXECUTE_TIME.length > 0) {
                                countdown();
                            } else {
                                window.location.reload(true);
                            }
                        }
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
                    if (isToggle) {
                        if (countdownInterval != null) {
                            clearInterval(countdownInterval);
                        }
                    }
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
