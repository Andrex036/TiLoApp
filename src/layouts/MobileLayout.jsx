import { Home, Users, Bell, BarChart2, Calendar } from 'lucide-react'
import { useAlerts } from '../hooks/useAlerts'
import { useRef, useEffect } from 'react'

export default function MobileLayout({ children, currentTab, onTabChange }) {
  const { alerts } = useAlerts()
  const activeAlertsCount = (alerts || []).filter(a => ['Activa', 'Pendiente', 'Vencida', 'Programada'].includes(a.estado)).length
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
        className="fixed bottom-0 left-0 right-0 lg:left-auto lg:right-auto lg:w-full lg:max-w-5xl bg-white/95 backdrop-blur-xl border-t border-blue-100 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] px-3 z-[100] shadow-[0_-16px_32px_-18px_rgba(15,77,184,0.45)]"
        style={{ 
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%'
        }}
      >
        <ul className="flex justify-around items-center max-w-lg mx-auto w-full gap-1.5 rounded-3xl bg-slate-50/90 border border-slate-100 px-1.5 py-1.5">
          <NavItem 
            icon={<Home size={22} />} 
            label="Inicio" 
            active={currentTab === 'inicio'} 
            onClick={() => onTabChange && onTabChange('inicio')}
            colorClass="blue"
          />
          <NavItem 
            icon={<Users size={22} />} 
            label="Casos" 
            active={currentTab === 'casos'} 
            onClick={() => onTabChange && onTabChange('casos')}
            colorClass="blue"
          />
          <NavItem 
            icon={<Calendar size={22} />} 
            label="Agenda" 
            active={currentTab === 'actividades'} 
            onClick={() => onTabChange && onTabChange('actividades')}
            colorClass="blue"
          />
          <NavItem 
            icon={
              <div className="relative">
                <Bell size={22} />
                <span className="absolute -top-2 -right-2 min-w-4 h-4 px-1 bg-red-600 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm shadow-red-500/30">
                  {activeAlertsCount}
                </span>
              </div>
            } 
            label="Alertas" 
            active={currentTab === 'alertas'}
            onClick={() => onTabChange && onTabChange('alertas')}
            colorClass="red"
          />
          <NavItem 
            icon={<BarChart2 size={22} />} 
            label="Reportes" 
            active={currentTab === 'reportes'} 
            onClick={() => onTabChange && onTabChange('reportes')}
            colorClass="blue"
          />
        </ul>
      </nav>
      
    </div>
  )
}

function NavItem({ icon, label, active, onClick, colorClass = 'blue' }) {
  const variants = {
    blue: {
      activeIcon: 'bg-gradient-to-br from-[#0F4DB8] to-[#0B3F9C] text-white shadow-lg shadow-blue-600/25',
      inactiveIcon: 'bg-blue-50 text-blue-600 border border-blue-100 group-hover:bg-blue-100 group-hover:text-blue-700',
      activeText: 'text-blue-700',
      inactiveText: 'text-slate-500 group-hover:text-blue-700'
    },
    red: {
      activeIcon: 'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg shadow-red-600/25',
      inactiveIcon: 'bg-red-50 text-red-600 border border-red-100 group-hover:bg-red-100 group-hover:text-red-700',
      activeText: 'text-red-700',
      inactiveText: 'text-slate-500 group-hover:text-red-700'
    }
  };
  const variant = variants[colorClass] || variants.blue;

  return (
    <li 
      onClick={onClick}
      className="group flex flex-col items-center justify-center gap-1 cursor-pointer flex-1 py-1.5 rounded-2xl transition-colors hover:bg-white/10 active:bg-white/15"
    >
      <div 
        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${
          active
            ? `${variant.activeIcon} scale-105`
            : `${variant.inactiveIcon} shadow-sm`
        }`}
      >
        {icon}
      </div>
      <span className={`text-[10px] font-black tracking-tight transition-colors ${active ? variant.activeText : variant.inactiveText}`}>
        {label}
      </span>
    </li>
  )
}
