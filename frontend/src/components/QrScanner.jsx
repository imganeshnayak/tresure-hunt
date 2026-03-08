import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { AlertCircle } from 'lucide-react';

const QrScanner = ({ onScanSuccess, onScanError }) => {
    const [error, setError] = useState(null);
    const scannerRef = useRef(null);

    useEffect(() => {
        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;

        const startScanner = async () => {
            try {
                await scanner.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: (viewfinderWidth, viewfinderHeight) => {
                            const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
                            const qrboxSize = Math.floor(minEdgeSize * 0.7);
                            return {
                                width: qrboxSize,
                                height: qrboxSize
                            };
                        },
                        aspectRatio: 1.0
                    },
                    (decodedText) => {
                        onScanSuccess(decodedText);
                    },
                    (errorMessage) => {
                        // Regular scanning errors are ignorable
                    }
                );
            } catch (err) {
                console.error("Scanner startup error:", err);
                if (err.toString().includes("NotAllowedError")) {
                    setError("Camera access denied. Please enable camera permissions in your browser settings and refresh.");
                } else {
                    setError("Could not start camera. Ensure no other app is using it.");
                }
                if (onScanError) onScanError(err);
            }
        };

        startScanner();

        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().then(() => {
                    scannerRef.current.clear();
                }).catch(e => console.log("Stop error", e));
            }
        };
    }, []);

    return (
        <div style={{ width: '100%', position: 'relative' }}>
            {error ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#ff4444', background: 'rgba(255, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid rgba(255, 68, 68, 0.2)' }}>
                    <AlertCircle size={40} style={{ marginBottom: '1rem' }} />
                    <p style={{ fontWeight: '600' }}>{error}</p>
                </div>
            ) : (
                <div id="reader" style={{ width: '100%', overflow: 'hidden', borderRadius: '12px' }}></div>
            )}
        </div>
    );
};

export default QrScanner;
