#define WINGS_IMPL
#include "wings.h"

#include <stdint.h>
#include <iostream>
#include <fstream>
#include <vector>
#include <algorithm>
#include <stack>
#include <string.h>

static Wg_Context* ctx;
static Wg_Context* exprChecker;
static std::string mystdout;

extern "C" {
	int OpenRepl() {
		Wg_Config cfg{};
		Wg_DefaultConfig(&cfg);
		cfg.enableOSAccess = true;
		cfg.print = [](const char* msg, int len, void*) {
			mystdout += std::string_view(msg, len);
		};
		
		ctx = Wg_CreateContext(&cfg);
		if (ctx == nullptr) {
			return 1;
		}

		// This context is only used to check if strings
		// are expressions rather than a set of statements.
		exprChecker = Wg_CreateContext();
		if (exprChecker == nullptr) {
			Wg_DestroyContext(ctx);
			ctx = nullptr;
			return 2;
		}

		return 0;
	}

	void CloseRepl() {
		if (ctx) Wg_DestroyContext(ctx);
		if (exprChecker) Wg_DestroyContext(exprChecker);
		ctx = nullptr;
		exprChecker = nullptr;
	}

	const char* GetStdout() {
		return mystdout.c_str();
	}

	void ClearStdout() {
		mystdout.clear();
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

		if (Wg_GetException(ctx)) {
			mystdout += Wg_GetErrorMessage(ctx);
			Wg_ClearException(ctx);
			return;
		}

		if (!Wg_IsNone(result)) {
			if (Wg_Obj* repr = Wg_UnaryOp(WG_UOP_REPR, result)) {
				mystdout += Wg_GetString(repr);
				mystdout += '\n';
			} else {
				mystdout += Wg_GetErrorMessage(ctx);
			}
		}
		Wg_ClearException(ctx);
	}
}

/*
int RunRepl() {
	Wg_Config cfg{};
	Wg_DefaultConfig(&cfg);
	cfg.enableOSAccess = true;
	
	Wg_Context* context = Wg_CreateContext(&cfg);
	if (context == nullptr) {
		return 1;
	}

	Wg_Obj* sysexit = Wg_GetGlobal(context, "SystemExit");
	Wg_IncRef(sysexit);

	// This context is only used to check if strings
	// are expressions rather than a set of statements.
	Wg_Context* exprChecker = Wg_CreateContext();
	if (exprChecker == nullptr) {
		Wg_DestroyContext(context);
		return 2;
	}

	PrintVersion();
	
	std::string input;
	bool indented = false;
	while (true) {
		if (input.empty()) {
			std::cout << ">>> ";
		} else {
			std::cout << "... ";
		}
		
		std::string line;
		std::getline(std::cin, line);
		input += line + "\n";

		size_t lastCharIndex = line.find_last_not_of(" \t");
		if (lastCharIndex != std::string::npos && line[lastCharIndex] == ':') {
			indented = true;
			continue;
		}

		if (indented && !line.empty()) {
			continue;
		}
		
		Wg_Obj* result = nullptr;
		Wg_ClearException(exprChecker);
		if (Wg_CompileExpression(exprChecker, input.c_str())) {
			result = Wg_ExecuteExpression(context, input.c_str(), "<string>");
		} else {
			Wg_Execute(context, input.c_str(), "<string>");
		}
		input.clear();
		indented = false;
		
		if (result && !Wg_IsNone(result)) {
			if (Wg_Obj* repr = Wg_UnaryOp(WG_UOP_REPR, result)) {
				std::cout << Wg_GetString(repr) << std::endl;
			}
		}
		
		Wg_Obj* exc = Wg_GetException(context);
		if (exc) {
			if (Wg_IsInstance(exc, &sysexit, 1)) {
				break;
			}
			
			std::cout << Wg_GetErrorMessage(context);
			Wg_ClearException(context);
		}
	}

	Wg_DestroyContext(exprChecker);
	Wg_DestroyContext(context);
	return 0;
}
*/