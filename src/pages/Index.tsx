import { useState } from 'react';
import AuthPage from './AuthPage';
import DisclaimerPage from './DisclaimerPage';
import OnboardingPage from './OnboardingPage';
import DashboardPage from './DashboardPage';

type AppState = 'auth' | 'disclaimer' | 'onboarding' | 'dashboard';

const Index = () => {
  const [state, setState] = useState<AppState>('auth');
  const [userName, setUserName] = useState('');

  // Simulated auth (Clerk integration requires publishable key)
  const handleFakeAuth = () => setState('disclaimer');

  if (state === 'auth') {
    return (
      <div onClick={handleFakeAuth}>
        <AuthPage />
      </div>
    );
  }

  if (state === 'disclaimer') {
    return <DisclaimerPage onAgree={() => setState('onboarding')} />;
  }

  if (state === 'onboarding') {
    return (
      <OnboardingPage
        onComplete={(data) => {
          setUserName(data.name || 'there');
          setState('dashboard');
        }}
      />
    );
  }

  return <DashboardPage userName={userName} />;
};

export default Index;
