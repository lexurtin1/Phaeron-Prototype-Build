import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PULSE_MODULES } from '@/lib/modules'
import { STUB_USER } from '@/lib/user'

export function generateStaticParams() {
  return PULSE_MODULES.filter((m) => m.status === 'live').map((m) => ({ tool: m.id }))
}

export default async function ToolPage({ params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params
  const mod = PULSE_MODULES.find((m) => m.id === tool)

  if (!mod || mod.status === 'coming-soon') notFound()

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        background: '#0f0f0f',
      }}
    >
      {/* Minimal top bar */}
      <header
        style={{
          height: '44px',
          minHeight: '44px',
          background: '#111',
          borderBottom: '1px solid #222',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: '16px',
          flexShrink: 0,
        }}
      >
        <Link
          href="/"
          style={{
            color: '#888',
            textDecoration: 'none',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap',
          }}
        >
          ← Pulse
        </Link>
        <div style={{ width: '1px', height: '16px', background: '#333' }} />
        <span
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#e0e0e0',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {mod.name}
        </span>
        <span style={{ fontSize: '13px', color: '#555', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {STUB_USER.name}
        </span>
      </header>

      {/* Full-screen iframe */}
      <iframe
        src={`${mod.prototypePath}index.html`}
        title={mod.name}
        allow="clipboard-read; clipboard-write"
        style={{
          flex: 1,
          border: 'none',
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </div>
  )
}
