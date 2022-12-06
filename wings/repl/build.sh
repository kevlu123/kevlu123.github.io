emcc main.cpp -o wings.js -std=c++20 -O3 -s WASM=1 \
    -s EXPORTED_RUNTIME_METHODS='["allocateUTF8","UTF8ToString"]' \
    -s EXPORTED_FUNCTIONS='["_free", "_OpenRepl", "_CloseRepl", "_GetStdout", "_Execute", "_ShouldExit"]'
