import { readFileSync, statSync } from 'node:fs';

const checks = [];

function check(name, condition, detail) {
  checks.push({ name, ok: Boolean(condition), detail });
}

function read(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
}

function fileSize(path) {
  try {
    return statSync(path).size;
  } catch {
    return 0;
  }
}

const index = read('index.html');
const css = read('style.css');
const launcher = read('lancer-local.cmd');
const launcherScript = read('scripts/start-local.ps1');
const pdfPath = 'assets/rapport-cevennes-synthese.pdf';
const pdfSize = fileSize(pdfPath);
const pdfTarget = `${pdfPath}#page=1`;

check('index.html exists', index !== null, 'Create the GitHub Pages entry point.');
check('PDF asset exists', pdfSize > 400000, 'Copy the latest source PDF into assets/ with a URL-safe filename.');
check('local launcher exists', launcher !== null, 'Create lancer-local.cmd for one-click local launch.');
check('local launcher script exists', launcherScript !== null, 'Create scripts/start-local.ps1 for robust Windows launch logic.');

if (index) {
  check('index redirects to PDF page 1', index.includes(pdfTarget), 'The entry page must send visitors directly to page 1 of the PDF.');
  check('index has no PDF action buttons', !/Ouvrir le PDF|Télécharger/.test(index), 'The entry page must not show intermediate action buttons.');
  check('index does not embed a viewer', !/<object|<iframe/.test(index), 'The entry page should not be an intermediate PDF viewer.');
  check('index uses French title', index.includes('Cévennes'), 'The visible title should preserve the project name.');
}

if (css) {
  check('legacy CSS kept harmless', css.includes('@media'), 'The previous stylesheet can remain as an unused helper.');
}

if (launcher) {
  check('launcher calls PowerShell helper', launcher.includes('scripts\\start-local.ps1'), 'The launcher must call the PowerShell helper.');
  check('launcher opens local root URL', launcher.includes('http://127.0.0.1:8000/'), 'The launcher must open the local site root.');
}

if (launcherScript) {
  check('launcher script starts local HTTP server', launcherScript.includes('http.server') && launcherScript.includes('8000'), 'The helper must serve the repo locally on port 8000.');
  check('launcher script opens local root URL', launcherScript.includes('http://127.0.0.1:$Port/') && launcherScript.includes('Start-Process $LocalUrl'), 'The helper must open the local site root.');
}

const failed = checks.filter((item) => !item.ok);
for (const item of checks) {
  const mark = item.ok ? 'PASS' : 'FAIL';
  console.log(`${mark} ${item.name}`);
  if (!item.ok) console.log(`  ${item.detail}`);
}

if (failed.length > 0) {
  process.exitCode = 1;
}
