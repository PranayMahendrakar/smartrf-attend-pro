import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ============================================================
// SmartRF Attend Pro - Complete RFID Attendance Management System
// Zero Dependencies | Single File | Persistent Storage
// ============================================================

const STORAGE_KEYS = {
  COMPANY: "srf:company",
  USERS: "srf:users",
  EMPLOYEES: "srf:employees",
  BRANCHES: "srf:branches",
  ATTENDANCE: "srf:attendance",
  HOLIDAYS: "srf:holidays",
  SETTINGS: "srf:settings",
  EMAIL_CONFIG: "srf:email-config",
  CARDS: "srf:cards",
};

const DEFAULT_COMPANY = {
  name: "SmartRF Attend Pro",
  address: "123 Business Park",
  logo: "",
};

const DEFAULT_SETTINGS = {
  gracePeriod: 15,
  weeklyOff: [0],
  shiftStart: "09:00",
  shiftEnd: "18:00",
  halfDayHours: 4,
  fullDayHours: 8,
  overtimeAfter: 9,
  latePenaltyPercent: 2,
};

const ROLES = { SUPER_ADMIN: "super_admin", ADMIN: "admin", EMPLOYEE: "employee" };
const SALARY_TYPES = ["Fixed", "Hourly", "Daily"];

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const fmtTime = (d) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
const today = () => new Date().toISOString().split("T")[0];
const getMonth = (d) => d?.slice(0, 7);
const currency = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 });

// ============================================================
// STORAGE HELPER
// ============================================================
const storage = {
  async get(key) {
    try {
      const r = await window.storage.get(key);
      return r ? JSON.parse(r.value) : null;
    } catch { return null; }
  },
  async set(key, val) {
    try {
      await window.storage.set(key, JSON.stringify(val));
      return true;
    } catch { return false; }
  },
};

// ============================================================
// ICONS (inline SVG components)
// ============================================================
const Icon = ({ d, size = 20, color = "currentColor", ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d={d} />
  </svg>
);

const Icons = {
  Dashboard: (p) => <Icon d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" {...p} />,
  Users: (p) => <Icon d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75" {...p} />,
  Scan: (p) => <Icon d="M2 8V6a2 2 0 012-2h4 M2 16v2a2 2 0 002 2h4 M18 4h2a2 2 0 012 2v2 M18 20h2a2 2 0 002-2v-2 M7 12h10" {...p} />,
  Card: (p) => <Icon d="M1 4h22v16H1z M1 10h22" {...p} />,
  Branch: (p) => <Icon d="M3 21h18 M3 7v14 M21 7v14 M6 7V4h12v3 M9 21v-5h6v5 M9 7h6" {...p} />,
  Money: (p) => <Icon d="M12 1v22 M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" {...p} />,
  Report: (p) => <Icon d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" {...p} />,
  Settings: (p) => <Icon d="M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" {...p} />,
  Logout: (p) => <Icon d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9" {...p} />,
  Plus: (p) => <Icon d="M12 5v14 M5 12h14" {...p} />,
  Edit: (p) => <Icon d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" {...p} />,
  Trash: (p) => <Icon d="M3 6h18 M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" {...p} />,
  Check: (p) => <Icon d="M20 6L9 17l-5-5" {...p} />,
  X: (p) => <Icon d="M18 6L6 18 M6 6l12 12" {...p} />,
  Clock: (p) => <Icon d="M12 2a10 10 0 100 20 10 10 0 000-20z M12 6v6l4 2" {...p} />,
  Mail: (p) => <Icon d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6" {...p} />,
  Search: (p) => <Icon d="M11 19a8 8 0 100-16 8 8 0 000 16z M21 21l-4.35-4.35" {...p} />,
  Download: (p) => <Icon d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3" {...p} />,
  Calendar: (p) => <Icon d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z M16 2v4 M8 2v4 M3 10h18" {...p} />,
  Shield: (p) => <Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...p} />,
  Alert: (p) => <Icon d="M12 9v4 M12 17h.01 M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" {...p} />,
  ChevDown: (p) => <Icon d="M6 9l6 6 6-6" {...p} />,
  Eye: (p) => <Icon d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z" {...p} />,
};

// ============================================================
// STYLES
// ============================================================
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap";
fontLink.rel = "stylesheet";
if (!document.querySelector('link[href*="Outfit"]')) document.head.appendChild(fontLink);

const CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0a0e17; --bg2: #111827; --bg3: #1a2235; --bg4: #243049;
    --border: #2a3550; --border2: #374461;
    --text: #e8edf5; --text2: #94a3c0; --text3: #5e6e8a;
    --accent: #3b82f6; --accent2: #2563eb; --accent-glow: rgba(59,130,246,0.15);
    --green: #22c55e; --green-bg: rgba(34,197,94,0.12);
    --red: #ef4444; --red-bg: rgba(239,68,68,0.12);
    --orange: #f59e0b; --orange-bg: rgba(245,158,11,0.12);
    --purple: #a855f7; --purple-bg: rgba(168,85,247,0.12);
    --cyan: #06b6d4;
    --font: 'Outfit', sans-serif; --mono: 'JetBrains Mono', monospace;
    --radius: 10px; --radius-sm: 6px; --radius-lg: 14px;
    --shadow: 0 4px 24px rgba(0,0,0,0.3);
    --transition: all 0.2s ease;
  }
  body { font-family: var(--font); background: var(--bg); color: var(--text); }
  input, select, textarea, button { font-family: var(--font); }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg2); }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
  @keyframes scanLine { 0% { top: 0; } 100% { top: 100%; } }
  .animate-in { animation: fadeIn 0.35s ease forwards; }
  .pulse { animation: pulse 2s infinite; }
`;

// ============================================================
// UI COMPONENTS
// ============================================================
const Btn = ({ children, variant = "primary", size = "md", icon, onClick, disabled, className = "", ...p }) => {
  const base = "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg border-none cursor-pointer whitespace-nowrap";
  const sizes = { sm: "text-xs px-3 py-1.5", md: "text-sm px-4 py-2", lg: "text-base px-6 py-2.5" };
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20",
    secondary: "bg-slate-700 hover:bg-slate-600 text-slate-200",
    danger: "bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30",
    ghost: "bg-transparent hover:bg-slate-700/50 text-slate-300",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${disabled ? "opacity-40 cursor-not-allowed" : ""} ${className}`} {...p}>
      {icon && <span className="mr-1.5">{icon}</span>}{children}
    </button>
  );
};

const Input = ({ label, error, ...p }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</label>}
    <input className="w-full px-3 py-2 bg-slate-800 border border-slate-600/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all" {...p} />
    {error && <span className="text-xs text-red-400">{error}</span>}
  </div>
);

