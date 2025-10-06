import React from "react";
import ReactDOM from "react-dom/client";
import { AppConfig, UserSession } from "@stacks/connect";
import { Connect } from "@stacks/connect-react";

import App from "./App";
import "./index.css";
import { STACKS_NETWORK } from "./lib/config";

const appConfig = new AppConfig(["store_write", "publish_data"]);
const userSession = new UserSession({ appConfig });

const authOptions = {
  appDetails: {
    name: "STX Airtime Drip",
    icon: `${window.location.origin}/app-icon.svg`,
  },
  onFinish: () => {
    window.location.reload();
  },
  onCancel: () => {
    console.info("Wallet connect popup closed");
  },
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Connect authOptions={authOptions}>
      <App userSession={userSession} />
    </Connect>
  </React.StrictMode>
);
