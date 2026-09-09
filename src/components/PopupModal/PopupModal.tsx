import React from "react";
import { Modal, Button } from "antd";
import { CloseOutlined } from "@ant-design/icons";

export interface PopupModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title?: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  showFooter?: boolean;
  className?: string;
  contentHeight?: number | string;
  minHeight?: number | string; 
  maxHeight?: number | string;
  primaryButtonDisabled?: boolean;
  hideButtons?: boolean;
  primaryButtonLoading?: boolean;
  primaryButtonTestId?: string;
  secondaryButtonTestId?: string;
}

const PopupModal: React.FC<PopupModalProps> = ({
  open,
  onClose,
  onSubmit,
  title,
  subtitle,
  children,
  primaryButtonText = "Primary",
  secondaryButtonText = "Secondary",
  showFooter = true,
  className,
  contentHeight = "auto",
  minHeight = 250, 
  maxHeight = 431,
  primaryButtonDisabled = false,
  hideButtons = false,
  primaryButtonLoading = false,
  primaryButtonTestId,
  secondaryButtonTestId,
}) => {
  const handleSubmit = () => {
    onSubmit();
  };

  const handleCancel = () => {
    onClose();
  };

  const contentStyle: React.CSSProperties = {
    height: contentHeight,
    minHeight: minHeight,
    maxHeight: maxHeight,
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      mask={{ closable: false }}
      footer={null}
      width={627}
      className={`popup-modal ${className || ""}`}
      closable={false}
      centered
    >
      {/* Header */}
      <div className="popup-modal__header">
        <div className="popup-modal__title-section">
          <h2 className="popup-modal__title">{title}</h2>
          <p className="popup-modal__subtitle">{subtitle}</p>
        </div>
        <button
          type="button"
          className="popup-modal__close"
          onClick={handleCancel}
          aria-label="Close"
          data-testid="close-button"
        >
          <CloseOutlined />
        </button>
      </div>

      {/* Content */}
      <div className="popup-modal__content" style={contentStyle}>
        {children}
      </div>

      {/* Footer */}
      {showFooter && (
        <div className="popup-modal__footer">
          <div className="popup-modal__buttons">
            {!hideButtons && secondaryButtonText && (
                <Button
                  type="default"
                  onClick={handleCancel}
                  className="popup-modal__button popup-modal__button--secondary"
                  data-testid={secondaryButtonTestId ?? secondaryButtonText}
                >
                  {secondaryButtonText}
                </Button>
            )}
            <Button
              type="primary"
              onClick={handleSubmit}
              className="popup-modal__button popup-modal__button--primary"
              disabled={primaryButtonDisabled}
              loading={primaryButtonLoading}
              data-testid={primaryButtonTestId ?? primaryButtonText}
            >
              {primaryButtonText}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default PopupModal;
