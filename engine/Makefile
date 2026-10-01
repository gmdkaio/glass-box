ifeq ($(origin CC),default)
CC := $(if $(shell command -v gcc 2>/dev/null),gcc,cc)
endif
CFLAGS ?= -std=c99 -O2 -Wall -Wextra -Wpedantic
LDLIBS = -lm
BUILD = build
LIB = rng.c quantize.c stats.c
HDR = rng.h quantize.h stats.h tests/check.h
TESTS = test_rng test_quantize test_stats

.PHONY: test clean

test: $(addprefix $(BUILD)/,$(TESTS))
	@for t in $(TESTS); do echo "== $$t"; ./$(BUILD)/$$t || exit 1; done

$(BUILD)/%: tests/%.c $(LIB) $(HDR) | $(BUILD)
	$(CC) $(CFLAGS) -I. $< $(LIB) -o $@ $(LDLIBS)

$(BUILD):
	mkdir -p $(BUILD)

clean:
	rm -rf $(BUILD)