// ==UserScript==
// @name         Gengo-reviewable
// @namespace    https://gengo.com/
// @source       https://github.com/KuoAnn/TampermonkeyUserscripts/raw/main/src/Gengo-Review.user.js
// @version      1.0.1
// @description  try to take over the world!
// @author       KuoAnn
// @match        https://gengo.com/t/jobs/status/reviewable
// @grant        none
// @icon         https://www.google.com/s2/favicons?sz=64&domain=www.gengo.com
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
    var total = parseFloat($("a.dropdown-toggle").text().replace("KuoAnn", "").replace("$", "").trim());
    var subtotal = 0;
    $('.td-list-column-reward').each(function (i, d) {
        var reward = d.innerText;
        if (reward) {
            reward = reward.trim().replace("$", "")
            if (!isNaN(reward)) {
                subtotal += parseFloat(reward);
            }
        }
    })

    subtotal = parseFloat((subtotal).toPrecision(12))
    total = parseFloat((total).toPrecision(12))
    var summaryUS = parseFloat(((subtotal + total)).toPrecision(12))
    var summaryNT = parseFloat(((subtotal + total) * 30).toPrecision(12))

    $('.box h1').after($("<div/>", {
        html: "入帳：$" + total
        + "<br>在途：$" + subtotal
        + "<hr>"
        + "<h3 style='color:red'>合計 $" + summaryUS + " ≈ NT $" + summaryNT + "</h3>"
    }))

})();