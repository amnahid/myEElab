const fs = require('fs');
const file = 'packages/core/src/editor/Canvas.tsx';
const content = fs.readFileSync(file, 'utf8');

const startMarker = '{circuit.wires.map(wire => {';
const endMarker = '          })()}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker, startIndex) + endMarker.length;

if (startIndex === -1 || endIndex < startIndex) {
  console.error("Markers not found");
  process.exit(1);
}

const replacement = `{/* Render in z-index order: Unselected Wires -> Unselected Components -> Junction Dots -> Selected Wires -> Selected Components */}
          {(() => {
            const renderWire = (wire) => {
              const isSelected = selectedIds.includes(wire.id);
              return (
                <WireNode 
                  key={wire.id} 
                  wire={wire} 
                  isSelected={isSelected}
                  theme={theme}
                  onSelect={(e) => {
                    if (mode === 'probe') {
                      const resolver = new NodeResolver();
                      const resolved = resolver.resolve(circuit);
                      const node = resolved.wires.get(wire.id);
                      if (node && typeof node === 'string' && node !== '0') {
                        const stage = e.target.getStage();
                        const pointer = stage.getPointerPosition();
                        const rawX = (pointer.x - stage.x()) / stage.scaleX();
                        const rawY = (pointer.y - stage.y()) / stage.scaleX();
                        
                        let minSqDist = Infinity;
                        let closest = { x: rawX, y: rawY };
                        for (let i = 0; i < wire.points.length - 1; i++) {
                          const p1 = wire.points[i];
                          const p2 = wire.points[i + 1];
                          const l2 = Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2);
                          if (l2 === 0) continue;
                          let t = ((rawX - p1.x) * (p2.x - p1.x) + (rawY - p1.y) * (p2.y - p1.y)) / l2;
                          t = Math.max(0, Math.min(1, t));
                          const projX = p1.x + t * (p2.x - p1.x);
                          const projY = p1.y + t * (p2.y - p1.y);
                          const distSq = Math.pow(rawX - projX, 2) + Math.pow(rawY - projY, 2);
                          if (distSq < minSqDist) {
                            minSqDist = distSq;
                            closest = { x: projX, y: projY };
                          }
                        }
                        toggleProbe(node, closest.x, closest.y);
                      }
                    } else if (mode === 'select') {
                      e.cancelBubble = true;
                      if (!e.evt.shiftKey && !selectedIds.includes(wire.id)) {
                        setSelection([wire.id]);
                      } else if (e.evt.shiftKey) {
                        setSelection([...selectedIds, wire.id]);
                      }
                    }
                  }}
                  onPointDragStart={() => {
                    if (!selectedIds.includes(wire.id)) {
                      setSelection([wire.id]);
                    }
                    useEditorStore.temporal.getState().pause();
                  }}
                  onPointDragEnd={(index, x, y) => {
                    const snapped = getMagneticSnap({x, y}) || {
                      x: Math.round(x / 10) * 10,
                      y: Math.round(y / 10) * 10
                    };
                    useEditorStore.temporal.getState().resume();
                    updateWirePoint(wire.id, index, snapped);
                  }}
                  onPointDragMove={(index, x, y) => {
                    updateWirePoint(wire.id, index, { x, y });
                  }}
                  onDblClick={() => setEditingComponent(wire.id)}
                />
              );
            };

            const junctionDots = [];
            const getPointKey = (x, y) => \`\${Math.round(x * 100) / 100},\${Math.round(y * 100) / 100}\`;
            
            const segments = [];
            for (const wire of circuit.wires) {
               for (let i = 0; i < wire.points.length - 1; i++) {
                 segments.push({ p1: wire.points[i], p2: wire.points[i+1] });
               }
            }

            const allPoints = new Set();
            for (const wire of circuit.wires) {
               for (const p of wire.points) {
                 allPoints.add(getPointKey(p.x, p.y));
               }
            }
            for (const comp of circuit.components) {
               const libComp = ComponentLibrary[comp.type];
               if (libComp) {
                 const rotRad = (comp.rotation || 0) * Math.PI / 180;
                 const cos = Math.round(Math.cos(rotRad));
                 const sin = Math.round(Math.sin(rotRad));
                 for (const pin of libComp.pins) {
                   const rx = comp.mirrored ? -pin.offset.x : pin.offset.x;
                   const ry = pin.offset.y;
                   const x = comp.position.x + (rx * cos - ry * sin);
                   const y = comp.position.y + (rx * sin + ry * cos);
                   allPoints.add(getPointKey(x, y));
                 }
               }
            }

            for (const ptStr of allPoints) {
              const [px, py] = ptStr.split(',').map(Number);
              let degree = 0;
              for (const seg of segments) {
                const l2 = Math.pow(seg.p2.x - seg.p1.x, 2) + Math.pow(seg.p2.y - seg.p1.y, 2);
                let dist = 0;
                if (l2 === 0) {
                  dist = Math.hypot(px - seg.p1.x, py - seg.p1.y);
                } else {
                  let t = ((px - seg.p1.x) * (seg.p2.x - seg.p1.x) + (py - seg.p1.y) * (seg.p2.y - seg.p1.y)) / l2;
                  t = Math.max(0, Math.min(1, t));
                  const projX = seg.p1.x + t * (seg.p2.x - seg.p1.x);
                  const projY = seg.p1.y + t * (seg.p2.y - seg.p1.y);
                  dist = Math.hypot(px - projX, py - projY);
                }
                
                if (dist <= 1) {
                  const atEndpoint = Math.hypot(px - seg.p1.x, py - seg.p1.y) <= 1 || Math.hypot(px - seg.p2.x, py - seg.p2.y) <= 1;
                  if (atEndpoint) {
                     degree += 1;
                  } else {
                     degree += 2;
                  }
                }
              }
              if (degree >= 3) {
                 junctionDots.push(
                    <Circle key={\`junc-\${ptStr}\`} x={px} y={py} radius={3.5} fill={theme === 'dark' ? '#cdd6f4' : '#34495e'} listening={false} />
                 );
              }
            }

            const readings = {};
            if (nodeVoltages && Object.keys(nodeVoltages).length > 0) {
              const resolver = new NodeResolver();
              const { components } = resolver.resolve(circuit);
              for (const comp of circuit.components) {
                if (comp.type === 'multimeter') {
                  const pinMap = components.get(comp.id);
                  if (pinMap) {
                    const n1 = pinMap.get('1') || '0';
                    const n2 = pinMap.get('2') || '0';
                    let reading = 0;
                    if (comp.params.mode === 'current') {
                      const branchName = \`v.vmm_\${comp.id.replace(/-/g, '').toLowerCase()}#branch\`;
                      reading = nodeVoltages[branchName] || 0;
                    } else {
                      const v1 = n1 === '0' ? 0 : (nodeVoltages[\`v(\${n1})\`] || 0);
                      const v2 = n2 === '0' ? 0 : (nodeVoltages[\`v(\${n2})\`] || 0);
                      reading = v1 - v2;
                    }
                    const abs = Math.abs(reading);
                    let formatted = '0.00 V';
                    if (comp.params.mode === 'current') {
                       if (abs === 0) formatted = '0.00 A';
                       else if (abs >= 1) formatted = \`\${parseFloat(reading.toFixed(3))} A\`;
                       else if (abs >= 1e-3) formatted = \`\${parseFloat((reading * 1e3).toFixed(3))} mA\`;
                       else if (abs >= 1e-6) formatted = \`\${parseFloat((reading * 1e6).toFixed(3))} µA\`;
                       else formatted = \`\${reading.toExponential(2)} A\`;
                    } else {
                       if (abs === 0) formatted = '0.00 V';
                       else if (abs >= 1e3) formatted = \`\${parseFloat((reading / 1e3).toFixed(3))} kV\`;
                       else if (abs >= 1) formatted = \`\${parseFloat(reading.toFixed(3))} V\`;
                       else if (abs >= 1e-3) formatted = \`\${parseFloat((reading * 1e3).toFixed(3))} mV\`;
                       else if (abs >= 1e-6) formatted = \`\${parseFloat((reading * 1e6).toFixed(3))} µV\`;
                       else formatted = \`\${reading.toExponential(2)} V\`;
                    }
                    readings[comp.id] = formatted;
                  }
                }
              }
            }

            const renderComponent = (comp) => {
              const isSelected = selectedIds.includes(comp.id);
              const renderPos = comp.position;
              return (
                <ComponentNode
                  key={comp.id} 
                  component={{ ...comp, position: renderPos }} 
                  mode={mode}
                  isSelected={isSelected}
                  theme={theme}
                  activeView={activeView}
                  multimeterReading={readings[comp.id]}
                  onSelect={(e) => {
                    if (mode === 'probe') {
                      const resolver = new NodeResolver();
                      const resolved = resolver.resolve(circuit);
                      const pins = resolved.components.get(comp.id);
                      if (pins && typeof pins !== 'string') {
                         const node = pins.get("1");
                         if (node && node !== '0') {
                           const libComp = ComponentLibrary[comp.type];
                           const pin = libComp?.pins.find(p => p.id === "1");
                           let x = comp.position.x;
                           let y = comp.position.y;
                           if (pin) {
                             const rotRad = (comp.rotation || 0) * Math.PI / 180;
                             const cos = Math.round(Math.cos(rotRad));
                             const sin = Math.round(Math.sin(rotRad));
                             const rx = pin.offset.x * cos - pin.offset.y * sin;
                             const ry = pin.offset.x * sin + pin.offset.y * cos;
                             x += rx;
                             y += ry;
                           }
                           toggleProbe(node, x, y);
                         }
                      }
                    } else if (mode === 'select') {
                      const stage = e.target.getStage();
                      const pos = getRelativePointerPosition(stage);
                      const pinSnap = getMagneticSnap(pos, 12);
                      if (!pinSnap) {
                        if (!e.evt.shiftKey && !selectedIds.includes(comp.id)) {
                          setSelection([comp.id]);
                        } else if (e.evt.shiftKey) {
                          setSelection([...selectedIds, comp.id]);
                        }
                      }
                    }
                  }}
                  onDblClick={() => setEditingComponent(comp.id)}
                  onDragStart={(e) => {
                    if (!selectedIds.includes(comp.id)) {
                      setSelection([comp.id]);
                    }
                    e.target.moveToTop();
                    useEditorStore.temporal.getState().pause();
                  }}
                  onDragMove={(e) => {
                    updateComponentPosition(comp.id, { x: e.target.x(), y: e.target.y() });
                  }}
                  onDragEnd={(e) => {
                    const newPos = {
                      x: Math.round(e.target.x() / 10) * 10,
                      y: Math.round(e.target.y() / 10) * 10
                    };
                    useEditorStore.temporal.getState().resume();
                    updateComponentPosition(comp.id, newPos);
                  }}
                  onMouseEnter={() => setHoveredComponentId(comp.id)}
                  onMouseLeave={() => setHoveredComponentId(null)}
                />
              );
            };

            const unselectedWires = circuit.wires.filter(w => !selectedIds.includes(w.id));
            const selectedWires = circuit.wires.filter(w => selectedIds.includes(w.id));
            const unselectedComps = circuit.components.filter(c => !selectedIds.includes(c.id));
            const selectedComps = circuit.components.filter(c => selectedIds.includes(c.id));

            return (
              <>
                {unselectedWires.map(renderWire)}
                {unselectedComps.map(renderComponent)}
                {junctionDots}
                {selectedWires.map(renderWire)}
                {selectedComps.map(renderComponent)}
              </>
            );
          })()}`;

const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
fs.writeFileSync(file, newContent, 'utf8');
console.log("Success");
