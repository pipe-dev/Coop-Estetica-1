import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Error capturado en la aplicación:', error, errorInfo)
  }

  handleReload = () => {
    try {
      sessionStorage.clear()
    } catch (e) {}
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0D0D0D',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          <div style={{
            maxWidth: '440px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            borderRadius: '20px',
            padding: '36px 28px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(212, 175, 55, 0.12)',
              border: '1px solid #D4AF37',
              color: '#D4AF37',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              fontSize: '24px'
            }}>
              ✦
            </div>

            <h2 style={{
              fontSize: '1.3rem',
              color: '#FFFFFF',
              margin: '0 0 10px',
              fontWeight: '700'
            }}>
              Actualización del Sistema
            </h2>

            <p style={{
              color: '#A3A3A3',
              fontSize: '0.85rem',
              lineHeight: '1.5',
              margin: '0 0 24px'
            }}>
              Se ha desplegado una versión actualizada de Catheryne Ríos Estética. Pulsa el botón para sincronizar la plataforma.
            </p>

            <button
              type="button"
              onClick={this.handleReload}
              style={{
                width: '100%',
                padding: '13px 20px',
                background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                color: '#000000',
                fontWeight: '700',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                boxShadow: '0 4px 15px rgba(212, 175, 55, 0.25)'
              }}
            >
              Sincronizar y Continuar
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
