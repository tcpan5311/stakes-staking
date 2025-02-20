import Image from "next/image";
import Header from "./components/header";
import Body from "./components/main_body";
import { MetamaskProvider } from "../../context/MetamaskContext";

export default function Home() {
  return (
  <div>
    <MetamaskProvider>
      <Header></Header>
      <Body></Body>
    </MetamaskProvider>
  </div>
  );
}
