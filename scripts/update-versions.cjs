#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const packagePath = args[0];
const targetVersion = args[1];
const updatePeer = args.includes('--update-peer');

if (!packagePath || !targetVersion) {
  console.error('Usage: update-versions.cjs <packagePath> <version> [--update-peer]');
  process.exit(1);
}

const pkgPath = path.join(packagePath, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

pkg.version = targetVersion;

if (updatePeer && pkg.peerDependencies && pkg.peerDependencies['@zachhandley/ez-i18n']) {
  pkg.peerDependencies['@zachhandley/ez-i18n'] = `>=${targetVersion}`;
}

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
