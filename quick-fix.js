#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function walkDirectory(dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkDirectory(fullPath)));
    } else if (entry.name.endsWith('.spec.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

async function fixFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    const originalContent = content;
    
    // Replace testSuite with suite
    content = content.replace(/({ )testSuite( })/g, '$1suite$2');
    content = content.replace(/testSuite/g, 'suite');
    
    if (content !== originalContent) {
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  const testsDir = '/Users/anthony/Desktop/Current Projects/VirtualStitch/tests';
  console.log('🔧 Finding and fixing test files...\n');
  
  const testFiles = await walkDirectory(testsDir);
  console.log(`Found ${testFiles.length} test files\n`);
  
  let fixedCount = 0;
  for (const file of testFiles) {
    if (await fixFile(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n🎯 Complete! Fixed ${fixedCount} files`);
}

main().catch(console.error);
