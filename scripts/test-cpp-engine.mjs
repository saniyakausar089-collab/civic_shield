// Test suite for C++ cascade engine (Phase 4C)
import { execFile } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const root = path.resolve('.');
const bin = process.platform === 'win32'
  ? path.join(root, 'build', 'cascade_cli.exe')
  : path.join(root, 'build', 'cascade_cli');
const networkPath = path.join(root, 'public', 'data', 'network.json');
const hoodsPath = path.join(root, 'public', 'data', 'neighborhoods.geojson');
const scenariosPath = path.join(root, 'public', 'data', 'scenarios.json');

if (!fs.existsSync(bin)) {
  console.error(`Binary not found at ${bin}. Run 'npm run build:cpp' or make first.`);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(scenariosPath, 'utf8'));
const scenarios = Array.isArray(raw) ? raw : raw.scenarios;

function runEngine(args, inputData) {
  return new Promise((resolve) => {
    const child = execFile(bin, args, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      resolve({ code: err ? (err.code || 1) : 0, stdout: stdout || '', stderr: stderr || '' });
    });
    if (inputData) {
      child.stdin.write(inputData);
      child.stdin.end();
    }
  });
}

async function main() {
  console.log('=== TEST 1: Running All 5 Scenarios Through C++ CLI ===');
  const cases = scenarios.map((sc) => ({ scenario: sc, opts: {} }));
  const res = await runEngine([networkPath, hoodsPath, '-'], JSON.stringify(cases));
  if (res.stderr) console.log('CLI Stderr:', res.stderr.trim());
  if (res.code !== 0) {
    console.error('FAIL: CLI exited with code', res.code);
    process.exit(1);
  }
  const results = JSON.parse(res.stdout);
  console.log(`Parsed ${results.length} scenario results.`);

  for (const r of results) {
    console.log(`\nScenario: ${r.scenario_id}`);
    console.log(`  Peak Affected: ${r.summary.peak_affected_pop} at T+${r.summary.peak_t}h`);
    console.log(`  Final Failed: ${r.summary.final_failed}, Final Degraded: ${r.summary.final_degraded}`);
    console.log(`  Hospitals Down Peak: ${r.summary.peak_hospitals_down}`);
    console.log(`  Affected Pop-Hours: ${r.summary.affected_pop_hours}`);
  }

  const pipe = results.find((r) => r.scenario_id === 'pipeline_burst');
  if (pipe && pipe.summary.peak_affected_pop === 428000 && pipe.summary.final_failed === 5) {
    console.log('\nPASS: Pipeline burst results match expected values.');
  } else {
    console.error('FAIL: Pipeline burst mismatch');
    process.exit(1);
  }

  const monsoon = results.find((r) => r.scenario_id === 'monsoon_flood');
  if (monsoon && monsoon.summary.peak_affected_pop === 568000 && monsoon.summary.final_failed === 7) {
    console.log('PASS: Monsoon flood results match expected values.');
  } else {
    console.error('FAIL: Monsoon flood mismatch');
    process.exit(1);
  }

  const heatwave = results.find((r) => r.scenario_id === 'heatwave_overload');
  if (heatwave && heatwave.summary.peak_affected_pop === 710000 && heatwave.summary.final_failed === 21) {
    console.log('PASS: Heatwave overload results match expected values.');
  } else {
    console.error('FAIL: Heatwave overload mismatch');
    process.exit(1);
  }

  console.log('\n=== TEST 2: Testing Malformed Input ===');
  const badJsonRes = await runEngine([networkPath, hoodsPath, '-'], '{ not valid json');
  if (badJsonRes.code !== 0 && badJsonRes.stderr.includes('error:')) {
    console.log('PASS: Malformed JSON correctly rejected with error message.');
  } else {
    console.error('FAIL: Malformed JSON not rejected properly.');
    process.exit(1);
  }

  console.log('\n=== TEST 3: Testing Missing Files ===');
  const missingFileRes = await runEngine(['non_existent.json', hoodsPath, '-'], '[]');
  if (missingFileRes.code !== 0 && missingFileRes.stderr.includes('cannot open')) {
    console.log('PASS: Missing file correctly rejected.');
  } else {
    console.error('FAIL: Missing file test failed.');
    process.exit(1);
  }

  console.log('\n=== TEST 4: Testing Invalid Scenario (missing triggers) ===');
  const invalidScRes = await runEngine([networkPath, hoodsPath, '-'], JSON.stringify([{ scenario: { id: 'bad' } }]));
  if (invalidScRes.code !== 0 && invalidScRes.stderr.includes('error:')) {
    console.log('PASS: Missing required field rejected with error.');
  } else {
    console.error('FAIL: Missing required field test failed.');
    process.exit(1);
  }

  console.log('\nAll C++ engine tests passed successfully!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

