import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Anchor, Lock, User, Skull } from 'lucide-react';

const Login = () => {
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
            // Automatic redirection based on role
            const role = res.user.role;
            navigate(role === 'admin' ? '/admin' : '/dashboard');
        } else {
            setError(res.message);
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', padding: '1.5rem', background: 'var(--bg-primary)' }}>
            <div className="premium-card responsive-login-card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem 2rem', textAlign: 'center' }}>
                <div style={{ marginBottom: '3.5rem' }}>
                    <div style={{ marginBottom: '1.5rem', display: 'inline-block' }}>
                        <Skull size={64} color="var(--amber-gold)" style={{ filter: 'drop-shadow(0 0 15px var(--accent-glow))' }} />
                    </div>
                    <h1 style={{ fontSize: '2.4rem', fontWeight: '900', color: 'var(--amber-gold)', letterSpacing: '-1.5px', marginBottom: '0.5rem' }}>TREASURE HUNT</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600', letterSpacing: '1px' }}>INITIALIZE SESSION</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    {error && (
                        <div style={{ color: '#ff4444', fontSize: '0.85rem', background: 'rgba(255, 68, 68, 0.1)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255, 68, 68, 0.2)', marginBottom: '0.5rem' }}>
                            {error.toUpperCase()}
                        </div>
                    )}

                    <div style={{ position: 'relative' }}>
                        <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: 0.6 }} />
                        <input
                            type="text"
                            className="input-field"
                            placeholder="OPERATIVE ID"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={{ width: '100%', paddingLeft: '48px', height: '56px', fontSize: '0.9rem', letterSpacing: '0.5px' }}
                            disabled={isLoggingIn}
                            required
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: 0.6 }} />
                        <input
                            type="password"
                            className="input-field"
                            placeholder="ACCESS KEY"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ width: '100%', paddingLeft: '48px', height: '56px', fontSize: '0.9rem', letterSpacing: '0.5px' }}
                            disabled={isLoggingIn}
                            required
                        />
                    </div>

                    <button type="submit" className="gold-button" style={{ height: '56px', marginTop: '1rem', fontSize: '1rem' }} disabled={isLoggingIn}>
                        {isLoggingIn ? 'DECRYPTING...' : 'AUTH_SESSION'}
                    </button>
                </form>

                <div style={{ marginTop: '3rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        NEW OPERATIVE? <Link to="/register" style={{ color: 'var(--amber-gold)', fontWeight: '700', textDecoration: 'none', marginLeft: '0.5rem' }}>ENROLL HERE</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
