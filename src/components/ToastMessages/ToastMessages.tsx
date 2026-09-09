
import React, { useEffect, useState, useRef } from "react";
import success_icon from "../../assets/success_icon.svg";
import error_icon from "../../assets/error_Icon.svg";
import warn_icon from "../../assets/warn_Icon.svg";

export type ToastType = 'success' | 'error' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface ToastMessagesProps {
  messages: ToastMessage[];
  onMessageClose?: (messageId: string) => void;
  className?: string;
}
 
/** Auto-dismiss after this many ms when duration is missing or invalid. */
export const DEFAULT_TOAST_DURATION_MS = 5000;
 
const ToastMessages: React.FC<ToastMessagesProps> = ({
  messages,
  onMessageClose,
  className,
}) => {
  const [visibleMessages, setVisibleMessages] = useState<ToastMessage[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
 
  useEffect(() => {
    if (messages.length === 0) {
      return;
    }
 
    const newMessages = messages.filter(
      msg => !visibleMessages.some(vm => vm.id === msg.id)
    );
 
    if (newMessages.length === 0) {
      return;
    }
 
    setVisibleMessages(prev => [...prev, ...newMessages]);
 
    newMessages.forEach(msg => {
      const duration =
        typeof msg.duration === "number" && msg.duration > 0
          ? msg.duration
          : DEFAULT_TOAST_DURATION_MS;
 
      const timer = setTimeout(() => {
        timersRef.current.delete(msg.id);
        setVisibleMessages(prev => prev.filter(m => m.id !== msg.id));
        onMessageClose?.(msg.id);
      }, duration);
 
      timersRef.current.set(msg.id, timer);
    });
  }, [messages, visibleMessages, onMessageClose]);
 
  useEffect(() => {
    return () => {
      timersRef.current.forEach(t => clearTimeout(t));
      timersRef.current.clear();
    };
  }, []);
 
  const getIconForType = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <img style={{ height: "40px" }} src={success_icon} alt="Success" />;
      case 'error':
        return <img style={{ height: "40px" }} src={error_icon} alt="Error" />;
      case 'warning':
        return <img style={{ height: "40px" }} src={warn_icon} alt="Warning" />;
      default:
        return <img style={{ height: "50px" }} src={success_icon} alt="Success" />;
    }
  };
 
  if (visibleMessages.length === 0) {
    return null;
  }

  return (
    <div className={`toast-messages ${className || ""}`}>
      {visibleMessages.map((msg) => (
        <div
          key={msg.id}
          className={`toast-messages__item toast-messages__item--${msg.type} rounded-bl-[15px] rounded-tl-[15px] size-full transition-opacity duration-200 ease-out`}
        >
          <div className="toast-messages__content">
            {getIconForType(msg.type)}
            <p className="toast-messages__text">{msg.message}</p>
          </div>

          {/* shadow / outline */}
          <div
            aria-hidden="true"
            className="inset-0 pointer-events-none rounded-bl-[15px] rounded-tl-[15px] shadow-[0px_1px_16.6px_0px_rgba(0,0,0,0.25)]"
          />
        </div>
      ))}
    </div>
  );
};

export default ToastMessages;