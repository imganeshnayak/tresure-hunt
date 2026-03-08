import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Users, Skull, ArrowLeft } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        teamName: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const res = await register(formData.username, formData.password, formData.teamName);
        if (res.success) {
            navigate(res.user.role === 'admin' ? '/admin' : '/dashboard');
        } else {
            setError(res.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', padding: '1rem', background: 'var(--bg-primary)' }}>
            <div className="premium-card" style={{ width: '100%', maxWidth: '400px', padding: '4rem 2.5rem', textAlign: 'center' }}>
                <div style={{ marginBottom: '3.5rem' }}>
                    <div style={{ marginBottom: '1.5rem', display: 'inline-block' }}>
                        <Skull size={64} color="var(--amber-gold)" style={{ filter: 'drop-shadow(0 0 15px var(--accent-glow))' }} />
                    </div>
                    <h1 style={{ fontSize: '2.4rem', fontWeight: '900', color: 'var(--amber-gold)', letterSpacing: '-1.5px', marginBottom: '0.5rem' }}>OPERATIVE ENROLLMENT</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600', letterSpacing: '1px' }}>CREATE MISSION PROFILE</p>
                </div>

                {error && (
                    <div style={{ color: '#ff4444', fontSize: '0.85rem', background: 'rgba(255, 68, 68, 0.1)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255, 68, 68, 0.2)', marginBottom: '1.5rem' }}>
                        {error.toUpperCase()}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div style={{ position: 'relative' }}>
                        <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: 0.6 }} />
                        <input
                            type="text"
                            className="input-field"
                            placeholder="OPERATIVE ID"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            style={{ width: '100%', paddingLeft: '48px', height: '56px', fontSize: '0.9rem', letterSpacing: '0.5px' }}
                            required
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: 0.6 }} />
                        <input
                            type="password"
                            className="input-field"
                            placeholder="ACCESS KEY"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            style={{ width: '100%', paddingLeft: '48px', height: '56px', fontSize: '0.9rem', letterSpacing: '0.5px' }}
                            required
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Users size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: 0.6 }} />
                        <input
                            type="text"
                            className="input-field"
                            placeholder="SQUAD NAME (OPTIONAL)"
                            value={formData.teamName}
                            onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                            style={{ width: '100%', paddingLeft: '48px', height: '56px', fontSize: '0.9rem', letterSpacing: '0.5px' }}
                        />
                    </div>

                    <button type="submit" className="gold-button" style={{ height: '56px', marginTop: '1rem', fontSize: '1rem' }} disabled={isLoading}>
                        {isLoading ? 'ENROLLING...' : 'ENROLL_OPERATIVE'}
                    </button>
                </form>

                <div style={{ marginTop: '3rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
                    <Link to="/login" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}>
                        <ArrowLeft size={16} /> DATA UPLINK DETECTED? LOGIN
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
