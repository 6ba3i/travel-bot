import ChatWindow from './components/ChatWindow';
import InputBar from './components/InputBar';
import './index.css';

export default function App() {
  return (
    <div className="h-screen flex flex-col">
      <ChatWindow />
      <InputBar />
    </div>
  );
}
