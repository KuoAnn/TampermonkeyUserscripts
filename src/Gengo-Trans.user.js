// ==UserScript==
// @name         Gengo-Trans
// @source       https://github.com/KuoAnn/TampermonkeyUserscripts/raw/main/src/Gengo-Trans.user.js
// @namespace    https://gengo.com/
// @version      1.4.2
// @description  Gengo Translate Extensions
// @author       KuoAnn
// @match        https://gengo.com/t/workbench/*
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/opencc-js@1.0.5/dist/umd/cn2t.min.js
// @require      https://cdn.jsdelivr.net/npm/pangu@4.0.7/dist/browser/pangu.min.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=www.gengo.com
// ==/UserScript==

const converter = OpenCC.Converter({ from: "cn", to: "tw" });
const css = `
    mark { background-color:orange; }
    .sourceToolbar {position:absolute;top:12px;left:40%;}
    .sourceToolbar a {float:right;padding:0 0 0 6px;}
    .btn-all {float:right;}
`;
const svg_clone =
    '<svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M9 18q-.825 0-1.413-.588T7 16V4q0-.825.588-1.413T9 2h9q.825 0 1.413.588T20 4v12q0 .825-.588 1.413T18 18H9Zm0-2h9V4H9v12Zm-6-1h2v-2H3v2Zm0-3.5h2v-2H3v2ZM10 22h2v-2h-2v2Zm-7-3.5h2v-2H3v2ZM5 22v-2H3q0 .825.588 1.413T5 22Zm1.5 0h2v-2h-2v2Zm7 0q.825 0 1.413-.588T15.5 20h-2v2ZM3 8h2V6q-.825 0-1.413.588T3 8Z"/></svg>';
const svg_highlight =
    '<svg width="18" height="18" viewBox="0 0 32 32"><path fill="currentColor" d="M12 15H5a3 3 0 0 1-3-3v-2a3 3 0 0 1 3-3h5V5a1 1 0 0 0-1-1H3V2h6a3 3 0 0 1 3 3zM5 9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h5V9zm15 14v2a1 1 0 0 0 1 1h5v-4h-5a1 1 0 0 0-1 1z"/><path fill="currentColor" d="M2 30h28V2Zm26-2h-7a3 3 0 0 1-3-3v-2a3 3 0 0 1 3-3h5v-2a1 1 0 0 0-1-1h-6v-2h6a3 3 0 0 1 3 3Z"/></svg>';
const svg_trans =
    '<svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M5 15v2a2 2 0 0 0 1.85 1.994L7 19h3v2H7a4 4 0 0 1-4-4v-2h2Zm13-5l4.4 11h-2.155l-1.201-3h-4.09l-1.199 3h-2.154L16 10h2Zm-1 2.885L15.753 16h2.492L17 12.885ZM8 2v2h4v7H8v3H6v-3H2V4h4V2h2Zm9 1a4 4 0 0 1 4 4v2h-2V7a2 2 0 0 0-2-2h-3V3h3ZM6 6H4v3h2V6Zm4 0H8v3h2V6Z"/></svg>';
