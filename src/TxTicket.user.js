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
const BUY_AREA_SEATS = [""]; // 座位優先順序；""=隨機 空白分隔=AND邏輯 (需注意是否和座位群組互斥)
const BUY_COUNT = 4; // 購買張數，若無則選擇最大值
const PAY_TYPE = "A"; // 付款方式：A=ATM, C=信用卡
const EXECUTE_TIME = "2024/10/10 23:31:30"; // 啟動時間：HH:mm:ss，"" OR 重整頁面=立即執行

// 系統參數(勿動)
let sys_isAutoMode = (localStorage.getItem("autoMode") || 0) == 1;
let sys_countdownInterval = null;
let sys_isSetConsole = false;
let sys_session = "";
let sys_isSelectArea = false;
let sys_isSelect2Button = false;
let sys_isClickBuyTicket = false;
let sys_isOcr = false;
let sys_isClickPayType = false;
let sys_isSubmit = false;
let sys_isListenOrder = false;
let sys_isGetCaptcha = false;

// 取得當前網址
const triggerUrl = window.location.href;
if (triggerUrl.includes("activity/detail/")) {
    sys_session = "d";
} else if (triggerUrl.includes("ticket/game/")) {
    sys_session = "g";
} else if (triggerUrl.includes("ticket/verify/")) {
    sys_session = "v";
} else if (triggerUrl.includes("ticket/area/")) {
    sys_session = "a";
} else if (triggerUrl.includes("ticket/ticket/")) {
    sys_session = "t";
} else if (triggerUrl.includes("ticket/checkout/")) {
    sys_session = "c";
}

