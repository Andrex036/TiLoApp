import { Home, Users, Bell, BarChart2, Calendar } from 'lucide-react'
import { useAlerts } from '../hooks/useAlerts'
import { useRef, useEffect } from 'react'

export default function MobileLayout({ children, currentTab, onTabChange }) {
  const { alerts } = useAlerts()
  const activeAlertsCount = alerts.filter(a => ['Activa', 'Pendiente', 'Vencida', 'Programada'].includes(a.estado)).length
  const mainRef = useRef(null)

  // Scroll to top when tab changes
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [currentTab])

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto bg-slate-50 relative overflow-hidden sm:shadow-2xl sm:border sm:border-slate-200 sm:h-[95vh] sm:mt-[2.5vh] sm:rounded-2xl">
      
      {/* Main Scrollable Content Area */}
      <main 
        ref={mainRef} 
        className="absolute inset-0 overflow-y-auto overflow-x-hidden scroll-smooth bg-slate-50 z-10"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="min-h-full flex flex-col">
          <div className="flex-1">
            {children}
          </div>
          {/* Bottom Spacer to ensure content clears the fixed nav */}
          <div className="h-[140px] w-full shrink-0" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}></div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav 
        className="fixed bottom-0 left-0 right-0 lg:left-auto lg:right-auto lg:w-full lg:max-w-5xl bg-white border-t border-slate-200 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] px-2 z-[100] shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.1)]"
        style={{ 
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%'
        }}
      >
        <ul className="flex justify-around items-center max-w-lg mx-auto w-full gap-1">
          <NavItem 
            icon={<Home size={22} />} 
            label="Inicio" 
            active={currentTab === 'inicio'} 
            onClick={() => onTabChange && onTabChange('inicio')}
          />
          <NavItem 
            icon={<Users size={22} />} 
            label="Casos" 
            active={currentTab === 'casos'} 
            onClick={() => onTabChange && onTabChange('casos')}
          />
          <NavItem 
            icon={<Calendar size={22} />} 
            label="Agenda" 
            active={currentTab === 'actividades'} 
            onClick={() => onTabChange && onTabChange('actividades')}
          />
          <NavItem 
            icon={
              <div className="relative">
                <Bell size={22} />
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                  {activeAlertsCount}
                </span>
              </div>
            } 
            label="Alertas" 
            active={currentTab === 'alertas'}
            onClick={() => onTabChange && onTabChange('alertas')}
          />
          <NavItem 
            icon={<BarChart2 size={22} />} 
            label="Reportes" 
            active={currentTab === 'reportes'}
            onClick={() => onTabChange && onTabChange('reportes')}
          />
        </ul>
      </nav>
      
    </div>
  )
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <li 
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1.5 cursor-pointer flex-1 py-1"
    >
      <div 
        className={`transition-all duration-300 ${
          active ? 'text-blue-600 scale-110' : 'text-slate-400'
        }`}
      >
        {icon}
      </div>
      <span className={`text-[10px] font-bold tracking-tight ${active ? 'text-blue-600' : 'text-slate-500'}`}>
        {label}
      </span>
    </li>
  )
}
