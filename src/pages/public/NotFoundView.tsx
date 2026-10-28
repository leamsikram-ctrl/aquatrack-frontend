import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../../components/molecules/EmptyState';
import { NotFoundIllustration } from '../../components/illustrations';
import { AquaTrackLogo } from '../../components/atoms/AquaTrackLogo';

export const NotFoundView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col items-center justify-center p-4">
      <div className="mb-6">
        <AquaTrackLogo size="lg" />
      </div>
      <EmptyState
        illustration={<NotFoundIllustration />}
        title="Page not found"
        description="The requested page could not be located."
        actionLabel="Go home"
        onAction={() => navigate('/')}
        className="max-w-md w-full"
      />
    </div>
  );
};

