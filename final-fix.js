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

async function fixTestFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    const originalContent = content;
    
    // Fix any remaining VirtualStitchTestSuite.extend patterns
    content = content.replace(
      /import\s*{\s*VirtualStitchTestSuite\s*}\s*from\s*['"][^'"]*['"];?\s*\n\s*const\s*{\s*test,\s*expect\s*}\s*=\s*VirtualStitchTestSuite\.extend\s*\(\s*{/g,
      `import { test, expect } from '../__config__/base-test';\n\nconst extendedTest = test.extend({`
    );
    
    // Fix parameter type annotations
    content = content.replace(/async \(\{\s*page\s*\},\s*use\)/g, 'async ({ page }, use: any)');
    content = content.replace(/\(msg\)(?!\w)/g, '(msg: any)');
    content = content.replace(/\(route\)(?!\w)/g, '(route: any)');
    content = content.replace(/\(request\)(?!\w)/g, '(request: any)');
    content = content.replace(/\(req\)(?!\w)/g, '(req: any)');
    content = content.replace(/\(cookie\)(?!\w)/g, '(cookie: any)');
    
    // Fix test calls with proper indentation
    content = content.replace(/\n\s+test\(/g, '\n    extendedTest(');
    content = content.replace(/\n\s+test\.describe\(/g, '\n  extendedTest.describe(');
    content = content.replace(/\n\s+test\.beforeEach\(/g, '\n  extendedTest.beforeEach(');
    content = content.replace(/\n\s+test\.afterEach\(/g, '\n  extendedTest.afterEach(');
    
    // Fix improper indentation for extendedTest calls
    content = content.replace(/\n\s+extendedTest\(/g, '\n    extendedTest(');
    content = content.replace(/\n\s+extendedTest\.describe\(/g, '\n  extendedTest.describe(');
    content = content.replace(/\n\s+extendedTest\.beforeEach\(/g, '\n  extendedTest.beforeEach(');
    content = content.replace(/\n\s+extendedTest\.afterEach\(/g, '\n  extendedTest.afterEach(');
    
    // Fix setup method calls
    content = content.replace(/suite\.setup\.initializeApp\(\)/g, 'suite.setup()');
    content = content.replace(/suite\.setup\.enableSecurityMonitoring\(\)/g, 'suite.enableSecurityMonitoring()');
    content = content.replace(/suite\.setup\.enableProductionMonitoring\(\)/g, 'suite.setupManager.enableProductionMonitoring()');
    content = content.replace(/suite\.setup\.verifyEnvironmentHealth\(\)/g, 'suite.setupManager.verifyEnvironmentHealth()');
    
    // Fix wait method calls that might be missing
    content = content.replace(/suite\.wait\.forLayoutStabilization\(\)/g, 'suite.wait.forStateStabilization()');
    
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
  console.log('🔧 Final comprehensive fix for all test files...\n');
  
  const testFiles = await walkDirectory(testsDir);
  console.log(`Found ${testFiles.length} test files\n`);
  
  let fixedCount = 0;
  for (const file of testFiles) {
    if (await fixTestFile(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n🎯 Final fix completed! Modified ${fixedCount} files`);
}

main().catch(console.error);
