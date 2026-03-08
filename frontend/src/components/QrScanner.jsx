import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QrScanner = ({ onScanSuccess, onScanError }) => {
    const scannerRef = useRef(null);

    useEffect(() => {
        // configuration for the scanner
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        };

        const scanner = new Html5QrcodeScanner("reader", config, /* verbose= */ false);

        scanner.render(
            (decodedText) => {
                // Success: what to do when a QR code is scanned
                onScanSuccess(decodedText);
                // Optionally stop scanning after a success
                scanner.clear().catch(error => {
                    console.error("Failed to clear scanner", error);
                });
            },
            (errorMessage) => {
                // Error: what to do when a QR code scan fails (this happens often during scanning)
                if (onScanError) onScanError(errorMessage);
            }
        );

        // Cleanup function to clear the scanner when the component is unmounted
        return () => {
            scanner.clear().catch(error => {
                console.error("Failed to clear scanner during cleanup", error);
            });
        };
    }, [onScanSuccess, onScanError]);

    return (
        <div id="reader" style={{ width: '100%', margin: '0 auto' }}></div>
    );
};

export default QrScanner;
