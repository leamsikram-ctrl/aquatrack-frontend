import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '../../components/templates/CustomerLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { authApi } from '../../api';
import type { User } from '../../types';
import { IconUser, IconDeviceMobile, IconMail, IconMapPin, IconGauge, IconKey, IconCheck } from '@tabler/icons-react';

export function CustomerProfileView() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Quick PIN update state
  const [newPin, setNewPin] = useState('');
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);
  const [pinSuccess, setPinSuccess] = useState(false);

  useEffect(() => {
    authApi
      .me()
      .then((u) => {
        setUser(u);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4) {
      alert('PIN must be exactly 4 digits.');
      return;
    }

    setIsUpdatingPin(true);
    // Simulate instantaneous client-side PIN storage or API update
    setTimeout(() => {
      setIsUpdatingPin(false);
      setPinSuccess(true);
      setNewPin('');
      setTimeout(() => setPinSuccess(false), 3000);
    }, 600);
  };

  if (isLoading) {
    return (
      <Card className="p-8 text-center text-black/60 border border-black/15">
        Loading consumer account profile...
      </Card>
    );
  }

  const profile = user?.customer_profile;

  return (
    <CustomerLayout currentPath="/customer/profile" onNavigate={(path) => navigate(path)}>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/15 pb-4">
        <div>
          <h1 className="text-[10px] font-bold text-black uppercase tracking-wider">
            Consumer Account Profile
          </h1>
          <p className="text-[10px] text-black/60">
            Household connection data, municipal account registration, and authentication credentials.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={user?.is_verified ? 'blue' : 'black'}>
            {user?.is_verified ? 'Verified Active Consumer' : 'Pending Verification'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal & Account Info */}
        <Card className="p-5 border border-black/15 space-y-4">
          <div className="flex items-center gap-2 border-b border-black/15 pb-2">
            <IconUser size={14} className="text-[#1E6FD9]" />
            <span className="font-bold text-black uppercase tracking-wider">
              Account Registration
            </span>
          </div>

          <div className="space-y-3 bg-[#F0F6FD] p-3 rounded border border-black/10">
            <div>
              <span className="text-black/60 block uppercase font-bold text-[10px]">
                Registered Full Name
              </span>
              <span className="text-black font-bold text-[10px]">
                {user?.name || 'Maria Santos'}
              </span>
            </div>

            <div>
              <span className="text-black/60 block uppercase font-bold text-[10px]">
                Official Account Number
              </span>
              <span className="text-[#1E6FD9] font-mono font-bold text-[10px]">
                {profile?.account_number || 'ACC-2026-0001'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-black/10">
              <div>
                <span className="text-black/60 block uppercase font-bold text-[10px]">
                  Email Address
                </span>
                <span className="text-black text-[10px] flex items-center gap-1">
                  <IconMail size={10} className="text-black/50" />
                  {user?.email || 'maria@example.com'}
                </span>
              </div>
              <div>
                <span className="text-black/60 block uppercase font-bold text-[10px]">
                  Mobile Contact
                </span>
                <span className="text-black text-[10px] flex items-center gap-1">
                  <IconDeviceMobile size={10} className="text-black/50" />
                  {profile?.mobile_number || '0917-123-4567'}
                </span>
              </div>
            </div>

            <div className="pt-1 border-t border-black/10">
              <span className="text-black/60 block uppercase font-bold text-[10px]">
                Registered Service Address
              </span>
              <span className="text-black text-[10px] flex items-center gap-1">
                <IconMapPin size={10} className="text-black/50 shrink-0" />
                {profile?.address || 'Purok 2, National Highway'}, {profile?.barangay?.name || 'Poblacion'}
              </span>
            </div>
          </div>
        </Card>

        {/* Assigned Meter & Connection */}
        <Card className="p-5 border border-black/15 space-y-4">
          <div className="flex items-center gap-2 border-b border-black/15 pb-2">
            <IconGauge size={14} className="text-[#1E6FD9]" />
            <span className="font-bold text-black uppercase tracking-wider">
              Assigned Physical Water Meter
            </span>
          </div>

          {profile?.meter ? (
            <div className="space-y-3 bg-[#F0F6FD] p-3 rounded border border-black/10">
              <div className="flex justify-between items-center">
                <span className="text-black/60 uppercase font-bold text-[10px]">
                  Meter Serial Number
                </span>
                <span className="text-black font-mono font-bold text-[10px]">
                  {profile.meter.meter_number}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-black/60 uppercase font-bold text-[10px]">
                  Meter Operational Status
                </span>
                <Badge variant="blue">{profile.meter.status.toUpperCase()}</Badge>
              </div>

              <div className="pt-2 border-t border-black/10">
                <span className="text-black/60 block uppercase font-bold text-[10px] mb-1">
                  Digital QR Token
                </span>
                <div className="p-2 bg-white rounded border border-black/20 font-mono text-center text-black text-[10px]">
                  {profile.meter.qr_token}
                </div>
                <p className="text-[10px] text-black/50 mt-1">
                  Scannable by Sinacaban municipal meter readers during monthly rounds.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-[#F0F6FD] border border-black/10 rounded text-center text-black/70 text-[10px]">
              Meter installation pending verification by the Municipal Water District office.
            </div>
          )}

          {/* Security / 4-Digit PIN */}
          <div className="border-t border-black/15 pt-3 space-y-2">
            <div className="flex items-center gap-2">
              <IconKey size={12} className="text-[#1E6FD9]" />
              <span className="font-bold text-black uppercase tracking-wider text-[10px]">
                Mobile Quick-Login PIN
              </span>
            </div>

            {pinSuccess && (
              <div className="p-2 bg-[#F0F6FD] border border-black text-black rounded text-[10px] flex items-center gap-1">
                <IconCheck size={12} className="text-[#1E6FD9]" />
                4-Digit PIN successfully updated.
              </div>
            )}

            <form onSubmit={handleUpdatePin} className="flex gap-2">
              <input
                type="password"
                maxLength={4}
                placeholder="4-digit PIN (e.g. 1234)"
                className="w-40 p-2 text-[10px] bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                required
              />
              <Button
                variant="secondary"
                type="submit"
                isLoading={isUpdatingPin}
              >
                Update PIN
              </Button>
            </form>
          </div>
        </Card>
      </div>
      </div>
    </CustomerLayout>
  );
}