const svg_cn2tw =
    '<svg width="18" height="18" viewBox="0 0 64 64"><path fill="currentColor" d="M32 2C15.432 2 2 15.432 2 32s13.432 30 30 30s30-13.432 30-30S48.568 2 32 2M19.217 24.134a4.916 4.916 0 1 1 0-9.834c2.716 0 4.916 2.201 4.916 4.917s-2.2 4.917-4.916 4.917m1.169.529l-1.169 4.387l-1.171-4.388c.378.081.769.126 1.171.126c.401 0 .792-.045 1.169-.125m-5.297-9.183a5.565 5.565 0 0 0-1.175 2.024L10.701 14.3l4.388 1.18m-.789-4.779l3.205 3.213a5.542 5.542 0 0 0-2.024 1.175L14.3 10.701m-.531 7.345a5.56 5.56 0 0 0 0 2.34l-4.386-1.169l4.386-1.171m.145 2.882c.245.76.651 1.445 1.175 2.023l-4.388 1.183l3.213-3.206m1.566 2.415a5.58 5.58 0 0 0 2.025 1.176L14.3 27.732l1.18-4.389m2.566-9.574l1.171-4.385l1.169 4.385a5.56 5.56 0 0 0-2.34 0m4.905 1.32a5.569 5.569 0 0 0-2.023-1.175l3.205-3.213l-1.182 4.388m4.781-.789l-3.214 3.206a5.557 5.557 0 0 0-1.176-2.025l4.39-1.181m-4.781 9.043l1.182 4.39l-3.207-3.214a5.585 5.585 0 0 0 2.025-1.176m.391-.392a5.567 5.567 0 0 0 1.177-2.025l3.214 3.208l-4.391-1.183m1.321-2.565c.08-.377.125-.768.125-1.169c0-.402-.045-.793-.126-1.171l4.388 1.171l-4.387 1.169M32 60C16.561 60 4 47.439 4 32h28V4c15.439 0 28 12.561 28 28S47.439 60 32 60"/></svg>';
const svg_pangu =
    '<svg width="18" height="18" viewBox="0 0 256 256"><path fill="currentColor" d="M112 48v160a8 8 0 0 1-16 0v-72H43.31l18.35 18.34a8 8 0 0 1-11.32 11.32l-32-32a8 8 0 0 1 0-11.32l32-32a8 8 0 0 1 11.32 11.32L43.31 120H96V48a8 8 0 0 1 16 0Zm125.66 74.34l-32-32a8 8 0 0 0-11.32 11.32L212.69 120H160V48a8 8 0 0 0-16 0v160a8 8 0 0 0 16 0v-72h52.69l-18.35 18.34a8 8 0 0 0 11.32 11.32l32-32a8 8 0 0 0 0-11.32Z"/></svg>';

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

let OPENAI_API_KEY = localStorage.getItem("OPENAI_API_KEY");

