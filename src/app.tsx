import { hot } from "react-hot-loader/root";
import React, { memo, useEffect } from "react";
import ReactDom from "react-dom";
import "antd/dist/antd.css";
import { Provider } from "react-redux";
import DevicesRow from "./components/DevicesRow";
import { persistor, store } from "./store";
import RecordsTable from "./components/RecordsTable";
import AppNavBar from "./components/AppNavBar";
import { PersistGate } from "redux-persist/integration/react";
import AutoTasks from "./components/AutoTasks";
import { getLanguage, i18next, initI18next } from "./store/settings/languages";
import { useAsyncFn } from "react-use";
import './App.css'
initI18next().then();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


const Main = memo(function Main() {
  const [{ loading }, changeLanguage] = useAsyncFn(async () => {
    const current = getLanguage();
    await i18next.changeLanguage(current);
  }, []);

  useEffect(() => {
    changeLanguage().then();
  }, []);

  if (loading) {
    return <div>
      Loading ...
    </div>;
  }
  return (
    <>
      <AppNavBar/>
      <DevicesRow/>
      <RecordsTable/>
      <AutoTasks/>
    </>
  );
});

const _App = memo(function App() {

  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <Main/>
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
ReactDom.render(<App/>, mainElement);
