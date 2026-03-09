import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoggingIn(true);
        const res = await login(username, password);
        if (res.success) {
            if (res.user.role === 'admin') {
                navigate('/admin');
            } else {
                setError('ACCESS DENIED: RED-LEVEL CLEARANCE REQUIRED');
                setIsLoggingIn(false);
            }
        } else {
            setError(res.message);
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', padding: '1.5rem', background: '#0a0a0a' }}>
            <div className="premium-card" style={{ width: '100%', maxWidth: '450px', padding: '3rem 2.5rem', textAlign: 'center', border: '1px solid #330000' }}>
                <div style={{ marginBottom: '3.5rem' }}>
                    <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ repeat: Infinity, duration: 4 }}
                        style={{ marginBottom: '1.5rem', display: 'inline-block' }}
                    >
                        <ShieldAlert size={64} color="#ff3333" style={{ filter: 'drop-shadow(0 0 15px rgba(255, 51, 51, 0.3))' }} />
                    </motion.div>
                    <h1 style={{ fontSize: '2.4rem', fontWeight: '900', color: '#ff3333', letterSpacing: '-1.5px', marginBottom: '0.5rem' }}>COMMAND_CORE</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600', letterSpacing: '2px' }}>OFFICER AUTHENTICATION</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {error && (
                        <motion.div
                            initial={{ x: -10 }}
                            animate={{ x: 0 }}
                            style={{ color: '#ff4444', fontSize: '0.85rem', background: 'rgba(255, 68, 68, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255, 68, 68, 0.2)', marginBottom: '0.5rem' }}
                        >
                            {error.toUpperCase()}
                        </motion.div>
                    )}

                    <div style={{ position: 'relative' }}>
                        <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: 0.6 }} />
                        <input
                            type="text"
                            className="input-field"
                            placeholder="OFFICER ID"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={{ width: '100%', paddingLeft: '48px', height: '56px', fontSize: '0.9rem', letterSpacing: '0.5px', border: '1px solid rgba(255,255,255,0.05)' }}
                            disabled={isLoggingIn}
                            required
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: 0.6 }} />
                        <input
                            type="password"
                            className="input-field"
                            placeholder="COMMAND KEY"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ width: '100%', paddingLeft: '48px', height: '56px', fontSize: '0.9rem', letterSpacing: '0.5px', border: '1px solid rgba(255,255,255,0.05)' }}
                            disabled={isLoggingIn}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="gold-button"
                        style={{ height: '56px', marginTop: '1rem', fontSize: '1rem', background: '#ff3333', color: '#fff' }}
                        disabled={isLoggingIn}
                    >
                        {isLoggingIn ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div className="loader" style={{ width: '20px', height: '20px', borderLeftColor: '#fff', marginBottom: 0 }}></div>
                                VERIFYING...
                            </div>
                        ) : 'ENGAGE_CORE'}
                    </button>
                </form>

                <div style={{ marginTop: '3rem', borderTop: '1px solid rgba(255,51,51,0.1)', paddingTop: '2rem' }}>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>
                        RESTRICTED AREA: UNAUTHORIZED ACCESS ATTEMPT WILL BE LOGGED
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
