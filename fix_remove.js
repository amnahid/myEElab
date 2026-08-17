const fs = require('fs');
const file = 'packages/core/src/editor/Canvas.tsx';
const lines = fs.readFileSync(file, 'utf8').split('\n');

// We want to delete from the duplicate `{/* Calculate Multimeter readings once */}`
// which is around line 632, down to the corresponding `})()` around 749.

const startIndex = lines.findIndex((l, i) => i > 600 && l.includes('{/* Calculate Multimeter readings once */}'));
const endIndex = lines.findIndex((l, i) => i > startIndex && l.trim() === '})()}');

if (startIndex !== -1 && endIndex !== -1) {
  lines.splice(startIndex, endIndex - startIndex + 1);
  fs.writeFileSync(file, lines.join('\n'), 'utf8');
  console.log("Duplicate block removed");
} else {
  console.log("Could not find block", startIndex, endIndex);
}
