class Program {
    constructor() {
        let svg = document.getElementById("microbit");
        this.microbit = new Microbit(svg);

        this.codeElement = document.getElementById("code");
        this.autoAccElement = document.getElementById("auto-acc");
        this.invertAccXElement = document.getElementById("invert-x");
        this.invertAccYElement = document.getElementById("invert-y");
        this.invertAccZElement = document.getElementById("invert-z");
        this.accXElement = document.getElementById("acc-x");
        this.accYElement = document.getElementById("acc-y");
        this.accZElement = document.getElementById("acc-z");

        this.worker = new Worker("worker.js");
        this.worker.onmessage = this.onMessage.bind(this);
        this.sab_buffer = new SharedArrayBuffer(1024);
        this.sab = new Int32Array(this.sab_buffer);
        this.sendState();

        this.intervalId = setInterval(this.loop.bind(this), 20);

        this.lastMicReadTime = 0;
    }

    stop() {
        this.worker.terminate();
        clearInterval(this.intervalId);
    }

    loop() {
        this.microbit.render();
        this.sendState();

        Accelerometer.instance.invertX = this.invertAccXElement.checked;
        Accelerometer.instance.invertY = this.invertAccYElement.checked;
        Accelerometer.instance.invertZ = this.invertAccZElement.checked;

        if (!this.autoAccElement.checked) {
            Accelerometer.instance.setManual(
                this.accXElement.value,
                this.accYElement.value,
                this.accZElement.value
            );
        }
        this.accXElement.value = Accelerometer.instance.x;
        this.accYElement.value = Accelerometer.instance.y;
        this.accZElement.value = Accelerometer.instance.z;
        setAccelerometerLabel("x", this.accXElement.value);
        setAccelerometerLabel("y", this.accYElement.value);
        setAccelerometerLabel("z", this.accZElement.value);
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
                console.log(e.data.message);
                break;
            case "error":
                console.log(e.data.message);
                this.microbit.showErrorImage();
                this.microbit.render();
                break;
            case "done":
                startstop();
                break;
            case "call":
                this.microbit[e.data.func](...e.data.args);
                break;
            case "mic_read":
                this.lastMicReadTime = Date.now();
                this.microbit.setMicrophoneLed(true);
                setTimeout(() => {
                    if (Date.now() - this.lastMicReadTime >= 1000) {
                        this.microbit.setMicrophoneLed(false);
                    }
                }, 1000);
                break;
        }
    }

    sendState() {
        let state = this.microbit.getState();
        let json = JSON.stringify(state);
        
        Atomics.store(this.sab, 0, 0);
        this.sab.set(new TextEncoder().encode(json), 1);
        this.sab[json.length + 1] = 0; // null-terminate
        Atomics.store(this.sab, 0, 1);
        Atomics.notify(this.sab, 0);
    }
}
    
function setAccelerometerLabel(axis, value) {
    let text = "Accelerometer " + axis.toUpperCase() + " (" + value + ")";
    document.getElementById("acc-label-" + axis).textContent = text;
}

function calibrateAccelerometer() {
    alert("Hold your device so that the bottom of the screen points toward the ground, then press OK.");
    setTimeout(() => {
        Accelerometer.instance.calibrateAxis("Y");
        alert("Hold your device so that the side of the screen points toward the ground, then press OK.");
        setTimeout(() => {
            Accelerometer.instance.calibrateAxis("X");
            alert("Lay your device flat with the screen facing towards the sky, then press OK.");
            setTimeout(() => {
                Accelerometer.instance.calibrateAxis("Z");
                document.getElementById("invert-x").checked = Accelerometer.instance.invertX;
                document.getElementById("invert-y").checked = Accelerometer.instance.invertY;
                document.getElementById("invert-z").checked = Accelerometer.instance.invertZ;
                alert("Calibration complete.");
            }, 500);
        }, 500);
    }, 500);
    //alert("Hold your device so that the bottom left points toward the ground"
    //    + " while the screen is tilted slightly towards the sky, then press OK.");
    //setTimeout(() => {
    //    Accelerometer.instance.calibrate();
    //    document.getElementById("invert-x").checked = Accelerometer.instance.invertX;
    //    document.getElementById("invert-y").checked = Accelerometer.instance.invertY;
    //    document.getElementById("invert-z").checked = Accelerometer.instance.invertZ;
    //    alert("Calibration complete.");
    //}, 500);
}

function isMobile() {
    return navigator.userAgent.match(/Android/i)
        || navigator.userAgent.match(/BlackBerry/i)
        || navigator.userAgent.match(/iPhone|iPad|iPod/i)
        || navigator.userAgent.match(/Opera Mini/i)
        || navigator.userAgent.match(/IEMobile/i)
        || navigator.userAgent.match(/WPDesktop/i);
}

function setPreset(code) {
    document.getElementById("code").value = code;
}

// https://stackoverflow.com/questions/6637341/use-tab-to-indent-in-textarea
function enableTextAreaTabs() {
    let textareas = document.getElementsByTagName("textarea");
    let count = textareas.length;
    for(let i = 0; i < count; i++){
        textareas[i].onkeydown = function(e) {
            if(e.key == "Tab" && !e.shiftKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                var s = this.selectionStart;
                this.value = this.value.substring(0,this.selectionStart) + "\t" + this.value.substring(this.selectionEnd);
                this.selectionEnd = s+1; 
            }
        }
    }
}

function showDiff() {
    document.getElementById("diff").hidden = false;
    document.getElementById("show-diff").remove();
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
    let oldLog = console.log;
    let divLog = document.getElementById("out");
    console.log = text => {
        oldLog(text);
        let autoScroll = divLog.scrollTop + divLog.clientHeight === divLog.scrollHeight;
        divLog.value += text;
        if (autoScroll) {
            divLog.scrollTop = divLog.scrollHeight;
        }
    };

    enableTextAreaTabs();

    document.getElementById("out").value = "";
    document.getElementById("auto-acc").checked = isMobile();
    if (!document.getElementById("code").value) {
        setPreset(battleshipsCode);
    }

    if (!crossOriginIsolated) {
        document.getElementById("startstop").disabled = true;
        document.getElementById("startstop").style.textDecoration = "line-through";
        document.getElementById("no-coi").hidden = false;
    }
};
