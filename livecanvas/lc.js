/**
 * JSON message format
 * 
 * [
 *   { "c": c, "p": y*w+x },
 *   ...
 * ]
*/

function lcLog(text) {
    //console.log(text);
    //let elem = document.getElementById("log");
    //if (elem.textContent.length > 1000)
    //    elem.textContent = "";
    //elem.textContent += text + "\n";
}

function lcIsInt(n) {
    return n === parseInt(n, 10);
}

function lcRgb(n) {
    return "#" + n.toString(16).padStart(8, "0");
}

class LCSocket {
    constructor(socketAddress) {
        this.rowCount = null;
        this.colCount = null;
        this.socketAddress = socketAddress;
        this.socket = new WebSocket(socketAddress);
        this.socket.onopen = this._onOpen.bind(this);
        this.socket.onmessage = this._onMessage.bind(this);
        this.socket.onclose = this._onClose.bind(this);
        this.socket.onerror = this._onError.bind(this);

        this.onOpen = null;
        this.onClose = null;
        this.onError = null;
        this.onFirstFrame = null;
        this.onPixelReceived = null;
        
        this.sendBuffer = [];
        this.sendByteRate = 0;
        this.recvByteRate = 0;
        this.sendByteCount = 0;
        this.recvByteCount = 0;
        this.byteRateTimerID = setInterval(this._onByteRateTimer.bind(this), 1000);
    }

    _onByteRateTimer() {
        this.sendByteRate = this.sendByteCount;
        this.recvByteRate = this.recvByteCount;
        this.sendByteCount = 0;
        this.recvByteCount = 0;
    }

    _onOpen() {
        this.onOpen?.();
    }

    _onClose(e) {
        this.onClose?.(e, this.socketAddress);
    }

    _onError(e) {
        this.onError?.(e, this.socketAddress);
    }

    dispose() {
        clearInterval(this.byteRateTimerID);
    }

    getSendByteRate() {
        return this.sendByteRate;
    }

    getRecvByteRate() {
        return this.recvByteRate;
    }

    getRowCount() {
        return this.rowCount;
    }

    getColCount() {
        return this.colCount;
    }

    send(p, c) {
        this.sendBuffer.push({ p: p, c: c });
    }

    flush() {
        if (this.sendBuffer.length > 0) {
            let data = JSON.stringify(this.sendBuffer);
            this.sendBuffer = [];
            this.socket.send(data);
            this.sendByteCount += data.length;
        }
    }

    _onMessage(e) {
        lcLog(`Socket recv.`);
        this.recvByteCount += e.data.length;

        let changes = JSON.parse(e.data);
        if (changes.constructor !== Array) {
            lcLog("Invalid message from server: root JSON element is not an array.");
            return;
        }

        // Initialize dimensions
        if (changes.length === 2 && (lcIsInt(changes[0]) && lcIsInt(changes[1]))) {
            this.colCount = changes[0];
            this.rowCount = changes[1];
            return;
        } else if (this.rowCount === null) {
            lcLog("Invalid message from server: dimensions not set.");
            return;
        } 

        for (let change of changes) {
            if (typeof change !== "object" || change === null) {
                lcLog("Invalid message from server: array element is not an object.");
                return;
            }
            
            if (!change.hasOwnProperty("c")) {
                lcLog("Invalid message from server: object missing attribute 'c'.");
                return;
            } else if (!lcIsInt(change.c)) {
                lcLog("Invalid message from server: attribute 'c' is not an integer.");
                return;
            } else if (change.c < 0 || change.c > 0xFFFFFFFF) {
                lcLog("Invalid message from server: attribute 'c' is out of range.");
                return;
            }

            if (!change.hasOwnProperty("p")) {
                lcLog("Invalid message from server: object missing attribute 'p'.");
                return;
            } else if (!lcIsInt(change.p)) {
                lcLog("Invalid message from server: attribute 'p' is not an integer.");
                return;
            }
        }

        // Received full frame
        if (changes.length === this.colCount * this.rowCount) {
            this.onFirstFrame?.();
        }

        for (let change of changes) {
            let colour = lcRgb(change.c);
            let pos = change.p;
            let x = pos % this.colCount;
            let y = Math.floor(pos / this.colCount);
            this.onPixelReceived?.(x, y, colour);
        }
    }
}

class LCInstance {
    static run(lcElem, socketAddress) {
        return new LCInstance(lcElem, socketAddress);
    }

