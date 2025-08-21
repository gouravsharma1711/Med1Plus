import React from 'react';
import QRCodeReact from 'react-qr-code';

// A QR code component that uses react-qr-code library
const QRCode = ({ value, size = 150, level = 'H', includeMargin = true }) => {
  // Default value if none provided
  console.log(value)
  console.log(value.cardId)
  const qrValue = value.cardId || 'https://medisecure.gov.in/verify';

  return (
    <div style={{ background: 'white', padding: includeMargin ? 16 : 0, borderRadius: 4 }}>
      <QRCodeReact
        value={qrValue}
        size={size}
        level={level}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default QRCode;