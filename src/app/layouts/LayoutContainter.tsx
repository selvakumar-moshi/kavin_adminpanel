import React, { useState, useEffect } from "react";
import { Layout, theme } from "antd";
import { Outlet } from "react-router-dom";
import HeaderContainer from "../../components/Header/HeaderContainer";
import { ConfigProvider, theme as antdTheme } from "antd";
import Sidebar from "../../components/Sidebar/Sidebar";
import Footer from "../../components/Footer/Footer";

const { Content } = Layout;

export interface LayoutOutletContext {
  themeMode: "light" | "dark";
  setThemeMode: React.Dispatch<React.SetStateAction<"light" | "dark">>;
}

const LayoutContainer: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [collapsed] = useState(true);
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    const storedTheme = localStorage.getItem("themeMode");
    if (storedTheme === "dark" || storedTheme === "light") {
      document.body.classList.remove("light-theme", "dark-theme");
      document.body.classList.add(`${storedTheme}-theme`);
      setThemeMode(storedTheme);
    } else {
      document.body.classList.remove("light-theme", "dark-theme");
      document.body.classList.add("light-theme");
      setThemeMode("light");
    }
  }, []);

  useEffect(() => {
    document.body.classList.remove("light-theme", "dark-theme");
    document.body.classList.add(`${themeMode}-theme`);
    localStorage.setItem("themeMode", themeMode);
  }, [themeMode]);

  return (
    <ConfigProvider
      theme={{
        algorithm:
          themeMode === "dark"
            ? antdTheme.darkAlgorithm
            : antdTheme.defaultAlgorithm,
      }}
    >
      <Layout>
        <Sidebar />
        <Layout>
          <HeaderContainer />
          <Content
            className={collapsed ? "collapsed" : "collapsed_expand"}
            style={{
                margin: "80px 27px 0 60px",
                paddingLeft: "32px",
                background: colorBgContainer,
                borderRadius: borderRadiusLG,
                minHeight: "calc(100vh - 108px)",
                transition: "margin-left 0.3s ease",
              }}
          >
            <Outlet context={{ themeMode, setThemeMode }} />
          </Content>
          <Footer />
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default LayoutContainer;