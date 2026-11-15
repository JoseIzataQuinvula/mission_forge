// Probe the ordering of DLRE_PRP_SOUTH.TAB using HTTP range requests.
const URL_ =
  'https://pds-geosciences.wustl.edu/lro/urn-nasa-pds-lro_diviner_derived1/data_derived_prp/dlre_prp_south.tab';
const ROW = 210;
const HEADER_ROWS = 1; // record 1 is the header line

async function rows(index) {
  const start = ROW * (index + HEADER_ROWS);
  const end = start + ROW * 2 - 1;
  const res = await fetch(URL_, { headers: { Range: `bytes=${start}-${end}` } });
  const text = await res.text();
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const clon = parseFloat(line.slice(126, 141));
      const clat = parseFloat(line.slice(143, 158));
      const alt = parseFloat(line.slice(160, 175));
      const tAvg = parseFloat(line.slice(177, 185));
      const tMax = parseFloat(line.slice(187, 195));
      const ice = parseFloat(line.slice(197, 208));
      return { clon: +clon.toFixed(3), clat: +clat.toFixed(3), alt: +alt.toFixed(3), tAvg, tMax, ice };
    });
}

const probes = [0, 1, 2398, 2399, 2400, 2401, 1199 * 2400, 1199 * 2400 + 1, 1440000, 2879999];
for (const idx of probes) {
  try {
    const r = await rows(idx);
    console.log(idx, JSON.stringify(r));
  } catch (error) {
    console.log(idx, 'ERROR', error.message);
  }
}
