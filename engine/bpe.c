#include "bpe.h"

#include <stdlib.h>

enum { SPACE, WHITE, LETTER, DIGIT, OTHER };

static int kind(unsigned char b) {
    if (b == ' ') return SPACE;
    if (b == '\t' || b == '\n' || b == '\r' || b == '\v' || b == '\f') return WHITE;
    if ((b >= 'a' && b <= 'z') || (b >= 'A' && b <= 'Z') || b >= 0x80) return LETTER;
    if (b >= '0' && b <= '9') return DIGIT;
    return OTHER;
}

/* 1 if byte i starts a chunk (see bpe.h) */
static unsigned char starts(const unsigned char *text, size_t i) {
    if (i == 0) return 1;
    int k = kind(text[i]), p = kind(text[i - 1]);
    if (k == SPACE || k == WHITE) return 1;
    if (p == SPACE) return 0;
    return k != p;
}

/* the text as byte tokens, with a flag on each token that starts a chunk */
static int setup(const unsigned char *text, size_t len, int **ids, unsigned char **start) {
    *ids = malloc((len ? len : 1) * sizeof **ids);
    *start = malloc(len ? len : 1);
    if (!*ids || !*start) {
        free(*ids);
        free(*start);
        return 0;
    }
    for (size_t i = 0; i < len; i++) {
        (*ids)[i] = text[i];
        (*start)[i] = starts(text, i);
    }
    return 1;
}

/* replaces every a b inside a chunk with token, left to right; returns the new length */
static size_t merge(int *ids, unsigned char *start, size_t n, int a, int b, int token) {
    size_t w = 0;
    for (size_t i = 0; i < n; i++) {
        if (i + 1 < n && ids[i] == a && ids[i + 1] == b && !start[i + 1]) {
            ids[w] = token;
            start[w++] = start[i];
            i++;
        } else {
            ids[w] = ids[i];
            start[w++] = start[i];
        }
    }
    return w;
}

size_t gb_bpe_train(const unsigned char *text, size_t len, size_t merges, int *pairs) {
    if (len < 2 || merges == 0) return 0;
    size_t vocab = 256 + merges;
    unsigned int *counts = calloc(vocab * vocab, sizeof *counts);
    int *ids;
    unsigned char *start;
    if (!counts || !setup(text, len, &ids, &start)) {
        free(counts);
        return 0;
    }

    size_t n = len, learned = 0;
    for (; learned < merges; learned++) {
        /* count the pairs, keeping the best so far: the first entry to reach the
           top count with the smallest index wins */
        unsigned int best = 0;
        size_t best_at = 0;
        for (size_t i = 0; i + 1 < n; i++) {
            if (start[i + 1]) continue;
            size_t at = (size_t)ids[i] * vocab + (size_t)ids[i + 1];
            unsigned int c = ++counts[at];
            if (c > best || (c == best && at < best_at)) {
                best = c;
                best_at = at;
            }
        }
        for (size_t i = 0; i + 1 < n; i++)
            if (!start[i + 1]) counts[(size_t)ids[i] * vocab + (size_t)ids[i + 1]] = 0;
        if (best < 2) break;

        int a = (int)(best_at / vocab), b = (int)(best_at % vocab);
        pairs[2 * learned] = a;
        pairs[2 * learned + 1] = b;
        n = merge(ids, start, n, a, b, 256 + (int)learned);
    }

    free(counts);
    free(ids);
    free(start);
    return learned;
}

/* Applying the merges one after another in order gives the same tokens as the
   usual rule (always merge the earliest-learned pair present): merge k only uses
   tokens made before it, so no later merge can make a pair for an earlier one. */
size_t gb_bpe_encode(const unsigned char *text, size_t len, const int *pairs, size_t merges, int *ids) {
    if (len == 0) return 0;
    unsigned char *start = malloc(len);
    if (!start) return 0;
    for (size_t i = 0; i < len; i++) {
        ids[i] = text[i];
        start[i] = starts(text, i);
    }
    size_t n = len;
    for (size_t k = 0; k < merges && n > 1; k++)
        n = merge(ids, start, n, pairs[2 * k], pairs[2 * k + 1], 256 + (int)k);
    free(start);
    return n;
}

void gb_bpe_curve(const unsigned char *text, size_t len, const int *pairs, size_t merges, size_t *counts) {
    int *ids;
    unsigned char *start;
    if (len == 0 || !setup(text, len, &ids, &start)) {
        for (size_t k = 0; k <= merges; k++) counts[k] = 0;
        return;
    }
    size_t n = len;
    counts[0] = n;
    for (size_t k = 0; k < merges; k++) {
        if (n > 1) n = merge(ids, start, n, pairs[2 * k], pairs[2 * k + 1], 256 + (int)k);
        counts[k + 1] = n;
    }
    free(ids);
    free(start);
}

static size_t spell(const int *pairs, int token, unsigned char *out, size_t cap, size_t at) {
    if (token < 256) {
        if (at < cap) out[at] = (unsigned char)token;
        return at + 1;
    }
    at = spell(pairs, pairs[2 * (token - 256)], out, cap, at);
    return spell(pairs, pairs[2 * (token - 256) + 1], out, cap, at);
}

size_t gb_bpe_token_bytes(const int *pairs, size_t merges, int token, unsigned char *out, size_t cap) {
    if (token < 0 || (size_t)token >= 256 + merges) return 0;
    return spell(pairs, token, out, cap, 0);
}
