---
title: "Writing a lock-free ring buffer in C, and where it goes wrong"
date: 2026-10-21
tag: systems
summary: "One producer, one consumer, no mutex. It fits on a screen — and it’s wrong in two subtle ways the first time you write it."
---

## The shape of the problem

A single-producer, single-consumer queue only needs two indices: `head`, written by the producer, and `tail`, written by the consumer. Because each index has exactly one writer, there is nothing to lock — as long as each side sees the other’s writes in the right order.

Keep the capacity a power of two and the wrap-around becomes a mask instead of a modulo.

## The naive version

```c ring.c
typedef struct {
  size_t head;   /* written by producer */
  size_t tail;   /* written by consumer */
  int    buf[1024];
} ring_t;

bool push(ring_t *r, int v) {
  if (r->head - r->tail == 1024) return false;
  r->buf[r->head & 1023] = v;
  r->head++;             /* bug: may be seen before the store above */
  return true;
}
```

This compiles, passes a single-threaded test, and usually works under load. The problem is the last line: nothing stops the compiler or the CPU from making the new `head` visible before the element it guards.

## Memory ordering

The fix is to publish `head` with release semantics and read it on the other side with acquire semantics, using `<stdatomic.h>`. The element write then “happens before” the consumer’s read of it — and the same reasoning applies to `tail` in the other direction.

[Continue the post…]
