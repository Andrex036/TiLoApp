import { useState, useEffect } from 'react'
import Splash from './pages/Splash'
import Dashboard from './pages/Dashboard'
import CasosDashboard from './pages/CasosDashboard'
import ActividadesDashboard from './pages/ActividadesDashboard'
import AlertasDashboard from './pages/AlertasDashboard'
import ReportesDashboard from './pages/ReportesDashboard'
import MobileLayout from './layouts/MobileLayout'

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [currentTab, setCurrentTab] = useState('inicio')
  const [navigationParams, setNavigationParams] = useState(null)

  const handleNavigate = (tab, params = null) => {
    setCurrentTab(tab)
    setNavigationParams(params)
  }

  useEffect(() => {
    // Simulate loading time for splash screen
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 3000) // 3 seconds splash

    // Force system reset for clean testing if not already done
    const resetDone = localStorage.getItem('tilo_reset_fresh_v2');
    if (!resetDone) {
      localStorage.removeItem('tilo_cases');
      localStorage.removeItem('tilo_activities');
      localStorage.removeItem('tilo_alerts');
      localStorage.setItem('tilo_reset_fresh_v2', 'true');
      // Refresh to ensure services re-init with empty mock data
      window.location.reload();
    }

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="w-full h-screen h-[100dvh] overflow-hidden bg-[var(--color-background)]">
      {showSplash ? (
        <Splash />
      ) : (
        <MobileLayout currentTab={currentTab} onTabChange={handleNavigate}>
          <div key={currentTab} className="animate-module w-full h-full">
            {currentTab === 'inicio' && <Dashboard />}
            {currentTab === 'casos' && (
              <CasosDashboard 
                onNavigate={handleNavigate} 
                initialCaseId={navigationParams?.caseId} 
              />
            )}
            {currentTab === 'actividades' && (
              <ActividadesDashboard 
                onNavigate={handleNavigate} 
                initialActivityId={navigationParams?.activityId}
              />
            )}
            {currentTab === 'alertas' && <AlertasDashboard onNavigate={handleNavigate} />}
            {currentTab === 'reportes' && <ReportesDashboard onNavigate={handleNavigate} />}
          </div>
        </MobileLayout>
      )}
    </div>
  )
}

export default App
