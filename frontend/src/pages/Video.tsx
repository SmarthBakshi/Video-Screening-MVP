import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '@/api/client'

type Video = { id: string; inviteId: string; storageKey: string; originalName: string; tag?: 'pending'|'advance'|'review'|'pass' }

export default function VideoPage() {
  const { id } = useParams()
  const [video, setVideo] = useState<Video | null>(null)

  useEffect(() => {
    (async () => {
      const v = await api<Video>(`/videos/${id}`)
      setVideo(v)
    })()
  }, [id])

  async function setTag(tag: NonNullable<Video['tag']>) {
    if (!id) return
    const v = await api<Video>(`/videos/${id}/tag`, { method: 'POST', body: JSON.stringify({ tag }) })
    setVideo(v)
  }

  if (!id) return <div>Missing video id</div>
  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h2>Video</h2>
      {video && <div style={{ marginBottom: 8, color: '#666' }}>{video.originalName}</div>}
      <video src={`${import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/api/v1'}/videos/${id}/stream`} controls style={{ width: '100%', borderRadius: 8 }} />
      <div style={{ marginTop: 12 }}>
        <label>Tag:&nbsp;</label>
        <select value={video?.tag ?? 'pending'} onChange={e => setTag(e.target.value as any)}>
          <option value="pending">pending</option>
          <option value="advance">advance</option>
          <option value="review">review</option>
          <option value="pass">pass</option>
        </select>
      </div>
    </div>
  )
}
