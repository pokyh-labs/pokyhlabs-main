import ParticleCanvas from "@/components/ParticleCanvas";
import Header from "@/components/Header";
import Headline from "@/components/Headline";
import RailLine from "@/components/RailLine";
import Socials from "@/components/Socials";
import ScrollIndicator from "@/components/ScrollIndicator";

export default function Home() {
  return (
    <>
      <ParticleCanvas />
      <div className="ui" style={{ position: "fixed", inset: 0, zIndex: 2, pointerEvents: "none" }}>
        <Header />
        <Headline />
        <RailLine />
        <Socials />
        <ScrollIndicator />
      </div>
    </>
  );
}