    constructor(lcElem, socketAddress) {
        let canvas = lcElem.getElementsByTagName("canvas")[0];
        this.colCount = 512;
        this.rowCount = 512;
        this.screenBuffer = [];
        this.cursorX = 0;
        this.cursorY = 0;
        this.canvas = canvas;
        this.canvasSize = [-1, -1];
        this.ctx = canvas.getContext("2d");
        this.mouseButtonState = 0;
        this.brushColour = lcRgb(0x000000FF);
        this.brushRadius = 3;
        this.lastCursorCellPos = null;
        this.enabled = false;
        this.connectionError = false;
        this.connectionErrorAddress = null;
        this.socketAddress = socketAddress;
        
        this.connectSocket();

        this.registerCallbacks();

        setInterval(this.onUpdate.bind(this), 16);
    }

    setSocketAddress(socketAddress) {
        this.socketAddress = socketAddress;
    }

    registerCallbacks() {
        document.body.addEventListener("mousemove", function(e) { 
            this.cursorX = e.clientX - this.canvas.offsetLeft; 
            this.cursorY = e.clientY - this.canvas.offsetTop;
        }.bind(this));
        document.body.addEventListener("touchmove", function(e) {
            let touch = e.touches.item(0);
            this.cursorX = touch.clientX - this.canvas.offsetLeft;
            this.cursorY = touch.clientY - this.canvas.offsetTop;
            e.preventDesult();
        }.bind(this));

        document.body.addEventListener("mousedown", function(e) {
            if (e.button === 0) {
                this.mouseButtonState++;
            }
        }.bind(this));
        document.body.addEventListener("touchstart", function() {
            // Little hack to prevent the touchstart event
            // from being fired before the touchmove
            setTimeout(function(){
                this.mouseButtonState++;
            }.bind(this), 10);
        }.bind(this));

        document.body.addEventListener("mouseup", function(e) {
            if (e.button === 0) {
                this.mouseButtonState--;
            }
        }.bind(this));
        document.body.addEventListener("touchend", function() {
            setTimeout(function(){
                this.mouseButtonState--;
            }.bind(this), 10);
        }.bind(this));
        document.body.addEventListener("touchcancel", function() {
            setTimeout(function(){
                this.mouseButtonState--;
            }.bind(this), 10);
        }.bind(this));

        this.canvas.onclick = function() {
            if (this.connectionError) {
                this.connectSocket();
            }
        }.bind(this);
        
        let self = this;
        let buttons = document.getElementsByClassName("lc-button");
        buttons[0].setAttribute("data-lc-selected", "true");
        for (let btn of buttons) {
            let colour = btn.getAttribute("data-lc-colour");
            btn.style["background-color"] = colour;
            btn.onclick = () => {
                self.setBrushColour(colour);
                btn.setAttribute("data-lc-selected", "true");
                for (let otherBtn of buttons)
                    if (otherBtn !== btn)
                        otherBtn.removeAttribute("data-lc-selected");
            };
        }
    }

    clearScreenBuffer() {
        this.screenBuffer = Array.from(
            Array(this.colCount * this.rowCount),
            () => null
        );
    }

    setBrushColour(colour) {
        this.brushColour = colour;
    }

    onUpdate() {
        let size = [
            parseInt(window.getComputedStyle(this.canvas).width),
            parseInt(window.getComputedStyle(this.canvas).height)
        ];

        if (size[0] !== this.canvasSize[0] || size[1] !== this.canvasSize[1]) {
            this.canvasSize = size;
            // This sets the coordinate space of the canvas,
            // NOT the css size of the canvas.
            this.canvas.setAttribute("width", size[0]);
            this.canvas.setAttribute("height", size[1]);
            this.rerender();
        }

        if (this.connectionError) {
            this.displayConnectionError();
            return;
        } else if (!this.enabled) {
            this.displayLoadingScreen();
            return;
        }

        let cellPos = this.getCursorCellPosition();
        if (cellPos && this.mouseButtonState) {
            if (this.lastCursorCellPos !== null) {
                // Continue line
                this.drawLine(...cellPos, ...this.lastCursorCellPos, this.brushRadius, this.brushColour);
            } else {
                // Begin draw
                this.drawCircle(...cellPos, this.brushRadius, this.brushColour);
            }
            this.lastCursorCellPos = cellPos;
        } else {
            // Mouse not down
            this.lastCursorCellPos = null;
        }

        this.lcsocket.flush();

        lcLog(`send ${this.lcsocket.getSendByteRate()} recv ${this.lcsocket.getRecvByteRate()}`);
    }

