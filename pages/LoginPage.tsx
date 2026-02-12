
import React, { useState, useEffect } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon } from '../components/Icons';

interface LoginPageProps {
  supabase: SupabaseClient | null;
  onLogin: (email: string, password: string) => Promise<string | null>;
  onRegister: (email: string, password: string) => Promise<string | null>;
  isUpdatingPassword?: boolean;
}

type View = 'login' | 'register' | 'forgotPassword' | 'updatePassword' | 'successMessage';

const LoginPage: React.FC<LoginPageProps> = ({ supabase, onLogin, onRegister, isUpdatingPassword = false }) => {
  const [view, setView] = useState<View>(isUpdatingPassword ? 'updatePassword' : 'login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Effect to sync view with prop, in case the prop changes while component is mounted.
  useEffect(() => {
    if (isUpdatingPassword) {
      setView('updatePassword');
    }
  }, [isUpdatingPassword]);

  const resetFormState = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setApiError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setSuccessMessage('');
  };

  const handleSetView = (newView: View) => {
    resetFormState();
    setView(newView);
  };
  
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
        setEmailError('E-Mail ist erforderlich.');
        return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
        setEmailError('Ungültiges E-Mail-Format.');
        return;
    }

    setIsLoading(true);
    setApiError('');
    
    const { error } = await supabase!.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname, // Redirect back to the app's base URL
    });

    setIsLoading(false);
    if (error) {
      setApiError(`Fehler: ${error.message}`);
    } else {
      setSuccessMessage(`Wenn ein Konto mit der E-Mail ${email} existiert, wurde ein Link zum Zurücksetzen des Passworts gesendet. Bitte prüfen Sie auch Ihren Spam-Ordner.`);
      setView('successMessage');
    }
  };
  
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    let isValid = true;
    setPasswordError('');
    setConfirmPasswordError('');

    if (!password.trim()) {
      setPasswordError('Passwort ist erforderlich.');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Passwort muss mindestens 6 Zeichen lang sein.');
      isValid = false;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('Die Passwörter stimmen nicht überein.');
      isValid = false;
    }
    if (!isValid) return;

    setIsLoading(true);
    setApiError('');

    const { error } = await supabase!.auth.updateUser({ password });

    setIsLoading(false);
    if (error) {
      setApiError(`Fehler beim Aktualisieren des Passworts: ${error.message}`);
    } else {
      setSuccessMessage('Ihr Passwort wurde erfolgreich aktualisiert. Sie können sich jetzt mit Ihrem neuen Passwort anmelden.');
      setView('successMessage');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setApiError('');

    if (!email.trim()) {
      setEmailError('E-Mail ist erforderlich.');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Ungültiges E-Mail-Format.');
      isValid = false;
    }

    if (!password.trim()) {
      setPasswordError('Passwort ist erforderlich.');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Passwort muss mindestens 6 Zeichen lang sein.');
      isValid = false;
    }

    if (view === 'register') {
      if (!confirmPassword.trim()) {
        setConfirmPasswordError('Passwortbestätigung ist erforderlich.');
        isValid = false;
      } else if (password !== confirmPassword) {
        setConfirmPasswordError('Die Passwörter stimmen nicht überein.');
        isValid = false;
      }
    }
    
    if (!isValid) return;
    
    setIsLoading(true);
    setApiError('');

    let errorResult: string | null = null;
    if (view === 'register') {
      errorResult = await onRegister(email, password);
      if (errorResult === null) {
        setSuccessMessage(`Registrierung erfolgreich! Wir haben eine Bestätigungs-E-Mail an ${email} gesendet. Bitte klicken Sie auf den Link, um Ihr Konto zu aktivieren.`);
        setView('successMessage');
      }
    } else { // 'login' view
      errorResult = await onLogin(email, password);
    }
    
    setIsLoading(false);
    if (errorResult) {
      setApiError(errorResult);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gray-100 p-4">
      <Card className="max-w-md w-full p-8">
        <div className="flex justify-center mb-4">
          <img src="https://hs-bw.com/wp-content/uploads/2026/02/Trailer-Card-App-icon.png" alt="App Logo" className="h-24 w-24 rounded-[10px]" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-6">Mantrailing Card</h1>
        
        {view === 'successMessage' ? (
            <div className="text-center p-4">
                <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900">Erfolg!</h2>
                <p className="text-gray-600 mt-2">{successMessage}</p>
                <div className="mt-6">
                    <button onClick={() => handleSetView('login')} className="text-sm text-blue-600 hover:underline">
                        Zurück zum Login
                    </button>
                </div>
            </div>
        ) : view === 'forgotPassword' ? (
             <>
                <p className="text-gray-600 text-center mb-8">Passwort zurücksetzen</p>
                <form onSubmit={handleForgotPassword} className="space-y-6">
                    <Input id="loginEmail" label="E-Mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ihre.email@example.com" error={emailError} disabled={isLoading} />
                    {apiError && <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">{apiError}</div>}
                    <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Sende...' : 'Link zum Zurücksetzen senden'}
                    </Button>
                </form>
                <div className="text-center mt-6">
                    <button onClick={() => handleSetView('login')} className="text-sm text-blue-600 hover:underline" disabled={isLoading}>
                        Zurück zum Login
                    </button>
                </div>
            </>
        ) : view === 'updatePassword' ? (
            <>
                <p className="text-gray-600 text-center mb-8">Neues Passwort festlegen</p>
                <form onSubmit={handleUpdatePassword} className="space-y-6">
                    <Input id="loginPassword" label="Neues Passwort" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" error={passwordError} disabled={isLoading} icon={showPassword ? EyeSlashIcon : EyeIcon} onIconClick={() => setShowPassword(!showPassword)} />
                    <Input id="confirmPassword" label="Passwort bestätigen" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="********" error={confirmPasswordError} disabled={isLoading} icon={showConfirmPassword ? EyeSlashIcon : EyeIcon} onIconClick={() => setShowConfirmPassword(!showConfirmPassword)} />
                    {apiError && <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">{apiError}</div>}
                    <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Speichere...' : 'Neues Passwort speichern'}
                    </Button>
                </form>
            </>
        ) : ( // Login and Register views
          <>
            <p className="text-gray-600 text-center mb-8">
              {view === 'register' ? 'Erstellen Sie Ihr neues Kundenkonto' : 'Melden Sie sich an, um fortzufahren'}
            </p>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input id="loginEmail" label="E-Mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ihre.email@example.com" error={emailError} disabled={isLoading} />
              <Input id="loginPassword" label="Passwort" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" error={passwordError} disabled={isLoading} icon={showPassword ? EyeSlashIcon : EyeIcon} onIconClick={() => setShowPassword(!showPassword)} />
              {view === 'register' && (
                <Input id="confirmPassword" label="Passwort bestätigen" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="********" error={confirmPasswordError} disabled={isLoading} icon={showConfirmPassword ? EyeSlashIcon : EyeIcon} onIconClick={() => setShowConfirmPassword(!showConfirmPassword)} />
              )}
              {apiError && <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">{apiError}</div>}
              <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
                {isLoading ? (view === 'register' ? 'Registriere...' : 'Melde an...') : (view === 'register' ? 'Registrieren' : 'Anmelden')}
              </Button>
            </form>
            <div className="flex justify-between items-center mt-6 text-sm">
                <button onClick={() => handleSetView('forgotPassword')} className="text-blue-600 hover:underline" disabled={isLoading}>
                    Passwort vergessen?
                </button>
                <button onClick={() => handleSetView(view === 'login' ? 'register' : 'login')} className="text-blue-600 hover:underline" disabled={isLoading}>
                    {view === 'login' ? 'Noch kein Konto?' : 'Bereits ein Konto?'}
                </button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default LoginPage;
