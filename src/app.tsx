import { hot } from "react-hot-loader/root";
import React, { memo } from "react";
import ReactDom from "react-dom";
import "antd/dist/antd.css";
import { Provider } from "react-redux";
import DevicesRow from "./components/DevicesRow";
import { persistor, store } from "./store";
import RecordsTable from "./components/RecordsTable";
import AppNavBar from "./components/AppNavBar";
import { PersistGate } from "redux-persist/integration/react";
import AutoTasks from "./components/AutoTasks";

const _App = memo(function App() {
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <AppNavBar />
        <DevicesRow />
        <RecordsTable />
        <AutoTasks />
      </PersistGate>
    </Provider>
  );
});
const App = hot(_App);

let mainElement = document.getElementById("main");
if (!mainElement) {
  mainElement = document.createElement("div");
  mainElement.setAttribute("id", "main");
  document.body.appendChild(mainElement);
}
ReactDom.render(<App />, mainElement);
