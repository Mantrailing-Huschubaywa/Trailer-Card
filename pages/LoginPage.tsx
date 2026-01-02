
import React, { useState } from 'react';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon } from '../components/Icons'; // Import the new icons

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<string | null>;
  onRegister: (email: string, password: string) => Promise<string | null>;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onRegister }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
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
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const resetForm = (switchToRegister: boolean) => {
    setIsRegisterMode(switchToRegister);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setApiError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setRegistrationSuccess(false);
  };

  const validateForm = () => {
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

    if (isRegisterMode) {
      if (!confirmPassword.trim()) {
        setConfirmPasswordError('Passwortbestätigung ist erforderlich.');
        isValid = false;
      } else if (password !== confirmPassword) {
        setConfirmPasswordError('Die Passwörter stimmen nicht überein.');
        isValid = false;
      }
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    setApiError('');

    let errorResult: string | null = null;
    if (isRegisterMode) {
      errorResult = await onRegister(email, password);
      if (errorResult === null) {
        setRegistrationSuccess(true);
      }
    } else {
      errorResult = await onLogin(email, password);
    }
    
    setIsLoading(false);
    if (errorResult) {
      setApiError(errorResult);
    }
    // On login success, App.tsx's onAuthStateChange handles navigation.
    // On registration success, the new registrationSuccess state handles the UI change.
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gray-100 p-4">
      <Card className="max-w-md w-full p-8">
        <div className="flex justify-center mb-4">
          <img src="https://hs-bw.com/wp-content/uploads/2026/01/Mantrailing.png" alt="App Logo" className="h-24 w-24 rounded-[10px]" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-6">Mantrailing Card</h1>
        
        {registrationSuccess ? (
          <div className="text-center p-4">
            <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">Registrierung erfolgreich!</h2>
            <p className="text-gray-600 mt-2">
              Wir haben eine Bestätigungs-E-Mail an <span className="font-medium">{email}</span> gesendet.
            </p>
            <p className="text-gray-600 mt-1">
              Bitte klicken Sie auf den Link in der E-Mail, um Ihr Konto zu aktivieren.
            </p>
            <div className="mt-6">
                <button onClick={() => resetForm(false)} className="text-sm text-blue-600 hover:underline">
                    Zurück zum Login
                </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-gray-600 text-center mb-8">
              {isRegisterMode ? 'Erstellen Sie Ihr neues Kundenkonto' : 'Melden Sie sich an, um fortzufahren'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                id="loginEmail"
                label="E-Mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ihre.email@example.com"
                error={emailError}
                disabled={isLoading}
              />
              <Input
                id="loginPassword"
                label="Passwort"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                error={passwordError}
                disabled={isLoading}
                icon={showPassword ? EyeSlashIcon : EyeIcon}
                onIconClick={() => setShowPassword(!showPassword)}
              />
              {isRegisterMode && (
                <Input
                  id="confirmPassword"
                  label="Passwort bestätigen"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="********"
                  error={confirmPasswordError}
                  disabled={isLoading}
                  icon={showConfirmPassword ? EyeSlashIcon : EyeIcon}
                  onIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              )}

              {apiError && (
                <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
                  {apiError}
                </div>
              )}

              <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
                {isLoading ? (isRegisterMode ? 'Registriere...' : 'Melde an...') : (isRegisterMode ? 'Registrieren' : 'Anmelden')}
              </Button>
            </form>
            
            <div className="text-center mt-6">
              <button onClick={() => resetForm(!isRegisterMode)} className="text-sm text-blue-600 hover:underline" disabled={isLoading}>
                {isRegisterMode ? 'Bereits ein Konto? Jetzt anmelden' : 'Noch kein Konto? Jetzt registrieren'}
              </button>
            </div>
          </>
        )}

      </Card>
    </div>
  );
};

export default LoginPage;
