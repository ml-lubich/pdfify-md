#!/usr/bin/env node

/**
 * Sync wrapper package version with main package version
 * Run this before publishing the wrapper package
 */

const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

const mainPackagePath = join(__dirname, '..', 'package.json');
const wrapperPackagePath = join(__dirname, 'package.json');

const mainPackage = JSON.parse(readFileSync(mainPackagePath, 'utf-8'));
const wrapperPackage = JSON.parse(readFileSync(wrapperPackagePath, 'utf-8'));

// Sync version
wrapperPackage.version = mainPackage.version;

// Sync dependency version
wrapperPackage.dependencies['md-pdf'] = `^${mainPackage.version}`;

writeFileSync(wrapperPackagePath, JSON.stringify(wrapperPackage, null, '\t') + '\n');
console.log(`✓ Synced wrapper package version to ${mainPackage.version}`);

