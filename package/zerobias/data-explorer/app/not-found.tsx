"use client"
import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>404 - Not Found</h2>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Could not find requested resource</p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: '0.5rem 1.5rem',
            background: '#2563eb',
            color: 'white',
            borderRadius: '0.375rem',
            textDecoration: 'none',
            fontWeight: '500'
          }}
        >
          Return to Data Explorer
        </Link>
      </div>
    </div>
  )
}
