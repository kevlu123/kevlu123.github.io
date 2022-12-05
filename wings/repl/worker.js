importScripts("wings.js");

let initialized = false;

function post(type, message="") {
	postMessage({
        type: type,
        message: message
    });
}

Module.onRuntimeInitialized = () => {
	post("status", "Initializing...\n");
	if (_OpenRepl() !== 0) {
		post("status", "Failed to initialize\n");
		post("initialize", "fail");
	} else {
		initialized = true;
		post("status", "Running\n");
		post("initialize", "success");
	}
};

onmessage = (event) => {
	if (!initialized) {
		return;
	}
	
	let code = event.data.code;
	let ptr = allocateUTF8(code);
	_Execute(ptr);
	_free(ptr);
	
	let output = UTF8ToString(_GetStdout());
	post("stdout", output);
	_ClearStdout();
};
