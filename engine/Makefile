ifeq ($(origin CC),default)
CC := $(if $(shell command -v gcc 2>/dev/null),gcc,cc)
endif
CFLAGS ?= -std=c99 -O2 -Wall -Wextra -Wpedantic
LDLIBS = -lm
BUILD = build
LIB = rng.c quantize.c stats.c text.c nn.c gb_wasm.c
HDR = rng.h quantize.h stats.h text.h nn.h gb_wasm.h tests/check.h
TESTS = test_rng test_quantize test_stats test_lattice test_snap test_text test_nn test_wasm_api

# wasm build: run emsdk_env.sh (Linux) or emsdk_env.ps1 (Windows) first
EMCC ?= emcc
WASM_DIR = $(BUILD)/wasm
WASM_FUNCS = _gb_wasm_weights,_gb_max_abs,_gb_quant_step,_gb_quantize,_gb_quantize_range,_gb_mse,_gb_dist,_gb_signal_kept,_gb_quant_mse_theory,_gb_lattice_count,_gb_lattice4,_gb_snap,_gb_snap_levels,_gb_softmax,_gb_sample_counts,_gb_pair_counts,_gb_row_odds,_gb_table_loss,_gb_nn_params,_gb_nn_init,_gb_nn_forward,_gb_nn_loss,_gb_nn_train,_gb_histogram,_malloc,_free
WASM_FLAGS = -std=c99 -O2 -I. --no-entry -sMODULARIZE -sEXPORT_ES6 -sENVIRONMENT=web,node -sALLOW_MEMORY_GROWTH -sEXPORTED_FUNCTIONS=$(WASM_FUNCS) -sEXPORTED_RUNTIME_METHODS=HEAPF64,HEAPU32,HEAP32

WEB_WASM = ../web/src/lib/wasm

.PHONY: test wasm wasm-web wasm-test clean

test: $(addprefix $(BUILD)/,$(TESTS))
	@for t in $(TESTS); do echo "== $$t"; ./$(BUILD)/$$t || exit 1; done

$(BUILD)/%: tests/%.c $(LIB) $(HDR) | $(BUILD)
	$(CC) $(CFLAGS) -I. $< $(LIB) -o $@ $(LDLIBS)

wasm: $(WASM_DIR)/glassbox.mjs

$(WASM_DIR)/glassbox.mjs: $(LIB) $(HDR) | $(WASM_DIR)
	$(EMCC) $(WASM_FLAGS) $(LIB) -o $@

# the built files are committed, so the site build does not need Emscripten
wasm-web: wasm
	mkdir -p $(WEB_WASM)
	cp $(WASM_DIR)/glassbox.mjs $(WASM_DIR)/glassbox.wasm $(WEB_WASM)/

wasm-test: wasm
	node wasm/smoke.mjs

$(BUILD):
	mkdir -p $(BUILD)

$(WASM_DIR):
	mkdir -p $(WASM_DIR)

clean:
	rm -rf $(BUILD)
