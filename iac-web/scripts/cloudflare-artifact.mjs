import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repository = resolve(root, '..')
const args = process.argv.slice(2)
if (args[0] === '--') args.shift()
const options = {}
while (args.length) {
  const key = args.shift()
  if (key === '--rolldown-wasm') {
    options[key] = true
    continue
  }
  if (!['--revision', '--frontend-origin'].includes(key) || !args[0]) {
    throw new Error(
      'Usage: artifact:cloudflare --revision FULL_SHA [--frontend-origin ORIGIN] [--rolldown-wasm]',
    )
  }
  options[key] = args.shift()
}
const revision = options['--revision']
if (!/^[a-f0-9]{40}$/.test(revision || '')) {
  throw new Error('An explicit full source commit SHA is required')
}

// Inherit OS/tool paths only; never load the checkout's .env or credentials into
// the source snapshot or build. Wrangler dry-run does not need authentication.
const env = Object.fromEntries(
  Object.entries(process.env).filter(([key]) =>
    ['PATH', 'HOME', 'TMPDIR', 'TMP', 'TEMP', 'SystemRoot'].includes(key),
  ),
)
env.CI = '1'
env.WRANGLER_SEND_METRICS = 'false'
env.CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV = 'false'
env.IAC_CF_FRONTEND_ORIGIN =
  options['--frontend-origin'] || 'http://127.0.0.1:8787'

function run(command, args, cwd = root, capture = false, input) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    input,
    stdio: capture || input ? ['pipe', 'pipe', 'pipe'] : 'inherit',
    maxBuffer: 64 * 1024 * 1024,
  })
  if (result.error || result.status !== 0) {
    // Do not dump captured process output: dependency scripts may contain env.
    throw new Error(
      `${command} failed (${result.status ?? result.error?.code})`,
    )
  }
  return result.stdout
}

const sha256 = (data) => createHash('sha256').update(data).digest('hex')
const toolingFiles = [
  'vite.cloudflare.config.ts',
  'cloudflare/worker.mjs',
  'wrangler.cloudflare.json',
]
const toolingHashes = Object.fromEntries(
  toolingFiles.map((path) => [path, sha256(readFileSync(join(root, path)))]),
)
const toolingDependencyLockSha256 = sha256(
  readFileSync(join(root, 'cloudflare/pnpm-lock.yaml')),
)
const builderSha256 = sha256(readFileSync(fileURLToPath(import.meta.url)))
const bundlerAdapterSha256 = sha256(
  readFileSync(join(root, 'scripts/cloudflare-vite.mjs')),
)
const bundlerRuntime = options['--rolldown-wasm'] ? 'wasi-pinned' : 'native'
const toolingRevision = run('git', ['rev-parse', 'HEAD'], root, true)
  .toString()
  .trim()
const toolingWorktreeDirty =
  run('git', ['status', '--porcelain'], root, true).length > 0
const buildKey = sha256(
  JSON.stringify({
    toolingHashes,
    toolingDependencyLockSha256,
    builderSha256,
    bundlerAdapterSha256,
    bundlerRuntime,
    toolingRevision,
    frontendOrigin: env.IAC_CF_FRONTEND_ORIGIN,
  }),
).slice(0, 12)
run('git', ['cat-file', '-e', `${revision}^{commit}`], repository, true)
const archive = run('git', ['archive', revision, 'iac-web'], repository, true)
const artifact = join(root, '.cloudflare-artifacts', revision, buildKey)
// Refuse to mix two builds or silently reuse an old source snapshot.
mkdirSync(dirname(artifact), { recursive: true })
mkdirSync(artifact)
const source = join(artifact, 'source')
mkdirSync(source)
run('tar', ['-x', '--strip-components=1', '-C', source], root, false, archive)

const sourceFiles = run(
  'git',
  ['ls-tree', '-rz', '--name-only', revision, 'iac-web'],
  repository,
  true,
)
  .toString()
  .split('\0')
  .filter(Boolean)
  .map((path) => path.slice('iac-web/'.length))
const sourceHashes = Object.fromEntries(
  sourceFiles.map((path) => [path, sha256(readFileSync(join(source, path)))]),
)
for (const path of toolingFiles) {
  if (sourceFiles.includes(path)) {
    throw new Error(
      `Source already contains tooling: ${path}; review its integration explicitly`,
    )
  }
  mkdirSync(dirname(join(source, path)), { recursive: true })
  copyFileSync(join(root, path), join(source, path))
}

// Install the chosen revision's own locked application dependencies. Do not
// replace its package.json/lockfile with main's or reuse another revision's tree.
run('pnpm', ['install', '--frozen-lockfile'], source)
run('pnpm', ['run', 'test:regression'], source)
const viteArguments = [
  'build',
  '--config',
  'vite.cloudflare.config.ts',
  '--mode',
  'cloudflare',
]
if (options['--rolldown-wasm']) {
  run(
    process.execPath,
    [join(root, 'scripts/cloudflare-vite.mjs'), ...viteArguments],
    source,
  )
} else {
  run('pnpm', ['exec', 'vite', ...viteArguments], source)
}
// Verify real output, including CSS hash agreement between client and SSR.
const referencedAssets = new Set()
function checkAssetReferences(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) checkAssetReferences(path)
    else if (entry.name.endsWith('.mjs')) {
      for (const [asset] of readFileSync(path, 'utf8').matchAll(
        /\/app\/assets\/[A-Za-z0-9_.-]+\.(?:css|js)(?![A-Za-z0-9_.-])/g,
      )) {
        referencedAssets.add(asset)
        if (
          !existsSync(join(source, '.output-cloudflare.local/public', asset))
        ) {
          throw new Error(`SSR references a missing build asset: ${asset}`)
        }
      }
    }
  }
}
checkAssetReferences(join(source, '.output-cloudflare.local/server'))
if (!referencedAssets.size) throw new Error('No SSR asset references found')
run(
  process.execPath,
  [
    join(root, 'cloudflare/node_modules/wrangler/bin/wrangler.js'),
    'deploy',
    '--config',
    'wrangler.cloudflare.json',
    '--dry-run',
    '--outdir',
    '.output-cloudflare.local/bundle',
  ],
  source,
)
for (const [path, hash] of Object.entries(sourceHashes)) {
  if (sha256(readFileSync(join(source, path))) !== hash) {
    throw new Error(`Build changed archived application source: ${path}`)
  }
}
writeFileSync(
  join(artifact, 'manifest.json'),
  JSON.stringify(
    {
      sourceRevision: revision,
      sourceArchiveSha256: sha256(archive),
      sourceTreeUnchanged: true,
      assetReferencesChecked: referencedAssets.size,
      toolingRevision,
      toolingWorktreeDirty,
      toolingHashes,
      toolingDependencyLockSha256,
      builderSha256,
      bundlerAdapterSha256,
      bundlerRuntime,
      sourceFilesVerified: sourceFiles.length,
      frontendOrigin: env.IAC_CF_FRONTEND_ORIGIN,
      nodeVersion: process.version,
      pnpmVersion: run('pnpm', ['--version'], source, true).toString().trim(),
      wranglerVersion: '4.151.0',
      checks: [
        'frozen install',
        'test:regression',
        'vite build',
        'SSR JS/CSS asset references',
        'wrangler deploy --dry-run',
      ],
      deployed: false,
    },
    null,
    2,
  ) + '\n',
)
console.log(`Validated source snapshot (no Git checkout/worktree): ${artifact}`)
