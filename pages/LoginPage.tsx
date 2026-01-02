import React, { useState } from 'react';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  onRegister: (email: string, password: string) => Promise<boolean>;
  externalError?: string;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onRegister, externalError }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('admin@pfotencard.de');
  const [password, setPassword] = useState('adminpassword');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [apiError, setApiError] = useState('');

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
      if (password !== confirmPassword) {
        setConfirmPasswordError('Die Passwörter stimmen nicht überein.');
        isValid = false;
      }
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      let success = false;
      if (isRegisterMode) {
        success = await onRegister(email, password);
        if (!success) {
          setApiError('Die Registrierung ist fehlgeschlagen. Die E-Mail könnte bereits vergeben sein.');
        }
      } else {
        success = await onLogin(email, password);
        if (!success) {
          setApiError('Ungültige E-Mail oder ungültiges Passwort.');
        }
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gray-100 p-4">
      <Card className="max-w-md w-full p-8">
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
          />
          <Input
            id="loginPassword"
            label="Passwort"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            error={passwordError}
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
            />
          )}

          {(externalError || apiError) && (
            <div className="text-red-600 text-sm text-center -mt-4">
              {externalError || apiError}
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full">
            {isRegisterMode ? 'Registrieren' : 'Anmelden'}
          </Button>
        </form>
        
        <div className="text-center mt-6">
          <button onClick={() => resetForm(!isRegisterMode)} className="text-sm text-blue-600 hover:underline">
            {isRegisterMode ? 'Bereits ein Konto? Jetzt anmelden' : 'Noch kein Konto? Jetzt registrieren'}
          </button>
        </div>

      </Card>
    </div>
  );
};

export default LoginPage;
