import ChatWindow from '../components/ChatWindow';   // already built earlier
import InputBar   from '../components/InputBar';

export default function ChatLayout() {
  return (
    <div className="h-screen flex flex-col">
      <ChatWindow />
      <InputBar />
    </div>
  );
}
