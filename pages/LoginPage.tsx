import React, { useState } from 'react';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { supabase } from '../supabaseClient';
import { UserRoleEnum } from '../types';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<boolean>; // Updated to return Promise
  onRegister: (email: string, password: string) => Promise<boolean>; // New prop for registration
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false); // State to toggle between login/register

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
    } else if (password.length < 6) {
      setPasswordError('Passwort muss mindestens 6 Zeichen lang sein.');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setLoginError(''); // Clear previous errors
      try {
        if (isRegistering) {
          const success = await onRegister(email, password);
          if (success) {
            alert('Registrierung erfolgreich! Sie sind jetzt angemeldet.');
            // onRegister already handles auto-login and redirection
          } else {
            setLoginError('Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
          }
        } else {
          const success = await onLogin(email, password);
          if (!success) {
            setLoginError('Ungültige E-Mail oder ungültiges Passwort.');
          }
        }
      } catch (error: any) {
        console.error('Auth error:', error.message);
        setLoginError(`Ein Fehler ist aufgetreten: ${error.message || 'Bitte versuchen Sie es erneut.'}`);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gray-100 p-4">
      <Card className="max-w-md w-full p-8">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-6">Mantrailing Card</h1>
        <p className="text-gray-600 text-center mb-8">{isRegistering ? 'Registrieren Sie sich, um fortzufahren' : 'Melden Sie sich an, um fortzufahren'}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            id="authEmail"
            label="E-Mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ihre.email@example.com"
            error={emailError}
          />
          <Input
            id="authPassword"
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
            {isRegistering ? 'Registrieren' : 'Anmelden'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          {isRegistering ? (
            <>
              Sie haben bereits ein Konto?{' '}
              <button
                type="button"
                className="text-blue-600 hover:text-blue-800 font-medium"
                onClick={() => setIsRegistering(false)}
              >
                Jetzt anmelden
              </button>
            </>
          ) : (
            <>
              Sie haben noch kein Konto?{' '}
              <button
                type="button"
                className="text-blue-600 hover:text-blue-800 font-medium"
                onClick={() => setIsRegistering(true)}
              >
                Jetzt registrieren
              </button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;