import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { referenceApi } from '../../api';
import type { Barangay } from '../../types';
import {
  IconSearch,
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

// Simulated transparent request tracker records for Sinacaban residents
interface SpecimenRequest {
  ref: string;
  barangay: string;
  issue: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'submitted' | 'assigned' | 'in_progress' | 'resolved';
  technician: string;
  updatedAt: string;
  remarks?: string;
}

const SPECIMEN_REQUESTS: Record<string, SpecimenRequest> = {
  'AT-0001': {
    ref: 'AT-0001',
    barangay: 'Poblacion',
    issue: 'Major Mainline Pipe Burst',
    urgency: 'high',
    status: 'resolved',
    technician: 'Engr. R. Baluyot (Team Alpha)',
    updatedAt: '2 hours ago',
    remarks: 'Mainline high-pressure collar clamp successfully installed and tested. Normal pressure restored.',
  },
  'AT-0002': {
    ref: 'AT-0002',
    barangay: 'San Isidro',
    issue: 'Service Line Pipe Leak',
    urgency: 'medium',
    status: 'in_progress',
    technician: 'J. Villarta (Field Inspector)',
    updatedAt: '35 minutes ago',
    remarks: 'Excavation completed. Replacing 1/2-inch PVC feeder pipe.',
  },
  'AT-0003': {
    ref: 'AT-0003',
    barangay: 'Sinonoc',
    issue: 'Low Water Pressure',
    urgency: 'medium',
    status: 'assigned',
    technician: 'Field Dispatch Unit 2',
    updatedAt: 'Today at 07:15 AM',
    remarks: 'Technician dispatched to inspect booster distribution valve.',
  },
  'AT-0004': {
    ref: 'AT-0004',
    barangay: 'Katipunan',
    issue: 'Routine Meter Inspection',
    urgency: 'low',
    status: 'submitted',
    technician: 'Pending Assignment',
    updatedAt: 'Today at 08:00 AM',
    remarks: 'Queued for daily municipal technician assignment.',
  },
};

export function LandingView() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [selectedBarangay, setSelectedBarangay] = useState<string>('All');
  const [searchRefInput, setSearchRefInput] = useState<string>('AT-0001');
  const [trackedRequest, setTrackedRequest] = useState<SpecimenRequest | null>(SPECIMEN_REQUESTS['AT-0001']);
  const [trackerMessage, setTrackerMessage] = useState<string | null>(null);

  // Active advisory broadcast preview
  const activeAdvisories = [
    {
      id: 1,
      title: 'Scheduled Mainline Interconnection & Pressure Balancing',
      barangays: ['Poblacion', 'San Antonio', 'San Isidro'],
      timeWindow: 'Saturday, 1:00 PM – 5:00 PM',
      type: 'Scheduled Maintenance',
    },
    {
      id: 2,
      title: 'Emergency Service Line Repair near Sitio Tubig',
      barangays: ['Sinonoc'],
      timeWindow: 'Active (Estimated restoration 11:30 AM)',
      type: 'Emergency Advisory',
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

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackerMessage(null);
    const cleaned = searchRefInput.trim().toUpperCase();

    if (!cleaned) {
      setTrackerMessage('Please enter a valid request reference (e.g., AT-0001).');
      setTrackedRequest(null);
      return;
    }

    if (SPECIMEN_REQUESTS[cleaned]) {
      setTrackedRequest(SPECIMEN_REQUESTS[cleaned]);
    } else {
      setTrackedRequest(null);
      setTrackerMessage(
        `No public record found for "${cleaned}". Please verify the reference or sign in to your consumer account for personal requests.`
      );
    }
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'staff') return '/staff/tasks';
    return '/customer/home';
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans text-[10px] flex flex-col selection:bg-[#F0F6FD] selection:text-[#1E6FD9]">
      {/* Top Session Ribbon (If Logged In) */}
      {user && (
        <div className="bg-[#1E6FD9] text-white px-6 sm:px-10 lg:px-14 py-2.5 flex items-center justify-between border-b border-black/10">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="font-medium">
              Active Institutional Session: {user.name || (user.customer_profile ? `${user.customer_profile.first_name} ${user.customer_profile.last_name}` : user.email || user.mobile_number)} ({user.role.toUpperCase()})
            </span>
          </div>
          <button
            onClick={() => navigate(getDashboardPath())}
            className="font-bold underline uppercase tracking-wider hover:text-white/80 cursor-pointer text-[10px]"
          >
            Enter {user.role === 'admin' ? 'Admin' : user.role === 'staff' ? 'Staff' : 'Customer'} Dashboard →
          </button>
        </div>
      )}

      {/* Main Institutional Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-black/15 shadow-2xs">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 h-16 flex items-center justify-between gap-6">
          {/* Logo & Municipal Identity */}
          <Link to="/" className="flex items-center gap-3 text-black hover:opacity-90">
            <div className="h-8 px-3 flex items-center justify-center rounded-lg bg-[#1E6FD9] text-white font-bold tracking-wider uppercase text-[10px]">
              AquaTrack
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold uppercase tracking-wider text-black text-[10px]">
                Sinacaban Water Works System
              </span>
              <span className="text-black/60 font-medium text-[10px]">
                SIWASS · Municipality of Sinacaban, Misamis Occidental
              </span>
            </div>
          </Link>

          {/* Quick Header Navigation (Desktop) */}
          <nav className="hidden lg:flex items-center gap-8 font-medium text-black/70">
            <a href="#services" className="hover:text-[#1E6FD9] transition-colors py-1">
              Utility Services
            </a>
            <a href="#tracker" className="hover:text-[#1E6FD9] transition-colors py-1">
              Track Request
            </a>
            <a href="#advisories" className="hover:text-[#1E6FD9] transition-colors py-1">
              Advisories & Interruptions
            </a>
            <a href="#coverage" className="hover:text-[#1E6FD9] transition-colors py-1">
              Barangay Coverage
            </a>
            <a href="#gateways" className="hover:text-[#1E6FD9] transition-colors py-1">
              Access Gateways
            </a>
            <a href="#contact" className="hover:text-[#1E6FD9] transition-colors py-1">
              Office & Support
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="secondary" className="h-9 px-4 text-[10px] font-bold">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" className="h-9 px-4 text-[10px] font-bold">
                Register Household
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative border-b border-black/15 bg-white py-16 sm:py-24 lg:py-28">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Headlines & Call to Actions */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#1E6FD9] bg-[#F0F6FD] text-[#1E6FD9] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1E6FD9]" />
                Official Municipal Public Utility Gateway
              </div>

              <h1 className="text-black font-bold tracking-tight text-[10px] uppercase leading-relaxed text-balance">
                Digital Water Utility Management System for the Municipality of Sinacaban
              </h1>

              <p className="text-black/70 font-normal leading-relaxed text-pretty max-w-3xl text-[10px]">
                AquaTrack provides Sinacaban residents, municipal water technicians, and utility administrators with an integrated municipal platform. Register household water meters, monitor real-time barangay service interruptions, report maintenance issues, and review official monthly billing statements.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link to="/register">
                  <Button
                    variant="primary"
                    className="h-10 px-5 text-[10px] font-bold"
                    rightIcon={<IconArrowRight size={14} />}
                  >
                    Register Water Connection
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="secondary" className="h-10 px-5 text-[10px] font-bold">
                    Institutional Sign In
                  </Button>
                </Link>
                <a href="#tracker">
                  <Button variant="ghost" className="h-10 px-4 text-[10px] font-bold text-[#1E6FD9] underline">
                    Track Existing Request (AT-XXXX)
                  </Button>
                </a>
              </div>

              {/* Trust & Compliance Badge Strip */}
              <div className="pt-6 border-t border-black/10 flex flex-wrap items-center gap-6 text-black/60">
                <div className="flex items-center gap-2">
                  <IconCheck size={14} className="text-[#1E6FD9]" />
                  <span>100% SIWASS Verified Meters</span>
                </div>
                <div className="flex items-center gap-2">
                  <IconCheck size={14} className="text-[#1E6FD9]" />
                  <span>19 Municipal Barangays Covered</span>
                </div>
                <div className="flex items-center gap-2">
                  <IconCheck size={14} className="text-[#1E6FD9]" />
                  <span>SMS Dispatched Incident Logs</span>
                </div>
                <div className="flex items-center gap-2">
                  <IconCheck size={14} className="text-[#1E6FD9]" />
                  <span>Queued Field Dispatch</span>
                </div>
              </div>
            </div>

            {/* Right Column: Live Operational Snapshot Card */}
            <div className="lg:col-span-5">
              <Card className="border-black/20 p-6 sm:p-7 space-y-5 shadow-xs bg-white rounded-xl">
                <div className="flex items-center justify-between border-b border-black/10 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1E6FD9]" />
                    <span className="font-bold uppercase tracking-wider text-black">
                      SIWASS Live Utility Board
                    </span>
                  </div>
                  <Badge variant="blue" className="text-[10px]">
                    Sinacaban Active
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="border border-black/10 rounded-lg p-3.5 bg-white">
                    <span className="text-black/60 block font-medium">Barangays Active</span>
                    <span className="font-bold text-black text-[10px] block mt-1">19 Barangays</span>
                    <span className="text-[#1E6FD9] block mt-0.5">Full Municipal Coverage</span>
                  </div>
                  <div className="border border-black/10 rounded-lg p-3.5 bg-white">
                    <span className="text-black/60 block font-medium">Field Dispatch Status</span>
                    <span className="font-bold text-black text-[10px] block mt-1">On Standby</span>
                    <span className="text-black/60 block mt-0.5">Response Ready 24/7</span>
                  </div>
                  <div className="border border-black/10 rounded-lg p-3.5 bg-white">
                    <span className="text-black/60 block font-medium">Meter Verification</span>
                    <span className="font-bold text-black text-[10px] block mt-1">QR Coded</span>
                    <span className="text-black/60 block mt-0.5">Physical Tagged Asset</span>
                  </div>
                  <div className="border border-black/10 rounded-lg p-3.5 bg-white">
                    <span className="text-black/60 block font-medium">Water Statements</span>
                    <span className="font-bold text-black text-[10px] block mt-1">Official CSV</span>
                    <span className="text-black/60 block mt-0.5">Treasury Validated</span>
                  </div>
                </div>

                {/* Active Advisory Alert Box */}
                <div className="border border-[#1E6FD9] bg-[#F0F6FD] rounded-lg p-4 text-black space-y-2">
                  <div className="flex items-center justify-between font-bold text-[#1E6FD9]">
                    <span className="flex items-center gap-1.5">
                      <IconAlertTriangle size={14} />
                      Current Water Advisory
                    </span>
                    <span className="uppercase tracking-wider">Scheduled</span>
                  </div>
                  <p className="text-black/80 font-normal leading-relaxed">
                    Pressure balancing operation scheduled for Poblacion, San Antonio, and San Isidro on Saturday. Normal supply maintained in adjacent zones.
                  </p>
                  <a
                    href="#advisories"
                    className="inline-flex items-center gap-1 font-bold text-[#1E6FD9] underline pt-1"
                  >
                    View All Advisories <IconArrowRight size={11} />
                  </a>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Public Utility Services Grid */}
      <section id="services" className="py-20 sm:py-24 lg:py-28 border-b border-black/15 bg-white">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-2.5">
            <span className="font-bold text-[#1E6FD9] uppercase tracking-wider block">
              Core Public Services
            </span>
            <h2 className="text-black font-bold uppercase tracking-wider text-[10px]">
              Comprehensive Water Utility Management
            </h2>
            <p className="text-black/70 font-normal leading-relaxed">
              Designed according to municipal ordinance and utility requirements, ensuring transparent, reliable, and accessible water service across Sinacaban.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Service 1: Registration */}
            <Card className="p-6 sm:p-7 border-black/15 hover:border-[#1E6FD9] transition-all space-y-3.5 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-[#1E6FD9] text-white flex items-center justify-center font-bold">
                <IconUserCheck size={18} />
              </div>
              <h3 className="font-bold text-black uppercase tracking-wider">
                Household Water Registration
              </h3>
              <p className="text-black/70 font-normal leading-relaxed">
                2-step online self-registration for residents. Pin your exact household location, confirm account credentials, and receive SMS updates upon meter verification by SIWASS administrators.
              </p>
              <div className="pt-3 border-t border-black/10">
                <Link to="/register" className="font-bold text-[#1E6FD9] hover:underline flex items-center gap-1">
                  Apply for Connection <IconArrowRight size={12} />
                </Link>
              </div>
            </Card>

            {/* Service 2: Issue Reporting & Field Dispatch */}
            <Card className="p-6 sm:p-7 border-black/15 hover:border-[#1E6FD9] transition-all space-y-3.5 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-[#1E6FD9] text-white flex items-center justify-center font-bold">
                <IconTools size={18} />
              </div>
              <h3 className="font-bold text-black uppercase tracking-wider">
                Issue Reporting & Field Dispatch
              </h3>
              <p className="text-black/70 font-normal leading-relaxed">
                Report broken pipes, water leaks, low pressure, and meter faults. System automatically derives ticket urgency and assigns authorized municipal technicians with reference tracking.
              </p>
              <div className="pt-3 border-t border-black/10">
                <a href="#tracker" className="font-bold text-[#1E6FD9] hover:underline flex items-center gap-1">
                  Track Service Request <IconArrowRight size={12} />
                </a>
              </div>
            </Card>

            {/* Service 3: Water Interruption Advisories */}
            <Card className="p-6 sm:p-7 border-black/15 hover:border-[#1E6FD9] transition-all space-y-3.5 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-[#1E6FD9] text-white flex items-center justify-center font-bold">
                <IconAlertTriangle size={18} />
              </div>
              <h3 className="font-bold text-black uppercase tracking-wider">
                Service Interruption Advisories
              </h3>
              <p className="text-black/70 font-normal leading-relaxed">
                Real-time public calendar of scheduled maintenance, emergency pipeline restorations, and barangay-specific advisory notices with SMS broadcasts to affected households.
              </p>
              <div className="pt-3 border-t border-black/10">
                <a href="#advisories" className="font-bold text-[#1E6FD9] hover:underline flex items-center gap-1">
                  Browse Active Advisories <IconArrowRight size={12} />
                </a>
              </div>
            </Card>

            {/* Service 4: Official Billing Statements */}
            <Card className="p-6 sm:p-7 border-black/15 hover:border-[#1E6FD9] transition-all space-y-3.5 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-[#1E6FD9] text-white flex items-center justify-center font-bold">
                <IconFileInvoice size={18} />
              </div>
              <h3 className="font-bold text-black uppercase tracking-wider">
                Official Monthly Water Bills
              </h3>
              <p className="text-black/70 font-normal leading-relaxed">
                Verified billing ledgers imported directly from municipal meter billing audits. Consumers can inspect published statements, payment statuses, and printable official receipts.
              </p>
              <div className="pt-3 border-t border-black/10">
                <Link to="/login" className="font-bold text-[#1E6FD9] hover:underline flex items-center gap-1">
                  View Account Ledger <IconArrowRight size={12} />
                </Link>
              </div>
            </Card>

            {/* Service 5: Field QR Inspection Tool */}
            <Card className="p-6 sm:p-7 border-black/15 hover:border-[#1E6FD9] transition-all space-y-3.5 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-[#1E6FD9] text-white flex items-center justify-center font-bold">
                <IconQrcode size={18} />
              </div>
              <h3 className="font-bold text-black uppercase tracking-wider">
                Field Technician Inspection
              </h3>
              <p className="text-black/70 font-normal leading-relaxed">
                On-site meter lookup via physical QR code tokens or engraved casing numbers. Field staff can inspect assigned households and resolve maintenance work orders in real-time.
              </p>
              <div className="pt-3 border-t border-black/10">
                <Link to="/login" className="font-bold text-[#1E6FD9] hover:underline flex items-center gap-1">
                  Technician Portal <IconArrowRight size={12} />
                </Link>
              </div>
            </Card>

            {/* Service 6: Municipal Administration */}
            <Card className="p-6 sm:p-7 border-black/15 hover:border-[#1E6FD9] transition-all space-y-3.5 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-[#1E6FD9] text-white flex items-center justify-center font-bold">
                <IconBuilding size={18} />
              </div>
              <h3 className="font-bold text-black uppercase tracking-wider">
                Administrative Control & Oversight
              </h3>
              <p className="text-black/70 font-normal leading-relaxed">
                Dedicated municipal command center for SIWASS administrators: applicant verification queue, staff dispatch board, billing CSV imports, and automated SMS incident notifications.
              </p>
              <div className="pt-3 border-t border-black/10">
                <Link to="/login" className="font-bold text-[#1E6FD9] hover:underline flex items-center gap-1">
                  Administrator Portal <IconArrowRight size={12} />
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Public Request Tracker Widget */}
      <section id="tracker" className="py-20 sm:py-24 lg:py-28 border-b border-black/15 bg-white">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-2.5">
            <span className="font-bold text-[#1E6FD9] uppercase tracking-wider block">
              Citizen Transparency
            </span>
            <h2 className="text-black font-bold uppercase tracking-wider text-[10px]">
              Track Public Service Request
            </h2>
            <p className="text-black/70 font-normal max-w-xl mx-auto leading-relaxed">
              Check the status and technician assignment of your water utility maintenance ticket. Enter your ticket reference number (e.g., AT-0001) below.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="p-7 sm:p-8 border-black/20 shadow-xs space-y-6 rounded-xl bg-white">
              <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchRefInput}
                    onChange={(e) => setSearchRefInput(e.target.value)}
                    placeholder="Enter Request Reference (e.g. AT-0001, AT-0002)"
                    className="w-full h-11 px-3.5 pl-10 border border-black/30 rounded-lg text-black text-[10px] font-medium uppercase tracking-wider placeholder:normal-case placeholder:text-black/40 outline-none focus:border-[#1E6FD9] focus:ring-1 focus:ring-[#1E6FD9]"
                  />
                  <IconSearch
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/50"
                  />
                </div>
                <Button type="submit" variant="primary" className="h-11 px-6 text-[10px] font-bold">
                  Look Up Status
                </Button>
              </form>

              {/* Quick Specimen Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 text-black/60 pt-1">
                <span className="font-medium">Try Sample Requests:</span>
                {Object.keys(SPECIMEN_REQUESTS).map((refKey) => (
                  <button
                    key={refKey}
                    type="button"
                    onClick={() => {
                      setSearchRefInput(refKey);
                      setTrackedRequest(SPECIMEN_REQUESTS[refKey]);
                      setTrackerMessage(null);
                    }}
                    className={`px-2.5 py-1 rounded-md border text-[10px] font-bold cursor-pointer transition-colors ${
                      searchRefInput === refKey
                        ? 'border-[#1E6FD9] bg-[#F0F6FD] text-[#1E6FD9]'
                        : 'border-black/20 hover:border-black text-black'
                    }`}
                  >
                    {refKey} ({SPECIMEN_REQUESTS[refKey].issue.slice(0, 20)}...)
                  </button>
                ))}
              </div>

              {trackerMessage && (
                <div className="p-3.5 border border-black/20 rounded-lg text-black/80 font-medium">
                  {trackerMessage}
                </div>
              )}

              {trackedRequest && (
                <div className="border border-black/15 rounded-xl p-5 sm:p-6 bg-white space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-black uppercase tracking-wider">
                          {trackedRequest.ref}
                        </span>
                        <Badge
                          variant={trackedRequest.urgency === 'high' ? 'black' : 'blue'}
                          className="text-[10px] uppercase font-bold px-3 py-1"
                        >
                          Urgency: {trackedRequest.urgency}
                        </Badge>
                      </div>
                      <span className="text-black/60 font-medium block mt-1">
                        Barangay {trackedRequest.barangay} · {trackedRequest.issue}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-black uppercase tracking-wider block">
                        Status: {trackedRequest.status.replace('_', ' ')}
                      </span>
                      <span className="text-black/60 font-medium block mt-0.5">
                        Updated {trackedRequest.updatedAt}
                      </span>
                    </div>
                  </div>

                  {/* 4-Stage Lifecycle Indicator */}
                  <div className="space-y-2.5">
                    <span className="font-bold text-black uppercase tracking-wider block">
                      Transparent Resolution Lifecycle
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { key: 'submitted', label: '1. Submitted' },
                        { key: 'assigned', label: '2. Assigned' },
                        { key: 'in_progress', label: '3. In Progress' },
                        { key: 'resolved', label: '4. Resolved' },
                      ].map((step, idx) => {
                        const stages = ['submitted', 'assigned', 'in_progress', 'resolved'];
                        const currentIdx = stages.indexOf(trackedRequest.status);
                        const isComplete = currentIdx >= idx;
                        const isCurrent = currentIdx === idx;

                        return (
                          <div
                            key={step.key}
                            className={`p-2.5 rounded-lg border text-center transition-colors ${
                              isCurrent
                                ? 'border-[#1E6FD9] bg-[#F0F6FD] text-[#1E6FD9] font-bold'
                                : isComplete
                                ? 'border-black bg-black text-white font-medium'
                                : 'border-black/15 text-black/40 font-normal'
                            }`}
                          >
                            <span className="block text-[10px]">{step.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Details & Field Technician Remarks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2 text-black/80">
                    <div className="border border-black/10 rounded-lg p-3.5 bg-white">
                      <span className="text-black/50 block font-medium">Assigned Field Unit</span>
                      <span className="font-bold text-black block mt-1">
                        {trackedRequest.technician}
                      </span>
                    </div>
                    <div className="border border-black/10 rounded-lg p-3.5 bg-white">
                      <span className="text-black/50 block font-medium">Latest Field Technician Remarks</span>
                      <span className="font-normal text-black block mt-1 leading-relaxed">
                        {trackedRequest.remarks || 'Pending inspection.'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </section>

      {/* Public Interruption Advisories Bulletin */}
      <section id="advisories" className="py-20 sm:py-24 lg:py-28 border-b border-black/15 bg-white">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-2">
              <span className="font-bold text-[#1E6FD9] uppercase tracking-wider block">
                Water Service Bulletin
              </span>
              <h2 className="text-black font-bold uppercase tracking-wider text-[10px]">
                Current Interruptions & Advisories
              </h2>
              <p className="text-black/70 font-normal leading-relaxed max-w-2xl">
                Official notices broadcasted to Sinacaban households to ensure preparedness for scheduled repairs.
              </p>
            </div>

            <Link to="/login">
              <Button variant="secondary" className="h-9 px-4 text-[10px] font-bold self-start sm:self-auto">
                Sign In to View Barangay Calendar
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {activeAdvisories.map((advisory) => (
              <Card
                key={advisory.id}
                className="p-6 sm:p-7 border-black/20 hover:border-[#1E6FD9] transition-all space-y-4 bg-white rounded-xl"
              >
                <div className="flex items-center justify-between border-b border-black/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <IconAlertTriangle size={16} className="text-[#1E6FD9]" />
                    <span className="font-bold uppercase tracking-wider text-black">
                      {advisory.type}
                    </span>
                  </div>
                  <Badge variant="blue" className="text-[10px]">
                    SIWASS Broadcast
                  </Badge>
                </div>

                <h3 className="font-bold text-black uppercase tracking-wider leading-relaxed">
                  {advisory.title}
                </h3>

                <div className="space-y-1.5 text-black/70">
                  <div className="flex items-center gap-2">
                    <IconClock size={14} className="text-black/50" />
                    <span className="font-medium text-black">Window:</span> {advisory.timeWindow}
                  </div>
                  <div className="flex items-center gap-2">
                    <IconMapPin size={14} className="text-black/50" />
                    <span className="font-medium text-black">Affected Zones:</span>{' '}
                    {advisory.barangays.join(', ')}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-black/10 bg-[#F0F6FD] text-black/80 font-normal leading-relaxed">
                  Households in affected areas are advised to store sufficient potable water prior to scheduled work. Field crews will expedite line reconnection.
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Barangay Coverage Section */}
      <section id="coverage" className="py-20 sm:py-24 lg:py-28 border-b border-black/15 bg-white">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-2.5">
            <span className="font-bold text-[#1E6FD9] uppercase tracking-wider block">
              Municipal Territory
            </span>
            <h2 className="text-black font-bold uppercase tracking-wider text-[10px]">
              Sinacaban Barangay Utility Coverage
            </h2>
            <p className="text-black/70 font-normal leading-relaxed">
              AquaTrack services all 19 official barangays across the Municipality of Sinacaban, Misamis Occidental.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center justify-center gap-2.5 flex-wrap pb-2">
            <button
              onClick={() => setSelectedBarangay('All')}
              className={`px-4 py-1.5 rounded-full border text-[10px] font-bold cursor-pointer transition-colors ${
                selectedBarangay === 'All'
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-black/20 hover:border-black'
              }`}
            >
              All 19 Barangays
            </button>
            <button
              onClick={() => setSelectedBarangay('Poblacion')}
              className={`px-4 py-1.5 rounded-full border text-[10px] font-bold cursor-pointer transition-colors ${
                selectedBarangay === 'Poblacion'
                  ? 'bg-[#1E6FD9] text-white border-[#1E6FD9]'
                  : 'bg-white text-black border-black/20 hover:border-black'
              }`}
            >
              Poblacion (Town Center)
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {displayedBarangays
              .filter((name) =>
                selectedBarangay === 'All' ? true : name.toLowerCase().includes(selectedBarangay.toLowerCase())
              )
              .map((bName) => (
                <div
                  key={bName}
                  className="p-4 border border-black/15 rounded-xl bg-white hover:border-[#1E6FD9] transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-black uppercase tracking-wider">
                      {bName}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1E6FD9]" />
                  </div>
                  <div className="mt-4 pt-2.5 border-t border-black/10 flex items-center justify-between text-black/60 font-medium">
                    <span>Meter Network</span>
                    <span className="text-[#1E6FD9] font-bold">Active</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Gateway Portals Selector */}
      <section id="gateways" className="py-20 sm:py-24 lg:py-28 border-b border-black/15 bg-white">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-2.5">
            <span className="font-bold text-[#1E6FD9] uppercase tracking-wider block">
              Institutional Access Gateways
            </span>
            <h2 className="text-black font-bold uppercase tracking-wider text-[10px]">
              Choose Your Access Portal
            </h2>
            <p className="text-black/70 font-normal leading-relaxed">
              Direct access point for consumers, field technicians, and municipal system administrators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Gateway 1: Customer */}
            <Card className="p-7 sm:p-8 border-black/20 hover:border-[#1E6FD9] transition-all flex flex-col justify-between space-y-6 bg-white rounded-xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-[#1E6FD9] text-white flex items-center justify-center font-bold">
                    <IconUser size={20} />
                  </div>
                  <Badge variant="blue" className="text-[10px]">
                    Citizen Portal
                  </Badge>
                </div>
                <h3 className="font-bold text-black uppercase tracking-wider">
                  Household Consumer Portal
                </h3>
                <p className="text-black/70 font-normal leading-relaxed">
                  For registered Sinacaban water consumers. Review official monthly billing statements, check meter details, submit service leak reports, and track repair tickets.
                </p>
                <div className="space-y-1.5 pt-1 text-black/80 font-medium">
                  <div className="flex items-center gap-2">
                    <IconCheck size={13} className="text-[#1E6FD9]" />
                    <span>View Published Monthly Bills</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconCheck size={13} className="text-[#1E6FD9]" />
                    <span>Report Leaks & Low Pressure</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconCheck size={13} className="text-[#1E6FD9]" />
                    <span>Receive SMS Advisories</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-5 border-t border-black/10">
                <Link to="/login" className="block">
                  <Button variant="primary" className="w-full h-9 text-[10px] font-bold">
                    Sign In to Consumer Account
                  </Button>
                </Link>
                <Link to="/register" className="block">
                  <Button variant="secondary" className="w-full h-9 text-[10px] font-bold">
                    Register New Connection
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Gateway 2: Staff */}
            <Card className="p-7 sm:p-8 border-black/20 hover:border-[#1E6FD9] transition-all flex flex-col justify-between space-y-6 bg-white rounded-xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center font-bold">
                    <IconTools size={20} />
                  </div>
                  <Badge variant="black" className="text-[10px]">
                    Field Operations
                  </Badge>
                </div>
                <h3 className="font-bold text-black uppercase tracking-wider">
                  Field Staff & Technician Portal
                </h3>
                <p className="text-black/70 font-normal leading-relaxed">
                  For authorized SIWASS maintenance technicians and meter inspectors. Manage assigned work orders, update task statuses to In Progress or Resolved, and inspect QR meter tags.
                </p>
                <div className="space-y-1.5 pt-1 text-black/80 font-medium">
                  <div className="flex items-center gap-2">
                    <IconCheck size={13} className="text-[#1E6FD9]" />
                    <span>Task Dispatch & Work Orders</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconCheck size={13} className="text-[#1E6FD9]" />
                    <span>QR Meter Token Scanner</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconCheck size={13} className="text-[#1E6FD9]" />
                    <span>Offline Sync & Inspection Log</span>
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-black/10">
                <Link to="/login" className="block">
                  <Button variant="secondary" className="w-full h-9 text-[10px] font-bold">
                    Technician Sign In
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Gateway 3: Admin */}
            <Card className="p-7 sm:p-8 border-black/20 hover:border-[#1E6FD9] transition-all flex flex-col justify-between space-y-6 bg-white rounded-xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-[#1E6FD9] text-white flex items-center justify-center font-bold">
                    <IconBuilding size={20} />
                  </div>
                  <Badge variant="blue" className="text-[10px]">
                    Administration
                  </Badge>
                </div>
                <h3 className="font-bold text-black uppercase tracking-wider">
                  Municipal Administrator Gateway
                </h3>
                <p className="text-black/70 font-normal leading-relaxed">
                  For Municipal Water Works administrative supervisors. Review citizen applicant verifications, assign inventory meters, dispatch technicians, and manage billing CSV imports.
                </p>
                <div className="space-y-1.5 pt-1 text-black/80 font-medium">
                  <div className="flex items-center gap-2">
                    <IconCheck size={13} className="text-[#1E6FD9]" />
                    <span>Citizen Verification Queue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconCheck size={13} className="text-[#1E6FD9]" />
                    <span>Monthly Billing Import & Lock</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconCheck size={13} className="text-[#1E6FD9]" />
                    <span>Barangay Advisory Broadcasts</span>
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-black/10">
                <Link to="/login" className="block">
                  <Button variant="secondary" className="w-full h-9 text-[10px] font-bold">
                    Administrative Gateway Sign In
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Office & Support Contact Information */}
      <section id="contact" className="py-20 sm:py-24 lg:py-28 border-b border-black/15 bg-white">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-5 space-y-4">
              <span className="font-bold text-[#1E6FD9] uppercase tracking-wider block">
                Municipal Water Works Office
              </span>
              <h2 className="text-black font-bold uppercase tracking-wider text-[10px]">
                Sinacaban Water Works System (SIWASS)
              </h2>
              <p className="text-black/70 font-normal leading-relaxed">
                The official public water utility office of the Local Government Unit (LGU) of Sinacaban. Operating under municipal mandate to deliver clean, potable, and continuous water to all households.
              </p>

              <div className="space-y-3 pt-3 text-black/80">
                <div className="flex items-start gap-3">
                  <IconMapPin size={16} className="text-[#1E6FD9] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-black block">Office Location</span>
                    <span>Ground Floor, Sinacaban Municipal Hall, Misamis Occidental, Philippines 7203</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <IconClock size={16} className="text-[#1E6FD9] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-black block">Operating Hours</span>
                    <span>Monday to Friday · 8:00 AM – 5:00 PM (PST)</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <IconPhone size={16} className="text-[#1E6FD9] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-black block">Emergency Hotline & SMS Dispatch</span>
                    <span>Landline: (088) 521-1200 · SMS Support: +63 917 123 4567</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <Card className="p-7 sm:p-8 border-black/20 shadow-xs bg-white space-y-5 rounded-xl">
                <h3 className="font-bold text-black uppercase tracking-wider border-b border-black/10 pb-3">
                  Frequently Asked Questions (Citizen Water Guide)
                </h3>

                <div className="space-y-4">
                  <div className="border border-black/10 rounded-lg p-4">
                    <h4 className="font-bold text-black uppercase tracking-wider">
                      How long does it take for a new connection to be verified?
                    </h4>
                    <p className="text-black/70 font-normal mt-1.5 leading-relaxed">
                      Upon completing the 2-step online registration with your location coordinates, SIWASS administrators inspect and link an available water meter from inventory within 1–2 business days. You will receive an SMS notification once approved.
                    </p>
                  </div>

                  <div className="border border-black/10 rounded-lg p-4">
                    <h4 className="font-bold text-black uppercase tracking-wider">
                      Where can I settle my water bill payments?
                    </h4>
                    <p className="text-black/70 font-normal mt-1.5 leading-relaxed">
                      In accordance with municipal audit standards, official payments are accepted at the Sinacaban Municipal Treasury Office (Ground Floor, Municipal Hall). Present your official account number or statement from the portal.
                    </p>
                  </div>

                  <div className="border border-black/10 rounded-lg p-4">
                    <h4 className="font-bold text-black uppercase tracking-wider">
                      What should I do during an unannounced service interruption?
                    </h4>
                    <p className="text-black/70 font-normal mt-1.5 leading-relaxed">
                      Check the live advisories section on this page or sign in to your consumer account to report a line disruption. Our emergency technicians will receive automated incident logs for immediate dispatch.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Institutional Municipal Footer */}
      <footer className="bg-white border-t border-black/15 py-12 mt-auto">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-black/10 pb-8">
            <div className="flex items-center gap-3">
              <div className="h-7 px-2.5 flex items-center justify-center rounded-lg bg-[#1E6FD9] text-white font-bold tracking-wider uppercase text-[10px]">
                AquaTrack
              </div>
              <span className="font-bold uppercase tracking-wider text-black">
                Sinacaban Water Works System (SIWASS)
              </span>
            </div>

            <div className="flex items-center gap-6 text-black/70 font-medium flex-wrap">
              <Link to="/login" className="hover:text-[#1E6FD9]">
                Sign In
              </Link>
              <span>·</span>
              <Link to="/register" className="hover:text-[#1E6FD9]">
                Register
              </Link>
              <span>·</span>
              <a href="#services" className="hover:text-[#1E6FD9]">
                Services
              </a>
              <span>·</span>
              <a href="#tracker" className="hover:text-[#1E6FD9]">
                Request Tracking
              </a>
              <span>·</span>
              <a href="#contact" className="hover:text-[#1E6FD9]">
                Support
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-black/60 font-medium text-[10px]">
            <div>
              © 2026 Municipality of Sinacaban, Misamis Occidental. Republic of the Philippines. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <span>Standard Municipal Public Utility Portal</span>
              <span>·</span>
              <span>System Version 1.0 (Vite / React 19)</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingView;
