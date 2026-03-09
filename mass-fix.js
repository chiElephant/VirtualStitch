#!/usr/bin/env node

const fs = require('fs').promises;

async function fixTestFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    const originalContent = content;
    
    // Fix import pattern
    content = content.replace(
      /import\s*{\s*VirtualStitchTestSuite\s*}\s*from\s*['"][^'"]*['"];?\s*\n\s*const\s*{\s*test,\s*expect\s*}\s*=\s*VirtualStitchTestSuite\.extend\s*\(\s*{/,
      `import { test, expect } from '../__config__/base-test';\n\nconst extendedTest = test.extend({`
    );
    
    // Fix parameter type annotations
    content = content.replace(/async \(\{\s*page\s*\},\s*use\)/g, 'async ({ page }, use: any)');
    content = content.replace(/\(msg\)/g, '(msg: any)');
    content = content.replace(/\(route\)/g, '(route: any)');
    content = content.replace(/\(request\)/g, '(request: any)');
    content = content.replace(/\(req\)/g, '(req: any)');
    content = content.replace(/\(cookie\)/g, '(cookie: any)');
    
    // Replace test calls with extendedTest, with proper indentation
    content = content.replace(/\n\s*test\(/g, '\n    extendedTest(');
    content = content.replace(/\n\s*test\.describe\(/g, '\n  extendedTest.describe(');
    content = content.replace(/\n\s*test\.beforeEach\(/g, '\n  extendedTest.beforeEach(');
    content = content.replace(/\n\s*test\.afterEach\(/g, '\n  extendedTest.afterEach(');
    
    // Fix any extra indentation issues
    content = content.replace(/\n\s+extendedTest\(/g, '\n    extendedTest(');
    content = content.replace(/\n\s+extendedTest\.describe\(/g, '\n  extendedTest.describe(');
    
    // Fix setup calls
    content = content.replace(/suite\.setup\.initializeApp\(\)/g, 'suite.setup()');
    content = content.replace(/suite\.setup\.enableSecurityMonitoring\(\)/g, 'suite.enableSecurityMonitoring()');
    
    if (content !== originalContent) {
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath.split('/').pop()}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  const filesToFix = [
    '/Users/anthony/Desktop/Current Projects/VirtualStitch/tests/integration/user-workflows.spec.ts',
    '/Users/anthony/Desktop/Current Projects/VirtualStitch/tests/quality/performance.spec.ts',
    '/Users/anthony/Desktop/Current Projects/VirtualStitch/tests/quality/responsive.spec.ts',
    '/Users/anthony/Desktop/Current Projects/VirtualStitch/tests/quality/security.spec.ts'
  ];
  
  console.log('🔧 Fixing remaining test extension files...\n');
  
  let fixedCount = 0;
  for (const file of filesToFix) {
    if (await fixTestFile(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n🎯 Fixed ${fixedCount} test extension files`);
}

main().catch(console.error);
