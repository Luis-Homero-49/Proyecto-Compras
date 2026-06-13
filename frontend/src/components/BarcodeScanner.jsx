import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X } from 'lucide-react';

const BarcodeScanner = ({ onScanSuccess, onClose }) => {

  useEffect(() => {
    let scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: {width: 250, height: 150},
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E
        ],
        rememberLastUsedCamera: true
      },
      false
    );

    scanner.render((decodedText) => {
      scanner.clear().catch(console.error);
      onScanSuccess(decodedText);
    }, () => {
      // Ignorar errores de frame
    });

    return () => {
      try {
        scanner.clear().catch(console.error);
      } catch (e) {
        // Ignorar si ya estaba limpio
      }
    };
  }, [onScanSuccess]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div className="card" style={{ padding: '24px', width: '90%', maxWidth: '500px', backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>Escanear Código de Barras</h3>
          <button onClick={onClose} className="btn-icon" style={{ padding: '8px' }}>
            <X size={24} />
          </button>
        </div>
        <div id="reader" style={{ width: '100%' }}></div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '16px' }}>
          Apunta la cámara al código de barras del producto
        </p>
      </div>
    </div>
  );
};

export default BarcodeScanner;
