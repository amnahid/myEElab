const fs = require('fs');
const file = 'packages/core/src/editor/Canvas.tsx';
let content = fs.readFileSync(file, 'utf8');

const insertPoint = content.lastIndexOf('</Layer>');
if (insertPoint !== -1) {
  const newBlock = `
          {/* Preview dot for DRAGGING existing wire points */}
          {previewSnapPos && (
             <Circle x={previewSnapPos.x} y={previewSnapPos.y} radius={8} stroke={theme === 'dark' ? '#f1c40f' : '#e67e22'} strokeWidth={3} fill="transparent" listening={false} />
          )}
`;
  content = content.substring(0, insertPoint) + newBlock + content.substring(insertPoint);
  fs.writeFileSync(file, content);
}
