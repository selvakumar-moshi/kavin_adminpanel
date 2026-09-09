import React from "react";

export interface ButtonProps {
  variant?: "primary" | "secondary" | "secondary2" | "tertiary";
  state?: "default" | "hover" | "inactive";
  withIcon?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const baseStyles =
  "box-border content-stretch flex gap-[10px] items-center justify-center overflow-clip px-[31px] py-[8px] relative rounded-[20px] size-full font-['Discover_Sans:Semibold',_sans-serif] leading-[16px] not-italic text-[16px] text-nowrap whitespace-pre transition-colors";


const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  state = "default",
  withIcon = false,
  children,
  onClick,
  disabled = false,
  className = "",
}) => {

  const getButtonStyles = () => {
    // always start with baseStyles
    let classes = baseStyles;

    if (disabled || state === "inactive") {
      classes += " cursor-not-allowed";
    }

    // only add structural differences per variant
    if (variant === "secondary" || variant === "secondary2") {
      classes += " border";
    }

    return classes;
  };


  // compute color styles using CSS variables so colors are configurable in one place
  const colorStyle: React.CSSProperties = (() => {
    if (disabled || state === "inactive") {
      return {
        backgroundColor: "var(--btn-disabled-bg)",
        color: "var(--btn-disabled-text)",
        borderColor: "var(--btn-disabled-bg)",
      };
    }

    switch (variant) {
      case "primary":
        return {
          backgroundColor: "var(--btn-primary-bg)",
          borderRadius: "20px",
          padding: "8px 31px",
          color: "var(--btn-primary-text)",
          // hover handled by CSS variable if you want to implement :hover in CSS
        };

      case "secondary":
        return {
          backgroundColor: "var(--btn-secondary-bg)",
          borderColor: "var(--btn-primary-bg)",
          // borderRadius: "20px",
          // padding: "8px 31px",
          color: "var(--btn-secondary-text)",
          border: "1px solid var(--btn-primary-bg)",
        };

      case "secondary2":
        return {
          backgroundColor: "var(--btn-secondary2-bg)",
          color: "var(--btn-secondary2-text)",
          borderColor: "var(--btn-secondary2-text)",
        };

      case "tertiary":
        return {
          backgroundColor: "var(--btn-tertiary-bg)",
          color: "var(--btn-tertiary-text)",
          borderColor: "transparent",
        };

      default:
        return {};
    }
  })();

  return (
    <button
      className={`${getButtonStyles()} ${className}`}
      style={colorStyle}
      onClick={onClick}
      disabled={disabled || state === "inactive"}
      data-variant={variant}
      data-state={state}
      data-with-icon={withIcon}
    >
      {children}
    </button>
  );
};

export default Button;
