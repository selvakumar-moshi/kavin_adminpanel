
import React, { useEffect, useRef, useState } from "react";
import success_icon from "../../assets/success_icon.svg";

export interface ToastMessageProps {
  type?: "success" | "error" | "warning";
  message: string;
  onClose?: () => void;
  duration?: number; // milliseconds, default 2000
  className?: string;
}

const ToastMessage: React.FC<ToastMessageProps> = ({
  type = "success",
  message,
  onClose,
  duration = 5000,
  className = "",
}) => {
  const [visible, setVisible] = useState(true);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // auto-dismiss after duration
    timeoutRef.current = window.setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, duration);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [onClose]);

  if (!visible) return null;

  // const getIcon = () => {
  //   switch (type) {
  //     case "success":
  //       return (
  //         <div
  //           style={{
  //             background: "var(--toast-success-bg) !important",
  //             borderRadius: 8,
  //             width: 32,
  //             height: 32,
  //             display: "flex",
  //             alignItems: "center",
  //             justifyContent: "center",
  //           }}
  //         >
  //           <svg
  //             className="w-5 h-5"
  //             viewBox="0 0 24 24"
  //             fill="var(--toast-success-text)"
  //           >
  //             <img src={success_icon} alt="" />
  //           </svg>
  //         </div>
  //       );
  //     case "error":
  //       return (
  //         <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
  //           <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  //         </svg>
  //       );
  //     case "warning":
  //       return (
  //         <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
  //           <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
  //         </svg>
  //       );
  //     default:
  //       return null;
  //   }
  // };

  // compute colors from CSS variables (defined in global CSS)
  const colorStyle: React.CSSProperties = (() => {
    switch (type) {
      case "success":
        return {
          position: "fixed",
          fontFamily:"var(--font-family)",
          color: "var(--toast-default-text)",
          borderLeft: "4px solid var(--toast-success-border)",
          boxShadow: "0px 1px 16.6px 0px rgba(0,0,0,0.25)",
          padding: "8px 20px",
          maxWidth: "80%",
          margin: "10px",
          right: "-10px",
          bottom: "100px",
          borderRadius: "15px 0 0 15px",
          border: "4px solid #EEE",
          background: "#FFF",
        };
      case "error":
        return {
          backgroundColor: "var(--toast-error-bg)",
          color: "var(--toast-error-text)",
          borderLeft: "4px solid var(--toast-error-border)",
        };
      case "warning":
        return {
          backgroundColor: "var(--toast-warning-bg)",
          color: "var(--toast-warning-text)",
          borderLeft: "4px solid var(--toast-warning-border)",
        };
      default:
        return {
          backgroundColor: "var(--toast-default-bg)",
          color: "var(--toast-default-text)",
          borderLeft: "4px solid var(--toast-default-border)",
        };
    }
  })();

  return (
    <div
      style={colorStyle}
      className={` rounded-bl-[15px] rounded-tl-[15px] size-full transition-opacity duration-200 ease-out ${className}`}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "40px",
          padding: "16px",
          borderRadius: "15px 0 0 15px",
        }}
      >
        <img style={{ height: "50px",paddingRight:"30" }} src={success_icon} alt="" />
        <p style={{ fontSize: "24px" }}>{message}</p>

        {onClose && (
          <button
            onClick={() => {
              if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
              setVisible(false);
              onClose();
            }}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        )}
      </div>

      {/* shadow / outline */}
      <div
        aria-hidden="true"
        className="inset-0 pointer-events-none rounded-bl-[15px] rounded-tl-[15px] shadow-[0px_1px_16.6px_0px_rgba(0,0,0,0.25)]"
        style={{}}
      />
    </div>
  );
};

export default ToastMessage;
