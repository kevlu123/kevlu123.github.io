#define WINGS_IMPL
#include "wings.h"

#include <stdint.h>
#include <iostream>
#include <fstream>
#include <vector>
#include <algorithm>
#include <stack>
#include <string.h>

#include <emscripten.h>

static Wg_Context* ctx;
static Wg_Context* exprChecker;
static std::string mystdout;
static bool shouldExit;
static Wg_Obj* sysexit;

static Wg_Obj* Clear(Wg_Context* ctx, Wg_Obj**, int) {
	emscripten_run_script("clearConsole();");
	return Wg_None(ctx);
}

static Wg_Obj* Version(Wg_Context* ctx, Wg_Obj**, int) {
	Wg_PrintString(ctx, "Wings v0.2.1\n");
	return Wg_None(ctx);
}

extern "C" {
	int OpenRepl() {
		Wg_Config cfg{};
		Wg_DefaultConfig(&cfg);
		cfg.enableOSAccess = true;
		cfg.print = [](const char* msg, int len, void*) {
			mystdout = std::string_view(msg, len);
			emscripten_run_script("onprint();");
		};
		
		ctx = Wg_CreateContext(&cfg);

		sysexit = Wg_GetGlobal(ctx, "SystemExit");
		Wg_IncRef(sysexit);

		Wg_Obj* clear = Wg_NewFunction(ctx, Clear, nullptr, "clear");
		if (clear == nullptr) {
			Wg_DestroyContext(ctx);
			return 1;
		}
		Wg_SetGlobal(ctx, "clear", clear);

		Wg_Obj* version = Wg_NewFunction(ctx, Version, nullptr, "version");
		if (version == nullptr) {
			Wg_DestroyContext(ctx);
			return 1;
		}
		Wg_SetGlobal(ctx, "version", version);

		// This context is only used to check if strings
		// are expressions rather than a set of statements.
		exprChecker = Wg_CreateContext();
		return 0;
	}

	void CloseRepl() {
		if (ctx) Wg_DestroyContext(ctx);
		if (exprChecker) Wg_DestroyContext(exprChecker);
		ctx = nullptr;
		exprChecker = nullptr;
	}

	bool ShouldExit() {
		return shouldExit;
	}

	const char* GetStdout() {
		return mystdout.c_str();
	}

	void Execute(const char* code) {
		Wg_Obj* result = nullptr;
		Wg_ClearException(exprChecker);
		if (Wg_CompileExpression(exprChecker, code)) {
			result = Wg_ExecuteExpression(ctx, code);
		} else {
			Wg_Execute(ctx, code);
			result = Wg_None(ctx);
		}

		shouldExit = false;
		if (Wg_Obj* exc = Wg_GetException(ctx)) {
			if (Wg_IsInstance(exc, &sysexit, 1)) {
				shouldExit = true;
			} else {
				Wg_PrintString(ctx, Wg_GetErrorMessage(ctx));
			}
			Wg_ClearException(ctx);
			return;
		}

		if (!Wg_IsNone(result)) {
			std::string text;
			if (Wg_Obj* repr = Wg_UnaryOp(WG_UOP_REPR, result)) {
				text = Wg_GetString(repr);
				text.push_back('\n');
			} else {
				text = Wg_GetErrorMessage(ctx);
			}
			Wg_PrintString(ctx, text.c_str());
		}
		Wg_ClearException(ctx);
	}
}
