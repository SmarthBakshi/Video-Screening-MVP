import React, { useEffect, useState } from 'react'
import { api } from '@/api/client'


type Invite = { inviteId: string; email: string; token: string; status: 'OPEN'|'UPLOADED' }


type CreateResp = Invite


type TagResp = { id: string; inviteId: string; storageKey: string; originalName: string; tag?: string }


export default function Admin() {
    const [invites, setInvites] = useState<Invite[]>([])
    const [email, setEmail] = useState('')


    async function load() {
        const data = await api<Invite[]>('/invites')
        setInvites(data)
    }
    useEffect(() => { load() }, [])

    async function createInvite() {
        if (!email) return
        const res = await api<CreateResp>('/invites', { method: 'POST', body: JSON.stringify({ email }) })
        setEmail('')
        await load()
        alert(`Share link: ${window.location.origin}/r/${res.token}`)
    }


    async function tagVideo(videoId: string, tag: string) {
        const _ = await api<TagResp>(`/videos/${videoId}/tag`, { method: 'POST', body: JSON.stringify({ tag }) })
        await load()
    }


    return (
        <div>
            <h2>Admin</h2>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input placeholder="candidate@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                <button onClick={createInvite}>Create Invite</button>
            </div>
            <table border={1} cellPadding={6}>
                <thead><tr><th>Email</th><th>Status</th><th>Token</th><th>Actions</th></tr></thead>
                <tbody>
                    {invites.map(inv => (
                        <tr key={inv.inviteId}>
                            <td>{inv.email}</td>
                            <td>{inv.status}</td>
                            <td style={{ fontFamily: 'monospace' }}>{inv.token.slice(0,8)}…</td>
                            <td style={{ display: 'flex', gap: 8 }}>
                                <a href={`/r/${inv.token}`} target="_blank">Record link</a>
                                <a href="#" onClick={(e) => { e.preventDefault(); window.prompt('Share link', `${window.location.origin}/r/${inv.token}`) }}>Copy</a>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}