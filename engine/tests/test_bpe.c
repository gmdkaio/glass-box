#include <string.h>

#include "bpe.h"
#include "check.h"

#define T(s) (const unsigned char *)(s), strlen(s)

int main(void) {
    int pairs[64];
    int ids[64];
    size_t counts[64];
    unsigned char out[16];

    /* "abab ab": a b comes three times, every other pair once */
    CHECK(gb_bpe_train(T("abab ab"), 10, pairs) == 1, "one pair repeats, so one merge");
    CHECK(pairs[0] == 'a' && pairs[1] == 'b', "the merge is a + b");
    CHECK(gb_bpe_encode(T("ab ab"), pairs, 1, ids) == 3 && ids[0] == 256 && ids[1] == ' ' && ids[2] == 256,
          "ab, space, ab");
    CHECK(gb_bpe_encode(T("ab ab"), pairs, 0, ids) == 5 && ids[4] == 'b', "no merges: one token per byte");

    /* a tie goes to the smaller numbers: space + c beats a + b and c + d */
    CHECK(gb_bpe_train(T("ab cd ab cd"), 1, pairs) == 1 && pairs[0] == ' ' && pairs[1] == 'c', "ties");

    /* nothing is merged across a chunk edge */
    CHECK(gb_bpe_train(T("a.a.a.a."), 10, pairs) == 0, "letters and full stops never pair");
    CHECK(gb_bpe_train(T("a b a b"), 10, pairs) == 1 && pairs[0] == ' ' && pairs[1] == 'b',
          "a space joins the word after it, not the one before");
    CHECK(gb_bpe_train(T("12a12a"), 10, pairs) == 1 && pairs[0] == '1' && pairs[1] == '2', "digits stay apart from letters");
    CHECK(gb_bpe_train(T("x\nx\nx\n"), 10, pairs) == 0, "a newline is a chunk of its own");

    /* bytes from 0x80 up are letters: é (C3 A9) stays inside its word */
    CHECK(gb_bpe_train(T("caf\xc3\xa9 caf\xc3\xa9"), 10, pairs) >= 4, "café merges through the é");
    CHECK(gb_bpe_encode(T("caf\xc3\xa9 caf\xc3\xa9"), pairs, 10, ids) == 3 && ids[1] == ' ', "café, space, café");

    /* merges build on merges, and the token spells back to its bytes */
    size_t learned = gb_bpe_train(T("the then the then"), 20, pairs);
    size_t n = gb_bpe_encode(T("the then"), pairs, learned, ids);
    CHECK(n == 2, "the, space then");
    CHECK(gb_bpe_token_bytes(pairs, learned, ids[1], out, sizeof out) == 5 && memcmp(out, " then", 5) == 0,
          "spell space then");
    CHECK(gb_bpe_token_bytes(pairs, learned, 'q', out, sizeof out) == 1 && out[0] == 'q', "a byte spells itself");
    CHECK(gb_bpe_token_bytes(pairs, learned, 256 + (int)learned, out, sizeof out) == 0, "no such token");
    CHECK(gb_bpe_token_bytes(pairs, learned, ids[1], out, 2) == 5 && out[0] == ' ' && out[1] == 't',
          "a short buffer still gets the length");

    /* the curve starts at the byte count, never rises, and ends where encode does */
    gb_bpe_curve(T("the then the then"), pairs, learned, counts);
    int down = counts[0] == 17;
    for (size_t k = 0; k < learned; k++) down &= counts[k + 1] <= counts[k];
    CHECK(down, "the curve falls from 17 bytes");
    CHECK(counts[learned] == gb_bpe_encode(T("the then the then"), pairs, learned, ids), "the curve ends at encode");

    CHECK(gb_bpe_train(T("a"), 10, pairs) == 0 && gb_bpe_encode(T(""), pairs, 0, ids) == 0, "too short to merge");
    DONE();
}
