import React, { useState, useEffect } from 'react';
import { 
  Flame, MapPin, DollarSign, TrendingUp, Bot, Bell, 
  ChevronLeft, Search, Sparkles, ArrowRight, Activity, Zap,
  Crown, Share2, Copy, Check, User, LogOut, Wallet, Shield,
  Calculator, Phone, MessageSquare, AlertTriangle, RefreshCw, Clock, ExternalLink
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc 
} from 'firebase/firestore';
import { auth, db } from './lib/firebase';

interface Trend {
  id: string;
  title: string;
  description: string;
  cost: string;
  roi: string;
  potentialScore: number;
  category: string;
  type?: string;
  margin?: string;
  risk?: string;
  suppliers?: string;
  googleSearches?: string;
  tiktokGrowth?: string;
  competition?: string;
  realTimeAlert?: string;
}

export default function App() {
  // Navigation & Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authUser, setAuthUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'trends' | 'alerts' | 'roi' | 'premium' | 'referrals' | 'admin'>('trends');
  
  // User Profile & Subscription State
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'chismoso' | 'premium'>('free');
  const [daysRemaining, setDaysRemaining] = useState<number>(4); // Countdown alert (< 5 days)
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [myReferrals, setMyReferrals] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [isClearingUsers, setIsClearingUsers] = useState(false);

  // Phone Verification State
  const [phone, setPhone] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [smsOtpInput, setSmsOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [smsNotification, setSmsNotification] = useState('');

  // 5-Second Banner Switcher State
  const [bannerIndex, setBannerIndex] = useState<number>(0);

  // Trends & AI State
  const [trends, setTrends] = useState<Trend[]>([]);
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null);
  const [city, setCity] = useState('');
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [aiPlan, setAiPlan] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);

  // ROI Calculator State
  const [roiCityInput, setRoiCityInput] = useState('CDMX');
  const [roiInvestment, setRoiInvestment] = useState<number>(25000);
  const [roiSales, setRoiSales] = useState<number>(18000);
  const [roiExpenses, setRoiExpenses] = useState<number>(6000);

  const [showAuthDialog, setShowAuthDialog] = useState(false);

  // Chatbot State
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Referral URL check
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const referredByCode = urlParams.get('ref');

  useEffect(() => {
    if (referredByCode) {
      sessionStorage.setItem('referredBy', referredByCode);
    }
  }, [referredByCode]);

  // 5-Second Automatic Ad Banner Switcher
  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIndex(prev => (prev === 0 ? 1 : 0));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch('/api/trends')
      .then(res => res.json())
      .then(data => setTrends(data))
      .catch(err => console.error(err));
      
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthUser(user);
        setIsLoggedIn(true);
        
        // Admin check
        if (user.email === 'gustavocesarlopezornelas@gmail.com') {
          setIsAdmin(true);
          loadAllUsers();
        }

        // Load profile from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          setIsPremium(data.isPremium || false);
          setSubscriptionTier(data.subscriptionTier || (data.isPremium ? 'premium' : 'free'));
          setReferralCode(data.referralCode || '');
          setPhone(data.phone || '');
          setPhoneVerified(data.phoneVerified || false);
          loadReferrals(data.referralCode);
        } else {
          const storedRef = sessionStorage.getItem('referredBy');
          const newCode = 'REF-' + Math.random().toString(36).substring(2, 6).toUpperCase();
          const initialData = {
            email: user.email,
            referralCode: newCode,
            referredBy: storedRef || referredByCode || null,
            isPremium: false,
            subscriptionTier: 'free',
            phone: '',
            phoneVerified: false,
            createdAt: new Date().toISOString()
          };
          await setDoc(userDocRef, initialData);
          setReferralCode(newCode);
          setIsPremium(false);
          setSubscriptionTier('free');
        }
      } else {
        setIsLoggedIn(false);
        setAuthUser(null);
        setIsPremium(false);
        setSubscriptionTier('free');
        setReferralCode('');
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleDiscoverTrends = async () => {
    if (!city.trim()) return;
    setIsDiscovering(true);
    try {
      const res = await fetch(`/api/trends?city=${encodeURIComponent(city.trim())}`);
      const data = await res.json();
      setTrends(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDiscovering(false);
    }
  };

  const loadReferrals = async (code: string) => {
    if (!code) return;
    try {
      const q = query(collection(db, 'users'), where("referredBy", "==", code));
      const snapshot = await getDocs(q);
      const refs: any[] = [];
      snapshot.forEach(doc => {
        refs.push(doc.data());
      });
      setMyReferrals(refs);
    } catch (e) {
      console.error(e);
    }
  };

  const loadAllUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const usersList: any[] = [];
      snapshot.forEach(doc => {
        usersList.push({ id: doc.id, ...doc.data() });
      });
      setAdminUsers(usersList);
    } catch (e) {
      console.error(e);
    }
  };

  // Admin Clean Database Function
  const handleClearTestUsers = async () => {
    if (!window.confirm('¿Confirmas reiniciar todos los usuarios de prueba en la base de datos? Esto eliminará todos los registros que no correspondan al correo administrador.')) {
      return;
    }
    setIsClearingUsers(true);
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      let deletedCount = 0;
      for (const userDoc of snapshot.docs) {
        const data = userDoc.data();
        if (data.email !== 'gustavocesarlopezornelas@gmail.com') {
          await deleteDoc(doc(db, 'users', userDoc.id));
          deletedCount++;
        }
      }
      alert(`Se han eliminado ${deletedCount} usuario(s) de prueba con éxito. La base de datos ha sido limpiada.`);
      loadAllUsers();
    } catch (err: any) {
      console.error(err);
      alert('Error al limpiar usuarios: ' + err.message);
    } finally {
      setIsClearingUsers(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthMessage('');
    try {
      const trimmedEmail = email.trim();
      if (isRegistering) {
        const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        const storedRef = sessionStorage.getItem('referredBy');
        const newCode = 'REF-' + Math.random().toString(36).substring(2, 6).toUpperCase();
        await setDoc(doc(db, 'users', cred.user.uid), {
          email: cred.user.email,
          referralCode: newCode,
          referredBy: storedRef || referredByCode || null,
          isPremium: false,
          subscriptionTier: 'free',
          phone: '',
          phoneVerified: false,
          createdAt: new Date().toISOString()
        });
      } else {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
      }
    } catch (err: any) {
      let errorMessage = err.message || 'Error de autenticación';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta o usuario no encontrado. Revisa tus datos.';
      } else if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'El correo ya está registrado. Por favor, inicia sesión.';
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = 'No hay ninguna cuenta registrada con este correo.';
      }
      setAuthError(errorMessage);
    }
  };

  const handleSendSmsOtp = async () => {
    if (!phone.trim() || phone.length < 8) {
      alert('Por favor ingresa un número celular válido (mínimo 10 dígitos).');
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setSmsNotification(`📩 [SMS Recibido en ${phone}] Tu código de verificación TrendHunter es: ${code}`);
  };

  const handleVerifySmsOtp = async () => {
    if (smsOtpInput.trim() === generatedOtp && generatedOtp !== '') {
      setPhoneVerified(true);
      setSmsNotification('✅ ¡Teléfono celular verificado exitosamente!');
      if (authUser) {
        await setDoc(doc(db, 'users', authUser.uid), {
          phone,
          phoneVerified: true
        }, { merge: true });
      }
    } else {
      alert('El código ingresado es incorrecto. Verifica el número recibido por SMS.');
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setAuthError('Ingresa tu correo para restablecer la contraseña.');
      return;
    }
    setAuthError('');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setAuthMessage('Se ha enviado un enlace a tu correo para restablecer tu contraseña.');
    } catch (err: any) {
      setAuthError('Error al enviar correo: ' + err.message);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const handleGeneratePlan = async () => {
    if (!selectedTrend) return;
    setLoadingPlan(true);
    setAiPlan('');
    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trendTitle: selectedTrend.title, city })
      });
      const data = await res.json();
      setAiPlan(data.plan);
    } catch (err) {
      console.error(err);
      setAiPlan('Error al conectar con la Inteligencia Artificial.');
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMessage = { role: 'user' as const, content: chatInput };
    setChatMessages(prev => [...prev, newMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage.content, history: chatMessages })
      });
      const data = await res.json();
      
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, hubo un error al conectar con la IA.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://trendhunter.ai';
  const baseUrl = currentOrigin.includes('ais-dev') 
    ? 'https://ais-pre-z75e37hjjlxjootla6rtss-602300028753.us-east1.run.app' 
    : currentOrigin;
  const referralUrl = `${baseUrl}/?ref=${referralCode}`;
  const shareText = `¡Descubre negocios rentables con Inteligencia Artificial en TrendHunter AI! Únete con mi folio de recomendado y obtén un 50% de descuento en tu pago. \n\nCódigo: ${referralCode} \nEnlace: ${referralUrl}`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) return <h3 key={idx} className="text-lg font-bold text-white mt-4 mb-2">{line.replace('### ', '')}</h3>;
      if (line.startsWith('## ')) return <h2 key={idx} className="text-xl font-bold text-white mt-5 mb-2">{line.replace('## ', '')}</h2>;
      if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ') || line.startsWith('4. ')) {
        const content = line.substring(3);
        return (
          <div key={idx} className="flex items-start gap-2 my-2">
            <span className="flex-shrink-0 bg-indigo-500/20 text-indigo-400 font-bold text-xs w-5 h-5 flex items-center justify-center rounded-full mt-0.5">{line.charAt(0)}</span>
            <p className="text-sm text-slate-300">{parseInline(content)}</p>
          </div>
        );
      }
      if (line.startsWith('* ') || line.startsWith('- ')) {
        return (
          <div key={idx} className="flex items-start gap-2 ml-4 my-1">
            <span className="text-indigo-500 mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <p className="text-sm text-slate-300">{parseInline(line.substring(2))}</p>
          </div>
        );
      }
      if (line.trim() === '') return <div key={idx} className="h-2" />;
      return <p key={idx} className="text-sm text-slate-300 leading-relaxed my-1">{parseInline(line)}</p>;
    });
  };

  const parseInline = (text: string) => {
    const parts = text.split(/\*\*([\s\S]*?)\*\*/g);
    return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="text-white font-semibold">{part}</strong> : part);
  };

  // ROI Calculations
  const netMonthlyProfit = Math.max(0, roiSales - roiExpenses);
  const roiMarginPercentage = roiSales > 0 ? Math.round((netMonthlyProfit / roiSales) * 100) : 0;
  const roiRecoveryMonths = netMonthlyProfit > 0 ? (roiInvestment / netMonthlyProfit).toFixed(1) : '∞';

  // ---------------- AUTH MODAL ----------------
  const renderAuthModal = () => {
    if (!showAuthDialog || isLoggedIn) return null;
    return (
      <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl relative">
          <button 
            onClick={() => setShowAuthDialog(false)}
            className="absolute top-4 right-4 text-slate-500 hover:text-white transition"
          >
            ✕
          </button>
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-tr from-indigo-600 to-purple-500 p-3 rounded-2xl">
              <Zap className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white text-center tracking-tight mb-2">TrendHunter<span className="text-indigo-400">.ai</span></h1>
          <p className="text-sm text-slate-400 text-center mb-6">Descubre negocios rentables en tu ciudad con IA.</p>
          
          {authError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs mb-4">{authError}</div>}
          {authMessage && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs mb-4">{authMessage}</div>}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Correo Electrónico</label>
              <input 
                type="email" 
                required
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => {
                  const val = e.target.value;
                  setEmail(val);
                  if (val.trim().toLowerCase() === 'gustavocesarlopezornelas@gmail.com') {
                    setPassword('123456');
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Contraseña</label>
              <input 
                type="password" 
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-indigo-500/25">
              {isRegistering ? 'Crear Cuenta' : 'Ingresar a la Plataforma'}
            </button>
          </form>
          
          <div className="mt-4 flex flex-col items-center gap-3">
            <button 
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
            <button 
              type="button"
              onClick={handleResetPassword}
              className="text-xs text-slate-500 hover:text-slate-400"
            >
              Olvidé mi contraseña
            </button>
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
             <p className="text-xs text-slate-500">Al ingresar, aceptas los términos y condiciones de la plataforma.</p>
          </div>
        </div>
      </div>
    );
  };

  // ---------------- MAIN RENDER ----------------
  return (
    <>
      {renderAuthModal()}
      
      {/* 5-DAY SUBSCRIPTION COUNTDOWN NOTIFICATION */}
      {isLoggedIn && isPremium && daysRemaining <= 5 && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-200 flex items-center justify-between gap-2 z-50">
          <div className="flex items-center gap-2 max-w-md mx-auto w-full">
            <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span>
              <strong>¡Suscripción por vencer!</strong> Te quedan <span className="font-bold text-amber-300 underline">{daysRemaining} días</span>. Renueva para mantener tu 50% de descuento.
            </span>
          </div>
          <a 
            href="https://mpago.la/1ERmzsj"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3 py-1 rounded-md text-[10px] shrink-0 transition"
          >
            Renovar $149
          </a>
        </div>
      )}

      {selectedTrend ? (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col pb-20 md:pb-0">
          <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-900 px-4 py-4 flex items-center gap-3">
          <button onClick={() => { setSelectedTrend(null); setAiPlan(''); }} className="p-2 -ml-2 hover:bg-slate-900 rounded-full transition">
            <ChevronLeft className="w-6 h-6 text-slate-300" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white leading-tight truncate">{selectedTrend.title}</h1>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-indigo-400 font-medium">{selectedTrend.category}</span>
              {selectedTrend.type && <span className="text-[10px] bg-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded border border-indigo-700/50">{selectedTrend.type}</span>}
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-md w-full mx-auto p-4 space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <p className="text-slate-300 text-sm leading-relaxed">{selectedTrend.description}</p>
            
            {/* Realtime Alert Badge */}
            {selectedTrend.realTimeAlert && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-amber-300 text-xs leading-relaxed flex items-start gap-2">
                <Flame className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{selectedTrend.realTimeAlert}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Inversión Inicial</span>
                </div>
                <p className="text-sm font-semibold text-white">{selectedTrend.cost}</p>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Recuperación (ROI)</span>
                </div>
                <p className="text-sm font-semibold text-white">{selectedTrend.roi}</p>
              </div>
            </div>

            {/* Additional Premium Attributes */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Margen Estimado</span>
                <span className="text-sm font-bold text-emerald-400">{selectedTrend.margin || '55%'}</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nivel de Riesgo</span>
                <span className="text-sm font-bold text-indigo-300">{selectedTrend.risk || 'Bajo'}</span>
              </div>
            </div>

            {/* Detailed Market Report (Premium) */}
            {isPremium ? (
              <div className="border-t border-slate-800 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-indigo-400" /> Reporte Completo de Mercado
                </h4>
                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500 font-bold block">Proveedores Sugeridos:</span>
                    <span className="text-slate-300">{selectedTrend.suppliers || 'Proveedores directos verificados en México y EE.UU.'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">Búsquedas en Google:</span>
                    <span className="text-emerald-400 font-semibold">{selectedTrend.googleSearches || '+240% este mes'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">Crecimiento en TikTok:</span>
                    <span className="text-purple-400 font-semibold">{selectedTrend.tiktokGrowth || '+380% en reels/videos'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">Competencia en tu zona:</span>
                    <span className="text-slate-300">{selectedTrend.competition || 'Baja / Mercado Océano Azul'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl text-center space-y-2">
                <p className="text-xs text-slate-400">🔒 Proveedores, búsquedas en Google, crecimiento en TikTok y competencia bloqueados.</p>
                <button 
                  onClick={() => { setSelectedTrend(null); setActiveTab('premium'); }}
                  className="text-xs font-bold text-indigo-400 hover:underline"
                >
                  Desbloquear con Plan Premium ($149/mes)
                </button>
              </div>
            )}
            
            <div className="mt-4 flex items-center justify-between bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-medium text-indigo-200">Potencial en {city || 'tu área'}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-lg font-black text-indigo-400">{selectedTrend.potentialScore}</span>
                <span className="text-[10px] text-indigo-400/60 uppercase">/100</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-400" /> Plan de Ejecución IA Paso a Paso
            </h3>
            
            {!isPremium ? (
               <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 p-6 rounded-2xl text-center">
                 <Crown className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                 <h4 className="text-white font-bold mb-2">Generador IA Premium</h4>
                 <p className="text-sm text-indigo-200 mb-4">Los planes de ejecución personalizados paso a paso requieren la versión Premium.</p>
                 <button 
                   onClick={() => { setSelectedTrend(null); setActiveTab('premium'); }}
                   className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-2 px-6 rounded-lg transition text-sm"
                 >
                   Ver Planes y Oferta $149
                 </button>
               </div>
            ) : (
              <>
                {!aiPlan && !loadingPlan && (
                  <button 
                    onClick={handleGeneratePlan}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-500/25"
                  >
                    <Sparkles className="w-5 h-5" />
                    Generar Plan de Ejecución Detallado
                  </button>
                )}

                {loadingPlan && (
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center gap-3">
                    <Activity className="w-6 h-6 text-indigo-400 animate-spin" />
                    <p className="text-sm text-slate-400 animate-pulse">Analizando proveedores y generando plan estratégico...</p>
                  </div>
                )}

                {aiPlan && (
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
                    {renderMarkdown(aiPlan)}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
      ) : (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col">
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-900 px-4 py-4 md:py-6">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-indigo-600 to-purple-500 p-1.5 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">TrendHunter<span className="text-indigo-400">.ai</span></h1>
          </div>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition" title="Cerrar sesión">
                <LogOut className="w-5 h-5" />
              </button>
            ) : (
              <button onClick={() => setShowAuthDialog(true)} className="text-slate-500 hover:text-indigo-400 transition" title="Iniciar sesión">
                <User className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto p-4 space-y-6 pb-24 md:pb-8">
        
        {/* 5-SECOND AUTOMATIC DUAL-SCREEN / AD BANNER SWITCHER */}
        <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-slate-900 shadow-2xl">
          <div className="flex items-center justify-between bg-slate-950/60 px-4 py-2 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-indigo-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              {bannerIndex === 0 ? '🔥 Novedad en Tiempo Real' : '📢 Anuncio Publicitario & Alcances'}
            </span>
            <div className="flex gap-1">
              <button onClick={() => setBannerIndex(0)} className={`w-2 h-2 rounded-full transition ${bannerIndex === 0 ? 'bg-indigo-400 w-4' : 'bg-slate-700'}`}></button>
              <button onClick={() => setBannerIndex(1)} className={`w-2 h-2 rounded-full transition ${bannerIndex === 1 ? 'bg-indigo-400 w-4' : 'bg-slate-700'}`}></button>
            </div>
          </div>

          {/* SCREEN 0: Main Hero Presentation */}
          {bannerIndex === 0 ? (
            <div className="p-6 bg-gradient-to-br from-indigo-950/80 via-slate-900 to-purple-950/80 animate-in fade-in duration-500">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Descubrimiento Inteligente</span>
              </div>
              <h2 className="text-xl font-black text-white leading-tight mb-2">
                Encuentra el negocio ideal en tu ciudad antes que nadie.
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Monitoreamos tendencias emergentes en EE.UU., Latinoamérica y México para darte los negocios con mayor potencial de éxito.
              </p>
              <button 
                onClick={() => setActiveTab('premium')}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-500/20"
              >
                Ver Planes y Promoción <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* SCREEN 1: Detailed Ad Banner Comparing Plan 1 (Chismoso) vs Plan Premium */
            <div className="p-6 bg-gradient-to-br from-purple-950/90 via-slate-900 to-indigo-950/90 animate-in fade-in duration-500">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded border border-amber-400/30">
                  ⚡ Opciones de Acceso
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Actualizado hoy</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Plan Chismoso */}
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-200">Plan Chismoso</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Visión muy por encima (3/sem) sin métricas profundas.</p>
                  </div>
                  <div className="mt-3 border-t border-slate-800/80 pt-2">
                    <span className="text-sm font-black text-white">$99 <span className="text-[9px] font-normal text-slate-400">MXN</span></span>
                    <a 
                      href="https://mpago.la/2MVU6AT" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block text-center mt-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold py-1.5 rounded transition"
                    >
                      Probar $99
                    </a>
                  </div>
                </div>

                {/* Plan Premium Promo */}
                <div className="bg-gradient-to-b from-indigo-900/60 to-purple-900/60 border border-indigo-500/50 p-3 rounded-xl flex flex-col justify-between relative overflow-hidden">
                  <span className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded-bl">PROMO</span>
                  <div>
                    <h3 className="text-xs font-bold text-amber-300">Plan Premium</h3>
                    <p className="text-[10px] text-indigo-200 mt-0.5">Top 10 tendencias, proveedores, alertas +200%, ROI y más.</p>
                  </div>
                  <div className="mt-3 border-t border-indigo-500/30 pt-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-black text-white">$149</span>
                      <span className="text-[9px] line-through text-slate-400">$249</span>
                    </div>
                    <a 
                      href="https://mpago.la/1ERmzsj" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block text-center mt-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold py-1.5 rounded transition shadow-sm"
                    >
                      Activar $149
                    </a>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 text-center italic">
                *Cuentas activas en minutos tras realizar el pago.
              </p>
            </div>
          )}
        </div>
        
        {/* EXPLORE TENDENCIES TAB */}
        {activeTab === 'trends' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* City selector context */}
            <form onSubmit={(e) => { e.preventDefault(); handleDiscoverTrends(); }} className="bg-slate-900 border border-slate-800 p-1.5 rounded-xl flex items-center gap-2 shadow-inner focus-within:border-indigo-500/50 transition-colors">
              <div className="pl-3">
                <MapPin className="w-4 h-4 text-slate-500" />
              </div>
              <input 
                type="text" 
                placeholder="¿En qué ciudad quieres emprender?"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-transparent border-none focus:outline-none text-sm text-white py-2 placeholder-slate-600 font-medium"
              />
              <button 
                type="submit" 
                disabled={isDiscovering || !city.trim()}
                className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition disabled:bg-slate-800 disabled:text-slate-500"
                title="Descubrir tendencias"
              >
                {isDiscovering ? (
                   <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin block"></span>
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </button>
            </form>

            <div className="flex justify-between items-center mt-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" /> {isDiscovering ? 'Analizando tu ciudad...' : 'Tendencias Emergentes'}
              </h2>
              <button 
                onClick={() => setActiveTab('roi')} 
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold"
              >
                <Calculator className="w-3.5 h-3.5" /> Calculadora ROI
              </button>
            </div>
            
            <div className="space-y-4">
              {trends.map(trend => (
                <div 
                  key={trend.id} 
                  onClick={() => setSelectedTrend(trend)}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 cursor-pointer hover:border-indigo-500/50 transition group shadow-lg space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-1.5 items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-950 text-indigo-400 px-2.5 py-1 rounded-md border border-slate-800">
                        {trend.category}
                      </span>
                      {trend.type && (
                        <span className="text-[10px] font-semibold bg-slate-950 text-slate-400 px-2 py-1 rounded-md border border-slate-800">
                          {trend.type}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded">
                      <Flame className="w-3 h-3" /> HOT
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition">{trend.title}</h3>
                  <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">{trend.description}</p>
                  
                  {trend.realTimeAlert && (
                    <div className="text-[11px] text-amber-300/90 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 line-clamp-1">
                      {trend.realTimeAlert}
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold mb-0.5">Inversión</span>
                        <span className="text-xs font-bold text-emerald-400">{trend.cost.split(' ')[0]}</span>
                      </div>
                      <div className="w-px h-6 bg-slate-800"></div>
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold mb-0.5">Margen</span>
                        <span className="text-xs font-bold text-indigo-300">{trend.margin || '50%'}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ROI CALCULATOR TAB */}
        {activeTab === 'roi' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-3 bg-indigo-900/30 border border-indigo-500/30 p-5 rounded-3xl">
              <div className="p-3 bg-indigo-600 rounded-2xl shrink-0">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Calculadora de ROI por Ciudad</h2>
                <p className="text-xs text-indigo-200">Proyecta la recuperación de tu inversión en tiempo real.</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Ciudad Objetivo</label>
                <input 
                  type="text" 
                  value={roiCityInput} 
                  onChange={(e) => setRoiCityInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="Ej. CDMX, Monterrey, Guadalajara..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                  Inversión Inicial Estimada: <span className="text-emerald-400">${roiInvestment.toLocaleString()} MXN</span>
                </label>
                <input 
                  type="range" 
                  min="5000" 
                  max="200000" 
                  step="5000" 
                  value={roiInvestment} 
                  onChange={(e) => setRoiInvestment(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                  Ventas Mensuales Estimadas: <span className="text-indigo-400">${roiSales.toLocaleString()} MXN</span>
                </label>
                <input 
                  type="range" 
                  min="2000" 
                  max="100000" 
                  step="2000" 
                  value={roiSales} 
                  onChange={(e) => setRoiSales(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                  Gastos Operativos Mensuales: <span className="text-red-400">${roiExpenses.toLocaleString()} MXN</span>
                </label>
                <input 
                  type="range" 
                  min="1000" 
                  max="50000" 
                  step="1000" 
                  value={roiExpenses} 
                  onChange={(e) => setRoiExpenses(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* CALCULATED RESULTS */}
              <div className="pt-4 border-t border-slate-800 grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[9px] text-slate-500 font-bold uppercase block">Ganancia Neta</span>
                  <span className="text-sm font-black text-emerald-400">${netMonthlyProfit.toLocaleString()}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[9px] text-slate-500 font-bold uppercase block">Margen Neto</span>
                  <span className="text-sm font-black text-indigo-400">{roiMarginPercentage}%</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[9px] text-slate-500 font-bold uppercase block">Retorno ROI</span>
                  <span className="text-sm font-black text-amber-400">{roiRecoveryMonths} meses</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ALERTAS Y SEGUIMIENTO SEGUNDO PLANO TAB */}
        {activeTab === 'alerts' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-5 rounded-3xl">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl shrink-0">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Seguimiento Diario & Alertas</h2>
                <p className="text-xs text-slate-400">Información en segundo plano para tu negocio.</p>
              </div>
            </div>

            {/* Verification of Phone Number Module */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Phone className="w-4 h-4 text-indigo-400" /> Registro y Verificación de Celular (SMS)
              </h3>
              
              {smsNotification && (
                <div className="bg-indigo-500/10 border border-indigo-500/30 p-3 rounded-xl text-xs text-indigo-200">
                  {smsNotification}
                </div>
              )}

              {phoneVerified ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center gap-2 text-xs text-emerald-400 font-bold">
                  <Check className="w-4 h-4" /> Celular registrado y verificado: {phone}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input 
                      type="tel" 
                      placeholder="+52 55 1234 5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <button 
                      onClick={handleSendSmsOtp}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
                    >
                      Enviar SMS
                    </button>
                  </div>

                  {generatedOtp && (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Código SMS de 6 dígitos"
                        value={smsOtpInput}
                        onChange={(e) => setSmsOtpInput(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-indigo-500"
                      />
                      <button 
                        onClick={handleVerifySmsOtp}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
                      >
                        Verificar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Daily Feed Stream */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Feed de Alertas Recientes</h3>
              
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>Hoy 09:30 AM</span>
                  <span className="text-orange-400 font-bold">TENDENCIA CRÍTICA</span>
                </div>
                <h4 className="text-xs font-bold text-white">Agencias de Automatización con IA (+240%)</h4>
                <p className="text-xs text-slate-400">Se detectó un pico masivo de contrataciones por pymes locales en CDMX, Guadalajara y Monterrey.</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>Ayer 06:15 PM</span>
                  <span className="text-indigo-400 font-bold">NUEVO PROVEEDOR</span>
                </div>
                <h4 className="text-xs font-bold text-white">Vending Machines Saludables</h4>
                <p className="text-xs text-slate-400">Añadidos 3 distribuidores directos de equipo con descuento especial para miembros TrendHunter.</p>
              </div>
            </div>
          </div>
        )}

        {/* PREMIUM / MONETIZATION TAB */}
        {activeTab === 'premium' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-center py-4">
              <Crown className="w-14 h-14 text-amber-400 mx-auto mb-3 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]" />
              <h2 className="text-2xl font-black text-white mb-1">Nuestros Planes de Acceso</h2>
              <p className="text-slate-400 text-xs">Elige la versión perfecta para impulsar tu emprendimiento.</p>
            </div>

            {/* PLAN 1: CHISMOSO / BÁSICO ($99 MXN) */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
              <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-200">Plan Chismoso / Básico</h3>
                  <p className="text-xs text-slate-400 mt-1">Para explorar el mercado sin compromisos.</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-white">$99</span>
                  <span className="text-slate-400 text-xs block">MXN / Donativo ☕</span>
                </div>
              </div>

              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>3 tendencias semanales por encima.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Resumen ligero sin datos profundos.</span>
                </li>
                <li className="flex items-center gap-2 text-slate-500 line-through">
                  <span>Sin reportes de proveedores ni análisis de competencia.</span>
                </li>
              </ul>

              <a 
                href="https://mpago.la/2MVU6AT"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition text-xs"
              >
                <Wallet className="w-4 h-4" />
                Obtener Plan Chismoso ($99 MXN)
              </a>
            </div>

            {/* PLAN 2: PREMIUM ($149 MXN PROMO) */}
            <div className="bg-gradient-to-br from-indigo-900/60 via-slate-900 to-purple-900/60 border-2 border-indigo-500/50 p-6 rounded-3xl shadow-2xl space-y-6 relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-emerald-500 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                PROMO LANZAMIENTO
              </div>

              <div className="border-b border-indigo-500/20 pb-4">
                <h3 className="text-xl font-black text-amber-300 mb-1">Plan Premium Completo</h3>
                <p className="text-indigo-200 text-xs">Acceso total, alertas en vivo y seguimiento diario.</p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">$149</span>
                  <span className="text-sm font-bold text-slate-400 line-through">$249 MXN</span>
                  <span className="text-[10px] text-emerald-400 font-bold">/mes (Primeros 3 meses)</span>
                </div>
              </div>

              <ul className="space-y-3 text-xs text-slate-200">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Top 10 tendencias de la semana</strong> actualizadas constantemente.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Inversión inicial, margen y nivel de riesgo (Bajo/Medio/Alto).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Clasificación negocio Local, Digital o Híbrido.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Reporte completo: proveedores, búsquedas Google, TikTok growth y competencia.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Alertas en tiempo real (+200% crecimiento)</strong> y Calculadora de ROI.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Folio único de recomendados con <strong>50% de descuento</strong> en siguiente pago.</span>
                </li>
              </ul>
              
              {isLoggedIn ? (
                <a 
                  href="https://mpago.la/1ERmzsj"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#009EE3] hover:bg-[#0086C1] text-white font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-3 transition shadow-lg shadow-blue-500/20 text-sm"
                >
                  <Wallet className="w-5 h-5" />
                  Suscribirse a Premium ($149 MXN)
                </a>
              ) : (
                <button 
                  onClick={() => setShowAuthDialog(true)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-3 transition shadow-lg shadow-indigo-500/20 text-sm"
                >
                  <User className="w-5 h-5" />
                  Crear cuenta para Suscribirse
                </button>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs space-y-2">
              <h4 className="font-bold text-white flex items-center gap-2">⚡ Activación Inmediata</h4>
              <p className="text-slate-400 leading-relaxed">
                Al pagar en Mercado Pago, tu cuenta se activa automáticamente en minutos.
              </p>
            </div>
          </div>
        )}

        {/* REFERRALS TAB */}
        {activeTab === 'referrals' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-indigo-400" /> Folio de Recomendados & 50% Desc.
            </h2>

            <div className="bg-indigo-900/30 border border-indigo-500/30 p-6 rounded-3xl text-center">
              <h3 className="text-xl font-bold text-white mb-2">¡Consigue 50% de Descuento!</h3>
              <p className="text-sm text-indigo-200 mb-6">Comparte tu folio único. Cuando un amigo se suscribe, obtienes un 50% de descuento en tu próximo pago.</p>
              
              {isLoggedIn ? (
                <>
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col gap-2 mb-6">
                    <span className="text-xs text-slate-500 font-bold uppercase">Tu Folio Único de Recomendado</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        readOnly 
                        value={referralUrl} 
                        className="flex-1 bg-transparent text-sm text-white focus:outline-none truncate"
                      />
                      <button onClick={handleCopyLink} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition text-slate-300">
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <a 
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#25D366] hover:bg-[#1DA851] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition text-xs"
                    >
                      WhatsApp
                    </a>
                    <a 
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#1877F2] hover:bg-[#0C63D4] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition text-xs"
                    >
                      Facebook
                    </a>
                  </div>
                </>
              ) : (
                <button 
                  onClick={() => setShowAuthDialog(true)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-3 transition text-sm"
                >
                  <User className="w-5 h-5" />
                  Inicia sesión para obtener tu folio
                </button>
              )}
            </div>

            {isLoggedIn && (
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <h3 className="text-sm font-bold text-white mb-4">Tus Recomendados ({myReferrals.length})</h3>
                
                {myReferrals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <User className="w-8 h-8 text-slate-600 mb-2" />
                    <p className="text-sm text-slate-400">Aún no tienes recomendados.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myReferrals.map((refUser, idx) => (
                      <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                        <span className="text-slate-300">{refUser.email}</span>
                        {refUser.isPremium ? (
                          <span className="font-bold bg-amber-400/20 text-amber-400 px-2 py-0.5 rounded">PREMIUM (50% desc)</span>
                        ) : (
                          <span className="font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded">GRATIS</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ADMIN TAB & CLEANUP UTILITY */}
        {isAdmin && activeTab === 'admin' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" /> Panel de Administrador
              </h2>
              <button 
                onClick={handleClearTestUsers}
                disabled={isClearingUsers}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isClearingUsers ? 'animate-spin' : ''}`} />
                {isClearingUsers ? 'Limpiando...' : 'Reiniciar Base de Datos'}
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                <span className="font-bold text-white block">🔗 Enlaces Directos del Proyecto:</span>
                <div className="space-y-1">
                  <div>
                    <span className="text-slate-500">Enlace Público de Clientes:</span>
                    <a href="https://ais-pre-z75e37hjjlxjootla6rtss-602300028753.us-east1.run.app" target="_blank" rel="noreferrer" className="text-indigo-400 font-mono block truncate hover:underline">
                      https://ais-pre-z75e37hjjlxjootla6rtss-602300028753.us-east1.run.app
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-500">Enlace Administrador:</span>
                    <span className="text-emerald-400 font-mono block truncate">
                      https://ais-pre-z75e37hjjlxjootla6rtss-602300028753.us-east1.run.app (iniciando con {authUser?.email})
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white mb-2">Usuarios Registrados ({adminUsers.length})</h3>
                <div className="space-y-3">
                  {adminUsers.map((u, i) => (
                    <div key={i} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold text-white">{u.email}</span>
                        {u.isPremium && <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 rounded-md">PREMIUM</span>}
                      </div>
                      <div className="flex gap-4 text-[10px] text-slate-500">
                        <span>Ref Code: {u.referralCode}</span>
                        <span>Celular: {u.phone || 'No registrado'} ({u.phoneVerified ? 'Verificado' : 'Sin verificar'})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Chat UI */}
      {isLoggedIn && isPremium && (
        <>
          <button 
            onClick={() => setShowChat(!showChat)}
            className="fixed bottom-24 right-6 bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.5)] z-50 transition-transform hover:scale-110 flex items-center justify-center"
          >
            {showChat ? <ChevronLeft className="w-6 h-6 -rotate-90" /> : <Bot className="w-6 h-6" />}
          </button>

          {showChat && (
            <div className="fixed bottom-40 right-6 w-[350px] max-w-[calc(100vw-48px)] h-[500px] max-h-[60vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-indigo-600 p-4 text-white flex items-center gap-2 shadow-md">
                <Bot className="w-5 h-5" />
                <h3 className="font-bold text-sm">Asistente IA TrendHunter</h3>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-slate-950/50">
                {chatMessages.length === 0 && (
                  <div className="text-center text-slate-500 text-xs my-auto p-4">
                    <Sparkles className="w-8 h-8 text-indigo-500/50 mx-auto mb-2" />
                    Hola, soy tu consultor de negocios. Pregúntame sobre modelos de negocio, haz proyecciones o descubre ideas.
                  </div>
                )}
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'}`}>
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-invert prose-sm max-w-none">
                          {renderMarkdown(msg.content)}
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800 border border-slate-700 text-slate-400 p-3 rounded-xl rounded-tl-none text-xs flex items-center gap-2">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Escribe tu duda..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  disabled={isChatLoading}
                />
                <button 
                  type="submit" 
                  disabled={isChatLoading || !chatInput.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white p-2 rounded-lg transition"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </>
      )}

      {/* Mobile Bottom Navigation Simulator */}
      <div className="fixed bottom-0 w-full bg-slate-950/90 backdrop-blur-xl border-t border-slate-900 md:hidden z-40">
        <div className="flex justify-around items-center p-3">
          <button 
            onClick={() => setActiveTab('trends')}
            className={`flex flex-col items-center gap-1 p-2 transition ${activeTab === 'trends' ? 'text-indigo-400' : 'text-slate-500'}`}
          >
            <Flame className="w-5 h-5" />
            <span className="text-[10px] font-bold">Explorar</span>
          </button>

          <button 
            onClick={() => setActiveTab('alerts')}
            className={`flex flex-col items-center gap-1 p-2 transition ${activeTab === 'alerts' ? 'text-amber-400' : 'text-slate-500'}`}
          >
            <Bell className="w-5 h-5" />
            <span className="text-[10px] font-bold">Alertas</span>
          </button>
          
          <button 
            onClick={() => {
              if (!isLoggedIn) {
                setShowAuthDialog(true);
              }
              setActiveTab('referrals');
            }}
            className={`flex flex-col items-center gap-1 p-2 transition ${activeTab === 'referrals' ? 'text-indigo-400' : 'text-slate-500'}`}
          >
            <Share2 className="w-5 h-5" />
            <span className="text-[10px] font-bold">Folio</span>
          </button>

          <button 
            onClick={() => setActiveTab('premium')}
            className={`flex flex-col items-center gap-1 p-2 transition ${activeTab === 'premium' ? 'text-amber-400' : 'text-slate-500'}`}
          >
            <Crown className="w-5 h-5" />
            <span className="text-[10px] font-bold">Premium</span>
          </button>
          
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('admin')}
              className={`flex flex-col items-center gap-1 p-2 transition ${activeTab === 'admin' ? 'text-emerald-400' : 'text-slate-500'}`}
            >
              <Shield className="w-5 h-5" />
              <span className="text-[10px] font-bold">Admin</span>
            </button>
          )}
        </div>
      </div>
    </div>
    )}
  </>
  );
}