(function () {
    ("use strict");
    // Append custom css style
    const style = document.createElement("style");
    style.innerHTML = css;
    document.head.appendChild(style);

    // Fast start
    let goTransCounter = 0;
    const goTrans = setInterval(() => {
        $selector = $("button.start-translation:first");
        if ($selector.length > 0 || goTransCounter++ > 100) {
            clearInterval(goTrans);
            $selector.click();
            console.log(".navbar-btn detect=" + $selector.length);
        }
    }, 100);

    const execute = async () => {
        await delay(100);
        let $navbarBtn = $(".navbar-btn");
        let counter = 0;
        while ($navbarBtn.length == 0) {
            if (counter++ > 50) {
                console.log(".navbar-btn detect fail");
                break;
            }
            await delay(100);
            $navbarBtn = $(".navbar-btn");
        }

        // Super Vision
        // $('.panel-center').removeClass('col-md-offset-1').removeClass('col-md-10').addClass('col-md-12');

        // Start append...
        console.log("Start append button");

        $navbarBtn = $(".list-tags");
        if ($navbarBtn.length > 0) {
            $btnSaveAll = $('<button id="btnSaveAll" class="btn navbar-btn btn-warning">Save</button>');
            $btnPanguAll = $('<button id="btnPanguAll" class="btn navbar-btn btn-default">Pangu</button>');
            $btnCn2TwAll = $('<button id="btnCn2TwAll" class="btn navbar-btn btn-default">Tw</button>');
            $btnTransAll = $('<button id="btnTransAll" class="btn navbar-btn btn-danger">Trans</button>');
            $div = $("<div class='btn-all'>").append($btnSaveAll).append($btnPanguAll).append($btnCn2TwAll).append($btnTransAll);

            $(".panel-center .comments").append($div);

            $btnSaveAll.click(function () {
                console.log("btnSaveAll");
                const $textarea = $("textarea.target");
                if ($textarea.length > 0) {
                    $.each($textarea, function (i, d) {
                        let $d = $(d);
                        $d.change();
                    });
                }
            });
            $btnPanguAll.click(function () {
                console.log("btnPanguAll");
                const $textarea = $("textarea.target");
                if ($textarea.length > 0) {
                    $.each($textarea, function (i, d) {
                        let $d = $(d);
                        console.log("Pangu[" + i + "]: " + $d.val());
                        panguText($d);
                    });
                }
            });
            $btnCn2TwAll.click(function () {
                console.log("btnCn2TwAll");
                const $textarea = $("textarea.target");
                if ($textarea.length > 0) {
                    $.each($textarea, function (i, d) {
                        let $d = $(d);
                        console.log("2TW[" + i + "]: " + $d.val());
                        cn2TwText($d);
                    });
                }
            });
            $btnTransAll.click(function () {
                console.log("btnTransAll");
                const $source = $(".source-wrap");
                const $textarea = $("textarea.target");
                if ($source.length > 0 && $textarea.length > 0) {
                    $.each($textarea, function (i, d) {
                        let $d = $(d);
                        // 保護機制：避免洗掉已翻譯部分
                        if ($d.val().length === 0) {
                            console.log("Trans[" + i + "]: " + $d.val());
                            let q = getOriginalText($($source[i]).find("pre.ng-isolate-scope"));
                            send2Gpt(q, $d);
                        } else {
                            console.log("Trans Skip[" + i + "]: " + $d.val());
                        }
                    });
                }
            });
        }

        console.log("Start append Tooltip");

        // Tooltip - 不會馬上 Render
        let navbarJob = ".box.job";
        let $navbarJob = $(navbarJob);
        while ($navbarJob.length == 0) {
            await delay(100);
            $navbarJob = $(navbarJob);
            console.log("Detect " + navbarJob + "=" + $navbarJob.length);
        }
        if ($navbarJob.length > 0) {
            $.each($navbarJob.find(".segment"), function (i, d) {
                let $d = $(d);
                console.log("Append Source[" + i + "]");
                // Source
                $d.find(".source-wrap pre").before(
                    "<div class='sourceToolbar'>" +
                        '<a class="btn btnSrcCopy btn-link" href="javascript:void(0)">' +
                        svg_clone +
                        "</a>" +
                        '<a class="btn btnHighlight btn-link" href="javascript:void(0)">' +
                        svg_highlight +
                        "</a>" +
                        "</div>"
                );
            });

            $.each($navbarJob.find(".segment"), function (i, d) {
                let $d = $(d);
                console.log("Append Target[" + i + "]");
                // Target
                $d.find(".nav-tools li:last")
                    .after('<li><a class="btn btnTgtCopy" href="javascript:void(0)">' + svg_clone + "</a></li>")
                    .after('<li><a class="btn btnTgtPangu" href="javascript:void(0)">' + svg_pangu + "</a></li>")
                    .after('<li><a class="btn btnTgtCn2Tw" href="javascript:void(0)">' + svg_cn2tw + "</a></li>")
                    .after('<li><a class="btn btnTgtTrans" href="javascript:void(0)">' + svg_trans + "</a></li>");
            });

            // Source
            $(".btnHighlight")
                .on("click", function () {
                    let $target = $(this).parents(".source-wrap").find("pre br");
                    $target.before("<mark>");
                })
                .click();
            $(".btnSrcCopy").on("click", function () {
                let $target = $(this).parents(".source-wrap").find("pre");
                let copyText = getOriginalText($target);
                // $target.select();
                // document.execCommand("copy"); // 複製選取的內容
                navigator.clipboard.writeText(copyText);
            });

            // Target
            $(".btnTgtTrans").on("click", function () {
                const $source = $(this).parents(".segment").find(".source-wrap pre.ng-isolate-scope");
                const $target = $(this).parents(".segment").find(".target-wrap textarea.target");
                let text = $target.val();
                if (text.length === 0) {
                    // 保護機制：避免洗掉已翻譯部分
                    let q = getOriginalText($source);
                    send2Gpt(q, $target);
                } else {
                    console.log("Trans Skip " + text);
                }
            });
            $(".btnTgtCn2Tw").on("click", function () {
                const $target = $(this).parents(".segment").find(".target-wrap textarea.target");
                console.log("2TW: " + $target.val());
                cn2TwText($target);
            });
            $(".btnTgtPangu").on("click", function () {
                const $target = $(this).parents(".segment").find(".target-wrap textarea.target");
                if ($target.length > 0) {
                    console.log("Pangu: " + $target.val());
                    panguText($target);
                }
            });
            $(".btnTgtCopy").on("click", function () {
                const $target = $(this).parents(".segment").find(".target-wrap textarea.target");
                // $target.select();
                // document.execCommand("copy"); // 複製選取的內容
                navigator.clipboard.writeText($target.val());
            });
        }
    };
    execute();
})();

