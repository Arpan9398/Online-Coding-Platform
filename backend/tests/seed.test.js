import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sampleProblems } from '../src/seed.js';
import { judge } from '../src/services/judge.js';

// Reference solutions prove that every seeded test case has the right expected output.
const solutions = {
  'Sum of Two Numbers': 'a, b = map(int, input().split())\nprint(a + b)\n',
  'Reverse a String': 'print(input()[::-1])\n',
  FizzBuzz: 'n = int(input())\nfor k in range(1, n + 1):\n    print("FizzBuzz" if k % 15 == 0 else "Fizz" if k % 3 == 0 else "Buzz" if k % 5 == 0 else k)\n',
  'Palindrome Check': 'w = input().strip().lower()\nprint("YES" if w == w[::-1] else "NO")\n',
  'Maximum Subarray Sum': 'input()\nxs = list(map(int, input().split()))\nbest = cur = xs[0]\nfor x in xs[1:]:\n    cur = max(x, cur + x)\n    best = max(best, cur)\nprint(best)\n',
  'Count Primes': 'n = int(input())\nsieve = bytearray([1]) * (n + 1)\nsieve[:2] = b"\\x00\\x00"[: min(2, n + 1)]\nfor i in range(2, int(n ** 0.5) + 1):\n    if sieve[i]:\n        sieve[i * i :: i] = bytearray(len(range(i * i, n + 1, i)))\nprint(sum(sieve))\n'
};

for (const problem of sampleProblems) {
  test(`seed problem "${problem.title}" matches its reference solution`, async () => {
    const r = await judge({ language: 'python', code: solutions[problem.title], testCases: problem.testCases, timeLimitMs: problem.timeLimitMs ?? 2000 });
    assert.equal(r.status, 'ACCEPTED', JSON.stringify(r.results.filter((x) => x.status !== 'PASSED')));
  });
}
