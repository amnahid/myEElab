const fs = require('fs');
const file = 'packages/core/src/editor/Canvas.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove the old preview dot block (it's between the dashed Line and ComponentNode ghost)
const oldBlockStart = `{mode === 'wire' && drawingWirePoints.length > 0 && mousePos && (() => {
             let onWire = false;`;
const oldBlockEnd = `return null;
          })()}`;

const startIndex = content.indexOf(oldBlockStart);
if (startIndex !== -1) {
  const endIndex = content.indexOf(oldBlockEnd, startIndex) + oldBlockEnd.length;
  content = content.substring(0, startIndex) + content.substring(endIndex);
}

// 2. Insert the new preview dot block at the very end of the return statement (before </Layer>)
const newBlock = `
          {/* Approach A: Hollow preview dot (Moved here to ensure it renders ON TOP of everything, including pin indicators) */}
          {mode === 'wire' && drawingWirePoints.length > 0 && mousePos && (() => {
             let onWire = false;
             for (const wire of circuit.wires) {
               for (let i = 0; i < wire.points.length - 1; i++) {
                 const p1 = wire.points[i];
                 const p2 = wire.points[i+1];
                 const l2 = Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2);
                 let dist = 0;
                 if (l2 === 0) dist = Math.hypot(mousePos.x - p1.x, mousePos.y - p1.y);
                 else {
                   let t = ((mousePos.x - p1.x) * (p2.x - p1.x) + (mousePos.y - p1.y) * (p2.y - p1.y)) / l2;
                   t = Math.max(0, Math.min(1, t));
                   const projX = p1.x + t * (p2.x - p1.x);
                   const projY = p1.y + t * (p2.y - p1.y);
                   dist = Math.hypot(mousePos.x - projX, mousePos.y - projY);
                 }
                 if (dist <= 1) {
                   onWire = true;
                   break;
                 }
               }
               if (onWire) break;
             }
             if (!onWire) {
               for (const comp of circuit.components) {
                 const libComp = ComponentLibrary[comp.type];
                 if (!libComp) continue;
                 const rotRad = (comp.rotation || 0) * Math.PI / 180;
                 const cos = Math.round(Math.cos(rotRad));
                 const sin = Math.round(Math.sin(rotRad));
                 for (const pin of libComp.pins) {
                   const rx = comp.mirrored ? -pin.offset.x : pin.offset.x;
                   const ry = pin.offset.y;
                   const px = comp.position.x + (rx * cos - ry * sin);
                   const py = comp.position.y + (rx * sin + ry * cos);
                   if (Math.hypot(mousePos.x - px, mousePos.y - py) <= 1) {
                     onWire = true;
                     break;
                   }
                 }
                 if (onWire) break;
               }
             }
             if (onWire) {
               return <Circle x={mousePos.x} y={mousePos.y} radius={8} stroke={theme === 'dark' ? '#f1c40f' : '#e67e22'} strokeWidth={3} fill="transparent" listening={false} />;
             }
             return null;
          })()}
`;

const insertIndex = content.lastIndexOf('</Layer>');
if (insertIndex !== -1) {
  content = content.substring(0, insertIndex) + newBlock + content.substring(insertIndex);
}

fs.writeFileSync(file, content);
