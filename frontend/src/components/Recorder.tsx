import React, { useEffect, useRef, useState } from 'react'

type Props = { maxSeconds?: number; onReadyBlob: (blob: Blob) => void }

export default function Recorder({ maxSeconds = 120, onReadyBlob }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const recRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])  // <-- collect here
  const [elapsed, setElapsed] = useState(0)
  const [status, setStatus] = useState<'idle'|'recording'|'preview'>('idle')
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    async function init() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      if (videoRef.current) videoRef.current.srcObject = stream

      // prefer mp4 if supported; fall back to webm
      const prefs = [
        'video/mp4;codecs=avc1,mp4a',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm'
      ]
      const mimeType = prefs.find(t => (window as any).MediaRecorder?.isTypeSupported?.(t)) || ''
      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }
      mr.onstop = () => {
        const type = mr.mimeType || mimeType || 'video/webm'
        const blob = new Blob(chunksRef.current, { type })
        ;(blob as any).__fileExt = type.includes('mp4') ? 'mp4' : 'webm'
        setStatus('preview')
        onReadyBlob(blob)
      }

      recRef.current = mr
    }
    init()

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
      const stream = videoRef.current?.srcObject as MediaStream | undefined
      stream?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const start = () => {
    const mr = recRef.current
    if (!mr) return
    chunksRef.current = []   // <-- clear
    setElapsed(0)
    setStatus('recording')
    mr.start()               // <-- no timeslice to avoid partial-chunk timing issues
    timerRef.current = window.setInterval(() => setElapsed(s => s + 1), 1000)
    window.setTimeout(stop, maxSeconds * 1000)
  }

  const stop = () => {
    if (timerRef.current) window.clearInterval(timerRef.current)
    recRef.current?.stop()
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <video ref={videoRef} autoPlay playsInline muted style={{ width: 480, maxWidth: '100%', borderRadius: 8 }} />
      <div>Elapsed: {elapsed}s / {maxSeconds}s</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={start} disabled={status==='recording'}>Start</button>
        <button onClick={stop}  disabled={status!=='recording'}>Stop</button>
      </div>
    </div>
  )
}