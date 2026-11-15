// Quick probe: decode the LOLA JPEG2000 raster and report frame info + value range.
import { readFileSync } from 'node:fs';

const OpenJPEGJS = (await import('@cornerstonejs/codec-openjpeg/decode')).default;
const lib = await OpenJPEGJS();

const path = process.argv[2] ?? 'public/data/nasa/raw/lola/ldem_75s_240m.jp2';
const bytes = readFileSync(path);

const decoder = new lib.J2KDecoder();
const encoded = decoder.getEncodedBuffer(bytes.length);
new Uint8Array(encoded).set(bytes);
decoder.readHeader();
decoder.decode();

const frameInfo = decoder.getFrameInfo();
console.log('frameInfo:', frameInfo);

const buffer = decoder.getDecodedBuffer();
const ctor =
  frameInfo.bitsPerSample <= 8
    ? Uint8Array
    : frameInfo.bitsPerSample <= 16
      ? Int16Array
      : Int32Array;
const data = new ctor(buffer);
console.log('samples:', data.length, 'expected:', frameInfo.width * frameInfo.height);

let min = Number.POSITIVE_INFINITY;
let max = Number.NEGATIVE_INFINITY;
let sum = 0;
for (let i = 0; i < data.length; i++) {
  const v = data[i];
  if (v < min) min = v;
  if (v > max) max = v;
  sum += v;
}
console.log('raw min/max/mean:', min, max, sum / data.length);
console.log('elevation min/max/mean (raw * 0.5):', min * 0.5, max * 0.5, (sum / data.length) * 0.5);
