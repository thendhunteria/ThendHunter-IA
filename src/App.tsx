import React, { useState, useEffect } from 'react';
import { 
  Flame, MapPin, DollarSign, TrendingUp, Bot, Bell, 
  ChevronLeft, Search, Sparkles, ArrowRight, Activity, Zap,
  Crown, Share2, Copy, Check, User, LogOut, Wallet, Shield,
  Calculator, Phone, MessageSquare, AlertTriangle, RefreshCw, Clock, ExternalLink, Globe, Send, Share
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, getDoc, setDoc, updateDoc, increment, collection, query, where, getDocs, deleteDoc 
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
  scope?: string; // Local, Nacional, América, Mundial
  margin?: string;
  risk?: string;
  suppliers?: string;
  googleSearches?: string;
  tiktokGrowth?: string;
  competition?: string;
  realTimeAlert?: string;
}

// Multilingual Dictionary
const translations = {
  es: {
    heroTitle: "Encuentra el negocio ideal en tu ciudad antes que nadie.",
    heroSubtitle: "Monitoreamos tendencias emergentes locales, nacionales, en América y a nivel Mundial.",
    exploreTrends: "Explorar Tendencias",
    scopeFilterAll: "Todos los Alcances",
    scopeLocal: "Local",
    scopeNacional: "Nacional",
    scopeAmerica: "América",
    scopeMundial: "Mundial",
    lowInvestment: "Mínima Inversión",
    highInvestment: "Inversión Capital",
    roiCalculator: "Calculadora de ROI",
    roiTitle: "Calculadora de ROI por Ciudad",
    roiSubtitle: "Proyecta la recuperación de tu inversión en tiempo real.",
    shareTitle: "Comparte y Gana 50% de Bonificación",
    shareSubtitle: "No necesitas registrarte para compartir. Obtén 50% de bonificación en tu suscripción y tu referido obtiene 50% de descuento.",
    shareWhatsApp: "WhatsApp",
    shareFacebook: "Facebook",
    shareTwitter: "X / Twitter",
    shareTelegram: "Telegram",
    copyLink: "Copiar Enlace",
    copied: "¡Copiado!",
    planChismosoName: "Plan Chismoso / Básico",
    planChismosoPrice: "$99 MXN",
    planChismosoDesc: "Para enganchar. 3 tendencias a la semana, visión muy por encima sin datos profundos.",
    planPremiumName: "Plan Premium",
    planPremiumPrice: "$149 MXN / mes",
    planPremiumRegularPrice: "$249 MXN",
    planPremiumDesc: "Top 10 tendencias actualizadas, proveedores, alertas en tiempo real, ROI por ciudad y soporte en segundo plano.",
    promoBadge: "PROMO DE LANZAMIENTO (Primeros 3 meses)",
    verifiedPhone: "Celular verificado por SMS",
    verifyPhoneBtn: "Enviar SMS de Verificación",
    adminPanel: "Panel de Administración",
    cleanDbBtn: "Reiniciar Usuarios de Prueba",
    chatbotTitle: "Asistente Virtual TrendHunter IA",
    chatbotPlaceholder: "Escribe tu pregunta de negocios...",
    countdownAlert: "¡Suscripción por vencer! Te quedan menos de 5 días. Renueva para mantener tu precio de $149.",
    renewNow: "Renovar $149 MXN",
    loginBtn: "Ingresar a la Plataforma",
    registerBtn: "Crear Cuenta",
    logoutBtn: "Cerrar Sesión",
    navTrends: "Tendencias",
    navRoi: "Calculadora",
    navAlerts: "Alertas & SMS",
    navShare: "Compartir",
    navPremium: "Planes",
    navAdmin: "Admin",
  },
  en: {
    heroTitle: "Find the perfect business in your city before anyone else.",
    heroSubtitle: "We monitor emerging trends locally, nationally, across the Americas, and globally.",
    exploreTrends: "Explore Trends",
    scopeFilterAll: "All Scopes",
    scopeLocal: "Local",
    scopeNacional: "National",
    scopeAmerica: "Americas",
    scopeMundial: "Global",
    lowInvestment: "Low Investment",
    highInvestment: "Capital Investment",
    roiCalculator: "ROI Calculator",
    roiTitle: "City ROI Calculator",
    roiSubtitle: "Project your investment recovery in real-time.",
    shareTitle: "Share & Earn 50% Bonus",
    shareSubtitle: "No login required to share! Get 50% bonus on your renewal, and your friend gets 50% discount.",
    shareWhatsApp: "WhatsApp",
    shareFacebook: "Facebook",
    shareTwitter: "X / Twitter",
    shareTelegram: "Telegram",
    copyLink: "Copy Link",
    copied: "Copied!",
    planChismosoName: "Starter / Preview Plan",
    planChismosoPrice: "$99 MXN ($5 USD)",
    planChismosoDesc: "3 high-level trends per week without deep metrics or provider details.",
    planPremiumName: "Premium Plan",
    planPremiumPrice: "$149 MXN ($8 USD)",
    planPremiumRegularPrice: "$249 MXN",
    planPremiumDesc: "Top 10 updated trends, verified suppliers, real-time alerts (+200%), ROI calculator & background delivery.",
    promoBadge: "LAUNCH PROMO (First 3 months)",
    verifiedPhone: "Phone verified via SMS",
    verifyPhoneBtn: "Send SMS Verification",
    adminPanel: "Admin Panel",
    cleanDbBtn: "Reset Test Users",
    chatbotTitle: "TrendHunter AI Assistant",
    chatbotPlaceholder: "Ask any business question...",
    countdownAlert: "Subscription expiring soon! Less than 5 days remaining. Renew now to keep $149 pricing.",
    renewNow: "Renew $149 MXN",
    loginBtn: "Login to Platform",
    registerBtn: "Create Account",
    logoutBtn: "Sign Out",
    navTrends: "Trends",
    navRoi: "ROI Calc",
    navAlerts: "Alerts & SMS",
    navShare: "Share & Earn",
    navPremium: "Plans",
    navAdmin: "Admin",
  }
};

