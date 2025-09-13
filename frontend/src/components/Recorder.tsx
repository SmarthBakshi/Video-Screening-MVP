import React, { useEffect, useRef, useState } from 'react'


type Props = {
maxSeconds?: number
onReadyBlob: (blob: Blob) => void
}


export default function Recorder({ maxSeconds = 120, onReadyBlob }: Props) {
const videoRef = useRef<HTMLVideoElement | null>(null)
const [rec, setRec] = useState<MediaRecorder | null>(null)
const [chunks, setChunks] = useState<Blob[]>([])
const [elapsed, setElapsed] = useState(0)
const [status, setStatus] = useState<'idle'|'recording'|'preview'>('idle')
const timerRef = useRef<number | null>(null)


useEffect(() => {
async function init() {
const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
if (videoRef.current) videoRef.current.srcObject = stream
const mr = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' })
mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) setChunks((c) => [...c, e.data]) }
mr.onstop = () => {
const blob = new Blob(chunks, { type: 'video/webm' })
setStatus('preview')
onReadyBlob(blob)
}
setRec(mr)
}
init()
return () => {
if (timerRef.current) window.clearInterval(timerRef.current)
// stop all tracks
const stream = videoRef.current?.srcObject as MediaStream | undefined
stream?.getTracks().forEach(t => t.stop())
}
}, [])


const start = () => {
if (!rec) return
setChunks([])
setElapsed(0)
setStatus('recording')
rec.start(250)
timerRef.current = window.setInterval(() => setElapsed((s) => s + 1), 1000)
window.setTimeout(stop, maxSeconds * 1000)
}


const stop = () => {
if (!rec) return
if (timerRef.current) window.clearInterval(timerRef.current)
rec.stop()
}


return (
    <div style={{ display: 'grid', gap: 12 }}>
        <video ref={videoRef} autoPlay playsInline muted style={{ width: 480, maxWidth: '100%', borderRadius: 8 }} />
        <div>Elapsed: {elapsed}s / {maxSeconds}s</div>
        <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={start} disabled={status==='recording'}>Start</button>
            <button onClick={stop} disabled={status!=='recording'}>Stop</button>
        </div>
    </div>
    )
}