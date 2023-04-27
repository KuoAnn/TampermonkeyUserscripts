// ==UserScript==
// @name         Cathay Auto Register
// @namespace    https://www.cathaybk.com.tw/promotion/CreditCard/Event
// @source       https://github.com/KuoAnn/TampermonkeyUserscripts/raw/main/src/Cathay-Register.user.js
// @version      1.0.0
// @description  try to take over the world!
// @author       KuoAnn
// @match        https://www.cathaybk.com.tw/promotion*/CreditCard/Event
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    var autoReload = false;
    var reloadWaitTime = 3;

    var start = function () {
        var attack = function (cid) {
            if (!!cid) {
                alert('Attack ' + cid);
                var form = $("#form-hidden");
                var token = form.find('input[name="__RequestVerificationToken"]').val();

                $.ajax({
                    url: form[0].action, type: form[0].method, cache: 0, data: "CampaignId=" + cid + "&__RequestVerificationToken=" + token, dataType: "json",
                    success: function (rs) {
                        if (rs) {
                            alert(rs.signResultText);

                            if (rs.signResult > 1) {
                                // re-attack
                                attack(cid);
                                attack(cid);
                            }

                            switch (rs.signResult) {
                                case 0:
                                case 1:
                                    alert("<h1 style='color:green'>SUCCESS! SN=" + rs.signUpNumber + "</h1>");
                                    break;
                                case 9001:
                                    alert('Full');
                                    break;
                                case 9998:
                                    alert("Rush Hour");
                                    break;
                                case 9999:
                                    alert("Busy");
                                    break;
                                default:
                            }
                        }
                    },
                    error: function (xhr) { if (xhr.status === 401) { alert("error: xhr=401"); } else if (IsHotTime) { alert("error: Rush Hour"); } else { alert("error: Busy") } },
                });
            }
        }

        $('.btn.btn-sign').each(function (i, d) {
            var cid = $(d).attr('data-campaign-id');

            if (!!cid) {
                attack(cid);
                attack(cid);
                alert("Found " + cid);
            }
        });
    }

    alert = function (str) {
        function checkTime(i) { return (i < 10) ? "0" + i : i; }
        function getNowTime() {
            var today = new Date(),
                h = checkTime(today.getHours()),
                m = checkTime(today.getMinutes()),
                s = checkTime(today.getSeconds());
            return h + ":" + m + ":" + s;
        }

        var oTest = document.getElementsByTagName('body')[0];
        var newNode = document.createElement("div");
        newNode.innerHTML = getNowTime() + ' >>> ' + str;

        oTest.insertBefore(newNode, oTest.childNodes[0]);
    };

    var waitHtmlBuzzer = setInterval(function () {
        alert("Loading...");
        if (document.getElementsByClassName('btn').length > 0) {
            clearInterval(waitHtmlBuzzer);

            if (document.getElementsByClassName('btn-sign').length == 0) {
                alert('CampaignId not Found');

                if (autoReload) {
                    var reloadTimer = setInterval(function () {
                        if (reloadWaitTime < 1) {
                            clearInterval(reloadTimer);
                            alert("Reloading...");
                            location.reload();
                            return;
                        }
                        else {
                            alert("Wait to Reload..." + reloadWaitTime--);
                        }
                    }, 1000);
                    return;
                }
            }
            else {
                start();
            }
        }
    }, 100);
})();