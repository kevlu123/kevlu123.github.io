import { WebSocketServer } from "ws";
import { LiveCanvasBackend } from "./lc-backend.js";
import fs from "fs";

const LC_WIDTH = 512;
const LC_HEIGHT = 512;
const LC_PORT = 5501;
const LC_SAVE_INTERVAL = 15 * 60 * 1000; // Save to disk every 15 minutes

let liveCanvas = new LiveCanvasBackend(LC_WIDTH, LC_HEIGHT);
try {
    let fileData = fs.readFileSync('./pic.bin');
    liveCanvas.deserialize(fileData);
} catch { }

let server = new WebSocketServer({ port: LC_PORT });
let connections = [];
let modified = false;

server.on("connection", socket => {
    socket.on("message", (data, isBinary) => {
        if (isBinary)
            return;
        let broadcastMessage = liveCanvas.update(data.toString());
        if (broadcastMessage !== null)
            for (let connection of connections)
                connection.send(broadcastMessage);
        modified = true;
        return;
    });

    socket.on("close", (_code, _reason) => {
        connections.splice(connections.indexOf(socket), 1);
        console.log("close");
    });

    socket.on("error", _error => {
        connections.splice(connections.indexOf(socket), 1);
        console.log("error");
    });

    socket.send(liveCanvas.getDimensions());
    socket.send(liveCanvas.getCanvasState());
    connections.push(socket);
    console.log("connection");
});

// https://stackoverflow.com/questions/14031763/doing-a-cleanup-action-just-before-node-js-exits
function setExitHandler(callback) {
    // attach user callback to the process event emitter
    // if no callback, it will still exit gracefully on Ctrl-C
    process.on('cleanup', callback);

    // do app specific cleaning before exiting
    process.on('exit', function () {
        process.emit('cleanup');
    });

    // catch ctrl+c event and exit normally
    process.on('SIGINT', function () {
        console.log('Ctrl-C...');
        process.exit(2);
    });

    // catch uncaught exceptions, trace, then exit normally
    process.on('uncaughtException', function (e) {
        console.log('Uncaught Exception...');
        console.log(e.stack);
        process.exit(99);
    });
};

function saveToDisk() {
    if (modified) {
        fs.writeFileSync('./pic.bin', liveCanvas.serialize());
        modified = false;
        console.log("Saved to disk");
    }
}

// Save to disk every 15 minutes
setInterval(saveToDisk, LC_SAVE_INTERVAL);

setExitHandler(saveToDisk);
