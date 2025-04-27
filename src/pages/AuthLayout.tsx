import BackgroundGrid from '../components/BackgroundGrid';

export default function AuthLayout({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <BackgroundGrid />

      <div
        className="
          w-full max-w-md z-10
          rounded-2xl border border-white/20
          bg-white/20 backdrop-blur-lg shadow-2xl
          p-10 space-y-6
        "
      >
        <h1 className="text-3xl font-semibold text-center text-white">
          {title}
        </h1>
        {children}
      </div>
    </div>
  );
}
