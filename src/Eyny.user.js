// ==UserScript==
// @name         Eyny
// @namespace    http://*.eyny.com/*
// @source       https://github.com/KuoAnn/TampermonkeyUserscripts/raw/main/src/Eyny.user.js
// @version      1.0.0
// @description  try to take over the world!
// @author       KuoAnn
// @match        http://*.eyny.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
    if(document.getElementsByName("submit")[0].value == '是，我已年滿18歲。\nYes, I am.'){
        document.getElementsByName("submit")[0].click();
    }
})();