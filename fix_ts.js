const fs = require('fs');
const file = 'packages/core/src/editor/Canvas.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('const renderWire = (wire) => {', 'const renderWire = (wire: any) => {');
content = content.replace('const getPointKey = (x, y) =>', 'const getPointKey = (x: number, y: number) =>');
content = content.replace('const allPoints = new Set();', 'const allPoints = new Set<string>();');
content = content.replace('for (const ptStr of allPoints) {', 'for (const ptStr of Array.from(allPoints)) {');
content = content.replace('const readings = {};', 'const readings: Record<string, string> = {};');
content = content.replace('const renderComponent = (comp) => {', 'const renderComponent = (comp: any) => {');

fs.writeFileSync(file, content, 'utf8');
console.log("TS Fixed");
