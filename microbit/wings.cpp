#define WINGS_IMPL
#include "wings.h"

#include <string>
#include <string_view>
#include <thread>

#include <emscripten.h>

#define EMBED_FUNC_NAME(func, name) {							\
	Wg_Obj* func = Wg_NewFunction(ctx, ::func, nullptr, name);	\
	if (func == nullptr) {										\
		Wg_DestroyContext(ctx);									\
		return false;											\
	}															\
	Wg_SetGlobal(ctx, name, func);								\
}

#define EMBED_FUNC(name) EMBED_FUNC_NAME(name, #name)

static void Call(const char* func, std::string_view args) {
	std::string script = "postMessage({type: 'call', func: '";
	script += func;
	script += "', args: [";
	script += args;
	script += "]});";
	emscripten_run_script(script.c_str());
}

static Wg_Obj* set_pixel(Wg_Context* context, Wg_Obj** argv, int argc) {
	WG_EXPECT_ARG_COUNT(3);
	for (int i = 0; i < 3; i++) {
		WG_EXPECT_ARG_TYPE_INT(i);
	}

	Call("setPixel",
		  std::to_string(Wg_GetInt(argv[0])) + ","
		+ std::to_string(Wg_GetInt(argv[1])) + ","
		+ std::to_string(Wg_GetInt(argv[2]))
	);
	return Wg_None(context);
}

static Wg_Obj* clear(Wg_Context* context, Wg_Obj** argv, int argc) {
	WG_EXPECT_ARG_COUNT(0);
	Call("clearDisplay", "");
	return Wg_None(context);
}

static Wg_Obj* scroll(Wg_Context* context, Wg_Obj** argv, int argc) {
	WG_EXPECT_ARG_COUNT(1);
	WG_EXPECT_ARG_TYPE_STRING(0);
	Call("clearDisplay", "");
	return Wg_None(context);
}

static bool LoadDisplayModule(Wg_Context* ctx) {
	EMBED_FUNC(set_pixel);
	EMBED_FUNC(clear);
	EMBED_FUNC(scroll);
	return true;
}

static Wg_Obj* get_x(Wg_Context* context, Wg_Obj** argv, int argc) {
	WG_EXPECT_ARG_COUNT(0);
	int x = emscripten_run_script_int("read_sab('acc_x');");
	return Wg_NewInt(context, x);
}

static Wg_Obj* get_y(Wg_Context* context, Wg_Obj** argv, int argc) {
	WG_EXPECT_ARG_COUNT(0);
	int y = emscripten_run_script_int("read_sab('acc_y');");
	return Wg_NewInt(context, y);
}

static Wg_Obj* get_z(Wg_Context* context, Wg_Obj** argv, int argc) {
	WG_EXPECT_ARG_COUNT(0);
	int z = emscripten_run_script_int("read_sab('acc_z');");
	return Wg_NewInt(context, z);
}

static bool LoadAccelerometerModule(Wg_Context* ctx) {
	EMBED_FUNC(get_x);
	EMBED_FUNC(get_y);
	EMBED_FUNC(get_z);
	return true;
}

static Wg_Obj* sound_level(Wg_Context* context, Wg_Obj** argv, int argc) {
	WG_EXPECT_ARG_COUNT(0);
	return Wg_NewInt(context, 0);
}

static bool LoadMicrophoneModule(Wg_Context* ctx) {
	EMBED_FUNC(sound_level);
	return true;
}

static Wg_Obj* a_is_pressed(Wg_Context* context, Wg_Obj** argv, int argc) {
	bool p = emscripten_run_script_int("read_sab('a_pressed');");
	return Wg_NewBool(context, p);
}

static Wg_Obj* b_is_pressed(Wg_Context* context, Wg_Obj** argv, int argc) {
	bool p = emscripten_run_script_int("read_sab('b_pressed');");
	return Wg_NewBool(context, p);
}

static Wg_Obj* a_was_pressed(Wg_Context* context, Wg_Obj** argv, int argc) {
	bool p = emscripten_run_script_int("read_sab('a_was_pressed');");
	return Wg_NewBool(context, p);
}

static Wg_Obj* b_was_pressed(Wg_Context* context, Wg_Obj** argv, int argc) {
	bool p = emscripten_run_script_int("read_sab('b_was_pressed');");
	return Wg_NewBool(context, p);
}

static bool LoadButtonAModule(Wg_Context* ctx) {
	EMBED_FUNC_NAME(a_is_pressed, "is_pressed");
	EMBED_FUNC_NAME(a_was_pressed, "was_pressed");
	return true;
}

static bool LoadButtonBModule(Wg_Context* ctx) {
	EMBED_FUNC_NAME(b_is_pressed, "is_pressed");
	EMBED_FUNC_NAME(b_was_pressed, "was_pressed");
	return true;
}

static Wg_Obj* sleep(Wg_Context* context, Wg_Obj** argv, int argc) {
	WG_EXPECT_ARG_COUNT(1);
	WG_EXPECT_ARG_TYPE_INT(0);
	std::this_thread::sleep_for(std::chrono::milliseconds(Wg_GetInt(argv[0])));
	return Wg_None(context);
}

static bool LoadMicrobitModule(Wg_Context* ctx) {
	EMBED_FUNC(sleep);
	return Wg_ImportModule(ctx, "display")
		&& Wg_ImportModule(ctx, "accelerometer")
		&& Wg_ImportModule(ctx, "microphone")
		&& Wg_ImportModule(ctx, "button_a")
		&& Wg_ImportModule(ctx, "button_b");
}

static std::string mystdout;

extern "C" {
	void Execute(const char* code) {
		Wg_Config cfg{};
		Wg_DefaultConfig(&cfg);
		cfg.enableOSAccess = true;
		cfg.print = [](const char* msg, int len, void*) {
			mystdout = std::string(msg, len);
			emscripten_run_script("onPrint();");
		};
		
		Wg_Context* ctx = Wg_CreateContext(&cfg);
		
		Wg_RegisterModule(ctx, "display", LoadDisplayModule);
		Wg_RegisterModule(ctx, "microphone", LoadMicrophoneModule);
		Wg_RegisterModule(ctx, "accelerometer", LoadAccelerometerModule);
		Wg_RegisterModule(ctx, "button_a", LoadButtonAModule);
		Wg_RegisterModule(ctx, "button_b", LoadButtonBModule);
		Wg_RegisterModule(ctx, "microbit", LoadMicrobitModule);

		if (!Wg_Execute(ctx, code)) {
			const char* err = Wg_GetErrorMessage(ctx);
			Wg_PrintString(ctx, err);
		}
	
		Wg_DestroyContext(ctx);
	}

	const char* GetStdout() {
		return mystdout.c_str();
	}
}