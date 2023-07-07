emcc wings.cpp -o wings.js -std=c++20 -O3 -s WASM=1 \
    -s TOTAL_MEMORY=64MB \
    -s EXPORTED_RUNTIME_METHODS='["allocateUTF8","UTF8ToString"]' \
    -s EXPORTED_FUNCTIONS='["_free", "_Execute", "_GetStdout"]' \
    #-s ASSERTIONS=1 \
