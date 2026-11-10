// Usa únicamente TypeScript y el runner incluidos en el proyecto/Node.
const { spawnSync } = require('node:child_process');
const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const root = join(__dirname, '..');
const compile = spawnSync(process.execPath, [require.resolve('typescript/bin/tsc'), '-p', 'tsconfig.tests.json'], { cwd: root, stdio: 'inherit' });
if (compile.status !== 0) process.exit(compile.status ?? 1);
mkdirSync(join(root, '.test-build'), { recursive: true });
writeFileSync(join(root, '.test-build', 'package.json'), '{"type":"commonjs"}');
const run = spawnSync(process.execPath, ['--test', '--test-isolation=none', 'tests/deteccion.test.cjs'], { cwd: root, stdio: 'inherit' });
process.exit(run.status ?? 1);
