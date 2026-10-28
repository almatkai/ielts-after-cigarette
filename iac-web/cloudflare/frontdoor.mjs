// Preserve the existing DEV hostname and its OAuth/cookie origin. All runtime
// requests go to the native Cloudflare app; no VPS/VPC fallback is configured.
export default {
  fetch(request, env) {
    return env.DEV_WEB.fetch(request)
  },
}
