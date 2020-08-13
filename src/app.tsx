import { hot } from "react-hot-loader/root";
import React from "react";
import ReactDom from "react-dom";
import "antd/dist/antd.css";
import { Col, Layout, Row } from "antd";
import DevicesRow from "./components/DevicesRow";

const _App = () => {
  return (
    <Layout>
      <Row style={{ alignItems: "center" }}>
        <Col>
          <h1 style={{ margin: 0 }}>Base Checkin Station</h1>
        </Col>
      </Row>
      <DevicesRow />
    </Layout>
  );
};
const App = hot(_App);

let mainElement = document.getElementById("main");
if (!mainElement) {
  mainElement = document.createElement("div");
  mainElement.setAttribute("id", "main");
  document.body.appendChild(mainElement);
}
ReactDom.render(<App />, mainElement);
