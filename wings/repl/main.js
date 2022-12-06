let worker;

let prompt;
let inp;
let out;
let stat;
let restart;

let code;
let history;
let historyIndex;
let tempHistory;

function initialize() {
    worker = new Worker("worker.js");
    worker.onmessage = workerOnMessage;

    code = "";
    history = [];
    historyIndex = 0;
    tempHistory = "";

    out.value = "";
    inp.value = "";
    prompt.value = ">>> ";

    out.disabled = true;
    inp.disabled = true;
    prompt.disabled = true;
    restart.disabled = true;

    workerOnMessage({ data: {
        type: "status",
        message: "Initializing..."
    } });
}

function execute(code) {
    worker.postMessage({ code: code });
}

function write(text) {
    let out = document.getElementById("out");
    let scroll = out.scrollHeight - out.scrollTop == out.clientHeight;
    out.value += text;
    if (scroll) {
        out.scrollTop = out.scrollHeight;
    }
}

function workerOnMessage(event) {
    let data = event.data;
    switch (data.type) {
        case "stdout":
            write(data.message);
            break;
        case "status":
            stat.innerText = "Status: " + data.message + "\n";
            break;
        case "clear":
            out.value = "";
            break;
        case "initialize":
            switch (data.message) {
                case "success":
                    onReplInitialized();
                    break;
                case "fail":
                    onReplInitializeFailed();
                    break;
                case "exit":
                    onReplExit();
            }
            break;
    }
}

function outputOnClick(event) {
    if (out.selectionStart == out.selectionEnd) {
        inp.focus();
    }
}

function moveCursorToEnd() {
    inp.selectionStart = inp.selectionEnd = inp.value.length;
    setTimeout(() => { inp.selectionStart = inp.selectionEnd = 10000; }, 0);
}

function inputOnKeyDown(event) {
    if (event.key == "ArrowUp" && historyIndex > 0) {
        if (historyIndex == history.length) {
            tempHistory = inp.value;
        }
        historyIndex--;
        inp.value = history[historyIndex];
        moveCursorToEnd();
    } else if (event.key == "ArrowDown" && historyIndex < history.length) {
        historyIndex++;
        if (historyIndex == history.length) {
            inp.value = tempHistory;
        } else {
            inp.value = history[historyIndex];
        }
        moveCursorToEnd();
    }

    if (event.key != "Enter")
        return;

    history.push(inp.value);
    historyIndex = history.length;

    let text = inp.value + "\n";
    code += text;
    let multiline = (code.match(/\n/g) || []).length > 1;
    let empty = text.trim().length == 0;
    let continuation = text.trim().endsWith(":");
    inp.value = "";
    write(prompt.value + text);
    if (continuation || (multiline && !empty)) {
        prompt.value = "... ";
    } else if (!multiline || (multiline && empty)) {
        execute(code);
        code = "";
        prompt.value = ">>> ";
    }
}

function enableTabInput(elem) {
    elem.addEventListener("keydown", (event) => {
        if (event.key == "Tab") {
            event.preventDefault();
            let start = elem.selectionStart;
            let end = elem.selectionEnd;

            elem.value = elem.value.substring(0, start) +
                "\t" + elem.value.substring(end);

            elem.selectionStart = start + 1;
            elem.selectionEnd = start + 1;
        }
    });
}

function restartOnClick(event) {
    worker.terminate();
    initialize();
}

function onReplInitialized() {
    out.disabled = false;
    inp.disabled = false;
    prompt.disabled = false;
    restart.disabled = false;
}

function onReplInitializeFailed() {
    restart.disabled = false;
}

function onReplExit() {
    out.disabled = true;
    inp.disabled = true;
    prompt.disabled = true;
    restart.disabled = false;
}

window.onload = () => {
    out = document.getElementById("out");
    inp = document.getElementById("in");
    prompt = document.getElementById("prompt");
    stat = document.getElementById("status");
    restart = document.getElementById("restart");

    out.addEventListener("click", outputOnClick);
    inp.addEventListener("keydown", inputOnKeyDown);
    restart.addEventListener("click", restartOnClick);

    enableTabInput(inp);

    inp.focus();
    
    initialize();
}
