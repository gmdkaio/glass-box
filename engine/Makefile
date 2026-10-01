CC ?= gcc
CFLAGS ?= -std=c99 -O2 -Wall -Wextra -Wpedantic
LDLIBS = -lm
BUILD = build
LIB = rng.c quantize.c
HDR = rng.h quantize.h tests/check.h

.PHONY: test clean

test: $(BUILD)/test_rng $(BUILD)/test_quantize
	./$(BUILD)/test_rng
	./$(BUILD)/test_quantize

$(BUILD)/%: tests/%.c $(LIB) $(HDR) | $(BUILD)
	$(CC) $(CFLAGS) -I. $< $(LIB) -o $@ $(LDLIBS)

$(BUILD):
	mkdir -p $(BUILD)

clean:
	rm -rf $(BUILD)