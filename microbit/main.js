class Program {
    constructor() {
        // Get html elements
        this.outputElement = document.getElementById("out");
        this.codeElement = document.getElementById("code");
        this.autoAccElement = document.getElementById("auto-acc");
        this.invertAccXElement = document.getElementById("invert-x");
        this.invertAccYElement = document.getElementById("invert-y");
        this.invertAccZElement = document.getElementById("invert-z");
        this.accXElement = document.getElementById("acc-x");
        this.accYElement = document.getElementById("acc-y");
        this.accZElement = document.getElementById("acc-z");
        this.startstopElement = document.getElementById("startstop");
        this.calibrateElement = document.getElementById("calibrate");
        this.micSensitivityElement = document.getElementById("mic-sensitivity");
        this.micSensitivityLabelElement = document.getElementById("mic-sensitivity-label");
        this.microbitSvg = document.getElementById("microbit");

        // Override console.log to also print to the output textarea
        let oldLog = console.log;
        let divLog = this.outputElement;
        divLog.value = "";
        console.log = text => {
            oldLog(text);
            let autoScroll = Math.abs(divLog.scrollTop + divLog.clientHeight - divLog.scrollHeight) < 10;
            divLog.value += text;
            if (autoScroll) {
                divLog.scrollTop = divLog.scrollHeight;
            }
        };
        this.enableTextAreaTabs();

        // Show default code
        if (!this.codeElement.value) {
            this.setPreset(battleshipsCode);
        }
        
        // Enable device accelerometer if on mobile
        this.autoAccElement.checked = this.isMobile();
        this.onAutoAccelerationClicked(this.autoAccElement.checked);

        // Show error if cross-origin isolation is not enabled
        if (!crossOriginIsolated) {
            this.startstopElement.disabled = true;
            this.startstopElement.style.textDecoration = "line-through";
            document.getElementById("no-coi").hidden = false;
        }
        
        // Initialize microbit
        this.microbit = new Microbit(this.microbitSvg);
        this.lastMicReadTime = 0;

        // Initialize web worker properties
        this.worker = null;
        this.sab_buffer = null;
        this.sab = null;

        // Start main loop
        this.intervalId = setInterval(this.loop.bind(this), 20);
    }

    startstop() {
        if (this.isRunning()) {
            this.stop();
        } else {
            this.start();
        }
    }

    start() {
        this.startstopElement.innerHTML = "Stop";
        this.microbit = new Microbit(this.microbitSvg);
        this.worker = new Worker("worker.js");
        this.worker.onmessage = this.onMessage.bind(this);
        this.sab_buffer = new SharedArrayBuffer(1024);
        this.sab = new Int32Array(this.sab_buffer);
        this.sendState();
    }

    stop() {
        this.worker.terminate();
        this.worker = null;
        this.startstopElement.innerHTML = "Run";
    }

    isRunning() {
        return this.worker !== null;
    }

    loop() {
        if (this.isRunning()) {
            this.microbit.render();
            this.sendState();
        }

        Accelerometer.instance.axisMap.invertX = this.invertAccXElement.checked;
        Accelerometer.instance.axisMap.invertY = this.invertAccYElement.checked;
        Accelerometer.instance.axisMap.invertZ = this.invertAccZElement.checked;
        Accelerometer.instance.manual = !this.autoAccElement.checked;
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
        this.setAccelerometerLabel("x", this.accXElement.value);
        this.setAccelerometerLabel("y", this.accYElement.value);
        this.setAccelerometerLabel("z", this.accZElement.value);
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
        state.mic_vol = Math.max(0, Math.min(255, state.mic_vol * this.micSensitivityElement.value));
        let json = JSON.stringify(state);
        
        Atomics.store(this.sab, 0, 0);
        this.sab.set(new TextEncoder().encode(json), 1);
        this.sab[json.length + 1] = 0; // null-terminate
        Atomics.store(this.sab, 0, 1);
        Atomics.notify(this.sab, 0);
    }

    onAutoAccelerationClicked(checked) {
        this.calibrateElement.disabled = !checked;
        this.invertAccXElement.disabled = !checked;
        this.invertAccYElement.disabled = !checked;
        this.invertAccZElement.disabled = !checked;
        this.accXElement.disabled = checked;
        this.accYElement.disabled = checked;
        this.accZElement.disabled = checked;
    }
    
    isMobile() {
        return navigator.userAgent.match(/Android/i)
            || navigator.userAgent.match(/BlackBerry/i)
            || navigator.userAgent.match(/iPhone|iPad|iPod/i)
            || navigator.userAgent.match(/Opera Mini/i)
            || navigator.userAgent.match(/IEMobile/i)
            || navigator.userAgent.match(/WPDesktop/i);
    }

    clearOutput() {
        this.outputElement.value = "";
    }

    setPreset(code) {
        this.codeElement.value = code;
    }

    // https://stackoverflow.com/questions/6637341/use-tab-to-indent-in-textarea
    enableTextAreaTabs() {
        this.outputElement.onkeydown = function(e) {
            if(e.key == "Tab" && !e.shiftKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                let s = this.selectionStart;
                this.value = this.value.substring(0,this.selectionStart) + "\t" + this.value.substring(this.selectionEnd);
                this.selectionEnd = s + 1; 
            }
        }
    }
    
    showDiff() {
        document.getElementById("diff").hidden = false;
        document.getElementById("show-diff").remove();
    }

    setMicSensitivityLavel(value) {
        this.micSensitivityLabelElement.textContent = "Microphone sensitivity (" + value + ")";
    }
    
    setAccelerometerLabel(axis, value) {
        let text = "Accelerometer " + axis.toUpperCase() + " (" + value + ")";
        document.getElementById("acc-label-" + axis).textContent = text;
    }

    calibrateAccelerometer() {
        let newConfig = {};
        alert("Hold your device so that the bottom of the screen points toward the ground, then press OK.");
        setTimeout(() => {
            [newConfig.y, newConfig.invertY] = Accelerometer.instance.getExtremeAxis();
            alert("Hold your device so that the left side of the screen points toward the ground, then press OK.");
            setTimeout(() => {
                [newConfig.x, newConfig.invertX] = Accelerometer.instance.getExtremeAxis();
                alert("Lay your device flat with the screen facing towards the sky, then press OK.");
                setTimeout(() => {
                    [newConfig.z, newConfig.invertZ] = Accelerometer.instance.getExtremeAxis();

                    if (newConfig.x === newConfig.y
                        || newConfig.x === newConfig.z
                        || newConfig.y === newConfig.z)
                    {
                        alert("Calibration failed. Please try again.");
                        return;
                    }

                    Accelerometer.instance.axisMap = newConfig;
                    document.getElementById("invert-x").checked = newConfig.invertX;
                    document.getElementById("invert-y").checked = newConfig.invertY;
                    document.getElementById("invert-z").checked = newConfig.invertZ;
                    alert("Calibration complete.");
                }, 500);
            }, 500);
        }, 500);
    }
}

let program = null;
window.onload = function() {
    program = new Program();
};
