#!/bin/bash

# Script to fix TypeScript errors in test files
# Replaces testSuite with suite in all test files

echo "🔧 Fixing TypeScript test parameter names..."

# Find all .spec.ts files and replace testSuite with suite
find /Users/anthony/Desktop/Current\ Projects/VirtualStitch/tests -name "*.spec.ts" -type f -exec sed -i '' 's/testSuite/suite/g' {} +

echo "✅ Fixed testSuite -> suite parameter names"

# Replace other common parameter issues
find /Users/anthony/Desktop/Current\ Projects/VirtualStitch/tests -name "*.spec.ts" -type f -exec sed -i '' 's/async ({ page }, use)/async ({ page }, use: any)/g' {} +
find /Users/anthony/Desktop/Current\ Projects/VirtualStitch/tests -name "*.spec.ts" -type f -exec sed -i '' 's/(msg)/(msg: any)/g' {} +
find /Users/anthony/Desktop/Current\ Projects/VirtualStitch/tests -name "*.spec.ts" -type f -exec sed -i '' 's/(route)/(route: any)/g' {} +
find /Users/anthony/Desktop/Current\ Projects/VirtualStitch/tests -name "*.spec.ts" -type f -exec sed -i '' 's/(request)/(request: any)/g' {} +
find /Users/anthony/Desktop/Current\ Projects/VirtualStitch/tests -name "*.spec.ts" -type f -exec sed -i '' 's/(req)/(req: any)/g' {} +

echo "✅ Fixed parameter type annotations"

echo "🎯 All TypeScript test fixes completed!"
