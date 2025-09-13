import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import Recorder from '@/components/Recorder'
import { api, apiUpload } from '@/api/client'


export default function Record() {
const { token } = useParams()
const [blob, setBlob] = useState<Blob | null>(null)
const [videoId, setVideoId] = useState<string | null>(null)
const [status, setStatus] = useState<'init'|'ready'|'uploading'|'done'|'error'>('init')


React.useEffect(() => {
async function check() {
try { await api(`/invites/${token}`); setStatus('ready') } catch { setStatus('error') }
}
check()
}, [token])


async function upload() {
  if (!blob || !token) return
  if (blob.size === 0) {
    alert('Recording failed (empty video). Please re-record and try again.')
    return
  }
  setStatus('uploading')
  const ext = (blob as any).__fileExt || 'webm'
  const form = new FormData()
  form.append('file', blob, `recording.${ext}`)
  const res = await apiUpload<{ videoId: string }>(`/upload/${token}`, form)
  setVideoId(res.videoId)
  setStatus('done')
}


if (status === 'error') return <div>Invalid or expired link.</div>
return (
    <div>
        <h2>Video Screening</h2>
        <p>Record up to 120 seconds, then upload.</p>
        <Recorder maxSeconds={120} onReadyBlob={setBlob} />
        <div style={{ marginTop: 12 }}>
            <button disabled={!blob || status==='uploading'} onClick={upload}>Upload</button>
        </div>
        {status==='done' && videoId && (
            <div style={{ marginTop: 12 }}>
                <p>Thanks! Your video was uploaded.</p>
            </div>
        )}
    </div>
    )
}