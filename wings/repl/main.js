let worker;

let inp;
let out;
let stat;
let restart;

let code;
let ps;

function initialize() {
    worker = new Worker("worker.js");
    worker.onmessage = workerOnMessage;

    code = "";
    ps = ">";
    
    out.value = "";
    inp.value = "";
    
    out.disabled = true;
    inp.disabled = true;
    restart.disabled = true;
}

function execute(code) {
    worker.postMessage({ code: code });
}

function write(text) {
    let out = document.getElementById("out");
    let scroll = out.scrollHeight - out.scrollTop === out.clientHeight;
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
            stat.innerText = "Status: " + data.message;
            break;
        case "initialize":
            if (data.message === "fail") {
                onReplInitializeFailed();
            } else {
                onReplInitialized();
            }
            break;
    }
}

function outputOnClick(event) {
    inp.focus();
}

function inputOnInput(event) {
}

function inputOnKeyDown(event) {
    if (event.key !== "Enter")
        return;

    let text = inp.value + "\n";
    write(ps.repeat(3) + " " + text);
    code += text
    if (text.trim().endsWith(":")) {
        ps = ".";
        inp.value = "";
    } else {
        execute(code);
        code = "";
        inp.value = "";
        ps = ">";
    }
}

function restartOnClick(event) {
    worker.terminate();
    initialize();
}

function onReplInitialized() {
    out.disabled = false;
    inp.disabled = false;
    restart.disabled = false;
}

function onReplInitializeFailed() {
    restart.disabled = false;
}

window.onload = () => {
    out = document.getElementById("out");
    inp = document.getElementById("in");
    stat = document.getElementById("status");
    restart = document.getElementById("restart");

    out.onclick = outputOnClick;
    inp.oninput = inputOnInput;
    inp.onkeydown = inputOnKeyDown;
    restart.onclick = restartOnClick;

    initialize();
}
