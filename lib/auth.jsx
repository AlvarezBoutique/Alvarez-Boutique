"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { supabase, supabaseEnabled, SUPABASE_URL, SUPABASE_KEY, emailForUsername } from "./browserClient";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

// La sesión se cierra automáticamente 5 horas después de iniciarla.
const SESSION_MAX_MS = 5 * 60 * 60 * 1000;
const LOGIN_AT_KEY = "alvarez_login_at";

const sesionVencida = () => {
  const at = Number(window.localStorage.getItem(LOGIN_AT_KEY) || 0);
  return at > 0 && Date.now() - at > SESSION_MAX_MS;
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(supabaseEnabled);
  const [authError, setAuthError] = useState(null);

  const loadProfile = useCallback(async (userId) => {
    const { data } = await supabase
      .from("profiles")
      .select("*, categories(slug, name)")
      .eq("id", userId)
      .single();
    if (data) {
      setProfile(data);
      return data;
    }
    // Sesión sin perfil: no debería pasar, pero cerramos para no dejar a nadie a medias.
    await supabase.auth.signOut();
    setAuthError("Tu usuario no tiene un perfil asignado. Pide a otra cuenta que lo cree de nuevo.");
    setProfile(null);
    return null;
  }, []);

  useEffect(() => {
    if (!supabaseEnabled) return;
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      if (data.session) {
        if (sesionVencida()) {
          await supabase.auth.signOut();
          setLoadingAuth(false);
          return;
        }
        if (!window.localStorage.getItem(LOGIN_AT_KEY)) {
          window.localStorage.setItem(LOGIN_AT_KEY, String(Date.now()));
        }
        setSession(data.session);
        await loadProfile(data.session.user.id);
      }
      setLoadingAuth(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s);
      if (s) {
        if (!window.localStorage.getItem(LOGIN_AT_KEY)) {
          window.localStorage.setItem(LOGIN_AT_KEY, String(Date.now()));
        }
        await loadProfile(s.user.id);
      } else {
        window.localStorage.removeItem(LOGIN_AT_KEY);
        setProfile(null);
      }
    });

    // Revisa cada minuto si la sesión cumplió 5 horas y la cierra.
    const timer = setInterval(() => {
      if (sesionVencida()) supabase.auth.signOut();
    }, 60 * 1000);

    return () => {
      active = false;
      sub.subscription.unsubscribe();
      clearInterval(timer);
    };
  }, [loadProfile]);

  const signIn = async (username, password) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: emailForUsername(username),
      password,
    });
    if (error) throw new Error("Usuario o contraseña incorrectos.");
    window.localStorage.setItem(LOGIN_AT_KEY, String(Date.now()));
  };

  const signOut = async () => {
    window.localStorage.removeItem(LOGIN_AT_KEY);
    if (supabaseEnabled) await supabase.auth.signOut();
  };

  // Registro de la primera cuenta (solo cuando aún no existe ninguna).
  const signUpFirstAccount = async ({ username, fullName, password, categoryId }) => {
    const { error } = await supabase.auth.signUp({
      email: emailForUsername(username),
      password,
      options: {
        data: { username: username.trim(), full_name: fullName.trim(), category_id: categoryId },
      },
    });
    if (error) throw new Error(error.message);
  };

  // Una cuenta crea otra sin perder su propia sesión (cliente temporal aparte).
  const createAccount = async ({ username, fullName, password, categoryId }) => {
    const tmp = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, storageKey: "alvarez_tmp_" + username },
    });
    const { error } = await tmp.auth.signUp({
      email: emailForUsername(username),
      password,
      options: {
        data: { username: username.trim(), full_name: fullName.trim(), category_id: categoryId },
      },
    });
    if (error) {
      if (/already registered|exists/i.test(error.message)) throw new Error("Ese nombre de usuario ya existe.");
      throw new Error(error.message);
    }
  };

  // Lanza si no se puede consultar. Quien llama NO debe interpretar un fallo de red
  // como "no hay cuentas": eso invitaría a crear la primera cuenta sobre una base
  // que quizá ya tiene datos, sólo porque está temporalmente inalcanzable.
  const hasAccounts = async () => {
    if (!supabaseEnabled) return true;
    const { data, error } = await supabase.rpc("has_accounts");
    if (error) throw new Error(error.message);
    return Boolean(data);
  };

  const value = {
    supabaseEnabled,
    session,
    profile,
    categoryId: profile?.category_id || null,
    category: profile?.categories || null,
    loadingAuth,
    authError,
    setAuthError,
    signIn,
    signOut,
    signUpFirstAccount,
    createAccount,
    hasAccounts,
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
