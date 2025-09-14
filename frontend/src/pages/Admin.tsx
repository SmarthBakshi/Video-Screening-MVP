import React, { useEffect, useState } from 'react'
import { api } from '@/api/client'

type Invite = {
  inviteId: string
  email: string
  token: string
  status: 'OPEN' | 'UPLOADED'
}

type TagType = 'pending' | 'advance' | 'review' | 'pass'

type Video = {
  id: string
  inviteId: string
  storageKey: string
  originalName: string
  tag?: TagType
}

const API_BASE = (import.meta.env.VITE_API_BASE as string) ?? 'http://localhost:8000/api/v1'

// Normalize backend variations: inviteId vs id vs _id
function normalizeInvite(raw: any): Invite | null {
  const inviteId =
    raw?.inviteId ?? raw?.id ?? raw?._id ?? raw?.invite_id ?? null
  if (!inviteId) return null
  return {
    inviteId,
    email: raw.email ?? '',
    token: raw.token ?? '',
    status: (raw.status as Invite['status']) ?? 'OPEN',
  }
}

export default function Admin() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [email, setEmail] = useState('')
  const [latestByInvite, setLatestByInvite] = useState<Record<string, Video | null>>({})
  const [loading, setLoading] = useState(false)
  const [previewFor, setPreviewFor] = useState<string | null>(null)

  function last<T>(arr: T[]): T | null {
    return arr && arr.length ? arr[arr.length - 1] : null
  }

  async function fetchLatestVideo(inviteId: string): Promise<Video | null> {
    if (!inviteId) return null
    // Preferred single-item endpoint
    try {
      return await api<Video>(`/invites/${encodeURIComponent(inviteId)}/videos/latest`)
    } catch {
      // Fallback to list endpoint
      try {
        const vids = await api<Video[]>(`/videos?inviteId=${encodeURIComponent(inviteId)}`)
        return last(vids)
      } catch {
        return null
      }
    }
  }

  async function loadInvitesAndVideos() {
    setLoading(true)
    try {
      const listRaw = await api<any[]>('/invites')
      // normalize and drop any malformed rows (no id)
      const normalized = listRaw
        .map(normalizeInvite)
        .filter((x): x is Invite => x !== null)

      setInvites(normalized)

      const entries = await Promise.all(
        normalized.map(async (inv) => {
          const v = await fetchLatestVideo(inv.inviteId)
          return [inv.inviteId, v] as const
        })
      )
      setLatestByInvite(Object.fromEntries(entries))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvitesAndVideos()
  }, [])

  async function createInvite() {
    if (!email) return
    const res = await api<any>('/invites', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
    const inv = normalizeInvite(res)
    setEmail('')
    await loadInvitesAndVideos()
    if (inv?.token) {
      alert(`Share link: ${window.location.origin}/r/${inv.token}`)
    }
  }

  async function updateTag(inviteId: string, videoId: string, tag: TagType) {
    await api<Video>(`/videos/${encodeURIComponent(videoId)}/tag`, {
      method: 'POST',
      body: JSON.stringify({ tag }),
    })
    const latest = await fetchLatestVideo(inviteId)
    setLatestByInvite((prev) => ({ ...prev, [inviteId]: latest }))
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <h2>Admin – Video Screening</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          placeholder="candidate@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ flex: '0 0 320px' }}
        />
        <button onClick={createInvite}>Create Invite</button>
        <button onClick={loadInvitesAndVideos} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <table border={1} cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Status</th>
            <th>Record Link</th>
            <th>Video</th>
            <th>Tag</th>
          </tr>
        </thead>
        <tbody>
          {invites.map((inv) => {
            const v = latestByInvite[inv.inviteId] ?? null
            const isPreviewing = previewFor === inv.inviteId && !!v
            return (
              <React.Fragment key={inv.inviteId}>
                <tr>
                  <td>{inv.email}</td>
                  <td>{inv.status}</td>
                  <td>
                    <a href={`/r/${inv.token}`} target="_blank" rel="noreferrer">Open</a>
                  </td>
                  <td>
                    {v ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <a href={`/v/${v.id}`} target="_blank" rel="noreferrer">Play</a>
                        <button onClick={() => setPreviewFor(isPreviewing ? null : inv.inviteId)}>
                          {isPreviewing ? 'Hide' : 'Preview'}
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: '#888' }}>No video yet</span>
                    )}
                  </td>
                  <td>
                    {v ? (
                      <select
                        value={v.tag ?? 'pending'}
                        onChange={(e) => updateTag(inv.inviteId, v.id, e.target.value as TagType)}
                      >
                        <option value="pending">pending</option>
                        <option value="advance">advance</option>
                        <option value="review">review</option>
                        <option value="pass">pass</option>
                      </select>
                    ) : (
                      <span style={{ color: '#888' }}>—</span>
                    )}
                  </td>
                </tr>

                {isPreviewing && v && (
                  <tr>
                    <td colSpan={5}>
                      <div style={{ padding: 8, background: '#fafafa', borderRadius: 8 }}>
                        <div style={{ marginBottom: 6, color: '#555' }}>{v.originalName}</div>
                        <video
                          controls
                          style={{ width: '100%', borderRadius: 8 }}
                          src={`${API_BASE}/videos/${encodeURIComponent(v.id)}/stream`}
                        />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
