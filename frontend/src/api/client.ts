const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1'


export async function api<T>(path: string, init?: RequestInit): Promise<T> {
const res = await fetch(`${API_BASE}${path}`, {
headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
...init,
})
if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
return res.json() as Promise<T>
}


export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
const res = await fetch(`${API_BASE}${path}`, {
method: 'POST',
body: form,
})
if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
return res.json() as Promise<T>
}