(function () {
    ("use strict");
    const observer = new MutationObserver((mo) => {
        mo.forEach((mutation) => {
            if (mutation.type === "childList") {
                if (sys_session != "d" && sys_session != "g") {
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

                switch (sys_session) {
                    case "d":
                    case "g":
                        // 活動頁
                        // 點選立即購票
                        const buyTicket = document.querySelector('a[href^="/activity/game/"]');
                        if (buyTicket && !sys_isClickBuyTicket) {
                            sys_isClickBuyTicket = true;
                            buyTicket.click();
                        }

                        if (sys_isAutoMode) {
                            const gameList = document.querySelector("#gameList table tbody");
                            if (gameList && !sys_isSubmit && !sys_isListenOrder) {
                                sys_isListenOrder = true;
                                const listenInterval = setInterval(() => {
                                    const updatedGameList = document.querySelector("#gameList table tbody");
                                    if (updatedGameList) {
                                        const isOrderSuccessful = goOrder(updatedGameList);
                                        const isAutoModeEnabled = localStorage.getItem("autoMode") === "1";
                                        if (isOrderSuccessful || !isAutoModeEnabled) {
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

                        function setCheckCodeAndSubmit(code) {
                            const checkCodeInput = document.querySelector(".greyInput[name=checkCode]");
                            if (checkCodeInput) {
                                checkCodeInput.value = code;
                                autoSubmit();
                            }
                        }

                        if (promoDesc) {
                            const textContent = promoDesc.textContent;
                            if (textContent.includes("國泰世華") && textContent.includes("卡號前8碼")) {
                                setCheckCodeAndSubmit("40637634");
                            } else if (textContent.includes("中國信託") && textContent.includes("卡號前6碼")) {
                                setCheckCodeAndSubmit("431195");
                            }
                        }
                        break;
                    case "a":
                        // 自動選位
                        if (sys_isAutoMode && !sys_isSelectArea) {
                            sys_isSelectArea = true;
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
                        agreeToTerms();
                        selectTicketQuantity();
                        handleCaptchaInput();

                        // 勾選同意條款
                        function agreeToTerms() {
                            const ticketAgree = document.getElementById("TicketForm_agree");
                            if (ticketAgree) {
                                ticketAgree.checked = true;
                            }
                        }

                        // 選取購票張數
                        function selectTicketQuantity() {
                            const ticketPrice = document.querySelector('[id^="TicketForm_ticketPrice_"]');
                            if (ticketPrice) {
                                const options = ticketPrice.querySelectorAll("option");
                                const hasBuyCount = Array.from(options).some((o) => o.value == BUY_COUNT);
                                ticketPrice.value = hasBuyCount ? BUY_COUNT : options[options.length - 1].value;
                            }
                        }

                        // 輸入圖形驗證碼
                        function handleCaptchaInput() {
                            const captchaInput = document.getElementById("TicketForm_verifyCode");
                            if (captchaInput) {
                                if (sys_isAutoMode && !sys_isOcr) {
                                    sys_isOcr = true;
                                    setCaptcha();
                                }

                                captchaInput.focus();
                                captchaInput.addEventListener("input", (e) => {
                                    if (e.target.value.length == 4) {
                                        autoSubmit();
                                    }
                                });
                            }
                        }
                        break;
                    case "c":
                        // 付款
                        function selectPaymentMethod(elementId) {
                            const paymentRadio = document.getElementById(elementId);
                            if (!sys_isClickPayType && paymentRadio) {
                                sys_isClickPayType = true;
                                paymentRadio.click();
                            }
                        }

                        if (PAY_TYPE == "A") {
                            // 選擇 ATM 付款
                            selectPaymentMethod("CheckoutForm_paymentId_54");
                        } else if (PAY_TYPE == "C") {
                            // 選擇信用卡付款
                            selectPaymentMethod("CheckoutForm_paymentId_36");
                        }
                        break;
                }

                // 共用優化 UI
                largerSubmit();
            }
        });

        function select2Button() {
            const select = document.querySelector("#gameId");
            if (select && !sys_isSelect2Button) {
                sys_isSelect2Button = true;
                const title = document.querySelector(".activityT.title");
                if (title) {
                    title.style.display = "none";
                }

                const fragment = document.createDocumentFragment();
                const selectOptions = select.querySelectorAll("option");

                selectOptions.forEach((option) => {
                    const b = document.createElement("button");
                    const dateText = option.textContent.match(/\d{4}\/\d{2}\/\d{2} \(\S+\)/);
                    b.textContent = dateText ? dateText[0] : option.textContent;
                    b.onclick = () => {
                        select.value = option.value;
                        select.dispatchEvent(new Event("change", { bubbles: true }));
                    };
                    setButtonStyle(b, option.selected);
                    fragment.appendChild(b);
                });

                select.before(fragment);
            }

            function setButtonStyle(button, isSelected) {
                button.style.padding = "2px 6px";
                button.style.margin = "2px";
                button.style.border = "1px solid #ccc";
                if (isSelected) {
                    button.style.backgroundColor = "#007bff";
                    button.style.color = "#fff";
                }
            }
        }

        function selectArea() {
            const groups = document.querySelectorAll(".zone-label");
            const selectedGroups = getSelectedGroups(groups);

            if (selectedGroups.length > 0) {
                for (const groupId of selectedGroups) {
                    const areaElements = document.querySelectorAll(`#${groupId} li a`);
                    console.log(groupId, areaElements);
                    if (selectAreaSeat(areaElements)) return true;
                }
                return false;
            } else {
                return selectAreaSeat(document.querySelectorAll(".area-list li a"));
            }

            function getSelectedGroups(groups) {
                const selectedGroups = [];
                if (groups.length > 0 && BUY_AREA_GROUPS.length > 0 && BUY_AREA_GROUPS[0] !== "") {
                    BUY_AREA_GROUPS.forEach((buyGroup) => {
                        groups.forEach((group) => {
                            if (group.textContent.includes(buyGroup)) {
                                const dataId = group.getAttribute("data-id");
                                if (dataId) selectedGroups.push(dataId);
                            }
                        });
                    });
                }
                return selectedGroups;
            }

            function selectAreaSeat(elements) {
                if (elements.length > 0) {
                    const randomElements = Array.from(elements).sort(() => Math.random() - 0.5);

                    for (const seat of BUY_AREA_SEATS) {
                        if (sys_isSubmit) break;

                        const buyAreaKeys = seat.split(" ");
                        for (const element of randomElements) {
                            if (isExcluded(element)) continue;

                            const matchCount = buyAreaKeys.filter((key) => element.textContent.includes(key)).length;
                            if (!sys_isSubmit && matchCount > 0 && matchCount === buyAreaKeys.length) {
                                sys_isSubmit = true;
                                element.click();
                                // console.log("pick", element.textContent);
                                return true;
                            }
                        }
                    }
                }
                return false;
            }

            function isExcluded(element) {
                const text = element.textContent;
                if (
                    text.includes("輪椅") ||
                    text.includes("身障") ||
                    text.includes("障礙") ||
                    text.includes("Restricted") ||
                    text.includes("遮蔽") ||
                    text.includes("視線不完整")
                ) {
                    return true;
                }

                const remainFont = element.querySelector("font");
                if (remainFont) {
                    const remainCount = parseInt(remainFont.textContent.replace("剩餘 ", ""), 10);
                    if (remainCount < BUY_COUNT) {
                        return true;
                    }
                }

                return false;
            }
        }

        function goOrder(gameList) {
            if (!gameList) return false;

            const gameRows = gameList.querySelectorAll("tr");

            const clickRandomGameButton = () => {
                const gameButtons = gameList.querySelectorAll("button");
                if (gameButtons.length > 0) {
                    const randomIndex = Math.floor(Math.random() * gameButtons.length);
                    gameButtons[randomIndex].click();
                    return true;
                }
                return false;
            };

            for (const index of BUY_DATE_INDEXS.map((i) => i - 1)) {
                if (index >= gameRows.length || index < 0) {
                    return clickRandomGameButton();
                }

                const gameButton = gameRows[index]?.querySelector("button");
                if (gameButton && !sys_isSubmit) {
                    sys_isSubmit = true;
                    gameButton.click();
                    return true;
                }
            }

            return false;
        }

        function get_ocr_image() {
            const img = document.querySelector("#TicketForm_verifyCode-image");
            if (img) {
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                canvas.height = img.naturalHeight;
                canvas.width = img.naturalWidth;
                context.drawImage(img, 0, 0);
                const img_data = canvas.toDataURL();
                return img_data ? img_data.split(",")[1] : "";
            }
            return "";
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
                    sys_isOcr = false;
                    if (r.status == 200) {
                        const answer = JSON.parse(r.responseText).answer;
                        if (answer.length == 4) {
                            if (!sys_isGetCaptcha) {
                                console.log(url + " return " + answer);
                                sys_isGetCaptcha = true;
                                const verifyCodeInput = document.getElementById("TicketForm_verifyCode");
                                if (verifyCodeInput) {
                                    verifyCodeInput.value = answer;
                                    autoSubmit();
                                }
                            } else {
                                console.log(url + " unuse " + answer);
                            }
                        } else if (!sys_isGetCaptcha) {
                            sys_isGetCaptcha = true;
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
                            sys_isGetCaptcha = false;
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
                Object.assign(submit.style, {
                    fontSize: "24px",
                    height: "100px",
                    width: "100%",
                    margin: "4px",
                });

                // 將 submit 按鈕移到最上方
                const submitParent = submit.parentNode;
                if (submitParent) {
                    submitParent.prepend(submit);
                }
            }
        }

        function removeSoldOut() {
            document.querySelectorAll("li").forEach((li) => {
                if (li.textContent.includes("已售完")) {
                    li.remove();
                }
            });
        }

        function SetConsole() {
            if (sys_isSetConsole) {
                return;
            }
            sys_isSetConsole = true;
            const isLogin = !!document.querySelector(".user-name");

            const divConsole = createConsoleElement();
            setDivConsoleText(divConsole, sys_isAutoMode, isLogin);

            divConsole.addEventListener("click", () => {
                let isAutoMode = (localStorage.getItem("autoMode") || 0) == 1;
                localStorage.setItem("autoMode", isAutoMode ? 0 : 1);
                setDivConsoleText(divConsole, isAutoMode, isLogin, true);
            });

            function createConsoleElement() {
                const div = document.createElement("div");
                document.body.appendChild(div);
                div.id = "divConsole";
                Object.assign(div.style, {
                    position: "fixed",
                    top: "0",
                    left: "0",
                    padding: "10px",
                    textAlign: "center",
                    zIndex: "9999",
                    color: "white",
                    cursor: "pointer",
                });
                return div;
            }

            function countdown() {
                console.log("countdown:", EXECUTE_TIME);
                const now = new Date();
                const executeDate = new Date(EXECUTE_TIME);
                let diff = executeDate - now;
                if (diff > 0) {
                    let seconds = Math.floor(diff / 1000);
                    sys_countdownInterval = setInterval(() => {
                        seconds--;
                        if (seconds <= 0) {
                            clearInterval(sys_countdownInterval);
                            window.location.reload(true);
                        } else {
                            divConsole.textContent = `🤖 ${seconds} 秒`;
                        }
                    }, 1000);
                } else {
                    window.location.reload(true);
                }
            }

            function setDivConsoleText(divConsole, isAutoMode, isLogin, isToggle = false) {
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
                    if (isToggle && sys_countdownInterval != null) {
                        clearInterval(sys_countdownInterval);
                    }
                }
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            autoSubmit();
        }
    });
})();

function autoSubmit() {
    const submit = document.querySelector("button[type=submit],#submitButton");
    if (submit && !sys_isSubmit) {
        sys_isSubmit = true;
        submit.click();
    }
}
