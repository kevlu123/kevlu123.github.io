class Accelerometer {
    constructor() {
        // Request permission for iOS 13+ devices
        if (DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === "function") {
            DeviceMotionEvent.requestPermission();
        }
        
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.rawX = 0;
        this.rawY = 0;
        this.rawZ = 0;
        this.invertX = false;
        this.invertY = false;
        this.invertZ = false;

        this.manual = false;

        this._axisMap = {
            "x": "x",
            "x": "y",
            "z": "z",
        };

        ondevicemotion = this._onMotion.bind(this);
    }
    
    _onMotion(event) {
        this.rawX = ms2ToMilliG(event.accelerationIncludingGravity.x);
        this.rawY = ms2ToMilliG(event.accelerationIncludingGravity.y);
        this.rawZ = ms2ToMilliG(event.accelerationIncludingGravity.z);
        if (!this.manual) {
            this[this._axisMap["x"]] = this.rawX;
            this[this._axisMap["y"]] = this.rawY;
            this[this._axisMap["z"]] = this.rawZ;
            if (this.invertX) this.x *= -1;
            if (this.invertY) this.y *= -1;
            if (this.invertZ) this.z *= -1;
        }
    }

    setManual(x, y, z) {
        this.rawX = x;
        this.rawY = y;
        this.rawZ = z;
        this.x = x;
        this.y = y;
        this.z = z;
    }

    //calibrate() {
    //    this.invertX = this.rawX > 0;
    //    this.invertY = this.rawY < 0;
    //    this.invertZ = this.rawZ > 0;
    //}

    calibrateAxis(axis) {
        // axis is upper case
        let extreme = Math.min(
            Math.abs(this.rawX),
            Math.abs(this.rawY),
            Math.abs(this.rawZ)
        );
        for (let ax of ["X", "Y", "Z"]) {
            if (this["raw" + ax] === extreme) {
                this._axisMap[axis.toLowerCase()] = ax.toLowerCase();
                this["invert" + ax] = this["raw" + ax] > 0;
                return;
            }
        }
    }
}

Accelerometer.instance = new Accelerometer();

function ms2ToMilliG(ms2) {
    return ms2 / 9.81 * 1000;
}
