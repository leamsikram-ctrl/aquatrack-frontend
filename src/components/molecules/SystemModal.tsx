import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  IconInfoCircle,
  IconCheck,
  IconAlertTriangle,
  IconAlertCircle,
  IconX,
  IconCopy,
  IconHelpCircle,
} from '@tabler/icons-react';
import { Button } from '../atoms/Button';

export type SystemModalType = 'info' | 'success' | 'warning' | 'error' | 'confirm' | 'credentials';

export interface SystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: SystemModalType;
  title: string;
  message?: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  isLoading?: boolean;
  isDestructive?: boolean;
  // Optional credential payload for user temporary password or credentials presentation
  credentials?: {
    userName: string;
    loginIdentifier: string;
    tempPassword?: string;
    meterNumber?: string;
    accountNumber?: string;
  };
  details?: { label: string; value: string }[];
}

export const SystemModal: React.FC<SystemModalProps> = ({
  isOpen,
  onClose,
  type = 'info',
  title,
  message,
  confirmText,
  cancelText = 'Cancel',
  onConfirm,
  isLoading = false,
  isDestructive = false,
  credentials,
  details,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const isConfirmation = type === 'confirm' || Boolean(onConfirm);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <IconCheck size={22} className="text-emerald-600" stroke={2.5} />;
      case 'error':
        return <IconAlertCircle size={22} className="text-rose-600" stroke={2.2} />;
      case 'warning':
        return <IconAlertTriangle size={22} className="text-amber-600" stroke={2.2} />;
      case 'credentials':
        return <IconCheck size={22} className="text-[#1E6FD9]" stroke={2.5} />;
      case 'confirm':
        return <IconHelpCircle size={22} className={isDestructive ? 'text-rose-600' : 'text-[#1E6FD9]'} stroke={2.2} />;
      case 'info':
      default:
        return <IconInfoCircle size={22} className="text-[#1E6FD9]" stroke={2.2} />;
    }
  };

  const getIconBadgeBg = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-200';
      case 'error':
        return 'bg-rose-50 border-rose-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'credentials':
        return 'bg-blue-50 border-blue-200';
      case 'confirm':
        return isDestructive ? 'bg-rose-50 border-rose-200' : 'bg-blue-50 border-blue-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const handleCopyCredentials = () => {
    if (!credentials) return;
    const parts = [
      `AquaTrack Credentials:`,
      `User: ${credentials.userName}`,
      `Login: ${credentials.loginIdentifier}`,
      credentials.tempPassword ? `Temporary Password: ${credentials.tempPassword}` : null,
      credentials.accountNumber ? `Account #: ${credentials.accountNumber}` : null,
      credentials.meterNumber ? `Meter #: ${credentials.meterNumber}` : null,
      `Portal: ${window.location.origin}/login`,
    ].filter(Boolean);

    navigator.clipboard.writeText(parts.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity duration-200 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-[0_20px_45px_rgba(0,0,0,0.22)] border border-black/15 overflow-hidden transition-all transform duration-200 scale-100 animate-scaleUp">
        {/* Modal Header */}
        <div className="px-5 pt-5 pb-3 flex items-start gap-3.5">
          <div className={`p-2 rounded-xl border shrink-0 ${getIconBadgeBg()}`}>
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="text-base font-bold text-black tracking-tight leading-snug">
              {title}
            </h3>
            {message && (
              <div className="text-[13px] text-black/75 mt-1 leading-relaxed">
                {message}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-black/40 hover:text-black rounded-lg hover:bg-black/5 transition-colors cursor-pointer shrink-0 -mr-1"
            title="Close dialog"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Credentials Card (if provided) */}
        {credentials && (
          <div className="mx-5 my-2 p-3.5 bg-slate-50 border border-black/15 rounded-lg space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-black/5">
              <span className="text-black/60 font-medium">Account Name:</span>
              <span className="font-bold text-black">{credentials.userName}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-black/5">
              <span className="text-black/60 font-medium">Login Identifier:</span>
              <span className="font-mono font-bold text-black">{credentials.loginIdentifier}</span>
            </div>
            {credentials.tempPassword && (
              <div className="flex justify-between items-center py-1 border-b border-black/5">
                <span className="text-black/60 font-medium">Temporary Password:</span>
                <span className="font-mono font-bold text-[#1E6FD9] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {credentials.tempPassword}
                </span>
              </div>
            )}
            {credentials.meterNumber && (
              <div className="flex justify-between items-center py-1 border-b border-black/5">
                <span className="text-black/60 font-medium">Meter Number:</span>
                <span className="font-mono font-semibold text-black">{credentials.meterNumber}</span>
              </div>
            )}
            {credentials.accountNumber && (
              <div className="flex justify-between items-center py-1">
                <span className="text-black/60 font-medium">Account Number:</span>
                <span className="font-mono font-semibold text-black">{credentials.accountNumber}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleCopyCredentials}
              className="w-full mt-2 py-1.5 px-3 rounded-lg border border-black/20 bg-white hover:bg-slate-100 text-black font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <IconCopy size={14} className="text-[#1E6FD9]" />
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Login Credentials'}</span>
            </button>
          </div>
        )}

        {/* Key-Value Details list (if provided) */}
        {details && details.length > 0 && (
          <div className="mx-5 my-2 p-3 bg-slate-50 border border-black/10 rounded-lg space-y-1.5 text-xs">
            {details.map((d, i) => (
              <div key={i} className="flex justify-between items-center py-0.5 border-b border-black/5 last:border-b-0">
                <span className="text-black/60 font-medium">{d.label}:</span>
                <span className="font-semibold text-black">{d.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="px-5 py-3.5 bg-slate-50/80 border-t border-black/10 flex items-center justify-end gap-2">
          {isConfirmation ? (
            <>
              <Button
                variant="secondary"
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="text-xs font-semibold px-4 py-1.5"
              >
                {cancelText}
              </Button>
              <Button
                variant={isDestructive ? 'primary' : 'primary'}
                type="button"
                onClick={async () => {
                  if (onConfirm) {
                    await onConfirm();
                  }
                }}
                disabled={isLoading}
                className={`text-xs font-semibold px-4 py-1.5 flex items-center gap-1.5 ${
                  isDestructive ? '!bg-rose-600 hover:!bg-rose-700 !border-rose-700 text-white' : ''
                }`}
              >
                {isLoading ? 'Processing...' : (confirmText || 'Confirm')}
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              type="button"
              onClick={onClose}
              className="text-xs font-semibold px-5 py-1.5"
            >
              {confirmText || 'Got it'}
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

