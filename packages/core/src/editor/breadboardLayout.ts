import { Point } from '../models/circuit';

export const GRID_SIZE = 15;
export const BOARD_WIDTH = 300;
export const BOARD_HEIGHT = 500;
export const START_Y = 25;

// Map hole ID to its (x, y) position on the breadboard canvas
export const getHolePosition = (id: string): Point | null => {
  if (!id) return null;

  if (id.startsWith('pwr-')) {
    const parts = id.split('-'); // pwr-left-+-1
    if (parts.length < 4) return null;
    const side = parts[1]; // left, right
    const polarity = parts[2]; // +, -
    const index = parseInt(parts[3], 10);

    let x = 0;
    if (side === 'left') {
      x = polarity === '-' ? 20 : 35;
    } else {
      x = polarity === '+' ? 265 : 280;
    }
    const y = START_Y + index * GRID_SIZE;
    return { x, y };
  }

  const match = id.match(/^(\d+)([a-j])$/);
  if (match) {
    const row = parseInt(match[1], 10);
    const colStr = match[2];
    const colIdx = colStr.charCodeAt(0) - 'a'.charCodeAt(0);

    const y = START_Y + (row - 1) * GRID_SIZE;

    if (colIdx < 5) {
      return { x: 70 + colIdx * GRID_SIZE, y };
    } else {
      return { x: 160 + (colIdx - 5) * GRID_SIZE, y };
    }
  }

  return null;
};

// Given a canvas coordinate (relative to the breadboard Group), find the nearest hole ID
export const getNearestHoleId = (x: number, y: number): string | null => {
  let bestDist = Infinity;
  let bestId: string | null = null;
  for (const hole of HOLES) {
    const pos = getHolePosition(hole.id);
    if (!pos) continue;
    const dx = x - pos.x;
    const dy = y - pos.y;
    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      bestDist = dist;
      bestId = hole.id;
    }
  }
  // Only snap if within ~10px
  if (bestDist > 100) return null;
  return bestId;
};

// Generate all holes for rendering
const generateHoles = (): { id: string; label?: string }[] => {
  const holes: { id: string; label?: string }[] = [];

  // Power rails (30 holes each)
  for (let i = 0; i < 30; i++) {
    holes.push({ id: `pwr-left---${i}`, label: '-' });
    holes.push({ id: `pwr-left-+-${i}`, label: '+' });
    holes.push({ id: `pwr-right-+-${i}`, label: '+' });
    holes.push({ id: `pwr-right---${i}`, label: '-' });
  }

  // Rows 1-30, columns a-j
  const cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
  for (let r = 1; r <= 30; r++) {
    for (const c of cols) {
      holes.push({ id: `${r}${c}` });
    }
  }
  return holes;
};

export const HOLES = generateHoles();
