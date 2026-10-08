import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { adminApi, type MeterTagData } from '../../api';
import type { User } from '../../types';
import {
  IconQrcode,
  IconPrinter,
  IconDownload,
  IconRotate,
  IconCopy,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconDroplet,
} from '@tabler/icons-react';

interface Props {
  customer: User;
  onClose: () => void;
}

export function MeterTagModal({ customer, onClose }: Props) {
  const [tagData, setTagData] = useState<MeterTagData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Fetch meter tag payload from backend
  const loadMeterTag = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await adminApi.meterTag(customer.id);
      setTagData(data);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setErrorMessage(
        errorObj?.response?.data?.message ||
          'No physical water meter is currently assigned to this customer account.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMeterTag();
  }, [customer.id]);

  // Render QR Code onto canvas whenever tagData changes
  useEffect(() => {
    if (tagData?.qr_token && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        tagData.qr_token,
        {
          width: 200,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'H',
        },
        (error) => {
          if (error) console.error('Error generating QR code:', error);
        }
      );
    }
  }, [tagData]);

  // Copy token to clipboard
  const handleCopyToken = () => {
    if (!tagData?.qr_token) return;
    navigator.clipboard.writeText(tagData.qr_token);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Rotate / Regenerate QR Token
  const handleRegenerateToken = async () => {
    if (!tagData?.meter_id) return;
    if (!window.confirm('Are you sure you want to rotate this meter QR token? Existing printed tags will become inactive.')) {
      return;
    }

    setIsRotating(true);
    try {
      const res = await adminApi.regenerateMeterQr(tagData.meter_id);
      setTagData((prev) => (prev ? { ...prev, qr_token: res.meter.qr_token } : null));
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      alert(errorObj?.response?.data?.message || 'Failed to rotate QR token.');
    } finally {
      setIsRotating(false);
    }
  };

  // Download QR Code as PNG file
  const handleDownloadQr = () => {
    if (!canvasRef.current || !tagData) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `AquaTrack-QR-${tagData.meter_number}-${tagData.account_number}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Trigger Browser Print Dialog
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-lg border border-black p-5 space-y-4 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-black/15 pb-2">
          <div className="flex items-center gap-2">
            <IconQrcode size={18} className="text-[#1E6FD9]" />
            <h2 className="font-bold text-black uppercase tracking-wider text-[14px]">
              Meter Tag & QR Code Generator
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-black hover:text-[#1E6FD9] p-1 font-bold"
            title="Close"
          >
            <IconX size={16} />
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-12 text-center space-y-2 text-black/60">
            <div className="w-6 h-6 border-2 border-[#1E6FD9] border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Generating hardware meter tag...</p>
          </div>
        )}

        {/* Error / No Meter State */}
        {!isLoading && errorMessage && (
          <div className="p-4 bg-[#FFF2F2] border border-black/30 rounded-lg space-y-3 text-black">
            <div className="flex items-center gap-2 font-bold text-black">
              <IconAlertCircle size={18} className="text-black" />
              <span>Unassigned Water Meter</span>
            </div>
            <p className="text-[14px] text-black/80">{errorMessage}</p>
            <div className="text-[12px] text-black/60">
              Go to the <strong>Customer Verifications</strong> queue to assign an active Sinacaban water meter to this customer first.
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}

        {/* Printable Meter Tag Preview */}
        {!isLoading && tagData && (
          <div className="space-y-4">
            {/* The Physical Meter Tag (This prints cleanly via @media print) */}
            <div
              id="aquatrack-meter-tag-print-area"
              className="bg-white border-2 border-black rounded-xl p-4 shadow-sm flex flex-col items-center max-w-[340px] mx-auto text-black"
            >
              {/* Tag Header */}
              <div className="w-full flex items-center justify-between border-b border-black/15 pb-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-[#1E6FD9] text-white flex items-center justify-center font-bold text-[10px]">
                    <IconDroplet size={12} />
                  </div>
                  <div className="text-left leading-tight">
                    <span className="font-bold text-[10px] text-black uppercase tracking-wider block">
                      LGU Sinacaban
                    </span>
                    <span className="font-extrabold text-[11px] text-[#1E6FD9] uppercase block">
                      AquaTrack Meter Tag
                    </span>
                  </div>
                </div>
                <Badge variant="blue" className="text-[10px] py-0.5 px-1.5 uppercase">
                  {tagData.meter_status}
                </Badge>
              </div>

              {/* QR Code Container */}
              <div className="p-2 bg-white border-2 border-[#1E6FD9] rounded-lg my-1 flex flex-col items-center justify-center shadow-inner">
                <canvas ref={canvasRef} className="block" />
                <span className="text-[10px] font-mono font-bold text-black/70 tracking-widest mt-1">
                  TOKEN: {tagData.qr_token.substring(0, 16)}...
                </span>
              </div>

              {/* Tag Metadata Table */}
              <table className="w-full text-[12px] border-collapse my-2">
                <tbody>
                  <tr className="border-b border-dashed border-black/15">
                    <td className="py-1 text-black/60 font-medium">Customer:</td>
                    <td className="py-1 font-bold text-right text-black">{tagData.customer_name}</td>
                  </tr>
                  <tr className="border-b border-dashed border-black/15">
                    <td className="py-1 text-black/60 font-medium">Account No:</td>
                    <td className="py-1 font-mono font-bold text-right text-[#1E6FD9]">{tagData.account_number}</td>
                  </tr>
                  <tr className="border-b border-dashed border-black/15">
                    <td className="py-1 text-black/60 font-medium">Meter Serial:</td>
                    <td className="py-1 font-mono font-bold text-right text-black">{tagData.meter_number}</td>
                  </tr>
                  <tr className="border-b border-dashed border-black/15">
                    <td className="py-1 text-black/60 font-medium">Barangay:</td>
                    <td className="py-1 font-bold text-right text-black">{tagData.barangay}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-black/60 font-medium">Issued Date:</td>
                    <td className="py-1 font-mono text-right text-black/80">{tagData.verified_at}</td>
                  </tr>
                </tbody>
              </table>

              {/* Tag Footer Warning */}
              <div className="w-full bg-[#F0F6FD] border border-[#1E6FD9]/30 rounded p-1.5 text-center text-[10px] text-[#1E6FD9] font-bold leading-tight">
                Official Utility Property · Scan with AquaTrack Staff App
              </div>
            </div>

            {/* Action Bar (Buttons) */}
            <div className="space-y-2 pt-2 border-t border-black/15">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <Button variant="primary" onClick={handlePrint} className="w-full text-[12px]">
                  <IconPrinter size={14} className="mr-1 inline" /> Print Tag
                </Button>
                <Button variant="secondary" onClick={handleDownloadQr} className="w-full text-[12px]">
                  <IconDownload size={14} className="mr-1 inline" /> Save QR (.png)
                </Button>
                <Button variant="ghost" onClick={handleCopyToken} className="w-full text-[12px]">
                  {isCopied ? (
                    <>
                      <IconCheck size={14} className="mr-1 inline text-[#1E6FD9]" /> Copied
                    </>
                  ) : (
                    <>
                      <IconCopy size={14} className="mr-1 inline" /> Copy Token
                    </>
                  )}
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleRegenerateToken}
                  disabled={isRotating}
                  className="text-[12px] font-bold text-black/60 hover:text-black hover:underline flex items-center gap-1"
                >
                  <IconRotate size={12} className={isRotating ? 'animate-spin' : ''} />
                  {isRotating ? 'Rotating...' : 'Rotate Token / Invalidate Old Tag'}
                </button>

                <Button variant="secondary" onClick={onClose} className="text-[12px]">
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
