import { Navigate, Route, Routes, useSearchParams } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { PreviewPage } from './pages/PreviewPage'

export function App() {
  return (
    <Routes>
      <Route path='/' element={<RootScreen />} />
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  )
}

function RootScreen() {
  const [params] = useSearchParams()
  const resume = params.get('resume')

  if (resume === null || resume === '') {
    return <HomePage />
  }

  return <PreviewPage slug={resume} />
}
