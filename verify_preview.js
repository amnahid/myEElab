const fs = require('fs');
const file = 'packages/core/src/editor/Canvas.tsx';
const content = fs.readFileSync(file, 'utf8');

if (content.includes('radius={8}') && content.includes("stroke={theme === 'dark' ? '#f1c40f' : '#e67e22'} strokeWidth={3}")) {
  console.log("Preview dot updated successfully.");
} else {
  console.log("Preview dot NOT updated.");
}

const numPreviewBlocks = (content.match(/mode === 'wire' && drawingWirePoints\.length > 0 && mousePos && \(\(\) => \{/g) || []).length;
console.log("Number of preview blocks: " + numPreviewBlocks);
