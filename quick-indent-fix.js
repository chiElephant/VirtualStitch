#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function fixAllTestFiles() {
  const testFiles = [
    '/Users/anthony/Desktop/Current Projects/VirtualStitch/tests/integration/user-workflows.spec.ts',
    '/Users/anthony/Desktop/Current Projects/VirtualStitch/tests/quality/performance.spec.ts',
    '/Users/anthony/Desktop/Current Projects/VirtualStitch/tests/quality/responsive.spec.ts',
    '/Users/anthony/Desktop/Current Projects/VirtualStitch/tests/quality/security.spec.ts'
  ];

  for (const filePath of testFiles) {
    try {
      let content = await fs.readFile(filePath, 'utf8');
      const originalContent = content;
      
      // Fix all indentation issues for extendedTest calls
      content = content.replace(/\n\s+extendedTest\(/g, '\n    extendedTest(');
      content = content.replace(/\n\s+extendedTest\.describe\(/g, '\n  extendedTest.describe(');
      content = content.replace(/\n\s+extendedTest\.beforeEach\(/g, '\n  extendedTest.beforeEach(');
      content = content.replace(/\n\s+extendedTest\.afterEach\(/g, '\n  extendedTest.afterEach(');
      
      // Fix setup method calls
      content = content.replace(/suite\.setup\.initializeApp\(\)/g, 'suite.setup()');
      content = content.replace(/suite\.setup\.enableSecurityMonitoring\(\)/g, 'suite.enableSecurityMonitoring()');
      
      // Fix specific wait method calls
      content = content.replace(/suite\.wait\.forLayoutStabilization\(\)/g, 'suite.wait.forStateStabilization()');
      
      if (content !== originalContent) {
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`✅ Fixed: ${path.basename(filePath)}`);
      }
    } catch (error) {
      console.error(`❌ Error fixing ${filePath}:`, error.message);
    }
  }
}

fixAllTestFiles();
