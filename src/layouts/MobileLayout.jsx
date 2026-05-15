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
      
      {/* Main Scrollable Content */}
      <main ref={mainRef} className="flex-1 overflow-y-auto scroll-smooth bg-slate-50 relative z-10">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-slate-200 pb-safe pt-2 px-6 pb-4 z-50 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <ul className="flex justify-between items-center max-w-md mx-auto min-w-[320px] gap-2">
          <NavItem 
            icon={<Home size={24} />} 
            label="Inicio" 
            active={currentTab === 'inicio'} 
            onClick={() => onTabChange && onTabChange('inicio')}
          />
          <NavItem 
            icon={<Users size={24} />} 
            label="Casos" 
            active={currentTab === 'casos'} 
            onClick={() => onTabChange && onTabChange('casos')}
          />
          <NavItem 
            icon={<Calendar size={24} />} 
            label="Actividades" 
            active={currentTab === 'actividades'} 
            onClick={() => onTabChange && onTabChange('actividades')}
          />
          <NavItem 
            icon={
              <div className="relative">
                <Bell size={24} />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white">
                  {activeAlertsCount}
                </span>
              </div>
            } 
            label="Alertas" 
            active={currentTab === 'alertas'}
            onClick={() => onTabChange && onTabChange('alertas')}
          />
          <NavItem 
            icon={<BarChart2 size={24} />} 
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
      className="flex flex-col items-center justify-center gap-1 cursor-pointer"
    >
      <div 
        className={`transition-colors ${
          active ? 'text-blue-600 animate-nav-active' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        {icon}
      </div>
      <span className={`text-[11px] font-medium ${active ? 'text-blue-600' : 'text-slate-500'}`}>
        {label}
      </span>
    </li>
  )
}