    getCursorCellPosition() {
        let hovering = this.cursorX >= 0
            && this.cursorY >= 0
            && this.cursorX < this.canvasSize[0]
            && this.cursorY < this.canvasSize[1];

        if (hovering) {
            return [
                Math.floor(this.cursorX / (this.canvasSize[0] / this.colCount)),
                Math.floor(this.cursorY / (this.canvasSize[1] / this.rowCount)),
            ];
        } else {
            return null;
        }
    }

    rerender() {
        for (let i = 0; i < this.screenBuffer.length; i++) {
            let x = i % this.colCount;
            let y = Math.floor(i / this.colCount);
            this.setPixel(x, y, this.screenBuffer[i])
        }
    }

    setPixel(x, y, colour="#000000ff") {
        let cellW = this.canvasSize[0] / this.colCount;
        let cellH = this.canvasSize[1] / this.rowCount;

        let left = Math.floor(x * cellW);
        let top = Math.floor(y * cellH);
        let right = Math.floor((x + 1) * cellW);
        let bottom = Math.floor((y + 1) * cellH);
        
        this.ctx.fillStyle = colour;
        this.ctx.fillRect(
            left,
            top,
            right - left,
            bottom - top
        );
    }

    drawPixel(x, y, c, broadcast=true) {
        if (this.isInBounds(x, y) && this.screenBuffer[y * this.colCount + x] !== c) {
            this.setPixel(x, y, c)
            this.screenBuffer[y * this.colCount + x] = c;

            if (broadcast) {
                this.lcsocket.send(
                    y * this.colCount + x,
                    parseInt(c.substring(1), 16)
                );
            }
        }
    }

    drawLine(x0, y0, x1, y1, thickness, c) {
        let dx = Math.abs(x1 - x0);
        let dy = Math.abs(y1 - y0);
        let sx = (x0 < x1) ? 1 : -1;
        let sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;

        while(true) {
            this.drawCircle(x0, y0, thickness, c)
            if (x0 === x1 && y0 === y1) break;
            let e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }
    }

    drawCircle(x, y, r, c) {
        for(let dy = -r; dy <= r; dy++)
            for(let dx = -r; dx <= r; dx++)
                if(dx * dx + dy * dy < r * r)
                    this.drawPixel(x + dx, y + dy, c);
    }

    isInBounds(x, y) {
        return x >= 0
            && y >= 0
            && x < this.colCount
            && y < this.rowCount;
    }

    displayText(text) {
        this.ctx.fillStyle = "#ffffffff";
        this.ctx.clearRect(0, 0, ...this.canvasSize);
        
        let minSize = Math.min(...this.canvasSize);
        this.ctx.fillStyle = "#000000ff";
        this.ctx.font = "bold " + (minSize / 45).toString()
            + "px Segoe UI, Tahoma, Geneva, Verdana, sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.fillText(text, minSize / 2, minSize / 2);
    }

    displayLoadingScreen() {
        this.displayText("Loading...");
    }

    displayConnectionError() {
        this.displayText(
            "Cannot connect to \"" + this.connectionErrorAddress
            + "\". The server may be down. Click to retry."
        );
    }

    connectSocket() {
        this.connectionError = false;
        this.lcsocket?.dispose();
        this.lcsocket = null;
        try {
            this.lcsocket = new LCSocket(this.socketAddress);
            this.lcsocket.onOpen = this.onSocketOpen.bind(this);
            this.lcsocket.onClose = this.onSocketClose.bind(this);
            this.lcsocket.onError = this.onSocketError.bind(this);
            this.lcsocket.onFirstFrame = this.onSocketFirstFrame.bind(this);
            this.lcsocket.onPixelReceived = this.onSocketPixelReceived.bind(this);
        } catch (e) {
            this.onSocketError(e, this.socketAddress);
        }
    }

    onSocketOpen(e) {
        lcLog("Socket opened.");
    }

    onSocketClose(e, address) {
        this.enabled = false;
        this.connectionError = true;
        this.connectionErrorAddress = address;
        if (e.wasClean) {
            lcLog(`Socket closed: code=${e.code} reason=${e.reason}`);
        } else {
            lcLog("Socket forcefully closed.");
        }
    }

    onSocketError(e, address) {
        this.enabled = false;
        this.connectionError = true;
        this.connectionErrorAddress = address;
        lcLog(`Socket error: ${e.message}`);
    }

    onSocketFirstFrame() {
        this.enabled = true;
        this.clearScreenBuffer();
        this.rowCount = this.lcsocket.getRowCount();
        this.colCount = this.lcsocket.getColCount();
    }

    onSocketPixelReceived(x, y, colour) {
        this.drawPixel(x, y, colour, false);
    }
}
