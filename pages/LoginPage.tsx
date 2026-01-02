import React, { useState } from 'react';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<string | null>;
  onRegister: (email: string, password: string) => Promise<string | null>;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onRegister }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('admin@pfotencard.de');
  const [password, setPassword] = useState('adminpassword');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = (switchToRegister: boolean) => {
    setIsRegisterMode(switchToRegister);
    setEmail(switchToRegister ? '' : 'admin@pfotencard.de');
    setPassword(switchToRegister ? '' : 'adminpassword');
    setConfirmPassword('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setApiError('');
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
    } else {
      errorResult = await onLogin(email, password);
    }
    
    setIsLoading(false);
    if (errorResult) {
      // Set the specific error message from the backend
      setApiError(errorResult);
    }
    // On success, the App.tsx's onAuthStateChange will handle navigation.
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gray-100 p-4">
      <Card className="max-w-md w-full p-8">
        <div className="flex justify-center mb-4">
          <img src="https://hs-bw.com/wp-content/uploads/2026/01/Mantrailing.png" alt="App Logo" className="h-24 w-24 rounded-[10px]" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-6">Mantrailing Card</h1>
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
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            error={passwordError}
            disabled={isLoading}
          />
          {isRegisterMode && (
            <Input
              id="confirmPassword"
              label="Passwort bestätigen"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="********"
              error={confirmPasswordError}
              disabled={isLoading}
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

      </Card>
    </div>
  );
};

export default LoginPage;