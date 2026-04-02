import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useSignIn } from '@clerk/clerk-react';
import { SignIn } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import BreathingCircle from '@/components/BreathingCircle';
import LanguageToggle from '@/components/LanguageToggle';
import { ArrowLeft } from 'lucide-react';

type AuthMode = 'social' | 'email';

const AuthPage = () => {
  const { t } = useTranslation();
  const { signIn, isLoaded } = useSignIn();
  const [mode, setMode] = useState<AuthMode>('social');

  const handleGoogleSignIn = async () => {
    if (!isLoaded) return;
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/',
      });
    } catch (err) {
      console.error('Google sign-in error:', err);
    }
  };

  const handleAppleSignIn = async () => {
    if (!isLoaded) return;
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_apple',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/',
      });
    } catch (err) {
      console.error('Apple sign-in error:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-pulz-turquoise-light opacity-40" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-pulz-seafoam opacity-30" />
      </div>

      <div className="absolute top-6 right-6 z-10">
        <LanguageToggle />
      </div>

      <motion.div
        className="flex flex-col items-center gap-8 max-w-sm w-full z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <BreathingCircle size={140} />

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-display font-semibold text-foreground tracking-tight">
            {t('app.name')}
          </h1>
          <p className="text-muted-foreground text-lg font-light">
            {t('app.tagline')}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'social' ? (
            <motion.div
              key="social"
              className="w-full space-y-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {/* Google */}
              <Button
                variant="pulz"
                size="lg"
                className="w-full h-14 text-base"
                onClick={handleGoogleSignIn}
                disabled={!isLoaded}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {t('auth.continueWithGoogle')}
              </Button>

              {/* Apple */}
              <Button
                variant="pulz-outline"
                size="lg"
                className="w-full h-14 text-base"
                onClick={handleAppleSignIn}
                disabled={!isLoaded}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                {t('auth.continueWithApple')}
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  {t('auth.or')}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Email */}
              <Button
                variant="outline"
                size="lg"
                className="w-full h-14 text-base border-border text-foreground hover:bg-accent"
                onClick={() => setMode('email')}
              >
                {t('auth.continueWithEmail')}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="email"
              className="w-full"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <button
                onClick={() => setMode('social')}
                className="flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('auth.backToOptions')}
              </button>

              <SignIn
                routing="virtual"
                afterSignInUrl="/"
                afterSignUpUrl="/"
                appearance={{
                  elements: {
                    rootBox:              'w-full',
                    card:                 'bg-transparent shadow-none border-0 p-0 gap-5 w-full',
                    headerTitle:          'hidden',
                    headerSubtitle:       'hidden',
                    socialButtonsRoot:    'hidden',
                    dividerRow:           'hidden',
                    formFieldInput:
                      'h-12 rounded-xl bg-card border-border text-foreground placeholder:text-muted-foreground focus:ring-primary',
                    formButtonPrimary:
                      'bg-primary hover:bg-primary/90 text-primary-foreground h-14 rounded-full text-base font-medium w-full',
                    footerActionLink:     'text-primary font-medium',
                    identityPreviewEditButton: 'text-primary',
                    formFieldLabel:       'text-sm font-medium text-foreground',
                    formFieldErrorText:   'text-destructive text-xs',
                    alertText:            'text-destructive text-sm',
                    footer:               'bg-transparent',
                  },
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {mode === 'social' && (
          <p className="text-sm text-muted-foreground text-center">
            {t('auth.signIn')}
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default AuthPage;
