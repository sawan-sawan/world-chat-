import { MessageCircle } from "lucide-react";
import "./IntroScreen.css";

export default function IntroScreen() {
  return (
    <main className="intro-screen">
      <div className="intro-logo">
        <MessageCircle size={42} />
      </div>
      <h1>talknesty</h1>
      <p>Chat freely. Connect deeply. Be you.</p>
    </main>
  );
}
