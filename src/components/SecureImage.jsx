import { useState, useEffect } from 'react'
import { getHeaders } from '../services/server'

const SecureImage = ({ src, alt, className, style, onClick, onError }) => {
    const [blobUrl, setBlobUrl] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        let active = true
        let currentUrl = null

        const fetchImage = async () => {
            if (!src) return

            try {
                setLoading(true)
                setError(false)

                const headers = getHeaders(true) // Gets auth + ngrok skip headers
                const response = await fetch(src, { headers })

                if (!response.ok) throw new Error('Failed to load image')

                const blob = await response.blob()
                if (active) {
                    currentUrl = URL.createObjectURL(blob)
                    setBlobUrl(currentUrl)
                }
            } catch (err) {
                console.error('SecureImage load error:', err)
                if (active) setError(true)
                if (onError) onError(err)
            } finally {
                if (active) setLoading(false)
            }
        }

        fetchImage()

        return () => {
            active = false
            if (currentUrl) URL.revokeObjectURL(currentUrl)
        }
    }, [src])

    if (error) {
        // Fallback or maintain layout
        return (
            <div
                className={className}
                style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}
                onClick={onClick}
            >
                <span style={{ fontSize: '20px' }}>⚠️</span>
            </div>
        )
    }

    if (loading) {
        return (
            <div
                className={className}
                style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.1)' }}
            >
                <div className="loader" style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            </div>
        )
    }

    return (
        <img
            src={blobUrl}
            alt={alt}
            className={className}
            style={style}
            onClick={onClick}
        />
    )
}

export default SecureImage
