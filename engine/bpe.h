#ifndef GB_BPE_H
#define GB_BPE_H

#include <stddef.h>

/*
 * Byte pair encoding, the way most models cut text into tokens.
 *
 * Every text starts as its UTF-8 bytes, tokens 0..255. Training finds the pair
 * of neighbouring tokens that occurs most often and makes it a new token, then
 * does it again. Merge k makes token 256 + k out of pairs[2k] and pairs[2k + 1].
 *
 * Text is first split into chunks and nothing is merged across a chunk edge, so
 * a token never spans two words. A chunk is a run of letters, a run of digits or
 * a run of other symbols, with one space in front of it if there was one. Any
 * byte from 0x80 up counts as a letter, so accented and non-Latin letters stay
 * inside their word. Every other whitespace byte is a chunk of its own.
 */

/*
 * Learns up to `merges` merges from text and writes them to pairs (room for
 * 2 * merges). Stops early when no pair occurs twice. The most frequent pair
 * wins, and a tie goes to the pair with the smaller numbers.
 * Returns how many merges it learned.
 */
size_t gb_bpe_train(const unsigned char *text, size_t len, size_t merges, int *pairs);

/*
 * Cuts text into tokens with the first `merges` merges. ids needs room for len.
 * Returns how many tokens there are.
 */
size_t gb_bpe_encode(const unsigned char *text, size_t len, const int *pairs, size_t merges, int *ids);

/*
 * How many tokens text becomes with 0, 1, ... merges merges: counts gets
 * merges + 1 entries, counts[0] = len.
 */
void gb_bpe_curve(const unsigned char *text, size_t len, const int *pairs, size_t merges, size_t *counts);

/*
 * Writes the bytes of a token, at most cap of them, to out. Returns the token's
 * full length, or 0 if the token is not 0..255 + merges.
 */
size_t gb_bpe_token_bytes(const int *pairs, size_t merges, int token, unsigned char *out, size_t cap);

#endif