function getOriginalText($source) {
    var range = document.createRange();
    range.selectNodeContents($source[0]);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    var transTxt = sel.toString();

    // $("#copyTxt").remove();
    // $(".panel-wrap").append('<div class="col-md-offset-1 col-md-10 panel-center" id="copyTxt" style="padding:24px">' + $transTxt.html() + "</div>");
    console.log(transTxt);

    // var transferData = encodeURIComponent(transTxt);
    // window.open("https://fanyi.youdao.com/index.html#/?data=" + transferData);
    return transTxt;
}

function cn2TwText($area) {
    if ($area.val().length > 0) {
        let t = converter($area.val());
        t = t.replace(/“/g, "「");
        t = t.replace(/”/g, "」");
        t = t.replace(/:/g, "：");
        t = t.replace(/;/g, "；");
        t = t.replace(/…/g, "⋯⋯");
        t = t.replace(/—/g, "──");
        t = t.replace(/你/g, "您");
        $area.val(t);
        $("#btnSave").click();
    }
}

function panguText($area) {
    if ($area.val().length > 0) {
        let t = pangu.spacing($area.val());
        $area.val(t);
        $("#btnSave").click();
    }
}

function send2Gpt(sQuestion, $destination) {
    if (OPENAI_API_KEY == null) {
        OPENAI_API_KEY = prompt("Enter Your OPENAI_API_KEY", "");
        if (OPENAI_API_KEY === null) {
            alert("You did not enter OPENAI_API_KEY");
            return;
        }
    }
    if (sQuestion === "") {
        alert("Type in your question!");
        return;
    }

    let q = "Translate into zh-TW\n" + sQuestion;
    console.log("Send Gpt: " + q);

    $("#btnTransAll").text("Translating...").prop("disabled", true);

    const oHttp = new XMLHttpRequest();
    oHttp.open("POST", "https://api.openai.com/v1/chat/completions");
    oHttp.setRequestHeader("Accept", "application/json");
    oHttp.setRequestHeader("Content-Type", "application/json");
    oHttp.setRequestHeader("Authorization", "Bearer " + OPENAI_API_KEY);
    oHttp.onreadystatechange = function () {
        $("#btnTransAll").text("Done").prop("disabled", false);
        if (oHttp.readyState === 4) {
            //console.log(oHttp.status);
            var oJson = {};

            try {
                oJson = JSON.parse(oHttp.responseText);
            } catch (ex) {
                alert("GPT Parse Error: " + ex.message);
                log.console("Resp:" + oHttp.responseText);
            }

            if (oJson.error && oJson.error.message) {
                alert("GPT Error: " + oJson.error.message);
                console.eror("GPT Error: " + oJson.error.message);
            } else if (oJson.choices && oJson.choices[0].message) {
                console.log(oJson);
                var s = oJson.choices[0].message;
                if (s == "") {
                    alert("GPT response empty");
                } else {
                    localStorage.setItem("OPENAI_API_KEY", OPENAI_API_KEY);
                    $destination.val(s.content);
                    setTimeout(function () {
                        $("#btnSave").click();
                    }, 500);
                }
            } else {
                alert("GPT Occurs Exception: " + oHttp.responseText);
                console.error("GPT Occurs Exception: " + oHttp.responseText);
            }
        }
    };

    var data = {
        model: "gpt-3.5-turbo",
        messages: [
            { role: "system", content: "Translator" },
            { role: "user", content: q },
        ],
    };

    oHttp.send(JSON.stringify(data));
}
