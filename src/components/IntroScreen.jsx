import LogoIcon from "./LogoIcon";

export default function IntroScreen() {
  return (
    <main className="intro-screen">
      <div className="intro-logo">
        <LogoIcon size={44} />
      </div>
      <h1>talknesty</h1>
      <p>Chat freely. Connect deeply. Be you.</p>
    </main>
  );
}
