// frontend/src/components/AadhaarVerify.jsx
// Mock Aadhaar + DigiLocker verification flow

import React, { useState } from 'react';

const STAGES = { idle: 'idle', otp: 'otp', verified: 'verified' };

// ─── DigiLocker Mock ──────────────────────────────────────────────────────────
const DigiLockerModal = ({ onClose }) => {
    const [imported, setImported] = useState(false);
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                        <span className="text-xl">📂</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">DigiLocker</h3>
                        <p className="text-xs text-gray-500">Government of India</p>
                    </div>
                </div>

                {!imported ? (
                    <div>
                        <p className="text-sm text-gray-600 mb-4">
                            Select documents to import:
                        </p>
                        <div className="space-y-3 mb-5">
                            {[
                                { icon: '🎓', name: 'Class 12 Marksheet', issuer: 'CBSE' },
                                { icon: '📜', name: 'Graduation Certificate', issuer: 'University Grants Commission' },
                                { icon: '🪪', name: 'Aadhaar Card', issuer: 'UIDAI' },
                            ].map(doc => (
                                <div key={doc.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <span>{doc.icon}</span>
                                        <div>
                                            <div className="text-sm font-medium text-gray-800">{doc.name}</div>
                                            <div className="text-xs text-gray-400">{doc.issuer}</div>
                                        </div>
                                    </div>
                                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-blue-600" />
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setImported(true)}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl">
                            Import Selected Documents
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <div className="text-5xl mb-3">✅</div>
                        <h4 className="font-bold text-green-700 text-lg mb-2">Documents Imported!</h4>
                        <p className="text-sm text-gray-500 mb-5">Your certificates have been verified via DigiLocker.</p>
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-left mb-4">
                            <p className="text-xs font-semibold text-green-700 mb-2">Imported Documents:</p>
                            <p className="text-xs text-green-600">✓ Class 12 Marksheet (CBSE)</p>
                            <p className="text-xs text-green-600">✓ Graduation Certificate</p>
                            <p className="text-xs text-green-600">✓ Aadhaar Card</p>
                        </div>
                        <button onClick={onClose} className="w-full bg-green-600 text-white font-semibold py-2.5 rounded-xl">
                            Done
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Main AadhaarVerify ───────────────────────────────────────────────────────
const AadhaarVerify = ({ onVerified }) => {
    const [stage, setStage] = useState(STAGES.idle);
    const [aadhaar, setAadhaar] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showDigiLocker, setShowDigiLocker] = useState(false);

    const handleSendOtp = async () => {
        if (aadhaar.replace(/\s/g, '').length !== 12 || !/^\d+$/.test(aadhaar.replace(/\s/g, ''))) {
            setError('Enter a valid 12-digit Aadhaar number');
            return;
        }
        setError('');
        setLoading(true);
        await new Promise(r => setTimeout(r, 1200)); // simulate API call
        setLoading(false);
        setStage(STAGES.otp);
    };

    const handleVerifyOtp = async () => {
        if (otp.length !== 6) { setError('Enter the 6-digit OTP'); return; }
        setError('');
        setLoading(true);
        await new Promise(r => setTimeout(r, 1000));
        setLoading(false);
        setStage(STAGES.verified);
        onVerified?.();
    };

    const formatAadhaar = (val) => {
        const digits = val.replace(/\D/g, '').slice(0, 12);
        return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    };

    if (stage === STAGES.verified) {
        return (
            <div>
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl mb-3">
                    <span className="text-2xl">✅</span>
                    <div>
                        <p className="font-bold text-green-700 text-sm">Aadhaar Verified</p>
                        <p className="text-xs text-green-600">Identity confirmed via UIDAI (Demo Mode)</p>
                    </div>
                    <span className="ml-auto bg-green-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">VERIFIED</span>
                </div>
                <button onClick={() => setShowDigiLocker(true)}
                    className="w-full flex items-center justify-center gap-2 border-2 border-orange-300 text-orange-600 font-semibold py-2.5 rounded-xl hover:bg-orange-50 transition-colors text-sm">
                    <span>📂</span> Import from DigiLocker
                </button>
                {showDigiLocker && <DigiLockerModal onClose={() => setShowDigiLocker(false)} />}
            </div>
        );
    }

    return (
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🪪</span>
                <span className="font-semibold text-gray-700 text-sm">Verify with Aadhaar</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Demo Mode</span>
            </div>

            {stage === STAGES.idle && (
                <div>
                    <input
                        type="text"
                        value={aadhaar}
                        onChange={e => setAadhaar(formatAadhaar(e.target.value))}
                        placeholder="XXXX XXXX XXXX"
                        maxLength={14}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-blue-500 mb-2"
                    />
                    {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
                    <button onClick={handleSendOtp} disabled={loading}
                        className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white text-sm font-semibold py-2.5 rounded-lg">
                        {loading ? 'Sending OTP...' : 'Send OTP'}
                    </button>
                </div>
            )}

            {stage === STAGES.otp && (
                <div>
                    <p className="text-xs text-gray-500 mb-3">
                        OTP sent to mobile linked with Aadhaar <span className="font-mono font-bold">XXXX XXXX {aadhaar.slice(-4)}</span>
                        <br /><span className="text-blue-600 font-bold">(Demo: use any 6-digit number)</span>
                    </p>
                    <input
                        type="text"
                        value={otp}
                        onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono text-center tracking-widest focus:outline-none focus:border-blue-500 mb-2"
                    />
                    {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
                    <button onClick={handleVerifyOtp} disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-sm font-semibold py-2.5 rounded-lg">
                        {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default AadhaarVerify;