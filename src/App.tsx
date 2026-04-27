import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { LandingPage } from './pages/LandingPage'
import { JoinPage } from './pages/JoinPage'
import { SignInPage } from './pages/SignInPage'
import { SignUpPage } from './pages/SignUpPage'
import { DashboardPage } from './pages/DashboardPage'
import { getSession, refreshSessionFromServer } from './state/session'
import { Toaster } from './components/Toast'

export default function App() {
  const location = useLocation()
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let alive = true
    refreshSessionFromServer().finally(() => {
      if (alive) setReady(true)
    })
    return () => {
      alive = false
    }
  }, [location.pathname])

  const session = getSession()
  if (!ready && location.pathname.startsWith('/app')) return null

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route
          path="/app/*"
          element={
            session ? <DashboardPage session={session} /> : <Navigate to="/" />
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toaster />
    </AppShell>
  )
}
