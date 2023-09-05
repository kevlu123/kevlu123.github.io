class Accelerometer {
    constructor() {
        if (typeof DeviceMotionEvent === "undefined") {
            console.log("DeviceMotionEvent is not supported. Device accelerometer will not work.");
        } else {
            ondevicemotion = this._onMotion.bind(this);
            // Request permission for iOS 13+ devices
            if (typeof DeviceMotionEvent.requestPermission === "function") {
                DeviceMotionEvent.requestPermission();
            }
        }
        
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.rawX = 0;
        this.rawY = 0;
        this.rawZ = 0;

        this.manual = false;

        this.axisMap = {
            x: "x",
            y: "y",
            z: "z",
            invertX: false,
            invertY: false,
            invertZ: false,
        };
    }
    
    _onMotion(event) {
        let rawX = ms2ToMilliG(event.accelerationIncludingGravity.x);
        let rawY = ms2ToMilliG(event.accelerationIncludingGravity.y);
        let rawZ = ms2ToMilliG(event.accelerationIncludingGravity.z);
        this.rawX = rawX;
        this.rawY = rawY;
        this.rawZ = rawZ;
        if (!this.manual) {
            if (this.axisMap.invertX) rawX *= -1;
            if (this.axisMap.invertY) rawY *= -1;
            if (this.axisMap.invertZ) rawZ *= -1;
            this[this.axisMap.x] = rawX;
            this[this.axisMap.y] = rawY;
            this[this.axisMap.z] = rawZ;
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

    // Gets the most extreme axis and whether it is inverted
    getExtremeAxis() {
        // axis is upper case
        let extreme = Math.max(
            Math.abs(this.rawX),
            Math.abs(this.rawY),
            Math.abs(this.rawZ)
        );
        for (let ax of ["X", "Y", "Z"]) {
            if (Math.abs(this["raw" + ax]) === extreme) {
                return [
                    ax.toLowerCase(),
                    this["raw" + ax] > 0
                ];
            }
        }
    }
}

setTimeout(() => {
try {
    Accelerometer.instance = new Accelerometer();
} catch (e) {
    console.log(e.stack);
}
}, 500);
function ms2ToMilliG(ms2) {
    return ms2 / 9.81 * 1000;
}
