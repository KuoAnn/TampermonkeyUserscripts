// ==UserScript==
// @name         Eyny Auto Login
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Automatically fill in login details and submit for Eyny forum
// @author       You
// @match        https://*.eyny.com/member.php?mod=logging*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=eyny.com
// @grant        none
// ==/UserScript==

(function () {
    "use strict";

    // Function to fill in the form
    function fillForm() {
        const user = "aaa";
        const pswd = "bbb";

        // Fill in username
        let usernameField = document.querySelector('input[name="username"]');
        if (usernameField) usernameField.value = user;

        // Fill in password
        let passwordField = document.querySelector('input[type="password"]');
        if (passwordField) passwordField.value = pswd;

        // Select security question
        let securityQuestionSelect = document.querySelector('select[name="questionid"]');
        if (securityQuestionSelect) {
            securityQuestionSelect.value = "1"; // "1" corresponds to "母親的名字"

            // Trigger change event to show answer field
            let event = new Event("change");
            securityQuestionSelect.dispatchEvent(event);
        }

        // Wait for the answer field to appear and then fill it
        setTimeout(() => {
            let answerField = document.querySelector('input[name="answer"]');
            if (answerField) {
                answerField.value = "123";

                // Click the login button
                let loginButton = document.querySelector('button[name="loginsubmit"]');
                if (loginButton) loginButton.click();
            }
        }, 1000); // Wait for 1000ms to ensure the field has appeared
    }

    // Function to wait for an element to appear
    function waitForElement(selector, callback) {
        if (document.querySelector(selector)) {
            callback();
        } else {
            setTimeout(() => waitForElement(selector, callback), 100);
        }
    }

    // Wait for the login form to be present before running the fillForm function
    waitForElement('form[name="login"]', fillForm);
})();
