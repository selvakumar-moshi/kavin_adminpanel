
import React from "react";
import { Spin } from "antd";

export interface LoaderProps {
  tip?: string;
  size?: "small" | "default" | "large";
  spinning?: boolean;
  fullScreen?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const Loader: React.FC<LoaderProps> = ({
  tip = "",
  size = "large",
  spinning = true,
  fullScreen = false,
  className = "",
  children,
}) => {
  if (fullScreen) {
    return (
      <div className={`loader-fullscreen ${className}`}>
        <Spin tip={tip} size={size} spinning={spinning} />
      </div>
    );
  }

  if (children) {
    return (
      <Spin tip={tip} size={size} spinning={spinning} className={`loader ${className}`}>
        {children}
      </Spin>
    );
  }

  return <Spin tip={tip} size={size} spinning={spinning} className={`loader ${className}`} />;
};

export default Loader;