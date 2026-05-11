import logo from '../assets/TiLo_Logo.png'

export default function Splash() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#0F4DB8] to-[#0B3F9C] text-white p-6 relative overflow-hidden">
      
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl opacity-60 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-300/20 rounded-full mix-blend-overlay filter blur-3xl opacity-60 animate-pulse" style={{ animationDelay: '1.5s' }}></div>

      <div className="flex flex-col items-center z-10">
        <div className="relative mb-8">
          {/* Glow effect behind logo */}
          <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl animate-pulse"></div>
          <img 
            src={logo} 
            alt="TiLo Logo" 
            className="w-36 h-36 object-contain relative z-10 drop-shadow-[0_10px_25px_rgba(0,0,0,0.3)] animate-float"
          />
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight drop-shadow-lg mb-3">TiLoApp</h1>
        <p className="text-blue-100 text-lg font-medium tracking-wide text-center">Orientación Escolar Inteligente</p>
      </div>
      
      <div className="absolute bottom-16 flex flex-col items-center z-10">
        <div className="w-40 h-1.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm relative">
          <div className="absolute top-0 left-0 h-full bg-white rounded-full w-[40%] animate-progress shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
        </div>
        <span className="text-[10px] text-white/70 mt-4 font-bold uppercase tracking-[0.2em] animate-pulse">Iniciando sistema...</span>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-15px) scale(1.05); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes progress {
          0% { left: -40%; }
          50% { left: 30%; width: 50%; }
          100% { left: 100%; width: 40%; }
        }
        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }
      `}} />
    </div>
  )
}
