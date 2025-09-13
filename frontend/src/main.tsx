import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import Admin from './pages/Admin'
import Record from './pages/Record'
import Playback from './pages/Playback'


const router = createBrowserRouter([
{
    path: '/',
    element: <App />,
    children: [
    { path: '/admin', element: <Admin /> },
    { path: '/r/:token', element: <Record /> },
    { path: '/v/:id', element: <Playback /> },
        ],
    },
])


createRoot(document.getElementById('root')!).render(
<React.StrictMode>
    <RouterProvider router={router} />
</React.StrictMode>
)