
export class LiveCanvasBackend {
    /*
     * Constructs a LiveCanvasBackend object to manage the canvas logic.
     * 
     * @param colCount The number of columns of the canvas.
     * @param rowCount The number of rows of the canvas.
     */
    constructor(colCount, rowCount) {
        this.colCount = colCount;
        this.rowCount = rowCount;
        this.bufferLen = colCount * rowCount;
        this.buffer = Array.from(Array(colCount * rowCount), () => 0xFFFFFFFF);
    }

    /*
     * Loads the canvas state from a Buffer object.
     *
     * @param data A Buffer object containing the serialized state.
     * @return A boolean indicating success.
     */
    deserialize(data) {
        if (data.constructor !== Buffer)
            return false;

        if (data.length !== this.bufferLen * 4)
            return false;

        this.buffer = [];
        for (let i = 0; i < this.bufferLen * 4; i += 4) {
            this.buffer.push(data.readUInt32LE(i));
        }
        return true;
    }

    /*
     * Saves the canvas state to a Buffer object.
     *
     * @return A Buffer object containing the serialized state.
     */
    serialize() {
        let data = Buffer.alloc(this.bufferLen * 4);
        for (let i = 0; i < this.bufferLen; i++) {
            let b = this.buffer[i];
            data[4 * i + 0] = (b & 0xFF);
            data[4 * i + 1] = ((b >> 8) & 0xFF);
            data[4 * i + 2] = ((b >> 16) & 0xFF);
            data[4 * i + 3] = ((b >> 24) & 0xFF);
        }
        return data;
    }

    /*
     * Updates the canvas state and returns a JSON string to
     * be sent to all connected clients including the client
     * that this message was received from.
     *
     * @param message A string containing the data received by a websocket.
     * @return A JSON string or null if the message is invalid.
     */
    update(message) {
        let changes;
        try {
            changes = JSON.parse(message);
        } catch (e) {
            return null;
        }

        if (changes.constructor !== Array)
            return null;

        function isInt(n) {
            return n !== null && n.constructor === Number && n === parseInt(n, 10);
        }

        for (let change of changes) {
            if (typeof change !== "object" || change === null)
                return null;
            
            if (!change.hasOwnProperty("c"))
                return null;
            else if (!isInt(change.c))
                return null;
            else if (change.c < 0 || change.c > 0xFFFFFFFF)
                return null;

            if (!change.hasOwnProperty("p"))
                return null;
            else if (!isInt(change.p))
                return null;
            else if (change.p < 0 || change.p >= this.bufferLen)
                return null;
        }

        for (let change of changes) {
            this.buffer[change.p] = change.c;
        }
        return JSON.stringify(changes);
    }

    /*
     * Gets the state of the entire canvas as a JSON string.
     * This can be sent to a client to initialize their canvas
     * when they connect.
     *
     * @return A JSON string containing the entire canvas state.
     */
    getCanvasState() {
        let changes = [];
        for (let i = 0; i < this.bufferLen; i++) {
            changes.push({
                "c": this.buffer[i],
                "p": i,
            });
        }
        return JSON.stringify(changes);
    }

    /*
     * Gets the canvas dimensions as a JSON string.
     * This should be sent to a client to initialize their
     * canvas dimensions when they connect. This must
     * be the first message sent to a client.
     *
     * @return A JSON string containing the entire canvas dimensions.
     */
    getDimensions() {
        return `[${this.colCount},${this.rowCount}]`
    }
}