const Select = ({ label, options, ...p }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</label>}
    <select className="w-full px-3 py-2 bg-slate-800 border border-slate-600/50 rounded-lg text-sm text-slate-200 outline-none focus:border-blue-500 transition-all" {...p}>
      {options.map(o => typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Badge = ({ children, color = "blue" }) => {
  const colors = {
    blue: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    green: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    red: "bg-red-500/15 text-red-400 border-red-500/25",
    orange: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    purple: "bg-purple-500/15 text-purple-400 border-purple-500/25",
    gray: "bg-slate-500/15 text-slate-400 border-slate-500/25",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors[color]}`}>{children}</span>;
};

const Card = ({ children, className = "", title, action, ...p }) => (
  <div className={`bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 backdrop-blur ${className}`} {...p}>
    {(title || action) && (
      <div className="flex items-center justify-between mb-4">
        {title && <h3 className="text-base font-semibold text-slate-200">{title}</h3>}
        {action}
      </div>
    )}
    {children}
  </div>
);

const Modal = ({ open, onClose, title, children, wide }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className={`bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[90vh] flex flex-col animate-in`}>
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"><Icons.X size={18} /></button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color = "blue", sub }) => {
  const colors = { blue: "from-blue-600/20 to-blue-600/5 border-blue-500/20", green: "from-emerald-600/20 to-emerald-600/5 border-emerald-500/20", red: "from-red-600/20 to-red-600/5 border-red-500/20", orange: "from-amber-600/20 to-amber-600/5 border-amber-500/20", purple: "from-purple-600/20 to-purple-600/5 border-purple-500/20", cyan: "from-cyan-600/20 to-cyan-600/5 border-cyan-500/20" };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-4 flex flex-col gap-1`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <span className="text-2xl font-bold text-white">{value}</span>
      {sub && <span className="text-xs text-slate-400">{sub}</span>}
    </div>
  );
};

const Table = ({ columns, data, onRowClick, emptyMsg = "No data" }) => (
  <div className="overflow-x-auto rounded-lg border border-slate-700/50">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-slate-800/80 border-b border-slate-700/50">
          {columns.map((c, i) => <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{c.header}</th>)}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">{emptyMsg}</td></tr>
        ) : data.map((row, i) => (
          <tr key={i} onClick={() => onRowClick?.(row)} className={`border-b border-slate-700/30 ${onRowClick ? "cursor-pointer hover:bg-slate-700/30" : ""} transition-colors`}>
            {columns.map((c, j) => <td key={j} className="px-4 py-3 text-slate-300">{c.render ? c.render(row) : row[c.key]}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Tabs = ({ tabs, active, onChange }) => (
  <div className="flex gap-1 bg-slate-800/60 p-1 rounded-lg border border-slate-700/50 overflow-x-auto">
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${active === t.id ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"}`}>
        {t.label}
      </button>
    ))}
  </div>
);

const BarChart = ({ data, maxVal }) => {
  const max = maxVal || Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-40">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-slate-400 font-mono">{d.value}</span>
          <div className="w-full bg-slate-700/30 rounded-t-md overflow-hidden" style={{ height: "100%" }}>
            <div className={`w-full rounded-t-md transition-all duration-500 ${d.color || "bg-blue-500"}`} style={{ height: `${(d.value / max) * 100}%`, marginTop: "auto", minHeight: d.value > 0 ? "4px" : "0" }} />
          </div>
          <span className="text-xs text-slate-500 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

// ============================================================
// MAIN APPLICATION
// ============================================================
export default function SmartRFAttendPro() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState("dashboard");

  // Data state
  const [company, setCompany] = useState(DEFAULT_COMPANY);
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [emailConfig, setEmailConfig] = useState({ smtp: "smtp.gmail.com", port: 587, email: "", password: "", recipients: [], schedule: "daily", time: "21:00" });
  const [cards, setCards] = useState([]);

  // Load all data
  useEffect(() => {
    (async () => {
      const [co, us, em, br, at, ho, se, ec, ca] = await Promise.all([
        storage.get(STORAGE_KEYS.COMPANY),
        storage.get(STORAGE_KEYS.USERS),
        storage.get(STORAGE_KEYS.EMPLOYEES),
        storage.get(STORAGE_KEYS.BRANCHES),
        storage.get(STORAGE_KEYS.ATTENDANCE),
        storage.get(STORAGE_KEYS.HOLIDAYS),
        storage.get(STORAGE_KEYS.SETTINGS),
        storage.get(STORAGE_KEYS.EMAIL_CONFIG),
        storage.get(STORAGE_KEYS.CARDS),
      ]);
      if (co) setCompany(co);
      if (se) setSettings(se);
      if (ec) setEmailConfig(ec);
      setBranches(br || [{ id: "main", name: "Main Branch", address: "HQ" }]);
      setHolidays(ho || []);
      setCards(ca || []);
      setAttendance(at || []);

      let loadedUsers = us || [];
      let loadedEmployees = em || [];

      // Seed default super admin if none
      if (loadedUsers.length === 0) {
        loadedUsers = [{ id: "sa1", username: "admin", password: "admin123", name: "Super Admin", role: ROLES.SUPER_ADMIN, branchId: "main" }];
        await storage.set(STORAGE_KEYS.USERS, loadedUsers);
      }
      if (!br) await storage.set(STORAGE_KEYS.BRANCHES, [{ id: "main", name: "Main Branch", address: "HQ" }]);
      setUsers(loadedUsers);
      setEmployees(loadedEmployees);
      setLoading(false);
    })();
  }, []);

  // Persist helpers
  const save = useCallback(async (key, data, setter) => {
    setter(data);
    await storage.set(key, data);
  }, []);

  const saveEmployees = (d) => save(STORAGE_KEYS.EMPLOYEES, d, setEmployees);
  const saveUsers = (d) => save(STORAGE_KEYS.USERS, d, setUsers);
  const saveBranches = (d) => save(STORAGE_KEYS.BRANCHES, d, setBranches);
  const saveAttendance = (d) => save(STORAGE_KEYS.ATTENDANCE, d, setAttendance);
  const saveHolidays = (d) => save(STORAGE_KEYS.HOLIDAYS, d, setHolidays);
  const saveSettings = (d) => save(STORAGE_KEYS.SETTINGS, d, setSettings);
  const saveCompany = (d) => save(STORAGE_KEYS.COMPANY, d, setCompany);
  const saveEmailConfig = (d) => save(STORAGE_KEYS.EMAIL_CONFIG, d, setEmailConfig);
  const saveCards = (d) => save(STORAGE_KEYS.CARDS, d, setCards);

  // ============================================================
  // LOGIN SCREEN
  // ============================================================
  if (!currentUser) {
    return <LoginScreen users={users} onLogin={setCurrentUser} company={company} loading={loading} />;
  }

  const isSuperAdmin = currentUser.role === ROLES.SUPER_ADMIN;
  const isAdmin = currentUser.role === ROLES.ADMIN || isSuperAdmin;
  const isEmployee = currentUser.role === ROLES.EMPLOYEE;

  const empSelf = isEmployee ? employees.find(e => e.userId === currentUser.id) : null;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Icons.Dashboard, show: true },
    { id: "scanner", label: "Scan Attendance", icon: Icons.Scan, show: isAdmin },
    { id: "employees", label: "Employees", icon: Icons.Users, show: isAdmin },
    { id: "cards", label: "RFID Cards", icon: Icons.Card, show: isAdmin },
    { id: "branches", label: "Branches", icon: Icons.Branch, show: isSuperAdmin },
    { id: "attendance", label: "Attendance", icon: Icons.Clock, show: true },
    { id: "payroll", label: "Payroll", icon: Icons.Money, show: isAdmin },
    { id: "reports", label: "Reports", icon: Icons.Report, show: isAdmin },
    { id: "holidays", label: "Holidays", icon: Icons.Calendar, show: isAdmin },
    { id: "email", label: "Email Setup", icon: Icons.Mail, show: isSuperAdmin },
    { id: "settings", label: "Settings", icon: Icons.Settings, show: isSuperAdmin },
    { id: "admin-users", label: "Manage Users", icon: Icons.Shield, show: isSuperAdmin },
  ].filter(n => n.show);

  const pageProps = {
    employees, saveEmployees, branches, saveBranches, attendance, saveAttendance,
    holidays, saveHolidays, settings, saveSettings, company, saveCompany,
    emailConfig, saveEmailConfig, cards, saveCards, users, saveUsers,
    currentUser, isSuperAdmin, isAdmin, isEmployee, empSelf,
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style>{CSS}</style>

      {/* Sidebar */}
      <aside className="w-60 bg-slate-900/80 border-r border-slate-700/50 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold">RF</div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">{company.name}</div>
              <div className="text-xs text-slate-500">Attendance System</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-0.5">
          {navItems.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${page === n.id ? "bg-blue-600/15 text-blue-400 border border-blue-500/20" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"}`}>
              <n.icon size={17} />{n.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-700/50">
          <div className="flex items-center gap-2 mb-2 px-2">
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-blue-400">{currentUser.name?.[0]}</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-slate-300 truncate">{currentUser.name}</div>
              <div className="text-xs text-slate-500 capitalize">{currentUser.role.replace("_", " ")}</div>
            </div>
          </div>
          <Btn variant="ghost" size="sm" icon={<Icons.Logout size={14} />} onClick={() => setCurrentUser(null)} className="w-full">Logout</Btn>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto animate-in" key={page}>
          {page === "dashboard" && <DashboardPage {...pageProps} />}
          {page === "scanner" && <ScannerPage {...pageProps} />}
          {page === "employees" && <EmployeesPage {...pageProps} />}
          {page === "cards" && <CardsPage {...pageProps} />}
          {page === "branches" && <BranchesPage {...pageProps} />}
          {page === "attendance" && <AttendancePage {...pageProps} />}
          {page === "payroll" && <PayrollPage {...pageProps} />}
          {page === "reports" && <ReportsPage {...pageProps} />}
          {page === "holidays" && <HolidaysPage {...pageProps} />}
          {page === "email" && <EmailPage {...pageProps} />}
          {page === "settings" && <SettingsPage {...pageProps} />}
          {page === "admin-users" && <AdminUsersPage {...pageProps} />}
        </div>
      </main>
    </div>
  );
}

// ============================================================
// LOGIN
// ============================================================
function LoginScreen({ users, onLogin, company, loading }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) { setError(""); onLogin(user); }
    else setError("Invalid credentials");
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style>{CSS}</style>
      <div className="text-blue-400 pulse text-lg">Loading system...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style>{CSS}</style>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-sm mx-4 animate-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl font-bold mx-auto mb-4 shadow-lg shadow-blue-600/30">RF</div>
          <h1 className="text-2xl font-bold text-white">{company.name}</h1>
          <p className="text-slate-500 text-sm mt-1">RFID Attendance Management System</p>
        </div>
        <Card>
          <div className="space-y-4">
            <Input label="Username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" onKeyDown={e => e.key === "Enter" && handleLogin()} />
            <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" onKeyDown={e => e.key === "Enter" && handleLogin()} />
            {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>}
            <Btn onClick={handleLogin} className="w-full">Sign In</Btn>
            <div className="text-center text-xs text-slate-600 mt-2">Default: admin / admin123</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ============================================================
// DASHBOARD
// ============================================================
function DashboardPage({ employees, attendance, branches, holidays, settings, isAdmin, isEmployee, empSelf }) {
  const todayStr = today();
  const todayAtt = attendance.filter(a => a.date === todayStr);
  const present = todayAtt.filter(a => a.inTime);
  const absent = employees.length - present.length;
  const late = todayAtt.filter(a => a.status === "late" || a.status === "late-half");
  const ot = todayAtt.reduce((s, a) => s + (a.overtimeHours || 0), 0);

  // Employee self view
  if (isEmployee && empSelf) {
    const myAtt = attendance.filter(a => a.employeeId === empSelf.id);
    const monthAtt = myAtt.filter(a => getMonth(a.date) === getMonth(todayStr));
    const presentDays = monthAtt.filter(a => a.inTime).length;
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Welcome, {empSelf.name}</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="This Month Present" value={presentDays} color="green" />
          <StatCard label="This Month Absent" value={Math.max(0, 22 - presentDays)} color="red" />
          <StatCard label="Leaves Remaining" value={empSelf.leaveCount || 2} color="purple" />
          <StatCard label="Monthly Salary" value={currency(empSelf.salary)} color="blue" />
        </div>
        <Card title="Recent Attendance">
          <Table
            columns={[
              { header: "Date", render: r => fmt(r.date) },
              { header: "In", render: r => r.inTime ? fmtTime(r.inTime) : "-" },
              { header: "Out", render: r => r.outTime ? fmtTime(r.outTime) : "-" },
              { header: "Status", render: r => <Badge color={r.status === "present" ? "green" : r.status === "late" ? "orange" : "red"}>{r.status || "present"}</Badge> },
            ]}
            data={myAtt.slice(-10).reverse()}
          />
        </Card>
      </div>
    );
  }

  // Weekly chart data
  const weekDays = [...Array(7)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 6 + i);
    const ds = d.toISOString().split("T")[0];
    const count = attendance.filter(a => a.date === ds && a.inTime).length;
    return { label: d.toLocaleDateString("en-IN", { weekday: "short" }), value: count, color: "bg-blue-500" };
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard label="Total Employees" value={employees.length} color="blue" />
        <StatCard label="Present Today" value={present.length} color="green" />
        <StatCard label="Absent Today" value={absent} color="red" />
        <StatCard label="Late Today" value={late.length} color="orange" />
        <StatCard label="Overtime Hrs" value={ot.toFixed(1)} color="purple" />
        <StatCard label="Branches" value={branches.length} color="cyan" />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card title="Weekly Attendance Trend">
          <BarChart data={weekDays} maxVal={employees.length || 10} />
        </Card>
        <Card title="Today's Activity">
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {todayAtt.length === 0 ? <p className="text-slate-500 text-sm">No activity yet today</p> : todayAtt.slice(-10).reverse().map((a, i) => {
              const emp = employees.find(e => e.id === a.employeeId);
              return (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700/30">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-blue-400">{emp?.name?.[0] || "?"}</div>
                    <div>
                      <div className="text-sm text-slate-300">{emp?.name || "Unknown"}</div>
                      <div className="text-xs text-slate-500">{emp?.department || ""}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">{a.inTime ? "IN: " + fmtTime(a.inTime) : ""} {a.outTime ? "| OUT: " + fmtTime(a.outTime) : ""}</div>
                    <Badge color={a.status === "present" ? "green" : a.status === "late" ? "orange" : a.status === "half-day" ? "purple" : "gray"}>{a.status || "present"}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Branch comparison */}
      {branches.length > 1 && (
        <Card title="Branch Comparison (Today)">
          <BarChart data={branches.map(b => ({
            label: b.name,
            value: todayAtt.filter(a => {
              const emp = employees.find(e => e.id === a.employeeId);
              return emp?.branchId === b.id && a.inTime;
            }).length,
            color: "bg-cyan-500",
          }))} />
        </Card>
      )}
    </div>
  );
}

// ============================================================
// SCANNER (Always-On Mode)
// ============================================================
function ScannerPage({ employees, cards, attendance, saveAttendance, settings, branches }) {
  const [scanInput, setScanInput] = useState("");
  const [lastScan, setLastScan] = useState(null);
  const [scanLog, setScanLog] = useState([]);
  const inputRef = useRef(null);
  const todayStr = today();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const processScan = useCallback((cardUid) => {
    const card = cards.find(c => c.uid === cardUid && !c.blocked);
    if (!card) {
      const unknownCard = cards.find(c => c.uid === cardUid);
      const msg = unknownCard?.blocked ? "⛔ Card is BLOCKED" : "⚠️ Unknown card: " + cardUid;
      setLastScan({ type: "error", message: msg, time: new Date() });
      setScanLog(p => [{ type: "error", message: msg, time: new Date() }, ...p].slice(0, 50));
      return;
    }

    const emp = employees.find(e => e.id === card.employeeId);
    if (!emp) {
      setLastScan({ type: "error", message: "Card not mapped to employee", time: new Date() });
      return;
    }

    const todayAtt = attendance.find(a => a.employeeId === emp.id && a.date === todayStr);
    const now = new Date();

    if (!todayAtt || !todayAtt.inTime) {
      // CLOCK IN
      const shiftStart = settings.shiftStart || "09:00";
      const [sh, sm] = shiftStart.split(":").map(Number);
      const graceMinutes = settings.gracePeriod || 15;
      const shiftTime = new Date(); shiftTime.setHours(sh, sm + graceMinutes, 0);
      const isLate = now > shiftTime;

      const record = {
        id: todayAtt?.id || uid(),
        employeeId: emp.id,
        date: todayStr,
        inTime: now.toISOString(),
        outTime: null,
        status: isLate ? "late" : "present",
        hoursWorked: 0,
        overtimeHours: 0,
      };

      const newAtt = todayAtt
        ? attendance.map(a => a.id === todayAtt.id ? { ...todayAtt, ...record } : a)
        : [...attendance, record];
      saveAttendance(newAtt);

      const scanResult = { type: "in", employee: emp, time: now, late: isLate };
      setLastScan(scanResult);
      setScanLog(p => [scanResult, ...p].slice(0, 50));
    } else if (!todayAtt.outTime) {
      // CLOCK OUT
      const inTime = new Date(todayAtt.inTime);
      const hoursWorked = (now - inTime) / (1000 * 60 * 60);
      const otAfter = settings.overtimeAfter || 9;
      const overtimeHours = Math.max(0, hoursWorked - otAfter);
      const halfDayHours = settings.halfDayHours || 4;
      let status = todayAtt.status === "late" ? "late" : "present";
      if (hoursWorked < halfDayHours) status = "half-day";

      const newAtt = attendance.map(a => a.id === todayAtt.id ? { ...a, outTime: now.toISOString(), hoursWorked: Math.round(hoursWorked * 100) / 100, overtimeHours: Math.round(overtimeHours * 100) / 100, status } : a);
      saveAttendance(newAtt);

      const scanResult = { type: "out", employee: emp, time: now, hours: hoursWorked.toFixed(1) };
      setLastScan(scanResult);
      setScanLog(p => [scanResult, ...p].slice(0, 50));
    } else {
      setLastScan({ type: "info", message: `${emp.name} already clocked in & out today`, time: now });
      setScanLog(p => [{ type: "info", message: `${emp.name} already done`, time: now }, ...p].slice(0, 50));
    }
  }, [employees, cards, attendance, todayStr, settings, saveAttendance]);

  const handleScan = (e) => {
    if (e.key === "Enter" && scanInput.trim()) {
      processScan(scanInput.trim().toUpperCase());
      setScanInput("");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Attendance Scanner</h1>
          <p className="text-slate-500 text-sm">Always-on mode — Tap card or enter UID</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 pulse" />
          <span className="text-xs text-emerald-400 font-medium">LIVE</span>
        </div>
      </div>

      {/* Scan Input */}
      <Card className="mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-transparent to-purple-600/5" />
        <div className="relative text-center py-8">
          <div className="w-24 h-24 mx-auto mb-4 rounded-2xl border-2 border-dashed border-blue-500/40 flex items-center justify-center bg-blue-500/5">
            <Icons.Scan size={40} color="#3b82f6" />
          </div>
          <p className="text-slate-400 text-sm mb-4">Scan RFID card or type Card UID below</p>
          <input
            ref={inputRef}
            value={scanInput}
            onChange={e => setScanInput(e.target.value.toUpperCase())}
            onKeyDown={handleScan}
            placeholder="Card UID (press Enter to scan)"
            className="w-full max-w-md mx-auto block px-4 py-3 bg-slate-900 border-2 border-blue-500/30 rounded-xl text-center text-lg font-mono text-blue-400 placeholder-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            autoFocus
          />
          <p className="text-xs text-slate-600 mt-2">USB RFID readers will auto-type the UID here</p>
        </div>
      </Card>

      {/* Last Scan Result */}
      {lastScan && (
        <Card className={`mb-6 border-l-4 ${lastScan.type === "in" ? "border-l-emerald-500" : lastScan.type === "out" ? "border-l-amber-500" : lastScan.type === "error" ? "border-l-red-500" : "border-l-blue-500"}`}>
          <div className="flex items-center gap-4">
            {lastScan.employee && (
              <div className="w-14 h-14 rounded-xl bg-slate-700 flex items-center justify-center text-xl font-bold text-blue-400">{lastScan.employee.name[0]}</div>
            )}
            <div className="flex-1">
              {lastScan.employee ? (
                <>
                  <div className="text-lg font-semibold">{lastScan.employee.name}</div>
                  <div className="text-sm text-slate-400">{lastScan.employee.department} · {lastScan.employee.empId}</div>
                </>
              ) : (
                <div className="text-lg font-semibold">{lastScan.message}</div>
              )}
            </div>
            <div className="text-right">
              {lastScan.type === "in" && (
                <div>
                  <Badge color="green">CLOCKED IN</Badge>
                  {lastScan.late && <div className="mt-1"><Badge color="orange">LATE</Badge></div>}
                </div>
              )}
              {lastScan.type === "out" && <div><Badge color="orange">CLOCKED OUT</Badge><div className="text-xs text-slate-400 mt-1">{lastScan.hours} hrs</div></div>}
              {lastScan.type === "error" && <Badge color="red">ERROR</Badge>}
              {lastScan.type === "info" && <Badge color="blue">INFO</Badge>}
              <div className="text-xs text-slate-500 mt-1">{fmtTime(lastScan.time)}</div>
            </div>
          </div>
        </Card>
      )}

      {/* Scan Log */}
      <Card title="Today's Scan Log">
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {scanLog.length === 0 ? <p className="text-slate-500 text-sm py-4 text-center">No scans yet</p> : scanLog.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700/30">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${s.type === "in" ? "bg-emerald-400" : s.type === "out" ? "bg-amber-400" : s.type === "error" ? "bg-red-400" : "bg-blue-400"}`} />
                <span className="text-sm text-slate-300">
                  {s.employee ? `${s.employee.name} — ${s.type === "in" ? "Clocked In" : "Clocked Out"}` : s.message}
                </span>
              </div>
              <span className="text-xs text-slate-500 font-mono">{fmtTime(s.time)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// EMPLOYEES
// ============================================================
function EmployeesPage({ employees, saveEmployees, branches, cards, saveCards, users, saveUsers }) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({});

  const emptyForm = { name: "", empId: "", phone: "", email: "", branchId: branches[0]?.id || "", department: "", designation: "", salary: 30000, workingHoursPerWeek: 40, shiftStart: "09:00", shiftEnd: "18:00", joiningDate: today(), salaryType: "Fixed", overtimeRate: 200, leaveCount: 2, rfidUid: "" };

  const openAdd = () => { setForm(emptyForm); setEditing(null); setShowModal(true); };
  const openEdit = (emp) => { setForm({ ...emptyForm, ...emp }); setEditing(emp); setShowModal(true); };

  const handleSave = () => {
    if (!form.name || !form.empId) return;
    if (editing) {
      saveEmployees(employees.map(e => e.id === editing.id ? { ...e, ...form } : e));
      // Update card mapping if RFID changed
      if (form.rfidUid && form.rfidUid !== editing.rfidUid) {
        const existingCard = cards.find(c => c.uid === form.rfidUid);
        if (!existingCard) {
          saveCards([...cards, { id: uid(), uid: form.rfidUid, employeeId: editing.id, blocked: false, registeredAt: new Date().toISOString() }]);
        }
      }
    } else {
      const newId = uid();
      const userId = uid();
      // Create user account for employee
      const newUser = { id: userId, username: form.empId.toLowerCase(), password: "emp123", name: form.name, role: ROLES.EMPLOYEE, branchId: form.branchId };
      saveUsers([...users, newUser]);
      const newEmp = { ...form, id: newId, userId };
      saveEmployees([...employees, newEmp]);
      // Register RFID card if provided
      if (form.rfidUid) {
        saveCards([...cards, { id: uid(), uid: form.rfidUid, employeeId: newId, blocked: false, registeredAt: new Date().toISOString() }]);
      }
    }
    setShowModal(false);
  };

  const handleDelete = (emp) => {
    if (confirm(`Delete employee "${emp.name}"?`)) {
      saveEmployees(employees.filter(e => e.id !== emp.id));
      saveCards(cards.filter(c => c.employeeId !== emp.id));
      saveUsers(users.filter(u => u.id !== emp.userId));
    }
  };

  const filtered = employees.filter(e => !search || e.name?.toLowerCase().includes(search.toLowerCase()) || e.empId?.toLowerCase().includes(search.toLowerCase()) || e.department?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Employees</h1>
        <Btn icon={<Icons.Plus size={16} />} onClick={openAdd}>Add Employee</Btn>
      </div>

      <div className="mb-4">
        <Input placeholder="Search by name, ID, or department..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Table
        columns={[
          { header: "Employee", render: r => (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-blue-400">{r.name?.[0]}</div>
              <div><div className="font-medium text-slate-200">{r.name}</div><div className="text-xs text-slate-500">{r.empId}</div></div>
            </div>
          )},
          { header: "Department", key: "department" },
          { header: "Branch", render: r => branches.find(b => b.id === r.branchId)?.name || "-" },
          { header: "Salary", render: r => <span className="font-mono">{currency(r.salary)}</span> },
          { header: "Type", render: r => <Badge color="blue">{r.salaryType || "Fixed"}</Badge> },
          { header: "RFID", render: r => {
            const card = cards.find(c => c.employeeId === r.id);
            return card ? <Badge color={card.blocked ? "red" : "green"}>{card.uid}</Badge> : <Badge color="gray">None</Badge>;
          }},
          { header: "", render: r => (
            <div className="flex gap-1">
              <button onClick={(e) => { e.stopPropagation(); openEdit(r); }} className="p-1.5 rounded hover:bg-slate-700 text-slate-400"><Icons.Edit size={14} /></button>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(r); }} className="p-1.5 rounded hover:bg-red-900/30 text-slate-400 hover:text-red-400"><Icons.Trash size={14} /></button>
            </div>
          )},
        ]}
        data={filtered}
        emptyMsg="No employees found"
      />

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit Employee" : "Add Employee"} wide>
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Full Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <Input label="Employee ID *" value={form.empId} onChange={e => setForm({ ...form, empId: e.target.value })} />
          <Input label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          <Input label="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <Select label="Branch" value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })} options={branches.map(b => ({ value: b.id, label: b.name }))} />
          <Input label="Department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="e.g. Engineering" />
          <Input label="Designation" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} placeholder="e.g. Software Engineer" />
          <Input label="Monthly Salary (₹)" type="number" value={form.salary} onChange={e => setForm({ ...form, salary: Number(e.target.value) })} />
          <Select label="Salary Type" value={form.salaryType} onChange={e => setForm({ ...form, salaryType: e.target.value })} options={SALARY_TYPES} />
          <Input label="Overtime Rate (₹/hr)" type="number" value={form.overtimeRate} onChange={e => setForm({ ...form, overtimeRate: Number(e.target.value) })} />
          <Input label="Working Hours/Week" type="number" value={form.workingHoursPerWeek} onChange={e => setForm({ ...form, workingHoursPerWeek: Number(e.target.value) })} />
          <Input label="Leave Count/Month" type="number" value={form.leaveCount} onChange={e => setForm({ ...form, leaveCount: Number(e.target.value) })} />
          <Input label="Shift Start" type="time" value={form.shiftStart} onChange={e => setForm({ ...form, shiftStart: e.target.value })} />
          <Input label="Shift End" type="time" value={form.shiftEnd} onChange={e => setForm({ ...form, shiftEnd: e.target.value })} />
          <Input label="Joining Date" type="date" value={form.joiningDate} onChange={e => setForm({ ...form, joiningDate: e.target.value })} />
          <Input label="RFID Card UID" value={form.rfidUid} onChange={e => setForm({ ...form, rfidUid: e.target.value.toUpperCase() })} placeholder="Scan or enter card UID" />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancel</Btn>
          <Btn onClick={handleSave}>{editing ? "Update" : "Add Employee"}</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================
// RFID CARDS
// ============================================================
function CardsPage({ cards, saveCards, employees }) {
  const [scanInput, setScanInput] = useState("");
  const [selectedEmp, setSelectedEmp] = useState("");
  const scanRef = useRef(null);

  const registerCard = () => {
    if (!scanInput || !selectedEmp) return;
    const existing = cards.find(c => c.uid === scanInput);
    if (existing) { alert("Card already registered!"); return; }
    saveCards([...cards, { id: uid(), uid: scanInput, employeeId: selectedEmp, blocked: false, registeredAt: new Date().toISOString() }]);
    setScanInput(""); setSelectedEmp("");
  };

  const toggleBlock = (card) => saveCards(cards.map(c => c.id === card.id ? { ...c, blocked: !c.blocked } : c));
  const deleteCard = (card) => confirm("Remove this card?") && saveCards(cards.filter(c => c.id !== card.id));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">RFID Card Management</h1>

      <Card className="mb-6" title="Register New Card">
        <div className="grid md:grid-cols-3 gap-4">
          <Input label="Scan Card UID" ref={scanRef} value={scanInput} onChange={e => setScanInput(e.target.value.toUpperCase())} placeholder="Scan or type card UID" onKeyDown={e => e.key === "Enter" && registerCard()} />
          <Select label="Assign to Employee" value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)} options={[{ value: "", label: "Select employee..." }, ...employees.map(em => ({ value: em.id, label: `${em.name} (${em.empId})` }))]} />
          <div className="flex items-end">
            <Btn onClick={registerCard} icon={<Icons.Plus size={16} />}>Register Card</Btn>
          </div>
        </div>
      </Card>

      <Card title={`Registered Cards (${cards.length})`}>
        <Table
          columns={[
            { header: "Card UID", render: r => <span className="font-mono text-blue-400">{r.uid}</span> },
            { header: "Employee", render: r => { const e = employees.find(em => em.id === r.employeeId); return e ? `${e.name} (${e.empId})` : "Unassigned"; }},
            { header: "Status", render: r => <Badge color={r.blocked ? "red" : "green"}>{r.blocked ? "Blocked" : "Active"}</Badge> },
            { header: "Registered", render: r => r.registeredAt ? fmt(r.registeredAt) : "-" },
            { header: "Actions", render: r => (
              <div className="flex gap-1">
                <Btn size="sm" variant={r.blocked ? "success" : "danger"} onClick={() => toggleBlock(r)}>{r.blocked ? "Unblock" : "Block"}</Btn>
                <button onClick={() => deleteCard(r)} className="p-1.5 rounded hover:bg-red-900/30 text-slate-400 hover:text-red-400"><Icons.Trash size={14} /></button>
              </div>
            )},
          ]}
          data={cards}
          emptyMsg="No cards registered"
        />
      </Card>
    </div>
  );
}

// ============================================================
// BRANCHES
// ============================================================
function BranchesPage({ branches, saveBranches, employees, users, saveUsers }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", address: "" });
  const [editing, setEditing] = useState(null);

  const handleSave = () => {
    if (!form.name) return;
    if (editing) saveBranches(branches.map(b => b.id === editing.id ? { ...b, ...form } : b));
    else saveBranches([...branches, { ...form, id: uid() }]);
    setShowModal(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Branch Management</h1>
        <Btn icon={<Icons.Plus size={16} />} onClick={() => { setForm({ name: "", address: "" }); setEditing(null); setShowModal(true); }}>Add Branch</Btn>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map(b => {
          const empCount = employees.filter(e => e.branchId === b.id).length;
          return (
            <Card key={b.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-200">{b.name}</h3>
                  <p className="text-xs text-slate-500">{b.address}</p>
                </div>
                <button onClick={() => { setForm(b); setEditing(b); setShowModal(true); }} className="p-1.5 rounded hover:bg-slate-700 text-slate-400"><Icons.Edit size={14} /></button>
              </div>
              <div className="flex gap-4">
                <div className="text-center"><div className="text-lg font-bold text-blue-400">{empCount}</div><div className="text-xs text-slate-500">Employees</div></div>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit Branch" : "Add Branch"}>
        <div className="space-y-4">
          <Input label="Branch Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <Input label="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancel</Btn>
          <Btn onClick={handleSave}>{editing ? "Update" : "Add Branch"}</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================
// ATTENDANCE VIEW
// ============================================================
function AttendancePage({ employees, attendance, saveAttendance, branches, settings, isEmployee, empSelf }) {
  const [selectedDate, setSelectedDate] = useState(today());
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedEmp, setSelectedEmp] = useState("all");
  const [tab, setTab] = useState("daily");
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({ employeeId: "", date: today(), inTime: "09:00", outTime: "18:00" });

  const filteredAtt = useMemo(() => {
    let data = attendance;
    if (isEmployee && empSelf) data = data.filter(a => a.employeeId === empSelf.id);
    if (selectedBranch !== "all") {
      const branchEmps = employees.filter(e => e.branchId === selectedBranch).map(e => e.id);
      data = data.filter(a => branchEmps.includes(a.employeeId));
    }
    if (selectedEmp !== "all") data = data.filter(a => a.employeeId === selectedEmp);
    if (tab === "daily") data = data.filter(a => a.date === selectedDate);
    if (tab === "weekly") {
      const d = new Date(selectedDate);
      const start = new Date(d); start.setDate(d.getDate() - d.getDay());
      const end = new Date(start); end.setDate(start.getDate() + 6);
      data = data.filter(a => { const ad = new Date(a.date); return ad >= start && ad <= end; });
    }
    if (tab === "monthly") data = data.filter(a => getMonth(a.date) === getMonth(selectedDate));
    return data.sort((a, b) => b.date.localeCompare(a.date) || (b.inTime || "").localeCompare(a.inTime || ""));
  }, [attendance, selectedDate, selectedBranch, selectedEmp, tab, isEmployee, empSelf, employees]);

  const addManualEntry = () => {
    if (!manualForm.employeeId || !manualForm.date) return;
    const inDate = new Date(manualForm.date + "T" + manualForm.inTime);
    const outDate = new Date(manualForm.date + "T" + manualForm.outTime);
    const hoursWorked = (outDate - inDate) / (1000 * 60 * 60);
    const record = {
      id: uid(), employeeId: manualForm.employeeId, date: manualForm.date,
      inTime: inDate.toISOString(), outTime: outDate.toISOString(),
      status: "present", hoursWorked: Math.round(hoursWorked * 100) / 100,
      overtimeHours: Math.max(0, Math.round((hoursWorked - (settings.overtimeAfter || 9)) * 100) / 100),
      manual: true,
    };
    saveAttendance([...attendance, record]);
    setShowManual(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Attendance Records</h1>
        {!isEmployee && <Btn icon={<Icons.Plus size={16} />} onClick={() => setShowManual(true)}>Manual Entry</Btn>}
      </div>

      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <Tabs tabs={[{ id: "daily", label: "Daily" }, { id: "weekly", label: "Weekly" }, { id: "monthly", label: "Monthly" }]} active={tab} onChange={setTab} />
        <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
        {!isEmployee && (
          <>
            <Select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} options={[{ value: "all", label: "All Branches" }, ...branches.map(b => ({ value: b.id, label: b.name }))]} />
            <Select value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)} options={[{ value: "all", label: "All Employees" }, ...employees.map(e => ({ value: e.id, label: `${e.name} (${e.empId})` }))]} />
          </>
        )}
      </div>

      <Table
        columns={[
          { header: "Date", render: r => fmt(r.date) },
          { header: "Employee", render: r => { const e = employees.find(em => em.id === r.employeeId); return e ? e.name : "Unknown"; }},
          { header: "In Time", render: r => r.inTime ? fmtTime(r.inTime) : "-" },
          { header: "Out Time", render: r => r.outTime ? fmtTime(r.outTime) : "-" },
          { header: "Hours", render: r => <span className="font-mono">{r.hoursWorked?.toFixed(1) || "-"}</span> },
          { header: "OT", render: r => r.overtimeHours > 0 ? <span className="font-mono text-purple-400">{r.overtimeHours.toFixed(1)}h</span> : "-" },
          { header: "Status", render: r => {
            const colors = { present: "green", late: "orange", "half-day": "purple", absent: "red" };
            return <Badge color={colors[r.status] || "gray"}>{r.status || "present"}</Badge>;
          }},
          { header: "", render: r => r.manual ? <Badge color="gray">Manual</Badge> : null },
        ]}
        data={filteredAtt}
        emptyMsg="No attendance records for this period"
      />

      <Modal open={showManual} onClose={() => setShowManual(false)} title="Add Manual Entry">
        <div className="space-y-4">
          <Select label="Employee" value={manualForm.employeeId} onChange={e => setManualForm({ ...manualForm, employeeId: e.target.value })} options={[{ value: "", label: "Select..." }, ...employees.map(em => ({ value: em.id, label: `${em.name} (${em.empId})` }))]} />
          <Input label="Date" type="date" value={manualForm.date} onChange={e => setManualForm({ ...manualForm, date: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="In Time" type="time" value={manualForm.inTime} onChange={e => setManualForm({ ...manualForm, inTime: e.target.value })} />
            <Input label="Out Time" type="time" value={manualForm.outTime} onChange={e => setManualForm({ ...manualForm, outTime: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Btn variant="secondary" onClick={() => setShowManual(false)}>Cancel</Btn>
          <Btn onClick={addManualEntry}>Add Entry</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================
// PAYROLL
// ============================================================
function PayrollPage({ employees, attendance, holidays, settings, branches }) {
  const [selectedMonth, setSelectedMonth] = useState(today().slice(0, 7));
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedEmp, setSelectedEmp] = useState(null);

  const calcPayroll = useCallback((emp) => {
    const monthAtt = attendance.filter(a => a.employeeId === emp.id && getMonth(a.date) === selectedMonth);

    // Calculate working days in month
    const [year, month] = selectedMonth.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const weeklyOff = settings.weeklyOff || [0]; // Sunday
    let totalWorkingDays = 0;
    const holidayDates = holidays.map(h => h.date);

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const dateStr = date.toISOString().split("T")[0];
      if (!weeklyOff.includes(date.getDay()) && !holidayDates.includes(dateStr)) {
        totalWorkingDays++;
      }
    }

    const presentDays = monthAtt.filter(a => a.inTime && (a.status === "present" || a.status === "late")).length;
    const halfDays = monthAtt.filter(a => a.status === "half-day").length;
    const lateDays = monthAtt.filter(a => a.status === "late" || a.status === "late-half").length;
    const absentDays = Math.max(0, totalWorkingDays - presentDays - halfDays);
    const totalOT = monthAtt.reduce((s, a) => s + (a.overtimeHours || 0), 0);
    const totalHours = monthAtt.reduce((s, a) => s + (a.hoursWorked || 0), 0);

    const monthlySalary = emp.salary || 30000;
    const perDay = monthlySalary / totalWorkingDays;
    const perHour = perDay / (emp.workingHoursPerWeek ? emp.workingHoursPerWeek / 5 : 8);

    let grossSalary;
    if (emp.salaryType === "Hourly") grossSalary = totalHours * perHour;
    else if (emp.salaryType === "Daily") grossSalary = (presentDays + halfDays * 0.5) * perDay;
    else grossSalary = monthlySalary;

    const absentDeduction = emp.salaryType === "Fixed" ? absentDays * perDay : 0;
    const halfDayDeduction = emp.salaryType === "Fixed" ? halfDays * perDay * 0.5 : 0;
    const latePenalty = lateDays * (monthlySalary * (settings.latePenaltyPercent || 2) / 100);
    const otPay = totalOT * (emp.overtimeRate || 200);

    const basic = grossSalary * 0.5;
    const hra = grossSalary * 0.2;
    const allowances = grossSalary * 0.3;
    const totalDeductions = absentDeduction + halfDayDeduction + latePenalty;
    const netSalary = grossSalary - totalDeductions + otPay;

    return {
      emp, totalWorkingDays, presentDays, halfDays, absentDays, lateDays, totalOT, totalHours,
      grossSalary, basic, hra, allowances, absentDeduction, halfDayDeduction, latePenalty, otPay, totalDeductions, netSalary,
    };
  }, [attendance, selectedMonth, holidays, settings]);

  const filteredEmps = selectedBranch === "all" ? employees : employees.filter(e => e.branchId === selectedBranch);
  const payrollData = filteredEmps.map(calcPayroll);
  const totalExpense = payrollData.reduce((s, p) => s + p.netSalary, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Payroll</h1>
        <div className="text-right">
          <div className="text-xs text-slate-500">Total Expense</div>
          <div className="text-xl font-bold text-emerald-400">{currency(totalExpense)}</div>
        </div>
      </div>

      <div className="flex gap-3 mb-4 items-end">
        <Input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} label="Month" />
        <Select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} label="Branch" options={[{ value: "all", label: "All Branches" }, ...branches.map(b => ({ value: b.id, label: b.name }))]} />
      </div>

      <Table
        columns={[
          { header: "Employee", render: r => (
            <div><div className="font-medium text-slate-200">{r.emp.name}</div><div className="text-xs text-slate-500">{r.emp.empId}</div></div>
          )},
          { header: "Working Days", render: r => r.totalWorkingDays },
          { header: "Present", render: r => <span className="text-emerald-400">{r.presentDays}</span> },
          { header: "Half Days", render: r => r.halfDays || "-" },
          { header: "Absent", render: r => <span className="text-red-400">{r.absentDays}</span> },
          { header: "Late", render: r => r.lateDays || "-" },
          { header: "OT Hours", render: r => r.totalOT > 0 ? <span className="text-purple-400">{r.totalOT.toFixed(1)}</span> : "-" },
          { header: "Deductions", render: r => <span className="text-red-400 font-mono">{currency(r.totalDeductions)}</span> },
          { header: "OT Pay", render: r => r.otPay > 0 ? <span className="text-purple-400 font-mono">{currency(r.otPay)}</span> : "-" },
          { header: "Net Salary", render: r => <span className="text-emerald-400 font-bold font-mono">{currency(r.netSalary)}</span> },
          { header: "", render: r => <Btn size="sm" variant="ghost" onClick={() => setSelectedEmp(r)}>View</Btn> },
        ]}
        data={payrollData}
        emptyMsg="No employees found"
      />

      {/* Payslip Modal */}
      <Modal open={!!selectedEmp} onClose={() => setSelectedEmp(null)} title="Salary Payslip" wide>
        {selectedEmp && (
          <div className="space-y-4">
            <div className="flex justify-between items-start border-b border-slate-700 pb-4">
              <div>
                <h3 className="text-lg font-bold">{selectedEmp.emp.name}</h3>
                <p className="text-sm text-slate-400">{selectedEmp.emp.empId} · {selectedEmp.emp.department} · {selectedEmp.emp.designation}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-400">Month: {selectedMonth}</div>
                <div className="text-sm text-slate-400">Salary Type: {selectedEmp.emp.salaryType || "Fixed"}</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-400 mb-2 uppercase">Attendance Summary</h4>
                <div className="space-y-1.5 text-sm">
                  {[
                    ["Total Working Days", selectedEmp.totalWorkingDays],
                    ["Present Days", selectedEmp.presentDays],
                    ["Half Days", selectedEmp.halfDays],
                    ["Absent Days", selectedEmp.absentDays],
                    ["Late Days", selectedEmp.lateDays],
                    ["Overtime Hours", selectedEmp.totalOT.toFixed(1)],
                    ["Total Hours Worked", selectedEmp.totalHours.toFixed(1)],
                  ].map(([l, v]) => (
                    <div key={l} className="flex justify-between"><span className="text-slate-400">{l}</span><span className="font-mono">{v}</span></div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-emerald-400 mb-2 uppercase">Earnings</h4>
                <div className="space-y-1.5 text-sm">
                  {[
                    ["Basic", currency(selectedEmp.basic)],
                    ["HRA", currency(selectedEmp.hra)],
                    ["Allowances", currency(selectedEmp.allowances)],
                    ["Overtime Pay", currency(selectedEmp.otPay)],
                  ].map(([l, v]) => (
                    <div key={l} className="flex justify-between"><span className="text-slate-400">{l}</span><span className="text-emerald-400 font-mono">{v}</span></div>
                  ))}
                </div>

                <h4 className="text-sm font-semibold text-red-400 mb-2 mt-4 uppercase">Deductions</h4>
                <div className="space-y-1.5 text-sm">
                  {[
                    ["Absent Deduction", currency(selectedEmp.absentDeduction)],
                    ["Half Day Deduction", currency(selectedEmp.halfDayDeduction)],
                    ["Late Penalty", currency(selectedEmp.latePenalty)],
                  ].map(([l, v]) => (
                    <div key={l} className="flex justify-between"><span className="text-slate-400">{l}</span><span className="text-red-400 font-mono">{v}</span></div>
                  ))}
                </div>

                <div className="border-t border-slate-700 mt-4 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Net Salary</span>
                    <span className="text-emerald-400">{currency(selectedEmp.netSalary)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ============================================================
// REPORTS
// ============================================================
function ReportsPage({ employees, attendance, branches, holidays, settings }) {
  const [reportType, setReportType] = useState("daily-attendance");
  const [selectedDate, setSelectedDate] = useState(today());
  const [selectedMonth, setSelectedMonth] = useState(today().slice(0, 7));
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [generated, setGenerated] = useState(null);

  const generateReport = () => {
    const filteredEmps = selectedBranch === "all" ? employees : employees.filter(e => e.branchId === selectedBranch);
    let data = [];
    let title = "";

    if (reportType === "daily-attendance") {
      title = `Daily Attendance Report - ${fmt(selectedDate)}`;
      data = filteredEmps.map(emp => {
        const att = attendance.find(a => a.employeeId === emp.id && a.date === selectedDate);
        return { Name: emp.name, "Emp ID": emp.empId, Department: emp.department, "In Time": att?.inTime ? fmtTime(att.inTime) : "Absent", "Out Time": att?.outTime ? fmtTime(att.outTime) : "-", Hours: att?.hoursWorked?.toFixed(1) || "-", Status: att?.status || "absent" };
      });
    } else if (reportType === "monthly-attendance") {
      title = `Monthly Attendance Report - ${selectedMonth}`;
      data = filteredEmps.map(emp => {
        const monthAtt = attendance.filter(a => a.employeeId === emp.id && getMonth(a.date) === selectedMonth);
        return { Name: emp.name, "Emp ID": emp.empId, Present: monthAtt.filter(a => a.status === "present" || a.status === "late").length, "Half Days": monthAtt.filter(a => a.status === "half-day").length, Late: monthAtt.filter(a => a.status === "late").length, "Total Hours": monthAtt.reduce((s, a) => s + (a.hoursWorked || 0), 0).toFixed(1), "OT Hours": monthAtt.reduce((s, a) => s + (a.overtimeHours || 0), 0).toFixed(1) };
      });
    } else if (reportType === "late-report") {
      title = `Late Report - ${selectedMonth}`;
      data = filteredEmps.map(emp => {
        const lateAtt = attendance.filter(a => a.employeeId === emp.id && getMonth(a.date) === selectedMonth && (a.status === "late" || a.status === "late-half"));
        return { Name: emp.name, "Emp ID": emp.empId, "Late Days": lateAtt.length, Dates: lateAtt.map(a => fmt(a.date)).join(", ") || "None" };
      }).filter(d => d["Late Days"] > 0);
    } else if (reportType === "overtime-report") {
      title = `Overtime Report - ${selectedMonth}`;
      data = filteredEmps.map(emp => {
        const monthAtt = attendance.filter(a => a.employeeId === emp.id && getMonth(a.date) === selectedMonth);
        const totalOT = monthAtt.reduce((s, a) => s + (a.overtimeHours || 0), 0);
        return { Name: emp.name, "Emp ID": emp.empId, "OT Hours": totalOT.toFixed(1), "OT Pay": currency(totalOT * (emp.overtimeRate || 200)) };
      }).filter(d => parseFloat(d["OT Hours"]) > 0);
    } else if (reportType === "payroll-report") {
      title = `Payroll Report - ${selectedMonth}`;
      const [year, month] = selectedMonth.split("-").map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      const weeklyOff = settings.weeklyOff || [0];
      const holidayDates = holidays.map(h => h.date);
      let totalWorkingDays = 0;
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month - 1, d);
        const dateStr = date.toISOString().split("T")[0];
        if (!weeklyOff.includes(date.getDay()) && !holidayDates.includes(dateStr)) totalWorkingDays++;
      }
      data = filteredEmps.map(emp => {
        const monthAtt = attendance.filter(a => a.employeeId === emp.id && getMonth(a.date) === selectedMonth);
        const presentDays = monthAtt.filter(a => a.status === "present" || a.status === "late").length;
        const halfDays = monthAtt.filter(a => a.status === "half-day").length;
        const absentDays = Math.max(0, totalWorkingDays - presentDays - halfDays);
        const totalOT = monthAtt.reduce((s, a) => s + (a.overtimeHours || 0), 0);
        const perDay = (emp.salary || 30000) / totalWorkingDays;
        const deductions = absentDays * perDay + halfDays * perDay * 0.5;
        const otPay = totalOT * (emp.overtimeRate || 200);
        return { Name: emp.name, "Emp ID": emp.empId, Salary: currency(emp.salary), Present: presentDays, Absent: absentDays, Deductions: currency(deductions), "OT Pay": currency(otPay), "Net Pay": currency((emp.salary || 30000) - deductions + otPay) };
      });
    }

    setGenerated({ title, data, columns: data.length > 0 ? Object.keys(data[0]) : [] });
  };

  const downloadCSV = () => {
    if (!generated || !generated.data.length) return;
    const header = generated.columns.join(",");
    const rows = generated.data.map(r => generated.columns.map(c => `"${r[c]}"`).join(","));
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${generated.title.replace(/\s+/g, "_")}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reports</h1>

      <Card className="mb-6">
        <div className="grid md:grid-cols-4 gap-4 items-end">
          <Select label="Report Type" value={reportType} onChange={e => setReportType(e.target.value)} options={[
            { value: "daily-attendance", label: "Daily Attendance" },
            { value: "monthly-attendance", label: "Monthly Attendance" },
            { value: "late-report", label: "Late Report" },
            { value: "overtime-report", label: "Overtime Report" },
            { value: "payroll-report", label: "Payroll Report" },
          ]} />
          {reportType === "daily-attendance" ? (
            <Input label="Date" type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          ) : (
            <Input label="Month" type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
          )}
          <Select label="Branch" value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} options={[{ value: "all", label: "All Branches" }, ...branches.map(b => ({ value: b.id, label: b.name }))]} />
          <Btn onClick={generateReport}>Generate Report</Btn>
        </div>
      </Card>

      {generated && (
        <Card title={generated.title} action={<Btn size="sm" variant="secondary" icon={<Icons.Download size={14} />} onClick={downloadCSV}>Download CSV</Btn>}>
          {generated.data.length > 0 ? (
            <Table columns={generated.columns.map(c => ({ header: c, key: c }))} data={generated.data} />
          ) : (
            <p className="text-slate-500 text-center py-8">No data for this report</p>
          )}
        </Card>
      )}
    </div>
  );
}

// ============================================================
// HOLIDAYS
// ============================================================
function HolidaysPage({ holidays, saveHolidays }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ date: "", name: "" });

  const addHoliday = () => {
    if (!form.date || !form.name) return;
    saveHolidays([...holidays, { id: uid(), ...form }]);
    setShowModal(false); setForm({ date: "", name: "" });
  };

  const deleteHoliday = (h) => saveHolidays(holidays.filter(x => x.id !== h.id));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Holiday Calendar</h1>
        <Btn icon={<Icons.Plus size={16} />} onClick={() => setShowModal(true)}>Add Holiday</Btn>
      </div>

      <Table
        columns={[
          { header: "Date", render: r => fmt(r.date) },
          { header: "Day", render: r => new Date(r.date).toLocaleDateString("en-IN", { weekday: "long" }) },
          { header: "Holiday Name", key: "name" },
          { header: "", render: r => <button onClick={() => deleteHoliday(r)} className="p-1.5 rounded hover:bg-red-900/30 text-slate-400 hover:text-red-400"><Icons.Trash size={14} /></button> },
        ]}
        data={holidays.sort((a, b) => a.date.localeCompare(b.date))}
        emptyMsg="No holidays configured"
      />

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Holiday">
        <div className="space-y-4">
          <Input label="Date" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          <Input label="Holiday Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Diwali, Republic Day" />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancel</Btn>
          <Btn onClick={addHoliday}>Add Holiday</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================
// EMAIL CONFIG
// ============================================================
function EmailPage({ emailConfig, saveEmailConfig }) {
  const [form, setForm] = useState(emailConfig);
  const [recipientInput, setRecipientInput] = useState("");

  const addRecipient = () => {
    if (recipientInput && !form.recipients.includes(recipientInput)) {
      setForm({ ...form, recipients: [...form.recipients, recipientInput] });
      setRecipientInput("");
    }
  };

  const removeRecipient = (email) => setForm({ ...form, recipients: form.recipients.filter(r => r !== email) });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Email Report Setup</h1>
      <Card>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="SMTP Server" value={form.smtp} onChange={e => setForm({ ...form, smtp: e.target.value })} placeholder="smtp.gmail.com" />
            <Input label="SMTP Port" type="number" value={form.port} onChange={e => setForm({ ...form, port: Number(e.target.value) })} />
            <Input label="Email Address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" />
            <Input label="App Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Gmail App Password" />
            <Select label="Report Schedule" value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })} options={["daily", "weekly", "monthly"]} />
            <Input label="Send Time" type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Recipients</label>
            <div className="flex gap-2 mt-1">
              <input value={recipientInput} onChange={e => setRecipientInput(e.target.value)} placeholder="Add recipient email" className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600/50 rounded-lg text-sm text-slate-200 outline-none focus:border-blue-500" onKeyDown={e => e.key === "Enter" && addRecipient()} />
              <Btn size="sm" onClick={addRecipient}>Add</Btn>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {form.recipients.map((r, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/15 text-blue-400 border border-blue-500/25 rounded text-xs">
                  {r}<button onClick={() => removeRecipient(r)} className="hover:text-red-400 ml-1">×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Btn onClick={() => saveEmailConfig(form)}>Save Configuration</Btn>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-sm text-amber-400">
              <strong>Note:</strong> Email sending requires a backend server with SMTP access. This configuration will be used when connecting to your backend service (ESP32/Raspberry Pi/Server). The settings are saved and ready to be consumed by your backend.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// SETTINGS
// ============================================================
function SettingsPage({ company, saveCompany, settings, saveSettings }) {
  const [companyForm, setCompanyForm] = useState(company);
  const [settingsForm, setSettingsForm] = useState(settings);
  const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const toggleWeeklyOff = (dayIdx) => {
    const offs = settingsForm.weeklyOff || [];
    setSettingsForm({ ...settingsForm, weeklyOff: offs.includes(dayIdx) ? offs.filter(d => d !== dayIdx) : [...offs, dayIdx] });
  };

  const handleResetAll = async () => {
    if (confirm("⚠️ This will DELETE ALL DATA. Are you absolutely sure?")) {
      for (const key of Object.values(STORAGE_KEYS)) {
        try { await window.storage.delete(key); } catch {}
      }
      window.location.reload();
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">System Settings</h1>

      <div className="space-y-6">
        <Card title="Company Information">
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Company Name" value={companyForm.name} onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })} />
            <Input label="Address" value={companyForm.address} onChange={e => setCompanyForm({ ...companyForm, address: e.target.value })} />
          </div>
          <div className="flex justify-end mt-4">
            <Btn onClick={() => saveCompany(companyForm)}>Save Company Info</Btn>
          </div>
        </Card>

        <Card title="Attendance Settings">
          <div className="grid md:grid-cols-3 gap-4">
            <Input label="Default Shift Start" type="time" value={settingsForm.shiftStart} onChange={e => setSettingsForm({ ...settingsForm, shiftStart: e.target.value })} />
            <Input label="Default Shift End" type="time" value={settingsForm.shiftEnd} onChange={e => setSettingsForm({ ...settingsForm, shiftEnd: e.target.value })} />
            <Input label="Grace Period (minutes)" type="number" value={settingsForm.gracePeriod} onChange={e => setSettingsForm({ ...settingsForm, gracePeriod: Number(e.target.value) })} />
            <Input label="Half Day Hours" type="number" value={settingsForm.halfDayHours} onChange={e => setSettingsForm({ ...settingsForm, halfDayHours: Number(e.target.value) })} />
            <Input label="Full Day Hours" type="number" value={settingsForm.fullDayHours} onChange={e => setSettingsForm({ ...settingsForm, fullDayHours: Number(e.target.value) })} />
            <Input label="Overtime After (hours)" type="number" value={settingsForm.overtimeAfter} onChange={e => setSettingsForm({ ...settingsForm, overtimeAfter: Number(e.target.value) })} />
            <Input label="Late Penalty (%)" type="number" value={settingsForm.latePenaltyPercent} onChange={e => setSettingsForm({ ...settingsForm, latePenaltyPercent: Number(e.target.value) })} />
          </div>

          <div className="mt-4">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">Weekly Off Days</label>
            <div className="flex flex-wrap gap-2">
              {weekDays.map((day, i) => (
                <button key={i} onClick={() => toggleWeeklyOff(i)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${(settingsForm.weeklyOff || []).includes(i) ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-400 hover:bg-slate-600"}`}>{day}</button>
              ))}
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Btn onClick={() => saveSettings(settingsForm)}>Save Attendance Settings</Btn>
          </div>
        </Card>

        <Card title="System" className="border-red-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-300">Reset All Data</p>
              <p className="text-xs text-slate-500">Delete all employees, attendance, and settings. This cannot be undone.</p>
            </div>
            <Btn variant="danger" onClick={handleResetAll}>Reset Everything</Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ============================================================
// ADMIN USERS MANAGEMENT
// ============================================================
function AdminUsersPage({ users, saveUsers, branches }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", password: "", role: ROLES.ADMIN, branchId: "" });
  const [editing, setEditing] = useState(null);

  const handleSave = () => {
    if (!form.name || !form.username || !form.password) return;
    if (editing) saveUsers(users.map(u => u.id === editing.id ? { ...u, ...form } : u));
    else saveUsers([...users, { ...form, id: uid() }]);
    setShowModal(false);
  };

  const handleDelete = (user) => {
    if (user.role === ROLES.SUPER_ADMIN && users.filter(u => u.role === ROLES.SUPER_ADMIN).length <= 1) {
      alert("Cannot delete the last super admin!"); return;
    }
    if (confirm(`Delete user "${user.name}"?`)) saveUsers(users.filter(u => u.id !== user.id));
  };

  const adminUsers = users.filter(u => u.role !== ROLES.EMPLOYEE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Btn icon={<Icons.Plus size={16} />} onClick={() => { setForm({ name: "", username: "", password: "", role: ROLES.ADMIN, branchId: branches[0]?.id || "" }); setEditing(null); setShowModal(true); }}>Add Admin</Btn>
      </div>

      <Table
        columns={[
          { header: "Name", render: r => <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-blue-400">{r.name?.[0]}</div>{r.name}</div> },
          { header: "Username", key: "username" },
          { header: "Role", render: r => <Badge color={r.role === ROLES.SUPER_ADMIN ? "purple" : "blue"}>{r.role.replace("_", " ").toUpperCase()}</Badge> },
          { header: "Branch", render: r => branches.find(b => b.id === r.branchId)?.name || "All" },
          { header: "", render: r => (
            <div className="flex gap-1">
              <button onClick={() => { setForm(r); setEditing(r); setShowModal(true); }} className="p-1.5 rounded hover:bg-slate-700 text-slate-400"><Icons.Edit size={14} /></button>
              <button onClick={() => handleDelete(r)} className="p-1.5 rounded hover:bg-red-900/30 text-slate-400 hover:text-red-400"><Icons.Trash size={14} /></button>
            </div>
          )},
        ]}
        data={adminUsers}
      />

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit User" : "Add Admin User"}>
        <div className="space-y-4">
          <Input label="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <Input label="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
          <Input label="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <Select label="Role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} options={[{ value: ROLES.SUPER_ADMIN, label: "Super Admin" }, { value: ROLES.ADMIN, label: "Admin" }]} />
          <Select label="Branch" value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })} options={[{ value: "", label: "All Branches" }, ...branches.map(b => ({ value: b.id, label: b.name }))]} />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancel</Btn>
          <Btn onClick={handleSave}>{editing ? "Update" : "Add User"}</Btn>
        </div>
      </Modal>
    </div>
  );
}
