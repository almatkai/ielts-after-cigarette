// Build-only adapter for the selected archive; application dependencies and
// native binaries stay byte-identical. Never imported by a deployed Worker.
import { createRequire, registerHooks } from 'node:module'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'

const selected = createRequire(resolve('package.json'))
const vitePackage = selected.resolve('vite/package.json')
const tooling = createRequire(
  new URL('../cloudflare/package.json', import.meta.url),
)
const store = resolve('node_modules/.pnpm')
const packages = readdirSync(store).filter((name) => /^rolldown@\d/.test(name))
const wasiPackages = {
  '1.1.5': '@rolldown/binding-wasm32-wasi',
  '1.2.1': 'rolldown-wasm-1-2-1',
}

// Rolldown 1.1.5 attempts native loading before checking FORCE_WASI. Its
// supported native-library override can resolve the matching WASI JS entry
// directly, avoiding macOS dlopen/code-validation entirely. Scope this setting
// to Rolldown's preload: other NAPI packages must keep their own bindings.
for (const name of packages) {
  const selectedPackage = resolve(
    store,
    name,
    'node_modules/rolldown/package.json',
  )
  const { version } = JSON.parse(readFileSync(selectedPackage, 'utf8'))
  const wasmName = wasiPackages[version]
  if (!wasmName)
    throw new Error('Review the exact selected Rolldown/WASI version')
  const wasmPackage = tooling.resolve(wasmName + '/package.json')
  if (JSON.parse(readFileSync(wasmPackage, 'utf8')).version !== version)
    throw new Error('Rolldown/WASI version mismatch')
  const overrides = {
    NAPI_RS_NATIVE_LIBRARY_PATH: tooling.resolve(wasmName),
    NAPI_RS_ASYNC_WORK_POOL_SIZE: '4',
    NAPI_RS_FORCE_WASI: undefined,
  }
  const before = Object.fromEntries(
    Object.keys(overrides).map((key) => [key, process.env[key]]),
  )
  try {
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
    await import(
      pathToFileURL(createRequire(selectedPackage).resolve('rolldown')).href
    )
  } finally {
    for (const [key, value] of Object.entries(before)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
  console.log(`[cloudflare-build] Rolldown ${version} using exact WASI binding`)
}
// A production build has no filesystem watcher. Vite's bundled Chokidar still
// probes this optional macOS-only addon on import. Model its supported absence
// (as on Linux) instead of loading another native addon during this build.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'fsevents') {
      const error = new Error(
        'Optional filesystem watcher omitted in the isolated build',
      )
      error.code = 'MODULE_NOT_FOUND'
      throw error
    }
    if (specifier === 'lightningcss') {
      const original = nextResolve(specifier, context)
      const manifest = resolve(
        dirname(fileURLToPath(original.url)),
        '../package.json',
      )
      const { version } = JSON.parse(readFileSync(manifest, 'utf8'))
      const name = {
        '1.33.0': 'lightningcss-wasm',
        '1.32.0': 'lightningcss-wasm-1-32-0',
      }[version]
      if (!name) throw new Error('Review the exact Lightning CSS/Wasm version')
      const entry = tooling.resolve(name)
      const target = context.conditions.includes('require')
        ? entry
        : entry.replace(/\.cjs$/, '.mjs')
      return { url: pathToFileURL(target).href, shortCircuit: true }
    }
    return nextResolve(specifier, context)
  },
})
const tailwindPackage = selected.resolve('@tailwindcss/vite')
const tailwindRequire = createRequire(tailwindPackage)
const oxideRequire = tailwindRequire
const oxide = oxideRequire.resolve('@tailwindcss/oxide')
const oxideVersion = JSON.parse(
  readFileSync(resolve(dirname(oxide), 'package.json'), 'utf8'),
).version
if (oxideVersion !== '4.3.3')
  throw new Error('Review the pinned Tailwind oxide WASI version')
const previousOverride = process.env.NAPI_RS_NATIVE_LIBRARY_PATH
try {
  process.env.NAPI_RS_NATIVE_LIBRARY_PATH = tooling.resolve(
    '@tailwindcss/oxide-wasm32-wasi',
  )
  oxideRequire('@tailwindcss/oxide')
} finally {
  if (previousOverride === undefined)
    delete process.env.NAPI_RS_NATIVE_LIBRARY_PATH
  else process.env.NAPI_RS_NATIVE_LIBRARY_PATH = previousOverride
}
const cli = resolve(dirname(vitePackage), 'bin/vite.js')
process.argv = [process.execPath, cli, ...process.argv.slice(2)]
await import(pathToFileURL(cli).href)
