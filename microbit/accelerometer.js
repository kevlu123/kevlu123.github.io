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

        ondevicemotion = this._onMotion.bind(this);
    }
    
    _onMotion(event) {
        this.rawX = ms2ToMilliG(-event.accelerationIncludingGravity.x);
        this.rawY = ms2ToMilliG(event.accelerationIncludingGravity.y);
        this.rawZ = ms2ToMilliG(-event.accelerationIncludingGravity.z);
        if (!this.manual) {
            this.x = this.rawX;
            this.y = this.rawY;
            this.z = this.rawZ;
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

    calibrate() {
        this.invertX = this.rawX > 0;
        this.invertY = this.rawY < 0;
        this.invertZ = this.rawZ > 0;
    }
}

Accelerometer.instance = new Accelerometer();

function ms2ToMilliG(ms2) {
    return ms2 / 9.81 * 1000;
}
