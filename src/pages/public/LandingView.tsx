import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { AquaTrackLogo } from '../../components/atoms/AquaTrackLogo';
import { referenceApi } from '../../api';
import type { Barangay } from '../../types';
import {
  IconCheck,
  IconMapPin,
  IconAlertTriangle,
  IconTools,
  IconFileInvoice,
  IconBuilding,
  IconPhone,
  IconClock,
  IconArrowRight,
  IconUser,
  IconUserCheck,
  IconQrcode,
} from '@tabler/icons-react';

// Official 19 Sinacaban Barangays fallback
const OFFICIAL_BARANGAYS: string[] = [
  'Cagay-anon',
  'Camanse',
  'Colupan',
  'Dinas',
  'Estrella',
  'Katipunan',
  'Libertad',
  'Poblacion',
  'San Antonio',
  'San Isidro',
  'San Jose',
  'San Martin',
  'San Vicente',
  'Sinonoc',
  'Subic',
  'Tipan',
  'Tubo-an',
  'Upper Katipunan',
  'Upper San Jose',
];

export function LandingView() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [selectedBarangay, setSelectedBarangay] = useState<string>('All');

  // Active advisory broadcast preview
  const activeAdvisories = [
    {
      id: 1,
      title: 'Mainline Interconnection & Pressure Balancing',
      barangays: ['Poblacion', 'San Antonio', 'San Isidro'],
      timeWindow: 'Saturday, 1:00 PM – 5:00 PM',
      type: 'Scheduled Maintenance',
    },
    {
      id: 2,
      title: 'Service Line Pipe Repair near Sitio Tubig',
      barangays: ['Sinonoc'],
      timeWindow: 'Active (Estimated restoration 11:30 AM)',
      type: 'Emergency Repair',
    },
  ];

  useEffect(() => {
    referenceApi
      .getBarangays()
      .then((data) => {
        if (data && data.length > 0) {
          setBarangays(data);
        }
      })
      .catch(() => {
        // Fallback gracefully to official seed list
      });
  }, []);

  const displayedBarangays =
    barangays.length > 0
      ? barangays.map((b) => b.name)
      : OFFICIAL_BARANGAYS;

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'staff') return '/staff/tasks';
    return '/customer/home';
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans text-[14px] flex flex-col selection:bg-[#F0F6FD] selection:text-[#1E6FD9]">
      {/* Top Session Ribbon (If Logged In) */}
      {user && (
        <div className="bg-[#1E6FD9] text-white px-6 sm:px-10 lg:px-14 py-2.5 flex items-center justify-between border-b border-black/10">
          <div className="flex items-center gap-2">
            <span className="font-bold">
              Active Session: {user.name || (user.customer_profile ? `${user.customer_profile.first_name} ${user.customer_profile.last_name}` : user.email || user.mobile_number)} ({user.role.toUpperCase()})
            </span>
          </div>
          <button
            onClick={() => navigate(getDashboardPath())}
            className="font-bold underline uppercase tracking-wider hover:text-white/80 cursor-pointer text-[14px]"
          >
            Enter {user.role === 'admin' ? 'Admin' : user.role === 'staff' ? 'Staff' : 'Customer'} Dashboard →
          </button>
        </div>
      )}

      {/* Main Institutional Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-black/20 shadow-[0_3px_0px_0px_rgba(0,0,0,0.08)]">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 h-16 flex items-center justify-between gap-6">
          {/* Logo & Municipal Identity */}
          <Link to="/" className="flex items-center gap-3 text-black hover:opacity-90">
            <AquaTrackLogo size={34} variant="mark" />
            <div className="flex flex-col leading-tight">
              <span className="font-bold uppercase tracking-wider text-black text-[14px]">
                AquaTrack
              </span>
              <span className="text-black/60 font-normal text-[14px]">
                Sinacaban Water Supply System
              </span>
            </div>
          </Link>

          {/* Quick Header Navigation (Desktop) */}
          <nav className="hidden lg:flex items-center gap-8 font-bold text-black/70">
            <a href="#services" className="hover:text-[#1E6FD9] transition-colors py-1">
              Services
            </a>
            <a href="#advisories" className="hover:text-[#1E6FD9] transition-colors py-1">
              Advisories
            </a>
            <a href="#coverage" className="hover:text-[#1E6FD9] transition-colors py-1">
              Coverage
            </a>
            <a href="#gateways" className="hover:text-[#1E6FD9] transition-colors py-1">
              Portals
            </a>
            <a href="#contact" className="hover:text-[#1E6FD9] transition-colors py-1">
              Office
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="secondary" className="h-9 px-4 text-[14px] font-bold">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" className="h-9 px-4 text-[14px] font-bold">
                Register Water Account
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section: Centered Civic Headline & Expansive 4-Metric Strip */}
      <section className="relative border-b border-black/20 shadow-[0_2px_0px_0px_rgba(0,0,0,0.06)] bg-white py-20 sm:py-28 lg:py-32">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14">
          <div className="max-w-6xl mx-auto text-center space-y-6 sm:space-y-8">
            {/* Pill Tag */}
            <div className="inline-flex items-center px-3.5 py-1.5 rounded-full border border-[#1E6FD9]/30 bg-[#F0F6FD] text-[#1E6FD9] font-bold uppercase tracking-wider text-xs">
              Official Municipal Public Utility Gateway — AquaTrack
            </div>

            {/* Main Centered Civic Headline */}
            <div className="space-y-3 sm:space-y-4">
              <h1
                aria-label="AquaTrack"
                className="hero-aquatrack-3d flex items-center justify-center flex-wrap sm:flex-nowrap text-5xl sm:text-7xl md:text-8xl lg:text-[110px] xl:text-[132px] 2xl:text-[144px] font-black uppercase tracking-tight text-black leading-none max-w-6xl mx-auto select-none"
              >
                <span className="hero-logo-mark inline-flex items-center justify-center shrink-0 w-[1.05em] h-[1.05em] -mr-[0.06em]">
                  <AquaTrackLogo size="100%" variant="mark" className="w-full h-full" />
                </span>
                <span className="hero-aquatrack-letters">QUATRACK</span>
              </h1>
              <p className="text-base sm:text-xl lg:text-2xl font-bold uppercase tracking-widest text-black/80">
                Sinacaban Water Supply System
              </p>
            </div>

            {/* Single Concise Mission Description */}
            <p className="text-sm sm:text-base lg:text-lg text-black/70 font-normal leading-relaxed max-w-2xl mx-auto">
              Unified digital platform for municipal water consumer accounts, meter verification, rapid maintenance dispatch, and transparent billing across all 19 barangays.
            </p>

            {/* Prominent Action CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
              <Link to="/register">
                <Button
                  variant="primary"
                  className="h-12 px-7 text-xs sm:text-sm font-bold rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                  rightIcon={<IconArrowRight size={16} />}
                >
                  Register Water Account
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  variant="secondary"
                  className="h-12 px-7 text-xs sm:text-sm font-bold rounded-lg"
                >
                  Institutional Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Expansive 4-Metric Strip */}
          <div className="mt-14 sm:mt-20 pt-10 sm:pt-14 border-t border-black/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Metric 1 */}
              <Card className="p-5 sm:p-6 border-black/20 hover:border-[#1E6FD9] transition-all bg-white rounded-xl space-y-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] hover:shadow-[3px_3px_0px_0px_#1E6FD9]">
                <span className="text-black/60 font-bold uppercase tracking-wider text-[14px] block">
                  Municipal Reach
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-black tracking-tight">
                  19
                </div>
                <div className="text-black font-bold uppercase tracking-wider text-xs">
                  Barangays Covered
                </div>
                <p className="text-black/70 font-normal leading-relaxed text-xs">
                  Full distribution network servicing Poblacion and all surrounding rural zones.
                </p>
              </Card>

              {/* Metric 2 */}
              <Card className="p-5 sm:p-6 border-black/20 hover:border-[#1E6FD9] transition-all bg-white rounded-xl space-y-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] hover:shadow-[3px_3px_0px_0px_#1E6FD9]">
                <span className="text-black/60 font-bold uppercase tracking-wider text-[14px] block">
                  Meter Management
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-black tracking-tight">
                  100%
                </div>
                <div className="text-black font-bold uppercase tracking-wider text-xs">
                  Verified Municipal Meters
                </div>
                <p className="text-black/70 font-normal leading-relaxed text-xs">
                  Physical QR token-encoded municipal meter registry with official verification.
                </p>
              </Card>

              {/* Metric 3 */}
              <Card className="p-5 sm:p-6 border-black/20 hover:border-[#1E6FD9] transition-all bg-white rounded-xl space-y-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] hover:shadow-[3px_3px_0px_0px_#1E6FD9]">
                <span className="text-black/60 font-bold uppercase tracking-wider text-[14px] block">
                  Field Maintenance
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-black tracking-tight">
                  24/7
                </div>
                <div className="text-black font-bold uppercase tracking-wider text-xs">
                  Rapid Field Dispatch
                </div>
                <p className="text-black/70 font-normal leading-relaxed text-xs">
                  Automated incident queue for burst pipes, low pressure, and urgent repairs.
                </p>
              </Card>

              {/* Metric 4 */}
              <Card className="p-5 sm:p-6 border-black/20 hover:border-[#1E6FD9] transition-all bg-white rounded-xl space-y-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] hover:shadow-[3px_3px_0px_0px_#1E6FD9]">
                <span className="text-black/60 font-bold uppercase tracking-wider text-[14px] block">
                  Public Transparency
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-black tracking-tight">
                  Live
                </div>
                <div className="text-black font-bold uppercase tracking-wider text-xs">
                  Published Billing Ledger
                </div>
                <p className="text-black/70 font-normal leading-relaxed text-xs">
                  Audited monthly statements with official municipal payment accountability.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Public Utility Services Grid */}
      <section id="services" className="py-20 sm:py-24 lg:py-28 border-b border-black/20 shadow-[0_2px_0px_0px_rgba(0,0,0,0.06)] bg-white">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-black">
              Services
            </h2>
            <p className="text-base sm:text-lg text-black/70 font-normal leading-relaxed">
              Municipal Water Management & Citizen Public Utility Services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Service 1 */}
            <Card className="p-6 border-black/20 hover:border-[#1E6FD9] transition-all space-y-3 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] hover:shadow-[3px_3px_0px_0px_#1E6FD9]">
              <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold">
                <IconUserCheck size={18} />
              </div>
              <h3 className="font-bold text-black uppercase tracking-wider text-base">
                Link Water Account
              </h3>
              <p className="text-black/70 font-normal leading-relaxed text-xs sm:text-sm">
                Link your existing municipal water account and meter number with instant SMS OTP activation.
              </p>
              <div className="pt-2 border-t border-black/10">
                <Link to="/register" className="font-bold text-[#1E6FD9] hover:underline flex items-center gap-1 text-xs">
                  Register Online <IconArrowRight size={13} />
                </Link>
              </div>
            </Card>

            {/* Service 2 */}
            <Card className="p-6 border-black/20 hover:border-[#1E6FD9] transition-all space-y-3 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] hover:shadow-[3px_3px_0px_0px_#1E6FD9]">
              <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold">
                <IconTools size={18} />
              </div>
              <h3 className="font-bold text-black uppercase tracking-wider text-base">
                Leak & Issue Dispatch
              </h3>
              <p className="text-black/70 font-normal leading-relaxed text-xs sm:text-sm">
                Direct fault reporting for pipe bursts and pressure drops with automated technician dispatch.
              </p>
              <div className="pt-2 border-t border-black/10">
                <Link to="/login" className="font-bold text-[#1E6FD9] hover:underline flex items-center gap-1 text-xs">
                  Report in Portal <IconArrowRight size={13} />
                </Link>
              </div>
            </Card>

            {/* Service 3 */}
            <Card className="p-6 border-black/20 hover:border-[#1E6FD9] transition-all space-y-3 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] hover:shadow-[3px_3px_0px_0px_#1E6FD9]">
              <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold">
                <IconAlertTriangle size={18} />
              </div>
              <h3 className="font-bold text-black uppercase tracking-wider text-base">
                Interruption Bulletins
              </h3>
              <p className="text-black/70 font-normal leading-relaxed text-xs sm:text-sm">
                Live broadcasts of scheduled maintenance and emergency repair notices per barangay.
              </p>
              <div className="pt-2 border-t border-black/10">
                <a href="#advisories" className="font-bold text-[#1E6FD9] hover:underline flex items-center gap-1 text-xs">
                  View Advisories <IconArrowRight size={13} />
                </a>
              </div>
            </Card>

            {/* Service 4 */}
            <Card className="p-6 border-black/20 hover:border-[#1E6FD9] transition-all space-y-3 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] hover:shadow-[3px_3px_0px_0px_#1E6FD9]">
              <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold">
                <IconFileInvoice size={18} />
              </div>
              <h3 className="font-bold text-black uppercase tracking-wider text-base">
                Monthly Water Bills
              </h3>
              <p className="text-black/70 font-normal leading-relaxed text-xs sm:text-sm">
                Audited monthly billing statements with ledger records and printable official statements.
              </p>
              <div className="pt-2 border-t border-black/10">
                <Link to="/login" className="font-bold text-[#1E6FD9] hover:underline flex items-center gap-1 text-xs">
                  View Billing <IconArrowRight size={13} />
                </Link>
              </div>
            </Card>

            {/* Service 5 */}
            <Card className="p-6 border-black/20 hover:border-[#1E6FD9] transition-all space-y-3 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] hover:shadow-[3px_3px_0px_0px_#1E6FD9]">
              <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold">
                <IconQrcode size={18} />
              </div>
              <h3 className="font-bold text-black uppercase tracking-wider text-base">
                Field Inspection
              </h3>
              <p className="text-black/70 font-normal leading-relaxed text-xs sm:text-sm">
                On-site meter inspection with physical QR tags and mobile offline synchronization.
              </p>
              <div className="pt-2 border-t border-black/10">
                <Link to="/login" className="font-bold text-[#1E6FD9] hover:underline flex items-center gap-1 text-xs">
                  Staff Access <IconArrowRight size={13} />
                </Link>
              </div>
            </Card>

            {/* Service 6 */}
            <Card className="p-6 border-black/20 hover:border-[#1E6FD9] transition-all space-y-3 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] hover:shadow-[3px_3px_0px_0px_#1E6FD9]">
              <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold">
                <IconBuilding size={18} />
              </div>
              <h3 className="font-bold text-black uppercase tracking-wider text-base">
                Municipal Operations
              </h3>
              <p className="text-black/70 font-normal leading-relaxed text-xs sm:text-sm">
                Admin control for applicant verification, crew assignment, and batch billing imports.
              </p>
              <div className="pt-2 border-t border-black/10">
                <Link to="/login" className="font-bold text-[#1E6FD9] hover:underline flex items-center gap-1 text-xs">
                  Admin Access <IconArrowRight size={13} />
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Public Interruption Advisories Bulletin */}
      <section id="advisories" className="py-20 sm:py-24 lg:py-28 border-b border-black/20 shadow-[0_2px_0px_0px_rgba(0,0,0,0.06)] bg-white">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-black">
                Advisories
              </h2>
              <p className="text-base sm:text-lg text-black/70 font-normal leading-relaxed">
                Water Service Notices & Maintenance Bulletins
              </p>
            </div>

            <Link to="/login">
              <Button variant="secondary" className="h-9 px-4 text-xs font-bold">
                Sign In to Full Calendar
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {activeAdvisories.map((advisory) => (
              <Card
                key={advisory.id}
                className="p-6 border-black/20 hover:border-[#1E6FD9] transition-all space-y-3.5 bg-white rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] hover:shadow-[3px_3px_0px_0px_#1E6FD9]"
              >
                <div className="flex items-center justify-between border-b border-black/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <IconAlertTriangle size={15} className="text-black" />
                    <span className="font-bold uppercase tracking-wider text-black text-xs">
                      {advisory.type}
                    </span>
                  </div>
                  <Badge variant="blue" className="text-[14px]">
                    AquaTrack
                  </Badge>
                </div>

                <h3 className="font-bold text-black uppercase tracking-wider text-base">
                  {advisory.title}
                </h3>

                <div className="space-y-1 text-black/70 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <IconClock size={13} className="text-black/50" />
                    <span className="font-bold text-black">Time:</span> {advisory.timeWindow}
                  </div>
                  <div className="flex items-center gap-2">
                    <IconMapPin size={13} className="text-black/50" />
                    <span className="font-bold text-black">Zones:</span> {advisory.barangays.join(', ')}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Barangay Coverage Section */}
      <section id="coverage" className="py-20 sm:py-24 lg:py-28 border-b border-black/20 shadow-[0_2px_0px_0px_rgba(0,0,0,0.06)] bg-white">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-black">
              Barangay Coverage
            </h2>
            <p className="text-base sm:text-lg text-black/70 font-normal leading-relaxed">
              Serving All 19 Municipal Barangays Across Sinacaban
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedBarangay('All')}
              className={`px-3.5 py-1.5 rounded-full border text-xs font-bold cursor-pointer transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,0.08)] ${
                selectedBarangay === 'All'
                  ? 'bg-[#1E6FD9] text-white border-[#1E6FD9]'
                  : 'bg-white text-black border-black/20 hover:border-black'
              }`}
            >
              All 19 Barangays
            </button>
            <button
              onClick={() => setSelectedBarangay('Poblacion')}
              className={`px-3.5 py-1.5 rounded-full border text-xs font-bold cursor-pointer transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,0.08)] ${
                selectedBarangay === 'Poblacion'
                  ? 'bg-[#1E6FD9] text-white border-[#1E6FD9]'
                  : 'bg-white text-black border-black/20 hover:border-black'
              }`}
            >
              Poblacion (Center)
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {displayedBarangays
              .filter((name) =>
                selectedBarangay === 'All' ? true : name.toLowerCase().includes(selectedBarangay.toLowerCase())
              )
              .map((bName) => (
                <div
                  key={bName}
                  className="p-3.5 border border-black/20 rounded-xl bg-white hover:border-[#1E6FD9] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.08)] hover:shadow-[2px_2px_0px_0px_#1E6FD9] transition-all flex items-center justify-center text-center"
                >
                  <span className="font-bold text-black uppercase tracking-wider text-xs">
                    {bName}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Gateway Portals Selector */}
      <section id="gateways" className="py-20 sm:py-24 lg:py-28 border-b border-black/20 shadow-[0_2px_0px_0px_rgba(0,0,0,0.06)] bg-white">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-black">
              Portals & Gateways
            </h2>
            <p className="text-base sm:text-lg text-black/70 font-normal leading-relaxed">
              Dedicated Access Portals for Consumers, Field Crews, and Administration
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Gateway 1: Customer */}
            <Card className="p-6 sm:p-7 border-black/20 hover:border-[#1E6FD9] transition-all flex flex-col justify-between space-y-5 bg-white rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] hover:shadow-[3px_3px_0px_0px_#1E6FD9]">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold">
                    <IconUser size={18} />
                  </div>
                  <Badge variant="blue" className="text-[14px]">
                    Consumer
                  </Badge>
                </div>
                <h3 className="font-bold text-black uppercase tracking-wider text-base sm:text-lg">
                  Household Consumers
                </h3>
                <p className="text-black/70 font-normal leading-relaxed text-xs sm:text-sm">
                  Review monthly bills, submit repair requests, and track status updates.
                </p>
                <div className="space-y-1.5 pt-1 text-black/80 font-normal text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <IconCheck size={14} className="text-black/60" />
                    <span>View Published Monthly Bills</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconCheck size={14} className="text-black/60" />
                    <span>Report Service Line Faults</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-black/10">
                <Link to="/login" className="block">
                  <Button variant="primary" className="w-full h-9 text-xs font-bold">
                    Consumer Sign In
                  </Button>
                </Link>
                <Link to="/register" className="block">
                  <Button variant="secondary" className="w-full h-9 text-xs font-bold">
                    Register Water Account
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Gateway 2: Staff */}
            <Card className="p-6 sm:p-7 border-black/20 hover:border-[#1E6FD9] transition-all flex flex-col justify-between space-y-5 bg-white rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] hover:shadow-[3px_3px_0px_0px_#1E6FD9]">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold">
                    <IconTools size={18} />
                  </div>
                  <Badge variant="black" className="text-[14px]">
                    Field
                  </Badge>
                </div>
                <h3 className="font-bold text-black uppercase tracking-wider text-base sm:text-lg">
                  Field Technicians
                </h3>
                <p className="text-black/70 font-normal leading-relaxed text-xs sm:text-sm">
                  Inspect assigned maintenance tickets, scan meter QR codes, and log resolutions.
                </p>
                <div className="space-y-1.5 pt-1 text-black/80 font-normal text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <IconCheck size={14} className="text-black/60" />
                    <span>View Assigned Work Orders</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconCheck size={14} className="text-black/60" />
                    <span>Scan Meter QR Casing Tags</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-black/10">
                <Link to="/login" className="block">
                  <Button variant="secondary" className="w-full h-9 text-xs font-bold">
                    Technician Sign In
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Gateway 3: Admin */}
            <Card className="p-6 sm:p-7 border-black/20 hover:border-[#1E6FD9] transition-all flex flex-col justify-between space-y-5 bg-white rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] hover:shadow-[3px_3px_0px_0px_#1E6FD9]">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold">
                    <IconBuilding size={18} />
                  </div>
                  <Badge variant="blue" className="text-[14px]">
                    Admin
                  </Badge>
                </div>
                <h3 className="font-bold text-black uppercase tracking-wider text-base sm:text-lg">
                  System Administrators
                </h3>
                <p className="text-black/70 font-normal leading-relaxed text-xs sm:text-sm">
                  Verify applicants, dispatch crews, broadcast advisories, and import monthly billing.
                </p>
                <div className="space-y-1.5 pt-1 text-black/80 font-normal text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <IconCheck size={14} className="text-black/60" />
                    <span>Review Verification Queue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconCheck size={14} className="text-black/60" />
                    <span>Batch CSV Billing Imports</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-black/10">
                <Link to="/login" className="block">
                  <Button variant="secondary" className="w-full h-9 text-xs font-bold">
                    Administrator Sign In
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Office & Support Contact Information */}
      <section id="contact" className="py-20 sm:py-24 lg:py-28 border-b border-black/20 shadow-[0_2px_0px_0px_rgba(0,0,0,0.06)] bg-white">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-5 space-y-3.5">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-black">
                Office Information
              </h2>
              <p className="text-base sm:text-lg text-black/70 font-normal leading-relaxed">
                Sinacaban Water Supply System Municipal Office
              </p>
              <p className="text-black/70 font-normal leading-relaxed text-xs sm:text-sm">
                Operating under municipal mandate to manage public utility water services for the Municipality of Sinacaban.
              </p>

              <div className="space-y-2.5 pt-2 text-black/80 text-xs sm:text-sm">
                <div className="flex items-start gap-2.5">
                  <IconMapPin size={16} className="text-black/60 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-black block">Location</span>
                    <span>Ground Floor, Sinacaban Municipal Hall, Misamis Occidental</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <IconClock size={16} className="text-black/60 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-black block">Operating Hours</span>
                    <span>Monday to Friday — 8:00 AM – 5:00 PM</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <IconPhone size={16} className="text-black/60 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-black block">Hotline & SMS</span>
                    <span>Landline: (088) 521-1200 / SMS: +63 917 123 4567</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <Card className="p-6 sm:p-7 border-black/20 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] bg-white space-y-4 rounded-xl">
                <h3 className="font-bold text-black uppercase tracking-wider border-b border-black/10 pb-2.5 text-base">
                  Quick Citizen Questions
                </h3>

                <div className="space-y-3">
                  <div className="border border-black/20 rounded-lg p-3.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.06)]">
                    <h4 className="font-bold text-black uppercase tracking-wider text-xs sm:text-sm">
                      How do I register my existing water account?
                    </h4>
                    <p className="text-black/70 font-normal mt-1 leading-relaxed text-xs sm:text-sm">
                      Enter your Account Number and Meter Number from your official SIWASS receipt. Once confirmed, you will receive an SMS OTP to activate your online account immediately.
                    </p>
                  </div>

                  <div className="border border-black/20 rounded-lg p-3.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.06)]">
                    <h4 className="font-bold text-black uppercase tracking-wider text-xs sm:text-sm">
                      Where can water payments be made?
                    </h4>
                    <p className="text-black/70 font-normal mt-1 leading-relaxed text-xs sm:text-sm">
                      Payments are received at the Sinacaban Municipal Treasury Office (Ground Floor, Municipal Hall).
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Institutional Municipal Footer */}
      <footer className="bg-white border-t border-black/20 shadow-[0_-2px_0px_0px_rgba(0,0,0,0.06)] py-10 mt-auto">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black/10 pb-6">
            <div className="flex items-center gap-2.5">
              <AquaTrackLogo size={24} variant="mark" />
              <span className="font-bold uppercase tracking-wider text-black text-xs sm:text-sm">
                AquaTrack — Sinacaban Water Supply System
              </span>
            </div>

            <div className="flex items-center gap-6 text-black/70 font-bold flex-wrap text-xs sm:text-sm">
              <Link to="/login" className="hover:text-[#1E6FD9] transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="hover:text-[#1E6FD9] transition-colors">
                Register Account
              </Link>
              <a href="#services" className="hover:text-[#1E6FD9] transition-colors">
                Services
              </a>
              <a href="#advisories" className="hover:text-[#1E6FD9] transition-colors">
                Advisories
              </a>
              <a href="#contact" className="hover:text-[#1E6FD9] transition-colors">
                Office
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-black/60 font-normal text-[14px]">
            <div>
              © 2026 Municipality of Sinacaban, Misamis Occidental. Republic of the Philippines.
            </div>
            <div>
              System Version 1.0 (Vite / React 19)
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingView;
