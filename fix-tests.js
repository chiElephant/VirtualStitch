const fs = require('fs');
const path = require('path');

// Function to recursively find all .spec.ts files
function findSpecFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findSpecFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith('.spec.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to fix a single file
function fixTestFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Replace testSuite with suite
    if (content.includes('testSuite')) {
      content = content.replace(/testSuite/g, 'suite');
      modified = true;
    }
    
    // Fix parameter type annotations
    const fixes = [
      [/async \(\{ page \}, use\)/g, 'async ({ page }, use: any)'],
      [/\(msg\)/g, '(msg: any)'],
      [/\(route\)/g, '(route: any)'],
      [/\(request\)/g, '(request: any)'],
      [/\(req\)/g, '(req: any)'],
      [/\(cookie\)/g, '(cookie: any)'],
      [/\(response\)/g, '(response: any)']
    ];
    
    for (const [pattern, replacement] of fixes) {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
console.log('🔧 Starting TypeScript test fixes...\n');

const testsDir = '/Users/anthony/Desktop/Current Projects/VirtualStitch/tests';
const specFiles = findSpecFiles(testsDir);

console.log(`Found ${specFiles.length} test files to process:\n`);

let fixedCount = 0;
for (const file of specFiles) {
  if (fixTestFile(file)) {
    fixedCount++;
  }
}

console.log(`\n🎯 Fix completed!`);
console.log(`📁 Total files processed: ${specFiles.length}`);
console.log(`✅ Files modified: ${fixedCount}`);
console.log(`📋 Files unchanged: ${specFiles.length - fixedCount}`);
