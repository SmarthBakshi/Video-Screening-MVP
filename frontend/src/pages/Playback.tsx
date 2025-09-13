import React from 'react'
import { useParams } from 'react-router-dom'


export default function Playback() {
    const { id } = useParams()
    const src = `${import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1'}/videos/${id}/stream`
    return (
    <div>
        <h2>Playback</h2>
        <video src={src} controls style={{ width: 640, maxWidth: '100%' }} />
    </div>
    )
}