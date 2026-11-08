import bcrypt from 'bcryptjs';
import { config } from './config.js';
import Problem from './models/Problem.js';
import User from './models/User.js';

const tc = (input, expectedOutput, isHidden = false) => ({ input, expectedOutput: String(expectedOutput), isHidden });

const fizzbuzz = (n) =>
  Array.from({ length: n }, (_, i) => {
    const k = i + 1;
    return k % 15 === 0 ? 'FizzBuzz' : k % 3 === 0 ? 'Fizz' : k % 5 === 0 ? 'Buzz' : String(k);
  }).join('\n');

const kadane = (arr) => {
  let best = arr[0];
  let current = arr[0];
  for (const x of arr.slice(1)) {
    current = Math.max(x, current + x);
    best = Math.max(best, current);
  }
  return best;
};
const arrayCase = (arr, hidden = false) => tc(`${arr.length}\n${arr.join(' ')}\n`, kadane(arr), hidden);

const PY = (body) => `# Read from standard input, print the answer to standard output\n${body}`;
const JS = (body) => `// Read from standard input, print the answer with console.log\nconst lines = require('fs').readFileSync(0, 'utf8').split('\\n');\n${body}`;

export const sampleProblems = [
  {
    title: 'Sum of Two Numbers', difficulty: 'Easy', points: 100, tags: ['math', 'input'],
    description: 'Read two integers a and b from one line, separated by a space, and print their sum.\n\nInput: a b\nOutput: a + b',
    starterCode: { python: PY('a, b = map(int, input().split())\n'), javascript: JS('') },
    testCases: [tc('3 5\n', 8), tc('-4 10\n', 6), tc('1000000 2000000\n', 3000000, true), tc('-5 -7\n', -12, true), tc('0 0\n', 0, true)]
  },
  {
    title: 'Reverse a String', difficulty: 'Easy', points: 100, tags: ['strings'],
    description: 'Read one line of text and print it reversed.\n\nInput: a single line\nOutput: the same line, reversed',
    starterCode: { python: PY('s = input()\n'), javascript: JS('') },
    testCases: [tc('hello\n', 'olleh'), tc('Coding\n', 'gnidoC'), tc('a\n', 'a', true), tc('racecar\n', 'racecar', true), tc('Hello World\n', 'dlroW olleH', true)]
  },
  {
    title: 'FizzBuzz', difficulty: 'Easy', points: 100, tags: ['loops', 'math'],
    description: 'Read an integer N. For every number from 1 to N, print one line:\n- "FizzBuzz" if it is divisible by both 3 and 5\n- "Fizz" if it is divisible by 3\n- "Buzz" if it is divisible by 5\n- otherwise the number itself\n\nInput: N\nOutput: N lines',
    starterCode: { python: PY('n = int(input())\n'), javascript: JS('') },
    testCases: [tc('5\n', fizzbuzz(5)), tc('15\n', fizzbuzz(15)), tc('1\n', fizzbuzz(1), true), tc('30\n', fizzbuzz(30), true)]
  },
  {
    title: 'Palindrome Check', difficulty: 'Easy', points: 100, tags: ['strings'],
    description: 'Read one word. Print YES if it reads the same forwards and backwards (ignore upper/lower case), otherwise print NO.\n\nInput: a single word\nOutput: YES or NO',
    starterCode: { python: PY('word = input().strip()\n'), javascript: JS('') },
    testCases: [tc('Level\n', 'YES'), tc('hello\n', 'NO'), tc('a\n', 'YES', true), tc('Noon\n', 'YES', true), tc('abca\n', 'NO', true)]
  },
  {
    title: 'Maximum Subarray Sum', difficulty: 'Medium', points: 200, tags: ['arrays', 'dynamic programming'],
    description: 'Given an array of integers, find the contiguous subarray (at least one element) with the largest sum and print that sum.\n\nInput:\nLine 1: n, the number of elements\nLine 2: n integers separated by spaces\nOutput: the maximum subarray sum',
    starterCode: { python: PY('n = int(input())\nnums = list(map(int, input().split()))\n'), javascript: JS('const nums = lines[1].split(" ").map(Number);\n') },
    testCases: [arrayCase([-2, 1, -3, 4, -1, 2, 1, -5, 4]), arrayCase([1, 2, 3]), arrayCase([-3, -1, -2]), arrayCase([5], true), arrayCase([2, -1, 2, -1, 2], true), arrayCase([-1, -1, -1, -1], true)]
  },
  {
    title: 'Count Primes', difficulty: 'Medium', points: 250, tags: ['math', 'optimization'], timeLimitMs: 3000,
    description: 'Read an integer N and print how many prime numbers are less than or equal to N.\n\nThe largest tests are big, so checking every number one by one will be too slow. Think about the Sieve of Eratosthenes.\n\nInput: N (0 ≤ N ≤ 1,000,000)\nOutput: the count of primes ≤ N',
    starterCode: { python: PY('n = int(input())\n'), javascript: JS('') },
    testCases: [tc('10\n', 4), tc('2\n', 1), tc('1\n', 0, true), tc('100\n', 25, true), tc('100000\n', 9592, true), tc('1000000\n', 78498, true)]
  }
];

export async function seed() {
  if (!(await User.exists({ email: config.adminEmail }))) {
    await User.create({
      name: 'Admin', email: config.adminEmail, role: 'admin',
      passwordHash: await bcrypt.hash(config.adminPassword, 10)
    });
    console.log(`Created admin account ${config.adminEmail}`);
  }
  if ((await Problem.countDocuments()) === 0) {
    await Problem.insertMany(sampleProblems);
    console.log(`Added ${sampleProblems.length} sample problems`);
  }
}
