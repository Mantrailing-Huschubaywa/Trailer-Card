
import React from 'react';

interface QRCodeDisplayProps {
  dataUrl: string; // URL for the QR code image
  altText?: string;
  className?: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ dataUrl, altText = 'QR Code', className = '' }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img src={dataUrl} alt={altText} className="w-36 h-36 object-contain" />
    </div>
  );
};

export default QRCodeDisplay;
