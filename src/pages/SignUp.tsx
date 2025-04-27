import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import AuthLayout from './AuthLayout';
import GoogleBtn from '../components/GoogleBtn';
import TextInput from '../components/TextInput';

export default function SignUp() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, pwd);
      nav('/chat', { replace: true });
    } catch (e: any) {
      setErr(e.message);
    }
  }

  return (
    <AuthLayout title="Create account">
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
        <button
          className="
            w-full rounded-lg bg-indigo-600
            py-2 text-white font-medium
            hover:bg-indigo-700 active:bg-indigo-800
            transition
          "
        >
          Sign up
        </button>
      </form>

      <div className="flex items-center gap-2">
        <hr className="flex-1 border-white/20" />
        <span className="text-sm text-white/60">or</span>
        <hr className="flex-1 border-white/20" />
      </div>

      <GoogleBtn />

      <p className="text-center text-sm text-white/70">
        Already have an account?{' '}
        <Link className="text-indigo-400 hover:underline" to="/login">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
