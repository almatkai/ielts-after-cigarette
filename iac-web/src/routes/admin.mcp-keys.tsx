import { createFileRoute } from '@tanstack/react-router'

import { MCPKeysPage } from '@/pages/admin/mcp-keys/mcp-keys-page'

export const Route = createFileRoute('/admin/mcp-keys')({
  component: MCPKeysPage,
})
