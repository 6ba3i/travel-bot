import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import AuthLayout from './AuthLayout';
import GoogleBtn from '../components/GoogleBtn';
import TextInput from '../components/TextInput';

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [remember, setRemember] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence
      );
      await signInWithEmailAndPassword(auth, email, pwd);
      nav('/chat', { replace: true });
    } catch (e: any) {
      setErr(e.message);
    }
  }

  return (
    <AuthLayout title="Log in">
      {err && <p className="text-sm text-red-500">{err}</p>}

      <form onSubmit={submit} className="space-y-4">
        <TextInput
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <TextInput
          type="password"
          placeholder="Password"
          value={pwd}
          onChange={e => setPwd(e.target.value)}
          required
        />
        <label className="flex items-center justify-between text-white/80">
          <span className="text-sm select-none">Remember me</span>
          <span className="relative inline-block w-10" >
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              className="sr-only peer"
            />
            <div
              className="
                block w-10 h-6 rounded-full bg-white/30
                peer-checked:bg-indigo-600 transition-colors
              "
            ></div>
            <div
              className="
                absolute top-0 left-0 h-6 w-6 bg-white rounded-full shadow
                transform peer-checked:translate-x-4 transition-transform
              "
            ></div>
          </span>
        </label>
        <button
          className="
            w-full rounded-lg bg-indigo-600
            py-2 text-white font-medium
            hover:bg-indigo-700 active:bg-indigo-800
            transition
          "
        >
          Log in
        </button>
      </form>

      <div className="flex items-center gap-2">
        <hr className="flex-1 border-white/20" />
        <span className="text-sm text-white/60">or</span>
        <hr className="flex-1 border-white/20" />
      </div>

      <GoogleBtn />

      <p className="text-center text-sm text-white/70">
        <Link to="/forgot" className="text-indigo-400 hover:underline">
          Forgot password?
        </Link>
      </p>

      <p className="text-center text-sm text-white/70">
        No account?{' '}
        <Link to="/signup" className="text-indigo-400 hover:underline">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
