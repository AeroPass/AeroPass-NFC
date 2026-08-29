'use client'

import { useState } from 'react'

type User = {
  id: number
  username: string
  estado: string
  persona: {
    nombres: string
    apellidos: string
    nombreCompleto: string
    email: string | null
    documento: string
  }
  rol: {
    id: number
    codigo: string
    nombre: string
  }
  permisos: string[]
}

export default function Home() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string>('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión')
        return
      }

      setUser(data.user)
      setToken(data.token)
    } catch {
      setError('No se pudo conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    setUser(null)
    setToken('')
    setUsername('')
    setPassword('')
  }

  // ============ PANTALLA DE LOGIN ============
  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>🔐 Iniciar Sesión</h1>
          <p style={styles.subtitle}>Sistema de Control de Acceso NFC</p>

          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={styles.input}
                placeholder="admin"
                required
                autoFocus
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div style={styles.error}>
                ❌ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? '⏳ Cargando...' : '🚀 Entrar'}
            </button>
          </form>

          <div style={styles.hint}>
            <strong>Usuario de prueba:</strong>
            <br />
            📧 admin
            <br />
            🔑 admin123
          </div>
        </div>
      </div>
    )
  }

  // ============ PANTALLA DE BIENVENIDA ============
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.welcomeHeader}>
          <div style={styles.avatar}>
            {user.persona.nombres.charAt(0)}{user.persona.apellidos.charAt(0)}
          </div>
          <div>
            <h1 style={styles.welcomeTitle}>¡Bienvenido!</h1>
            <p style={styles.welcomeName}>{user.persona.nombreCompleto}</p>
          </div>
        </div>

        <div style={styles.infoGrid}>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>👤 Usuario</span>
            <span style={styles.infoValue}>{user.username}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>🎭 Rol</span>
            <span style={styles.infoValue}>
              <span style={{
                ...styles.badge,
                background: user.rol.codigo === 'ADMIN' ? '#fee2e2' : '#dbeafe',
                color: user.rol.codigo === 'ADMIN' ? '#991b1b' : '#1e40af',
              }}>
                {user.rol.codigo}
              </span>
              <span style={{ marginLeft: 8, fontSize: 14, color: '#666' }}>
                {user.rol.nombre}
              </span>
            </span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>📊 Estado</span>
            <span style={styles.infoValue}>
              <span style={{
                ...styles.badge,
                background: user.estado === 'ACTIVO' ? '#dcfce7' : '#fee2e2',
                color: user.estado === 'ACTIVO' ? '#166534' : '#991b1b',
              }}>
                ● {user.estado}
              </span>
            </span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>📧 Email</span>
            <span style={styles.infoValue}>{user.persona.email || '—'}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>🆔 Documento</span>
            <span style={styles.infoValue}>{user.persona.documento}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>🔑 Permisos</span>
            <span style={styles.infoValue}>{user.permisos.length} permisos asignados</span>
          </div>
        </div>

        <div style={styles.permissionsBox}>
          <h3 style={styles.permissionsTitle}>📝 Tus permisos ({user.permisos.length})</h3>
          <div style={styles.permissionsList}>
            {user.permisos.map((p) => (
              <span key={p} style={styles.permissionTag}>{p}</span>
            ))}
          </div>
        </div>

        <div style={styles.tokenBox}>
          <h3 style={styles.tokenTitle}>🎫 Tu Token JWT</h3>
          <p style={styles.tokenHint}>
            Copia este token para usarlo en Postman en el header:
            <br />
            <code style={styles.tokenHeader}>Authorization: Bearer &lt;token&gt;</code>
          </p>
          <textarea
            readOnly
            value={token}
            style={styles.tokenArea}
            rows={4}
            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
          />
        </div>

        <button onClick={handleLogout} style={styles.logoutButton}>
          🚪 Cerrar Sesión
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: 20,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: 40,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    width: '100%',
    maxWidth: 480,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    textAlign: 'center' as const,
    margin: 0,
    color: '#1a1a1a',
  },
  subtitle: {
    textAlign: 'center' as const,
    color: '#666',
    fontSize: 14,
    marginBottom: 30,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: 600,
    color: '#333',
  },
  input: {
    padding: '12px 16px',
    borderRadius: 8,
    border: '2px solid #e0e0e0',
    fontSize: 16,
    outline: 'none',
    transition: 'border-color 0.2s',
    color: '#1a1a1a',
    background: '#ffffff',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  error: {
    background: '#fee2e2',
    color: '#991b1b',
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 14,
    border: '1px solid #fecaca',
  },
  button: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    padding: '14px 24px',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    marginTop: 8,
  },
  hint: {
    marginTop: 24,
    padding: 16,
    background: '#f8fafc',
    borderRadius: 8,
    fontSize: 14,
    color: '#475569',
    textAlign: 'center' as const,
    border: '1px dashed #cbd5e1',
  },
  // Pantalla de bienvenida
  welcomeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
    paddingBottom: 24,
    borderBottom: '2px solid #f1f5f9',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    fontWeight: 700,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
    color: '#1a1a1a',
  },
  welcomeName: {
    fontSize: 16,
    color: '#666',
    margin: '4px 0 0 0',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginBottom: 24,
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
    padding: 12,
    background: '#f8fafc',
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 500,
  },
  infoValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  badge: {
    padding: '2px 10px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 700,
  },
  permissionsBox: {
    marginBottom: 24,
    padding: 16,
    background: '#f8fafc',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
  },
  permissionsTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#475569',
    margin: '0 0 12px 0',
  },
  permissionsList: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
  },
  permissionTag: {
    background: '#e0e7ff',
    color: '#3730a3',
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 500,
  },
  tokenBox: {
    marginBottom: 24,
    padding: 16,
    background: '#1e293b',
    borderRadius: 8,
  },
  tokenTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#cbd5e1',
    margin: '0 0 8px 0',
  },
  tokenHint: {
    fontSize: 12,
    color: '#94a3b8',
    margin: '0 0 12px 0',
    lineHeight: 1.6,
  },
  tokenHeader: {
    background: '#0f172a',
    padding: '2px 6px',
    borderRadius: 4,
    color: '#fbbf24',
    fontFamily: 'monospace',
  },
  tokenArea: {
    width: '100%',
    background: '#0f172a',
    color: '#4ade80',
    border: '1px solid #334155',
    borderRadius: 6,
    padding: 10,
    fontFamily: 'monospace',
    fontSize: 11,
    resize: 'none' as const,
    outline: 'none',
  },
  logoutButton: {
    width: '100%',
    background: '#fee2e2',
    color: '#991b1b',
    border: 'none',
    padding: '12px 24px',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
}
