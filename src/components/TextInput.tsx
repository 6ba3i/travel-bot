export default function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <input
      {...props}
      className="
        w-full rounded-lg border border-white/30
        bg-white/10 backdrop-blur
        px-4 py-2
        placeholder:text-white/60 text-white
        focus:ring-2 focus:ring-indigo-500 focus:outline-none
      "
    />
  );
}
