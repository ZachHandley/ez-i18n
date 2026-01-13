#!/usr/bin/env node
const [currentRaw, targetRaw] = process.argv.slice(2);

if (!currentRaw || !targetRaw) {
  console.error('Usage: compare-versions.cjs <current> <target>');
  process.exit(1);
}

function normalize(version) {
  return version.replace(/^v/, '').split('-')[0];
}

function parse(version) {
  return normalize(version)
    .split('.')
    .map((part) => Number(part) || 0);
}

function compare(a, b) {
  const pa = parse(a);
  const pb = parse(b);
  const length = Math.max(pa.length, pb.length);
  for (let i = 0; i < length; i += 1) {
    const av = pa[i] ?? 0;
    const bv = pb[i] ?? 0;
    if (av > bv) return 1;
    if (av < bv) return -1;
  }
  return 0;
}

const result = compare(currentRaw, targetRaw);
// Exit 1 if current > target, else 0.
process.exit(result === 1 ? 1 : 0);
