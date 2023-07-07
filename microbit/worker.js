importScripts("wings.js");

Module.onRuntimeInitialized = () => {
    postMessage({
        type: "ready"
    })
};

function onPrint() {
	let output = UTF8ToString(_GetStdout());
    postMessage({
        type: "out",
        message: output
    });
}

function usingString(str, func) {
    let ptr = allocateUTF8(str);
    try {
        func(ptr);
    } finally {
        _free(ptr);
    }
}

let a_press_count = 0;
let b_press_count = 0;

function read_sab(attr) {
    while (true) {
        let json = "";
        try {
            while (Atomics.wait(sab, 0, 0) !== "not-equal") { }
            for (let i = 1; sab[i]; i++) {
                json += String.fromCharCode(sab[i]);
            }
            let obj = JSON.parse(json);

            if (attr === "a_was_pressed") {
                if (a_press_count != obj.a_press_count) {
                    a_press_count = obj.a_press_count;
                    return 1;
                }
                return 0;
            } else if (attr === "b_was_pressed") {
                if (b_press_count != obj.b_press_count) {
                    b_press_count = obj.b_press_count;
                    return 1;
                }
                return 0;
            }

            return obj[attr];
        } catch (e) {
            console.log(`Race condition: json=${json} error=${e}`);
        }
    }
}

let sab = null;

onmessage = (event) => {
    console.log(event.data);
    switch (event.data.type) {
    case "execute":
        sab = new Int32Array(event.data.sab);
        let code = event.data.code;
        try {
            usingString(code, _Execute);
        } catch (e) {
            postMessage({
                type: "error",
                message: e.toString() + "\n"
            });
        }
        break;
    }
};
