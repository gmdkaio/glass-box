#ifndef GB_CHECK_H
#define GB_CHECK_H

#include <stdio.h>

static int gb_failures = 0;

#define CHECK(cond, msg)                                              \
    do {                                                              \
        if (!(cond)) {                                                \
            printf("FAIL %s:%d  %s\n", __FILE__, __LINE__, (msg));    \
            gb_failures++;                                            \
        }                                                             \
    } while (0)

#define DONE()                                                        \
    do {                                                              \
        if (gb_failures) {                                            \
            printf("%d failure(s)\n", gb_failures);                   \
            return 1;                                                 \
        }                                                             \
        printf("ok\n");                                               \
        return 0;                                                     \
    } while (0)

#endif