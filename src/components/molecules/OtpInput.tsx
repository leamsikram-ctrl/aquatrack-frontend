import React, { useEffect, useRef, useState } from 'react';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  error?: string | null;
  onResend?: () => void;
  resendCooldown?: number;
  autoFocus?: boolean;
  id?: string;
  name?: string;
  className?: string;
}

export function OtpInput({
  value = '',
  onChange,
  length = 6,
  disabled = false,
  error = null,
  onResend,
  resendCooldown = 30,
  autoFocus = false,
  id = 'otp-input',
  name = 'otp',
  className = '',
}: OtpInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [countdown, setCountdown] = useState(resendCooldown);

  // Manage 30-second resend countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const sanitized = rawVal.replace(/\D/g, '').slice(0, length);
    onChange(sanitized);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    const sanitized = pasteData.replace(/\D/g, '').slice(0, length);
    if (sanitized) {
      onChange(sanitized);
    }
  };

  const handleResendClick = () => {
    if (countdown > 0 || disabled || !onResend) return;
    setCountdown(resendCooldown);
    onResend();
  };

  const focusInput = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  };

  const digits = value.split('');
  const activeIndex = Math.min(digits.length, length - 1);

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Visual Boxes Container with Single Invisible Overlay Input */}
      <div
        className="relative flex items-center justify-center gap-2 sm:gap-3 cursor-pointer select-none"
        onClick={focusInput}
      >
        {/* The single underlying input with autofill and numeric keypad support */}
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          maxLength={length}
          value={value}
          onChange={handleInputChange}
          onPaste={handlePaste}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-label="6-digit verification code"
          aria-invalid={Boolean(error)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />

        {/* 6 Individual Display Boxes */}
        {Array.from({ length }).map((_, index) => {
          const char = digits[index] || '';
          const isCurrent = isFocused && index === (char ? index : activeIndex);
          const hasError = Boolean(error);

          let borderClass = 'border-black/20 hover:border-black/40';
          let bgClass = 'bg-white';
          let textClass = 'text-black';

          if (hasError) {
            borderClass = 'border-urgency-high bg-red-50/40 text-urgency-high';
          } else if (isCurrent) {
            borderClass = 'border-brand-blue ring-2 ring-brand-blue/20 bg-blue-50/30';
          } else if (char) {
            borderClass = 'border-black/40 bg-white';
          }

          return (
            <div
              key={index}
              data-testid={`otp-box-${index}`}
              className={`w-11 h-12 sm:w-12 sm:h-14 rounded-lg border-2 flex items-center justify-center font-mono font-bold text-xl sm:text-2xl transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.06)] ${borderClass} ${bgClass} ${textClass}`}
            >
              {char ? (
                char
              ) : isCurrent ? (
                <span className="w-0.5 h-6 bg-brand-blue animate-pulse" />
              ) : (
                <span className="text-black/20 font-normal">·</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Error Message (Retains entered code) */}
      {error && (
        <div
          role="alert"
          className="text-xs text-urgency-high font-medium flex items-center justify-center gap-1.5 pt-1"
        >
          <IconAlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Resend Action with 30-Second Countdown */}
      {onResend && (
        <div className="flex items-center justify-between pt-1 text-xs text-black/60 px-1">
          <span>Didn't receive the pin?</span>
          {countdown > 0 ? (
            <span className="font-medium text-black/50">
              Resend in <strong className="font-mono text-black">{countdown}s</strong>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResendClick}
              disabled={disabled}
              className="text-brand-blue hover:underline font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <IconRefresh size={13} />
              <span>Resend PIN</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

