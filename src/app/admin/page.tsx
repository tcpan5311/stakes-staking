import Header from "../components/header";
import Body from "../components/admin_body";
import { MetamaskProvider } from "../../../context/MetamaskContext";

import { PrimeReactProvider } from "primereact/api";

export default function Admin() {
    return (
      <div>
        <PrimeReactProvider>
        <MetamaskProvider>
          <Header></Header>
          <Body></Body>
        </MetamaskProvider>
        </PrimeReactProvider>
      </div>

    );
  }