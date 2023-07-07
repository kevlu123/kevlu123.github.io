class Microbit {
    constructor(svg) {
        this._ledStates = new Array(25).fill(0);
        this._ledsElements = svg.querySelector("#LEDsOn").querySelectorAll("use");

        this._micLedState = false;
        this._micElement = svg.querySelector("#LitMicrophone");

        this._buttons = [
            new Button(svg.querySelector("#ButtonA")),
            new Button(svg.querySelector("#ButtonB"))
        ];

        this._accelerometer = new Accelerometer();
    }

    clearDisplay() {
        this._ledStates = new Array(25).fill(0);
    }

    setPixel(x, y, value) {
        this._ledStates[x * 5 + y] = value;
    }

    setMicrophoneLed(on) {
        this._micLedState = on;
    }

    getMicrophoneValue() {
        return 0;
    }

    getState() {
        return {
            acc_x: this._accelerometer.x,
            acc_y: this._accelerometer.y,
            acc_z: this._accelerometer.z,
            a_pressed: this._buttons[0].isPressed(),
            b_pressed: this._buttons[1].isPressed(),
            a_press_count: this._buttons[0].getPressCount(),
            b_press_count: this._buttons[1].getPressCount(),
        };
    }

    render() {
        for (let i = 0; i < 25; i++) {
            let value = this._ledStates[i];
            let led = this._ledsElements[i];
            led.style.display = "inline";
            led.style.opacity = (value / 9).toString();
        }

        this._buttons[0].render();
        this._buttons[1].render();
        
        this._micElement.style.display = this._micLedState ? "unset" : "none";
    }
}

class Button {
    constructor(element) {
        this._element = element;
        this._presses = 0;
        this._mouseDown = false;
        this._presses = 0;
        this._pressCount = 0;
        this._element.setAttribute("role", "button");
        this._element.setAttribute("tabindex", "0");
        this._element.style.cursor = "pointer";
        this.keyListener = (e) => {
            switch (e.key) {
                case "Enter":
                case " ":
                    e.preventDefault();
                    if (e.type === "keydown") {
                        this.press();
                    } else {
                        this.release();
                    }
                    break;
            }
        };
        this.mouseDownListener = (e) => {
            e.preventDefault();
            this._mouseDownTouchStartAction();
        };
        this.touchStartListener = (e) => {
            this._mouseDownTouchStartAction();
        };
        this.mouseUpTouchEndListener = (e) => {
            e.preventDefault();
            if (this._mouseDown) {
                this._mouseDown = false;
                this.release();
            }
        };
        this.mouseLeaveListener = (e) => {
            if (this._mouseDown) {
                this._mouseDown = false;
                this.release();
            }
        };
        this._element.addEventListener("mousedown", this.mouseDownListener);
        this._element.addEventListener("touchstart", this.touchStartListener);
        this._element.addEventListener("mouseup", this.mouseUpTouchEndListener);
        this._element.addEventListener("touchend", this.mouseUpTouchEndListener);
        this._element.addEventListener("keydown", this.keyListener);
        this._element.addEventListener("keyup", this.keyListener);
        this._element.addEventListener("mouseleave", this.mouseLeaveListener);
    }
    
    _setValueInternal(value) {
        if (value) {
            this._pressCount++;
            this._presses++;
        } else if (this._presses) {
            this._presses--;
        }
        //this._render();
    }
    
    _mouseDownTouchStartAction() {
        this._mouseDown = true;
        this.press();
    }

    press() {
        this._wasPressed = true;
        this._setValueInternal(1);
    }

    release() {
        this._setValueInternal(0);
    }

    isPressed() {
        return this._presses;
    }

    getPressCount() {
        return this._pressCount;
    }

    render() {
        const fill = !!this._presses ? "#00c800" : "#000000";
        this._element.querySelectorAll("circle").forEach((c) => {
            c.style.fill = fill;
        });
    }
}

class Accelerometer {
    constructor() {
        // Request permission for iOS 13+ devices
        if (DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === "function") {
            DeviceMotionEvent.requestPermission();
        }
        
        this.x = 0;
        this.y = 0;
        this.z = 0;
        ondevicemotion = this._onMotion.bind(this);
    }
    
    _onMotion(event) {
        this.x = ms2ToMilliG(event.accelerationIncludingGravity.x);
        this.y = ms2ToMilliG(event.accelerationIncludingGravity.y);
        this.z = ms2ToMilliG(event.accelerationIncludingGravity.z);
    }
}

function ms2ToMilliG(ms2) {
    return ms2 / 9.81 * 1000;
}
