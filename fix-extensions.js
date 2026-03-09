#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

// Files that use VirtualStitchTestSuite.extend() pattern
const filesToFix = [
  '/Users/anthony/Desktop/Current Projects/VirtualStitch/tests/integration/user-workflows.spec.ts',
  '/Users/anthony/Desktop/Current Projects/VirtualStitch/tests/quality/accessibility.spec.ts',
  '/Users/anthony/Desktop/Current Projects/VirtualStitch/tests/quality/performance.spec.ts',
  '/Users/anthony/Desktop/Current Projects/VirtualStitch/tests/quality/responsive.spec.ts',
  '/Users/anthony/Desktop/Current Projects/VirtualStitch/tests/quality/security.spec.ts'
];

async function fixTestFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    const originalContent = content;
    
    // Replace the import and extend pattern
    content = content.replace(
      /import\s*{\s*VirtualStitchTestSuite\s*}\s*from\s*['"][^'"]*['"];?\s*\n\s*const\s*{\s*test,\s*expect\s*}\s*=\s*VirtualStitchTestSuite\.extend\s*\(\s*{/,
      `import { test, expect } from '../__config__/base-test';\n\nconst extendedTest = test.extend({`
    );
    
    // Replace all test( calls with extendedTest(
    content = content.replace(/\n\s*test\(/g, '\n   extendedTest(');
    
    // Replace all test.describe( calls with extendedTest.describe(
    content = content.replace(/\n\s*test\.describe\(/g, '\n   extendedTest.describe(');
    
    // Replace test.beforeEach with extendedTest.beforeEach
    content = content.replace(/\n\s*test\.beforeEach\(/g, '\n   extendedTest.beforeEach(');
    
    // Replace test.afterEach with extendedTest.afterEach
    content = content.replace(/\n\s*test\.afterEach\(/g, '\n   extendedTest.afterEach(');
    
    // Fix parameter type annotations
    content = content.replace(/async \(\{\s*page\s*\},\s*use\)/g, 'async ({ page }, use: any)');
    content = content.replace(/\(msg\)/g, '(msg: any)');
    content = content.replace(/\(route\)/g, '(route: any)');
    content = content.replace(/\(request\)/g, '(request: any)');
    content = content.replace(/\(req\)/g, '(req: any)');
    content = content.replace(/\(cookie\)/g, '(cookie: any)');
    
    if (content !== originalContent) {
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${path.basename(filePath)}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 Fixing test extension files...\n');
  
  let fixedCount = 0;
  for (const file of filesToFix) {
    if (await fixTestFile(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n🎯 Fixed ${fixedCount} test extension files`);
}

main().catch(console.error);