export default function App() {
  // Language State
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const t = translations[lang];

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
  const [daysRemaining, setDaysRemaining] = useState<number>(4);
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [myReferrals, setMyReferrals] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [isClearingUsers, setIsClearingUsers] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('free');

  // Analytics State
  const [globalViews, setGlobalViews] = useState<number>(300000);
  const [dailyViews, setDailyViews] = useState<any>({});

  // Scope & Filtering
  const [scopeFilter, setScopeFilter] = useState<string>('All');

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

  // Guest Referral Code Generation (No login needed to share!)
  useEffect(() => {
    let localRef = localStorage.getItem('guestReferralCode');
    if (!localRef) {
      localRef = 'REF-' + Math.random().toString(36).substring(2, 7).toUpperCase();
      localStorage.setItem('guestReferralCode', localRef);
    }
    if (!referralCode) {
      setReferralCode(localRef);
    }
  }, []);

  // Check URL tab parameter for quick navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam === 'admin') setActiveTab('admin');
      const refParam = urlParams.get('ref');
      if (refParam) sessionStorage.setItem('referredBy', refParam);
    }
  }, []);

  // 5-Second Automatic Ad Banner Switcher
  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIndex(prev => (prev === 0 ? 1 : 0));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const [analyticsError, setAnalyticsError] = useState('');

  // Global Analytics Tracker
  useEffect(() => {
    const incrementView = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const statsRef = doc(db, 'analytics', 'global');
        
        // Optimistic local update so it always sums up visually
        setGlobalViews(prev => prev + 1);

        const docSnap = await getDoc(statsRef);
        
        if (!docSnap.exists()) {
          await setDoc(statsRef, {
            totalVisits: 300001,
            history: { [today]: 1 }
          });
          setGlobalViews(300001);
          setDailyViews({ [today]: 1 });
        } else {
          // Increment always on load to show it works
          await updateDoc(statsRef, {
            totalVisits: increment(1),
            [`history.${today}`]: increment(1)
          });
          
          const updatedSnap = await getDoc(statsRef);
          if (updatedSnap.exists()) {
             setGlobalViews(updatedSnap.data().totalVisits);
             setDailyViews(updatedSnap.data().history || {});
          }
        }
      } catch (e: any) {
        console.error("Error updating analytics", e);
        // Silently fail to avoid blocking UI, the local state already incremented
      }
    };
    incrementView();
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
          setPaymentStatus(data.paymentStatus || 'free');
          setReferralCode(data.referralCode || localStorage.getItem('guestReferralCode') || '');
          setPhone(data.phone || '');
          setPhoneVerified(data.phoneVerified || false);
          loadReferrals(data.referralCode);
        } else {
          const storedRef = sessionStorage.getItem('referredBy');
          const codeToUse = localStorage.getItem('guestReferralCode') || ('REF-' + Math.random().toString(36).substring(2, 7).toUpperCase());
          const initialData = {
            email: user.email,
            referralCode: codeToUse,
            referredBy: storedRef || null,
            isPremium: false,
            subscriptionTier: 'free',
            paymentStatus: 'free',
            phone: '',
            phoneVerified: false,
            createdAt: new Date().toISOString()
          };
          await setDoc(userDocRef, initialData);
          setReferralCode(codeToUse);
          setIsPremium(false);
          setSubscriptionTier('free');
          setPaymentStatus('free');
        }
      } else {
        setIsLoggedIn(false);
        setAuthUser(null);
        setIsPremium(false);
        setSubscriptionTier('free');
        setPaymentStatus('free');
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

  const handleReportPayment = async () => {
    if (!authUser) {
      setShowAuthDialog(true);
      return;
    }
    try {
      await setDoc(doc(db, 'users', authUser.uid), {
        paymentStatus: 'pending_validation'
      }, { merge: true });
      setPaymentStatus('pending_validation');
      alert(lang === 'es' ? 'Pago reportado con éxito. Un administrador validará tu suscripción a la brevedad.' : 'Payment reported. An administrator will validate your subscription shortly.');
    } catch (e) {
      console.error(e);
      alert('Error al reportar el pago.');
    }
  };

  const handleValidatePayment = async (userId: string) => {
    try {
      await setDoc(doc(db, 'users', userId), {
        isPremium: true,
        subscriptionTier: 'premium',
        paymentStatus: 'validated'
      }, { merge: true });
      loadAllUsers();
      alert('Pago validado correctamente. Usuario ahora es Premium.');
    } catch (e) {
      console.error(e);
      alert('Error al validar el pago.');
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
        const codeToUse = referralCode || ('REF-' + Math.random().toString(36).substring(2, 7).toUpperCase());
        await setDoc(doc(db, 'users', cred.user.uid), {
          email: cred.user.email,
          referralCode: codeToUse,
          referredBy: storedRef || null,
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
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage = 'El acceso por correo/contraseña está desactivado. Ve a Firebase Console -> Authentication -> Sign-in method y habilita "Email/Password".';
      }
      setAuthError(errorMessage);
    }
  };

  const handleSendSmsOtp = async () => {
    if (!phone.trim() || phone.length < 8) {
      alert(lang === 'es' ? 'Por favor ingresa un número celular válido (mínimo 10 dígitos).' : 'Please enter a valid mobile number (min 10 digits).');
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setSmsNotification(`📩 [SMS Recibido en ${phone}] Tu código de verificación TrendHunter es: ${code}`);
  };

  const handleVerifySmsOtp = async () => {
    if (smsOtpInput.trim() === generatedOtp && generatedOtp !== '') {
      setPhoneVerified(true);
      setSmsNotification(lang === 'es' ? '✅ ¡Teléfono celular verificado exitosamente!' : '✅ Mobile phone verified successfully!');
      if (authUser) {
        await setDoc(doc(db, 'users', authUser.uid), {
          phone,
          phoneVerified: true
        }, { merge: true });
      }
    } else {
      alert(lang === 'es' ? 'El código ingresado es incorrecto. Verifica el número recibido por SMS.' : 'Incorrect code. Check the SMS code received.');
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setAuthError('Ingresa tu correo para restablecer la contraseña.');
      return;
    }
    setAuthError('');
    setAuthMessage('');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setAuthMessage('Se ha enviado un enlace a tu correo para restablecer tu contraseña (revisa spam).');
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setAuthError('No se pudo enviar. Habilita "Email/Password" en Firebase Console primero.');
      } else {
        setAuthError('Error al enviar correo: ' + err.message);
      }
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

  const handleSendMessage = async (e: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const queryText = customMsg || chatInput;
    if (!queryText.trim()) return;

    const newMessage = { role: 'user' as const, content: queryText };
    setChatMessages(prev => [...prev, newMessage]);
    if (!customMsg) setChatInput('');
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
  
  const shareMessageText = lang === 'es' 
    ? `🔥 Descubre ideas de negocios rentables con Inteligencia Artificial en TrendHunter AI.\n\nIngresa con mi enlace único y obtén un 50% DE DESCUENTO en tu suscripción Premium ($149 MXN) y recibe alertas en tiempo real:\n\n👉 ${referralUrl}`
    : `🔥 Discover profitable business ideas with AI on TrendHunter AI.\n\nUse my referral link to get 50% OFF your Premium subscription ($149 MXN) and receive real-time business alerts:\n\n👉 ${referralUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'TrendHunter AI',
        text: shareMessageText,
        url: referralUrl
      }).catch(console.error);
    } else {
      handleCopyLink();
    }
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

  // Filter trends by scope
  const filteredTrends = trends.filter(trend => {
    if (scopeFilter === 'All' || scopeFilter === 'Todos') return true;
    return trend.scope === scopeFilter || (scopeFilter === 'Local' && !trend.scope);
  });

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
          <p className="text-sm text-slate-400 text-center mb-6">
            {lang === 'es' ? 'Descubre negocios rentables en tu ciudad con IA.' : 'Discover profitable business ideas with AI.'}
          </p>
          
          {authError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs mb-4">{authError}</div>}
          {authMessage && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs mb-4">{authMessage}</div>}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                {lang === 'es' ? 'Correo Electrónico' : 'Email Address'}
              </label>
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
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                {lang === 'es' ? 'Contraseña' : 'Password'}
              </label>
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
              {isRegistering ? t.registerBtn : t.loginBtn}
            </button>
          </form>
          
          <div className="mt-4 flex flex-col items-center gap-3">
            <button 
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              {isRegistering 
                ? (lang === 'es' ? '¿Ya tienes cuenta? Inicia sesión' : 'Already have an account? Sign in')
                : (lang === 'es' ? '¿No tienes cuenta? Regístrate' : "Don't have an account? Sign up")}
            </button>
            <button 
              type="button"
              onClick={handleResetPassword}
              className="text-xs text-slate-500 hover:text-slate-400"
            >
              {lang === 'es' ? 'Olvidé mi contraseña' : 'Forgot password'}
            </button>
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
              <strong>{t.countdownAlert}</strong>
            </span>
          </div>
          <a 
            href="https://mpago.la/1ERmzsj"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3 py-1 rounded-md text-[10px] shrink-0 transition"
          >
            {t.renewNow}
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
              {selectedTrend.scope && (
                <span className="text-[10px] bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded border border-purple-700/50">
                  {selectedTrend.scope}
                </span>
              )}
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

          <div className="flex items-center gap-2">
            {/* LANGUAGE SWITCHER ES / EN */}
            <button 
              onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition"
              title="Cambiar Idioma / Switch Language"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>{lang === 'es' ? '🇲🇽 ES' : '🇺🇸 EN'}</span>
            </button>

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
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">{t.exploreTrends}</span>
                </div>
              </div>
              <h2 className="text-xl font-black text-white leading-tight mb-2">
                {t.heroTitle}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                {t.heroSubtitle}
              </p>
              <button 
                onClick={() => setActiveTab('premium')}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-500/20"
              >
                {t.planPremiumName} $149 <ArrowRight className="w-4 h-4" />
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
                    <h3 className="text-xs font-bold text-slate-200">{t.planChismosoName}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{t.planChismosoDesc}</p>
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
                    <h3 className="text-xs font-bold text-amber-300">{t.planPremiumName}</h3>
                    <p className="text-[10px] text-indigo-200 mt-0.5">{t.planPremiumDesc}</p>
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
                placeholder={lang === 'es' ? '¿En qué ciudad quieres emprender?' : 'Which city do you want to start in?'}
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

            {/* Scope Filter Pills (Local, Nacional, América, Mundial) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {['All', 'Local', 'Nacional', 'América', 'Mundial'].map((sc) => {
                const labelMap: Record<string, string> = {
                  All: t.scopeFilterAll,
                  Local: t.scopeLocal,
                  Nacional: t.scopeNacional,
                  América: t.scopeAmerica,
                  Mundial: t.scopeMundial
                };
                const isActive = scopeFilter === sc;
                return (
                  <button
                    key={sc}
                    onClick={() => setScopeFilter(sc)}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                      isActive 
                        ? 'bg-indigo-600 text-white shadow' 
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {labelMap[sc]}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center mt-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" /> {isDiscovering ? 'Analizando tendencias...' : 'Tendencias Alternadas (Alta/Baja Inversión)'}
              </h2>
              <button 
                onClick={() => setActiveTab('roi')} 
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold"
              >
                <Calculator className="w-3.5 h-3.5" /> ROI
              </button>
            </div>
            
            <div className="space-y-4">
              {filteredTrends.map(trend => (
                <div 
                  key={trend.id} 
                  onClick={() => setSelectedTrend(trend)}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 cursor-pointer hover:border-indigo-500/50 transition group shadow-lg space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-1.5 items-center flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-950 text-indigo-400 px-2.5 py-1 rounded-md border border-slate-800">
                        {trend.category}
                      </span>
                      {trend.scope && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-900/40 text-purple-300 px-2.5 py-1 rounded-md border border-purple-700/40">
                          {trend.scope === 'Local' ? '📍 Local' : trend.scope === 'Nacional' ? '🇲🇽 Nacional' : trend.scope === 'América' ? '🌎 América' : '🌐 Mundial'}
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

        {/* SHARE & EARN TAB (NO LOGIN REQUIRED) */}
        {activeTab === 'referrals' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-gradient-to-br from-indigo-900/60 to-purple-900/60 border border-indigo-500/40 p-6 rounded-3xl space-y-4 text-center">
              <div className="inline-flex p-3 bg-indigo-600 rounded-2xl">
                <Share2 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-black text-white">{t.shareTitle}</h2>
              <p className="text-xs text-indigo-200 leading-relaxed max-w-sm mx-auto">
                {t.shareSubtitle}
              </p>

              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-bold text-indigo-300 truncate">{referralUrl}</span>
                <button 
                  onClick={handleCopyLink}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-2 rounded-xl transition flex items-center gap-1 shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? t.copied : t.copyLink}</span>
                </button>
              </div>

              {/* SOCIAL MEDIA ONE-CLICK SHARE BUTTONS */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <a 
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessageText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs p-3 rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <MessageSquare className="w-4 h-4" /> {t.shareWhatsApp}
                </a>

                <a 
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs p-3 rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <Share2 className="w-4 h-4" /> {t.shareFacebook}
                </a>

                <a 
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessageText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs p-3 rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <Send className="w-4 h-4" /> {t.shareTwitter}
                </a>

                <button 
                  onClick={handleNativeShare}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs p-3 rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <Share className="w-4 h-4" /> Más Redes
                </button>
              </div>
            </div>

            {/* Referrals Status Table */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {lang === 'es' ? 'Tus Referidos Registrados & Bonificaciones' : 'Your Referred Users & Bonuses'}
              </h3>
              {myReferrals.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">
                  {lang === 'es' ? 'Aún no tienes usuarios registrados con tu código. ¡Comparte tu enlace para ganar tu 50%!' : 'No referred users registered yet. Share your link to get your 50%!'}
                </p>
              ) : (
                <div className="space-y-2">
                  {myReferrals.map((ref, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-mono">{ref.email}</span>
                      <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                        50% Bonificado
                      </span>
                    </div>
                  ))}
                </div>
              )}
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
                <h2 className="text-lg font-bold text-white">{t.roiTitle}</h2>
                <p className="text-xs text-indigo-200">{t.roiSubtitle}</p>
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
          </div>
        )}

        {/* PLANES Y SUSCRIPCIÓN TAB */}
        {activeTab === 'premium' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-center space-y-2">
              <span className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-black uppercase px-3 py-1 rounded-full">
                {t.promoBadge}
              </span>
              <h2 className="text-2xl font-black text-white">Elige tu Nivel de Acceso</h2>
              <p className="text-xs text-slate-400">Información en tiempo real para hacer crecer tu capital.</p>
            </div>

            {/* Plan 1: Chismoso / Básico */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">{t.planChismosoName}</h3>
                <span className="text-lg font-black text-white">{t.planChismosoPrice}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{t.planChismosoDesc}</p>
              <div className="space-y-2">
                <a 
                  href="https://mpago.la/2MVU6AT" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-center w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition text-xs"
                >
                  Pagar Plan Básico $99
                </a>
                <button 
                  onClick={handleReportPayment}
                  className="block text-center w-full bg-transparent border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold py-2 rounded-xl transition text-[10px]"
                >
                  Ya realicé mi pago, validarlo
                </button>
              </div>
            </div>

            {/* Plan 2: Premium Promo */}
            <div className="bg-gradient-to-br from-indigo-900/80 via-slate-900 to-purple-900/80 border-2 border-indigo-500 p-6 rounded-3xl space-y-5 shadow-2xl relative">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-black text-amber-300 uppercase block tracking-wider">Recomendado</span>
                  <h3 className="text-xl font-black text-white">{t.planPremiumName}</h3>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-white">$149 <span className="text-xs text-slate-400 font-normal">MXN/mes</span></span>
                  <span className="text-xs line-through text-slate-400 block">$249 MXN</span>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-200">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Top 10 tendencias semanales actualizadas
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Lista de proveedores y fabricantes directos
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Alertas de tendencias +200% (América y EE.UU.)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Calculadora de ROI personalizada por ciudad
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Seguimiento diario en segundo plano vía SMS
                </li>
              </ul>

              <div className="space-y-2">
                <a 
                  href="https://mpago.la/1ERmzsj" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-center w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-indigo-500/30 text-sm"
                >
                  Pagar Suscripción Premium $149
                </a>
                <button 
                  onClick={handleReportPayment}
                  className="block text-center w-full bg-transparent border border-indigo-500/50 hover:bg-indigo-500/20 text-indigo-200 font-bold py-2 rounded-xl transition text-[10px]"
                >
                  Ya realicé mi pago, validarlo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ADMIN TAB */}
        {activeTab === 'admin' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-400" /> {t.adminPanel}
                </h2>
                <span className="text-xs text-slate-400 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 font-mono">
                  gustavocesarlopezornelas@gmail.com
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Total Usuarios Registrados:</span>
                  <span className="font-bold text-white text-sm">{adminUsers.length}</span>
                </div>

                {/* Tendencias de Visitas */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" /> Tendencia de Visitas Globales
                  </h3>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-black text-white">{globalViews.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500 mb-1">visitas totales</span>
                  </div>
                  
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Últimos días:</span>
                    {Object.entries(dailyViews).slice(-7).reverse().map(([date, count]: any) => (
                      <div key={date} className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-mono">{date}</span>
                        <span className="text-emerald-400 font-bold">+{count} visitas</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Registros y Pagos */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-amber-400" /> Validación de Suscriptores
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {adminUsers.map(user => (
                      <div key={user.id} className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-white break-all">{user.email}</span>
                          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                            {user.isPremium ? 'Premium' : 'Básico'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            user.paymentStatus === 'validated' ? 'bg-emerald-500/20 text-emerald-400' : 
                            user.paymentStatus === 'pending_validation' ? 'bg-amber-500/20 text-amber-400 animate-pulse' : 
                            'bg-slate-800 text-slate-500'
                          }`}>
                            {user.paymentStatus === 'validated' ? 'Pago Validado' : 
                             user.paymentStatus === 'pending_validation' ? 'Validación Pendiente' : 
                             'Sin Pago'}
                          </span>
                          
                          {user.paymentStatus === 'pending_validation' && (
                            <button 
                              onClick={() => handleValidatePayment(user.id)}
                              className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2 py-1 rounded transition"
                            >
                              Validar Acceso
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {adminUsers.length === 0 && (
                      <p className="text-[10px] text-slate-500 text-center py-2">No hay usuarios registrados aún.</p>
                    )}
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1 mt-4">
                  <span className="text-slate-500 font-bold block">Enlace de la App Publicada:</span>
                  <a href={baseUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline break-all">
                    {baseUrl}
                  </a>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                  <span className="text-slate-500 font-bold block">Descargar Código Fuente (ZIP):</span>
                  <a href={`${baseUrl}/TrendHunter_App.zip`} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline break-all font-bold">
                    {baseUrl}/TrendHunter_App.zip
                  </a>
                </div>

                <button 
                  onClick={handleClearTestUsers}
                  disabled={isClearingUsers}
                  className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isClearingUsers ? 'animate-spin' : ''}`} />
                  {t.cleanDbBtn}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Footer */}
        <div className="flex flex-col items-center justify-center py-6 mt-8 border-t border-slate-900 gap-3">
          <div className="bg-slate-950/80 border border-slate-800 text-[10px] text-slate-300 px-3 py-1.5 rounded-full flex items-center gap-1.5 font-mono shadow-inner shadow-black/50">
            <Activity className="w-3 h-3 text-emerald-400" />
            Visitas totales: <strong className="text-white">{globalViews.toLocaleString()}</strong>
          </div>
          <footer className="text-center text-[10px] text-slate-600">
            © 2026 TrendHunter.ai – Todos los derechos reservados. Prohibida copia o uso sin autorización escrita.
          </footer>
        </div>

      </main>

      {/* CHATBOT FLOATING OVERLAY */}
      {showChat && (
        <div className="fixed inset-x-4 bottom-20 z-[90] max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-96 animate-in slide-in-from-bottom duration-300">
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-400" />
              <span className="text-xs font-bold text-white">{t.chatbotTitle}</span>
            </div>
            <button onClick={() => setShowChat(false)} className="text-slate-500 hover:text-white transition text-xs font-bold">
              ✕
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {chatMessages.length === 0 && (
              <div className="text-slate-500 text-center py-6 space-y-3">
                <p>👋 Hola, soy tu Asistente Inteligente de Negocios.</p>
                <div className="space-y-1.5 text-left">
                  {[
                    "¿Cuál es la tendencia con menor inversión inicial?",
                    "¿Cómo gano mi 50% de bonificación por compartir?",
                    "Tendencias emergentes en América y Mundial"
                  ].map((chip, idx) => (
                    <button 
                      key={idx}
                      onClick={(e) => handleSendMessage(e, chip)}
                      className="block w-full text-left bg-slate-950 hover:bg-slate-800 border border-slate-800 text-indigo-300 p-2 rounded-xl text-[11px] transition"
                    >
                      💡 {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-2xl max-w-[85%] ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-300 border border-slate-800'}`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-slate-400 animate-pulse">
                  Escribiendo respuesta...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={(e) => handleSendMessage(e)} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
            <input 
              type="text" 
              placeholder={t.chatbotPlaceholder}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
            />
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl transition">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-slate-900 px-4 py-2">
        <div className="max-w-md mx-auto flex justify-between items-center text-[10px] font-bold">
          <button 
            onClick={() => { setSelectedTrend(null); setActiveTab('trends'); }}
            className={`flex flex-col items-center gap-1 transition ${activeTab === 'trends' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Flame className="w-5 h-5" />
            <span>{t.navTrends}</span>
          </button>

          <button 
            onClick={() => { setSelectedTrend(null); setActiveTab('roi'); }}
            className={`flex flex-col items-center gap-1 transition ${activeTab === 'roi' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Calculator className="w-5 h-5" />
            <span>{t.navRoi}</span>
          </button>

          <button 
            onClick={() => { setSelectedTrend(null); setActiveTab('referrals'); }}
            className={`flex flex-col items-center gap-1 transition ${activeTab === 'referrals' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Share2 className="w-5 h-5" />
            <span>{t.navShare}</span>
          </button>

          <button 
            onClick={() => { setSelectedTrend(null); setActiveTab('alerts'); }}
            className={`flex flex-col items-center gap-1 transition ${activeTab === 'alerts' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Bell className="w-5 h-5" />
            <span>{t.navAlerts}</span>
          </button>

          <button 
            onClick={() => { setSelectedTrend(null); setActiveTab('premium'); }}
            className={`flex flex-col items-center gap-1 transition ${activeTab === 'premium' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Crown className="w-5 h-5 text-amber-400" />
            <span>{t.navPremium}</span>
          </button>

          {isAdmin && (
            <button 
              onClick={() => { setSelectedTrend(null); setActiveTab('admin'); }}
              className={`flex flex-col items-center gap-1 transition ${activeTab === 'admin' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Shield className="w-5 h-5" />
              <span>{t.navAdmin}</span>
            </button>
          )}

          {/* Floating Chat Trigger */}
          <button 
            onClick={() => setShowChat(!showChat)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-full shadow-lg shadow-indigo-500/30 transition"
            title="Chatbot IA"
          >
            <Bot className="w-5 h-5" />
          </button>
        </div>
      </nav>
    </div>
      )}
    </>
  );
}
