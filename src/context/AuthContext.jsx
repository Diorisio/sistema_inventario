import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_PROFILES } from '../services/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Inicializamos con el perfil de Administrador por defecto o el guardado en localStorage
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('adidas_active_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading active user:', e);
    }
    return DEMO_PROFILES[0]; // Admin por defecto
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('adidas_active_user', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  // Cambio rápido de rol para demostraciones y pruebas del sistema adaptativo (RN-02)
  const switchRole = (roleKey) => {
    const profile = DEMO_PROFILES.find(p => p.role === roleKey) || DEMO_PROFILES[0];
    setCurrentUser(profile);
  };

  const loginWithEmail = async (email, password) => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          // Consultar perfil de la base de datos
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profile) {
            setCurrentUser(profile);
            return { success: true };
          }
        }
      }

      // Si no hay Supabase o para cuentas de prueba por email
      const matched = DEMO_PROFILES.find(p => p.email.toLowerCase() === email.toLowerCase());
      if (matched) {
        setCurrentUser(matched);
        return { success: true };
      }

      // Si se ingresó un correo nuevo para prueba
      const customUser = {
        id: `usr-${Date.now()}`,
        email,
        full_name: email.split('@')[0].replace('.', ' ').toUpperCase(),
        role: 'sector_ventas',
        phone: '+57 300 000 0000'
      };
      setCurrentUser(customUser);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    localStorage.removeItem('adidas_active_user');
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      role: currentUser?.role || 'sector_ventas',
      switchRole,
      loginWithEmail,
      logout,
      loading,
      demoProfiles: DEMO_PROFILES
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

