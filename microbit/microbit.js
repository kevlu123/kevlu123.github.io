class Microbit {
    constructor(svg) {
        this._ledStates = new Array(25).fill(0);
        this._lastLedStates = new Array(25).fill(0);
        this._ledsElements = svg.querySelector("#LEDsOn").querySelectorAll("use");

        this._micLedState = false;
        this._micElement = svg.querySelector("#LitMicrophone");

        this.buttons = [
            new Button(svg.querySelector("#ButtonA")),
            new Button(svg.querySelector("#ButtonB"))
        ];
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
            acc_x: Accelerometer.instance.x,
            acc_y: Accelerometer.instance.y,
            acc_z: Accelerometer.instance.z,
            a_pressed: this.buttons[0].isPressed(),
            b_pressed: this.buttons[1].isPressed(),
            a_press_count: this.buttons[0].getPressCount(),
            b_press_count: this.buttons[1].getPressCount(),
            mic_vol: Microphone.instance.volume,
        };
    }

    render() {
        for (let i = 0; i < 25; i++) {
            let value = Math.max(this._lastLedStates[i], this._ledStates[i]); // Reduce flickering
            let led = this._ledsElements[i];
            led.style.display = "inline";
            led.style.opacity = (value / 9).toString();
        }
        this._lastLedStates = this._ledStates.slice();

        this.buttons[0].render();
        this.buttons[1].render();
        
        this._micElement.style.display = this._micLedState ? "unset" : "none";
    }

    showErrorImage() {
        this.clearDisplay();
        this._ledStates = [
            0, 0, 0, 0, 9,
            9, 9, 0, 9, 0,
            0, 0, 0, 9, 0,
            9, 9, 0, 9, 0,
            0, 0, 0, 0, 9,
        ];
        this._lastLedStates = [
            0, 0, 0, 0, 9,
            9, 9, 0, 9, 0,
            0, 0, 0, 9, 0,
            9, 9, 0, 9, 0,
            0, 0, 0, 0, 9,
        ];
    }
}

class Button {
    constructor(element) {
        this._element = element;
        this._presses = 0;
        this._mouseDown = false;
        this._presses = 0;
        this._pressCount = 0;
        //this._element.setAttribute("role", "button");
        //this._element.setAttribute("tabindex", "0");
        //this._element.style.cursor = "pointer";
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
    
    _mouseDownTouchStartAction() {
        this._mouseDown = true;
        this.press();
    }

    press() {
        this._wasPressed = true;
        this._isPressed = true;
        this._pressCount++;
    }

    release() {
        this._isPressed = false;
    }

    isPressed() {
        return this._isPressed;
    }

    getPressCount() {
        return this._pressCount;
    }

    render() {
        const fill = this._isPressed ? "#00c800" : "#000000";
        this._element.querySelectorAll("circle").forEach((c) => {
            c.style.fill = fill;
        });
    }
}
