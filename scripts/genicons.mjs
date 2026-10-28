import zlib from 'zlib';
import fs from 'fs';

function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const dataBuf = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, dataBuf])));
  return Buffer.concat([len, typeBuf, dataBuf, crcBuf]);
}

function makePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      const dst = rowStart + 1 + x * 4;
      raw[dst] = rgba[src];
      raw[dst + 1] = rgba[src + 1];
      raw[dst + 2] = rgba[src + 2];
      raw[dst + 3] = rgba[src + 3];
    }
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function createIcon(size) {
  const radius = Math.round(size * 0.22);
  const navy = [12, 20, 40, 255];
  const white = [245, 247, 251, 255];
  const bg = Buffer.alloc(size * size * 4);
  const r2 = Math.max(0, radius - 1.5);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const inside = x >= radius && x < size - radius && y >= radius && y < size - radius;
      const cx = Math.min(Math.max(x, radius), size - 1 - radius);
      const cy = Math.min(Math.max(y, radius), size - 1 - radius);
      const rr = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
      const cornerInside = (x < radius || x >= size - radius || y < radius || y >= size - radius) ? rr <= r2 : true;
      const insideRounded = inside && cornerInside;
      bg[idx] = insideRounded ? navy[0] : 0;
      bg[idx + 1] = insideRounded ? navy[1] : 0;
      bg[idx + 2] = insideRounded ? navy[2] : 0;
      bg[idx + 3] = insideRounded ? navy[3] : 0;
    }
  }
  const w = Math.max(8, size * 0.11);
  const drawLine = (x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const steps = Math.ceil(len / 2);
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const cx = x1 + dx * t;
      const cy = y1 + dy * t;
      const half = w / 2 + 1;
      for (let oy = -half; oy <= half; oy++) {
        for (let ox = -half; ox <= half; ox++) {
          const px = cx + nx * ox;
          const py = cy + ny * oy;
          const ix = Math.round(px);
          const iy = Math.round(py);
          if (ix >= 0 && ix < size && iy >= 0 && iy < size) {
            const idx = (iy * size + ix) * 4;
            const d = Math.abs(px - ix) + Math.abs(py - iy);
            if (d < 1.5) {
              bg[idx] = white[0];
              bg[idx + 1] = white[1];
              bg[idx + 2] = white[2];
              bg[idx + 3] = white[3];
            }
          }
        }
      }
    }
  };
  const vTop = size * 0.35;
  const vBot = size * 0.9;
  const vMid = size * 0.22;
  drawLine(size * 0.27, vTop, size * 0.5, vMid);
  drawLine(size * 0.73, vTop, size * 0.5, vMid);

  const png = makePNG(size, size, bg);
  return png;
}

fs.writeFileSync('C:/Users/HP/veyro/public/icon-512.png', createIcon(512));
fs.writeFileSync('C:/Users/HP/veyro/public/icon-192.png', createIcon(192));
console.log('OK');
