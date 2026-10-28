import { useState } from 'react';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { IconShieldCheck, IconX, IconFileText, IconLock } from '@tabler/icons-react';

export interface TermsPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  version?: string;
  acceptedAt?: string;
}

export function TermsPrivacyModal({
  isOpen,
  onClose,
  version = 'v1.0.0',
  acceptedAt = 'October 2026 (Registration)',
}: TermsPrivacyModalProps) {
  const [activeDoc, setActiveDoc] = useState<'terms' | 'privacy'>('terms');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-hero-entrance">
      <div className="w-full max-w-lg bg-white rounded-xl border border-black/20 p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] max-h-[85vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-black/10 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <IconShieldCheck size={20} className="text-brand-blue" />
            <div>
              <h2 className="font-bold text-[15px] text-black">
                AquaTrack Legal Documents
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-black/60">
                <span>Version: <strong className="font-mono text-black">{version}</strong></span>
                <span>•</span>
                <span>Accepted: <strong className="text-black">{acceptedAt}</strong></span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-black/50 hover:text-black p-1 rounded-md hover:bg-black/5 cursor-pointer"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-black/5 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setActiveDoc('terms')}
            className={`py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeDoc === 'terms'
                ? 'bg-white text-black shadow-sm'
                : 'text-black/60 hover:text-black'
            }`}
          >
            <IconFileText size={14} />
            <span>Terms of Use</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDoc('privacy')}
            className={`py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeDoc === 'privacy'
                ? 'bg-white text-black shadow-sm'
                : 'text-black/60 hover:text-black'
            }`}
          >
            <IconLock size={14} />
            <span>Privacy Notice</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-3 text-xs text-black/75 pr-1 leading-relaxed">
          {activeDoc === 'terms' ? (
            <div className="space-y-3">
              <div className="p-2.5 bg-blue-50 border border-brand-blue/20 rounded-lg text-black font-medium flex items-center justify-between">
                <span>Terms of Use</span>
                <Badge variant="blue">Accepted ({version})</Badge>
              </div>
              <p>
                Welcome to AquaTrack, the official digital water utility management and customer service portal of the Sinacaban Water Supply System (SIWASS), Municipality of Sinacaban, Misamis Occidental.
              </p>
              <h4 className="font-bold text-black text-[13px] pt-1">1. User Accounts and Verification</h4>
              <p>
                Customer accounts are verified against official SIWASS office records. Meter numbers and registered barangays are permanently tied to service connections to determine maintenance jurisdiction and water interruption advisories. Corrections must be handled directly at the SIWASS municipal office.
              </p>
              <h4 className="font-bold text-black text-[13px] pt-1">2. Password Security and Inactive Sessions</h4>
              <p>
                Users are responsible for safeguarding access credentials. Changing your account password automatically revokes and signs out all other active sessions across devices.
              </p>
              <h4 className="font-bold text-black text-[13px] pt-1">3. Utility Policies and Account Inactivity</h4>
              <p>
                Online customer accounts cannot be self-deleted or deactivated online. Disconnections, line transfers, and account closures are handled by authorized personnel at the municipal office.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-2.5 bg-blue-50 border border-brand-blue/20 rounded-lg text-black font-medium flex items-center justify-between">
                <span>Privacy Notice</span>
                <Badge variant="blue">Accepted ({version})</Badge>
              </div>
              <p>
                The Sinacaban Water Supply System is committed to protecting your personal data in compliance with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173).
              </p>
              <h4 className="font-bold text-black text-[13px] pt-1">1. Information We Collect</h4>
              <p>
                We collect personal information necessary for water service delivery, including your name, registered mobile number, email address, service address, meter number, and home location coordinates.
              </p>
              <h4 className="font-bold text-black text-[13px] pt-1">2. Purpose of Data Processing</h4>
              <p>
                Your information is used exclusively for service request routing, billing balance statements, emergency water interruption advisories, and system security verification. We never sell or share customer data with commercial third parties.
              </p>
              <h4 className="font-bold text-black text-[13px] pt-1">3. Activity Logs and Verification Data</h4>
              <p>
                Account modifications, legal consents, and security events are logged in an append-only audit trail without storing passwords, SMS PINs, or reset tokens.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-black/10 pt-3 flex justify-end shrink-0">
          <Button variant="secondary" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
