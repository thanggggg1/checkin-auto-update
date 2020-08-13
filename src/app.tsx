import React from "react";
import ReactDom from "react-dom";
import "antd/dist/antd.css";
import { Col, Layout, Row } from "antd";

const mainElement = document.createElement("div");
document.body.appendChild(mainElement);
const App = () => {
  return (
    <Layout>
      <Row style={{ alignItems: "center" }}>
        <Col>
          <h1 style={{ margin: 0 }}>Base Checkin Station</h1>
        </Col>
      </Row>
      <Row></Row>
    </Layout>
  );
};
ReactDom.render(<App />, mainElement);
