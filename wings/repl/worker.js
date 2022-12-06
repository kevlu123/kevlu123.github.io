importScripts("wings.js");

let initialized = false;

function post(type, message="") {
	postMessage({
        type: type,
        message: message
    });
}

Module.onRuntimeInitialized = () => {
	post("status", "Initializing...");
	if (_OpenRepl() !== 0) {
		post("status", "Failed to initialize");
		post("initialize", "fail");
	} else {
		initialized = true;
		post("status", "Running");
		post("initialize", "success");
	}
};

function onprint() {
	let output = UTF8ToString(_GetStdout());
	post("stdout", output);
}

function clearConsole() {
	post("clear");
}

onmessage = (event) => {
	if (!initialized) {
		return;
	}
	
	let code = event.data.code;
	let ptr = allocateUTF8(code);
	_Execute(ptr);
	_free(ptr);

	if (_ShouldExit()) {
		_CloseRepl();
		initialized = false;
		post("status", "Exited");
		post("initialize", "exit");
	}
};
