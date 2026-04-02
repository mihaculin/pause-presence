import { useState } from 'react';
import { useUser, SignedIn, SignedOut } from '@clerk/clerk-react';
import AuthPage from './AuthPage';
import DisclaimerPage from './DisclaimerPage';
import OnboardingPage from './OnboardingPage';
import DashboardPage from './DashboardPage';

type PostAuthState = 'disclaimer' | 'onboarding' | 'dashboard';

const Index = () => {
  const { user } = useUser();
  const [postAuthState, setPostAuthState] = useState<PostAuthState>('disclaimer');
  const [userName, setUserName] = useState('');

  return (
    <>
      <SignedOut>
        <AuthPage />
      </SignedOut>
      <SignedIn>
        {postAuthState === 'disclaimer' && (
          <DisclaimerPage onAgree={() => setPostAuthState('onboarding')} />
        )}
        {postAuthState === 'onboarding' && (
          <OnboardingPage
            onComplete={(data) => {
              setUserName(data.name || user?.firstName || 'there');
              setPostAuthState('dashboard');
            }}
          />
        )}
        {postAuthState === 'dashboard' && (
          <DashboardPage userName={userName} />
        )}
      </SignedIn>
    </>
  );
};

export default Index;
