import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import AuthLayout from './AuthLayout';
import TextInput from '../components/TextInput';

export default function Forgot() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (e: any) {
      setErr(e.message);
    }
  }

  return (
    <AuthLayout title="Password reset">
      {sent ? (
        <p className="text-white text-center">
          Check your inbox for a reset link.
        </p>
      ) : (
        <>
          {err && <p className="text-sm text-red-500">{err}</p>}
          <form onSubmit={submit} className="space-y-4">
            <TextInput
              type="email"
              placeholder="Your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
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
              Send reset link
            </button>
          </form>
        </>
      )}

      <p className="text-center text-sm text-white/70 mt-4">
        <Link to="/login" className="text-indigo-400 hover:underline">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}
