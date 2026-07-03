import Link from 'next/link'
import { PULSE_MODULES } from '@/lib/modules'
import { STUB_USER } from '@/lib/user'

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0f0f0f',
        color: '#e0e0e0',
        fontFamily: 'system-ui, sans-serif',
        padding: '48px',
      }}
    >
      <h1 style={{ fontSize: '20px', fontWeight: 600 }}>Calastone Pulse</h1>
      <p style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>Signed in as {STUB_USER.name}</p>
      <ul style={{ marginTop: '32px', listStyle: 'none', padding: 0, display: 'grid', gap: '10px' }}>
        {PULSE_MODULES.map((mod) => (
          <li key={mod.id}>
            {mod.status === 'live' ? (
              <Link href={`/${mod.id}`} style={{ color: '#4fd1c5', textDecoration: 'none' }}>
                {mod.name}
              </Link>
            ) : (
              <span style={{ color: '#555' }}>{mod.name} (coming soon)</span>
            )}
          </li>
        ))}
      </ul>
    </main>
  )
}
