import React from "react";

export interface ButtonProps {
  variant?: "primary" | "secondary" | "secondary2" | "tertiary";
  state?: "default" | "hover" | "inactive";
  withIcon?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: any;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  state = "default",
  withIcon = false,
  children,
  onClick,
  loading = false,
  disabled = false,
  className = "",
  icon,
}) => {
  const getButtonStyles = () => {
    const baseStyles =
      " content-stretch flex gap-[10px] items-center justify-center overflow-clip px-[31px] py-[8px] relative rounded-[20px] size-full font-['Discover_Sans:Semibold',_sans-serif] leading-[16px] not-italic text-[16px] text-nowrap whitespace-pre transition-colors";

    if (disabled || state === "inactive") {
      return `${baseStyles} cursor-not-allowed`;
    }

    // keep structural classes only; colors are driven by inline styles (CSS vars)
    switch (variant) {
      case "secondary":
      case "secondary2":
        return `${baseStyles} border`; // border color will be set via style
      default:
        return baseStyles;
    }
  };

  // compute color styles using CSS variables so colors are configurable in one place
  const colorStyle: React.CSSProperties = (() => {
    if (disabled || state === "inactive") {
      return {
        backgroundColor: "var(--btn-disabled-bg)",
        borderRadius: "20px",
        padding: "8px 20px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        color: "white",
        cursor: 'pointer'
      };
    }

    switch (variant) {
      case "primary":
        return {
          backgroundColor: "var(--btn-primary-bg)",
          borderRadius: "20px",
          padding: "8px 20px",
          color: "var(--btn-primary-text)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          // hover handled by CSS variable if you want to implement :hover in CSS
        };

      case "secondary":
        return {
          backgroundColor: "var(--btn-secondary-bg)",
          borderColor: "var(--btn-secondary-text)",
          borderRadius: "20px",
          padding: "8px 20px",
          color: "var(--btn-secondary-text)",
          border: "1px solid var(--btn-secondary-text)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        };

      case "secondary2":
        return {
          backgroundColor: "var(--btn-secondary2-bg)",
          color: "var(--btn-secondary2-text)",
          padding: "8px 20px",
          borderColor: "var(--btn-secondary2-text)",
        };

      case "tertiary":
        return {
          backgroundColor: "var(--btn-tertiary-bg)",
          color: "var(--btn-tertiary-text)",
          borderColor: "transparent",
          padding: "8px 20px",
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
      disabled={disabled || state === "inactive" || loading}
      data-variant={variant}
      data-state={state}
      data-with-icon={withIcon}
      data-icon={icon}
      data-testid={children}
    >
      {icon && <span className="button-icon">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
