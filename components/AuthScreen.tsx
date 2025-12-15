import React, { useState } from 'react';
import { User } from '../types';
import { Button } from './Button';
import { Input } from './Input';
import { Mail, Lock, User as UserIcon, ArrowRight, MessageSquare } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true); // Toggle between Login and Register simulation
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    // Basic validation
    if (!email.includes('@') || password.length < 6) return;
    
    // If registering, we need a name. If logging in, we mock a name if empty.
    if (!isLoginMode && name.length < 2) return;

    setLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      onLogin({
        id: `user-${Date.now()}`,
        email: email,
        name: name || email.split('@')[0], // Use part of email as name if logic implies simple login
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}&background=10b981&color=fff`
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[128px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[128px]" />

      <div className="w-full max-w-md bg-dark-900/50 backdrop-blur-xl border border-dark-800 p-8 rounded-3xl shadow-2xl relative z-10 animate-fade-in">
        <div className="flex justify-center mb-8">
          <div className="h-20 w-20 bg-gradient-to-tr from-primary-600 to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <MessageSquare className="text-white h-10 w-10" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">Bem-vindo ao NeoChat</h1>
        <p className="text-gray-400 text-center mb-8">
          {isLoginMode ? 'Entre na sua conta para continuar.' : 'Crie sua conta gratuitamente.'}
        </p>

        <div className="space-y-4">
          <Input 
            type="email" 
            placeholder="seu@email.com" 
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={18} />}
            autoFocus
          />

          <Input 
            type="password" 
            placeholder="••••••••" 
            label="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock size={18} />}
          />

          {!isLoginMode && (
            <div className="animate-slide-up">
              <Input 
                type="text" 
                placeholder="Seu nome completo" 
                label="Nome de exibição"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={<UserIcon size={18} />}
              />
            </div>
          )}

          <Button 
            className="w-full mt-6" 
            onClick={handleSubmit}
            isLoading={loading}
            disabled={!email.includes('@') || password.length < 6 || (!isLoginMode && name.length < 2)}
          >
            {isLoginMode ? 'Entrar' : 'Cadastrar'} 
            {!loading && <ArrowRight size={18} />}
          </Button>

          <div className="mt-6 flex flex-col gap-3 items-center">
            <div className="w-full h-[1px] bg-dark-800 relative">
               <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0d0d0f] px-2 text-xs text-gray-500">OU</span>
            </div>

            <button 
              onClick={() => { setIsLoginMode(!isLoginMode); setName(''); }}
              className="text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              {isLoginMode ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
            </button>
          </div>
        </div>
      </div>
      
      <p className="mt-8 text-dark-800/50 text-sm font-medium">Desenvolvido com React e Gemini</p>
    </div>
  );
};