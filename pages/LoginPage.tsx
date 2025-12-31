
import React, { useState } from 'react';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';

interface LoginPageProps {
  onLogin: (email: string, password: string) => boolean;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  // Pre-fill with admin credentials for quick access
  const [email, setEmail] = useState('admin@pfotencard.de');
  const [password, setPassword] = useState('adminpassword');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginError, setLoginError] = useState('');

  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setLoginError('');

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
    }

    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const success = onLogin(email, password);
      if (!success) {
        setLoginError('Ungültige E-Mail oder ungültiges Passwort.');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gray-100 p-4">
      <Card className="max-w-md w-full p-8">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-6">Mantrailing Card</h1>
        <p className="text-gray-600 text-center mb-8">Melden Sie sich an, um fortzufahren</p>

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

          {loginError && (
            <div className="text-red-600 text-sm text-center -mt-4">
              {loginError}
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full">
            Anmelden
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;