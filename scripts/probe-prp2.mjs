// Discriminate lat(rho) model (stereographic vs linear) + lon convention with interior points.
import fs from 'node:fs';

const URL_ = 'https://pds-geosciences.wustl.edu/lro/urn-nasa-pds-lro_diviner_derived1/data_derived_prp/dlre_prp_south.tab';
const TMP = process.env.TEMP + '/dlre_prp_south.tab';
if (!fs.existsSync(TMP)) {
  const res = await fetch(URL_);
  const reader = res.body.getReader();
  const chunks = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(Buffer.from(value));
  }
  fs.writeFileSync(TMP, Buffer.concat(chunks));
}
const fd = fs.openSync(TMP, 'r');
const REC = 210;
function rec(idx) {
  const buf = Buffer.alloc(REC);
  fs.readSync(fd, buf, 0, REC, REC * (idx + 1));
  return {
    clon: parseFloat(buf.toString('latin1', 126, 142)),
    clat: parseFloat(buf.toString('latin1', 143, 159)),
  };
}
// (line i, cell j) -> record 2*(i*1200+j)
const probes = [
  ['0,300', (0 * 1200 + 300) * 2],
  ['0,600', (0 * 1200 + 600) * 2],
  ['300,600', (300 * 1200 + 600) * 2],
  ['600,600', (600 * 1200 + 600) * 2],
  ['900,600', (900 * 1200 + 600) * 2],
  ['600,0', (600 * 1200 + 0) * 2],
  ['600,1199', (600 * 1200 + 1199) * 2],
  ['1199,600', (1199 * 1200 + 600) * 2],
];
const R = 1737.4;
const degPerKm = 180 / (Math.PI * R);
const out = [];
for (const [name, idx] of probes) {
  const r = rec(idx);
  const [li, cj] = name.split(',').map(Number);
  const x = -300 + cj * 0.5 + 0.25;      // cell center x (km)
  const y = 300 - li * 0.5 - 0.25;       // cell center y (km)
  const rho = Math.hypot(x, y);
  const lonModel = Math.atan2(x, y) * 180 / Math.PI;
  const latStereo = (2 * Math.atan(rho / (2 * R)) - Math.PI / 2) * 180 / Math.PI;
  const latLinear = -90 + rho * degPerKm;
  out.push({ cell: name, idx, obs: r, rho, lonModel, latStereo, latLinear });
}
console.log(JSON.stringify(out, null, 1));
fs.closeSync(fd);
