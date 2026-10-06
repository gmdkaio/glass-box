ifeq ($(origin CC),default)
CC := $(if $(shell command -v gcc 2>/dev/null),gcc,cc)
endif
CFLAGS ?= -std=c99 -O2 -Wall -Wextra -Wpedantic
LDLIBS = -lm
BUILD = build
LIB = rng.c quantize.c stats.c text.c nn.c chain.c context.c bpe.c calib.c retrieve.c memory.c embed.c sampler.c lora.c gb_wasm.c
HDR = rng.h quantize.h stats.h text.h nn.h chain.h context.h bpe.h calib.h retrieve.h memory.h embed.h sampler.h lora.h gb_wasm.h tests/check.h
TESTS = test_rng test_quantize test_stats test_lattice test_snap test_text test_nn test_chain test_context test_bpe test_calib test_retrieve test_memory test_embed test_sampler test_lora test_wasm_api

# wasm build: run emsdk_env.sh (Linux) or emsdk_env.ps1 (Windows) first
EMCC ?= emcc
WASM_DIR = $(BUILD)/wasm
WASM_FUNCS = _gb_wasm_weights,_gb_max_abs,_gb_quant_step,_gb_quantize,_gb_quantize_range,_gb_mse,_gb_dist,_gb_signal_kept,_gb_quant_mse_theory,_gb_lattice_count,_gb_lattice4,_gb_snap,_gb_snap_levels,_gb_softmax,_gb_sample_counts,_gb_pair_counts,_gb_row_odds,_gb_table_loss,_gb_nn_params,_gb_nn_init,_gb_nn_forward,_gb_nn_loss,_gb_nn_train,_gb_nn_train_curve,_gb_nn_train_watch,_gb_nn_word_loss,_gb_nn_quiz,_gb_lr_at,_gb_histogram,_gb_chain_odds,_gb_chain_trace,_gb_chain_trials,_gb_context_scores,_gb_context_place,_gb_context_share,_gb_bpe_train,_gb_bpe_encode,_gb_bpe_curve,_gb_bpe_token_bytes,_gb_calib_sample,_gb_calib_bins,_gb_calib_error,_gb_calib_brier,_gb_calib_fit_shift,_gb_calib_apply,_gb_bm25,_gb_rank_of,_gb_pick_share,_gb_mem_weights,_gb_mem_kv,_gb_mem_max_tokens,_gb_cooc,_gb_ppmi,_gb_sym_eigen,_gb_embed_take,_gb_cosine_rows,_gb_mean_rows,_gb_neighbour_agreement,_gb_project_2d,_gb_top_k,_gb_top_p,_gb_min_p,_gb_repeat_penalty,_gb_sample_odds,_gb_odds_from,_gb_generate,_gb_loop_share,_gb_penalty_curve,_gb_lora_params,_gb_lora_init,_gb_lora_merge,_gb_lora_train,_gb_gain_share,_gb_diff,_gb_low_rank,_gb_lora_count,_malloc,_free
WASM_FLAGS = -std=c99 -O2 -I. --no-entry -sMODULARIZE -sEXPORT_ES6 -sENVIRONMENT=web,node -sALLOW_MEMORY_GROWTH -sEXPORTED_FUNCTIONS=$(WASM_FUNCS) -sEXPORTED_RUNTIME_METHODS=HEAPF64,HEAPU32,HEAP32,HEAPU8

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
