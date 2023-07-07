class Program {
    constructor() {
        let svg = document.getElementById("microbit");
        this.microbit = new Microbit(svg);
        this.codeElement = document.getElementById("code");
        this.outputElement = document.getElementById("out");
        this.manualAccElement = document.getElementById("manual-acc");
        this.invertAccXElement = document.getElementById("invert-x");
        this.invertAccYElement = document.getElementById("invert-y");
        this.invertAccZElement = document.getElementById("invert-z");
        this.manualAccXElement = document.getElementById("acc-x");
        this.manualAccYElement = document.getElementById("acc-y");
        this.manualAccZElement = document.getElementById("acc-z");

        this.worker = new Worker("worker.js");
        this.worker.onmessage = this.onMessage.bind(this);
        this.sab_buffer = new SharedArrayBuffer(1024);
        this.sab = new Int32Array(this.sab_buffer);
        this.sendState();

        this.intervalId = setInterval(this.loop.bind(this), 17);
    }

    stop() {
        this.worker.terminate();
        clearInterval(this.intervalId);
    }

    loop() {
        this.microbit.render();
        this.sendState();
    }

    log(text) {
        this.outputElement.value += text;
    }

    onMessage(e) {
        switch (e.data.type) {
            case "ready":
                this.worker.postMessage({
                    type: "execute",
                    code: this.codeElement.value,
                    sab: this.sab_buffer,
                });
                break;
            case "out":
            case "error":
                this.log(e.data.message);
                break;
            case "call":
                this.microbit[e.data.func](...e.data.args);
                break;
        }
    }

    sendState() {
        let state = this.microbit.getState();
        if (this.manualAccElement.checked) {
            state.acc_x = this.manualAccXElement.value;
            state.acc_y = this.manualAccYElement.value;
            state.acc_z = this.manualAccZElement.value;
        }
        if (this.invertAccXElement.checked) state.acc_x *= -1;
        if (this.invertAccYElement.checked) state.acc_y *= -1;
        if (this.invertAccZElement.checked) state.acc_z *= -1;
        let json = JSON.stringify(state);
        
        Atomics.store(this.sab, 0, 0);
        this.sab.set(new TextEncoder().encode(json), 1);
        this.sab[json.length + 1] = 0; // null-terminate
        Atomics.store(this.sab, 0, 1);
        Atomics.notify(this.sab, 0);
    }
}
    
function setAccelerometer(axis, value) {
    let text = "Accelerometer " + axis.toUpperCase() + " (" + value + ")";
    document.getElementById("acc-label-" + axis).textContent = text;
}

function isMobile() {
    return navigator.userAgent.match(/Android/i)
        || navigator.userAgent.match(/BlackBerry/i)
        || navigator.userAgent.match(/iPhone|iPad|iPod/i)
        || navigator.userAgent.match(/Opera Mini/i)
        || navigator.userAgent.match(/IEMobile/i)
        || navigator.userAgent.match(/WPDesktop/i);
}

let prog = null;
function startstop() {
    let btn = document.getElementById("startstop");
    if (prog) {
        prog.stop();
        btn.innerHTML = "Run";
        prog = null;
    } else {
        btn.innerHTML = "Stop";
        prog = new Program();
    }
}

window.onload = function() {
    console.log = (function (old_function, div_log) { 
        return function (text) {
            old_function(text);
            div_log.value += text;
        };
    } (console.log.bind(console), document.getElementById("out")));

    document.getElementById("code").value = defaultCode;
    document.getElementById("out").value = "";
    document.getElementById("manual-acc").checked = !isMobile();

    if (!crossOriginIsolated) {
        document.getElementById("startstop").disabled = true;
        document.getElementById("startstop").style.textDecoration = "line-through";
        document.getElementById("no-coi").hidden = false;
    }
};
