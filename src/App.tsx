import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { LandingPage } from './pages/LandingPage'
import { JoinPage } from './pages/JoinPage'
import { SignInPage } from './pages/SignInPage'
import { SignUpPage } from './pages/SignUpPage'
import { DashboardPage } from './pages/DashboardPage'
import { getSession } from './state/session'

export default function App() {
  useLocation() // ensure rerender on navigation for session reads
  const session = getSession()

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
    </AppShell>
  )
}
