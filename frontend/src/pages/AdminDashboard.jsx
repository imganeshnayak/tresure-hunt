import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import api from '../api';
import { Users, BookOpen, Plus, Trash2, Eye, EyeOff, QrCode, X, Edit2, Save, Skull } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

const AdminDashboard = () => {
    const { logout } = useAuth();
    const { clues, updateClue, deleteClue, allTeams } = useGame();
    const [activeTab, setActiveTab] = useState('clues');
    const [selectedQR, setSelectedQR] = useState(null);
    const [editingClue, setEditingClue] = useState(null);
    const [decoys, setDecoys] = useState([]);
    const [editingDecoy, setEditingDecoy] = useState(null);

    useEffect(() => {
        if (activeTab === 'decoys') {
            api.get('/decoys').then(res => setDecoys(res.data)).catch(() => { });
        }
    }, [activeTab]);

    const handleSaveDecoy = async (d) => {
        if (!d.label?.trim() || !d.message?.trim()) {
            alert('Please fill in both the Label and the Troll Message before saving.');
            return;
        }
        try {
            const res = await api.post('/decoys', d);
            setDecoys(prev => {
                const idx = prev.findIndex(x => x._id === res.data._id);
                if (idx >= 0) { const n = [...prev]; n[idx] = res.data; return n; }
                return [...prev, res.data];
            });
            setEditingDecoy(null);
        } catch (err) {
            console.error('Save decoy error:', err.response?.data || err.message);
            alert(`Failed to save decoy: ${err.response?.data?.message || err.message}`);
        }
    };

    const handleDeleteDecoy = async (id) => {
        await api.delete(`/decoys/${id}`);
        setDecoys(prev => prev.filter(d => d._id !== id));
    };

    const toggleDecoyPublish = (d) => handleSaveDecoy({ ...d, published: !d.published });

    const handleDownloadQR = () => {
        const svg = document.getElementById('qr-svg-download');
        if (!svg) return;
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const size = 300;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, size, size);
            ctx.drawImage(img, 0, 0, size, size);
            const link = document.createElement('a');
            const label = selectedQR?.label || `level-${selectedQR?.level}`;
            link.download = `qr-${label.replace(/\s+/g, '-').toLowerCase()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    const formatTime = (isoString) => {
        if (!isoString) return '---';
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleAddClue = () => {
        const nextLevel = clues.length + 1;
        const newClue = {
            level: nextLevel,
            type: 'mcq',
            mcqQuestion: "The riddle or question...",
            mcqOptions: ["Option 1", "Option 2", "Option 3", "Option 4"],
            mcqAnswer: "Option 1",
            clueText: "Where to go next?",
            published: false
        };
        setEditingClue(newClue);
    };

    const handleSaveClue = async (clueData) => {
        const success = await updateClue(clueData);
        if (success) setEditingClue(null);
    };

    const togglePublish = (clue) => {
        updateClue({ ...clue, published: !clue.published });
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...editingClue.mcqOptions];
        newOptions[index] = value;
        setEditingClue({ ...editingClue, mcqOptions: newOptions });
    };

    return (
        <div className="container" style={{ minHeight: '100vh', padding: '3rem 1rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4rem' }}>
                <div>
                    <h1 style={{ color: 'var(--amber-gold)', fontSize: '2.8rem', fontWeight: '800', letterSpacing: '-1px', marginBottom: '0.5rem' }}>OFFICER'S QUARTERS</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Command center for the great treasure hunt</p>
                </div>
                <button className="gold-button" style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }} onClick={logout}>Abandon Ship (Logout)</button>
            </header>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '3rem', padding: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px' }}>
                <button
                    onClick={() => setActiveTab('clues')}
                    style={{
                        padding: '0.8rem 1.5rem',
                        background: activeTab === 'clues' ? 'rgba(255, 170, 0, 0.1)' : 'transparent',
                        color: activeTab === 'clues' ? 'var(--amber-gold)' : 'var(--text-secondary)',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.3s ease',
                        fontWeight: activeTab === 'clues' ? '600' : '400'
                    }}
                >
                    <BookOpen size={18} /> Clues Management
                </button>
                <button
                    onClick={() => setActiveTab('tracking')}
                    style={{
                        padding: '0.8rem 1.5rem',
                        background: activeTab === 'tracking' ? 'rgba(255, 170, 0, 0.1)' : 'transparent',
                        color: activeTab === 'tracking' ? 'var(--amber-gold)' : 'var(--text-secondary)',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.3s ease',
                        fontWeight: activeTab === 'tracking' ? '600' : '400'
                    }}
                >
                    <Users size={18} /> Crew Tracking
                </button>
                <button
                    onClick={() => setActiveTab('decoys')}
                    style={{
                        padding: '0.8rem 1.5rem',
                        background: activeTab === 'decoys' ? 'rgba(255, 170, 0, 0.1)' : 'transparent',
                        color: activeTab === 'decoys' ? 'var(--amber-gold)' : 'var(--text-secondary)',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.3s ease',
                        fontWeight: activeTab === 'decoys' ? '600' : '400'
                    }}
                >
                    <Skull size={18} /> Decoy QR Codes
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'clues' ? (
                    <motion.div
                        key="clues"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Journey Landmarks</h2>
                            <button className="gold-button" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }} onClick={handleAddClue}>
                                <Plus size={20} /> New Landmark
                            </button>
                        </div>

                        <div style={{ display: 'grid', gap: '1.2rem' }}>
                            {clues.map((clue) => (
                                <div key={clue._id || clue.level} className="premium-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.6rem' }}>
                                            <span style={{ color: 'var(--amber-gold)', fontWeight: '800', fontSize: '0.9rem', letterSpacing: '1px' }}>LANDMARK {clue.level}</span>
                                            <span style={{
                                                fontSize: '0.65rem',
                                                color: clue.published ? '#4caf50' : 'var(--text-secondary)',
                                                background: clue.published ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255,255,255,0.05)',
                                                padding: '3px 10px',
                                                borderRadius: '20px',
                                                fontWeight: '600'
                                            }}>
                                                {clue.published ? 'PUBLISHED' : 'DRAFT'}
                                            </span>
                                        </div>
                                        <p style={{ fontWeight: '500', fontSize: '1.1rem', marginBottom: '0.4rem' }}>{clue.mcqQuestion}</p>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                            <span style={{ color: 'var(--amber-gold)', opacity: 0.7 }}>Next Hint:</span> {clue.clueText}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                                        <button onClick={() => setEditingClue(clue)} title="Edit" className="flex-center" style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                const token = localStorage.getItem('treasure_token');
                                                const tokenParam = token ? `&t=${encodeURIComponent(token)}` : '';
                                                const baseUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
                                                setSelectedQR({ ...clue, url: `${baseUrl}/dashboard?unlock=${clue.level}${tokenParam}` });
                                            }}
                                            title="View QR"
                                            className="flex-center"
                                            style={{ width: '40px', height: '40px', background: 'rgba(255, 170, 0, 0.05)', border: '1px solid rgba(255, 170, 0, 0.2)', borderRadius: '10px', cursor: 'pointer', color: 'var(--amber-gold)' }}
                                        >
                                            <QrCode size={18} />
                                        </button>
                                        <button onClick={() => togglePublish(clue)} title={clue.published ? "Unpublish" : "Publish"} className="flex-center" style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                            {clue.published ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm(`Are you sure you want to delete Landmark ${clue.level}? This cannot be undone.`)) {
                                                    deleteClue(clue._id);
                                                }
                                            }}
                                            title="Delete"
                                            className="flex-center"
                                            style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.03)', border: '1px solid #330000', borderRadius: '10px', cursor: 'pointer', color: '#ff4444' }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ) : activeTab === 'decoys' ? (
                    <motion.div
                        key="decoys"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Ghost Traps</h2>
                            <button className="gold-button" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}
                                onClick={() => setEditingDecoy({ label: '', message: '', published: false })}
                            >
                                <Plus size={20} /> Create Trap
                            </button>
                        </div>

                        <div style={{ display: 'grid', gap: '1.2rem' }}>
                            {decoys.length === 0 && (
                                <div className="premium-card" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '4rem' }}>
                                    <Skull size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                                    <p>The waters are safe... for now. Add some decoys!</p>
                                </div>
                            )}
                            {decoys.map((decoy) => (
                                <div key={decoy._id} className="premium-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.6rem' }}>
                                            <Skull size={16} color="var(--amber-gold)" />
                                            <span style={{ fontWeight: '800', color: 'var(--amber-gold)', fontSize: '0.9rem', letterSpacing: '1px' }}>{decoy.label.toUpperCase()}</span>
                                            {decoy.published && <span style={{ fontSize: '0.65rem', color: 'var(--amber-gold)', background: 'rgba(255, 170, 0, 0.1)', padding: '3px 10px', borderRadius: '20px', fontWeight: '600' }}>ACTIVE TRAP</span>}
                                        </div>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>"{decoy.message}"</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                                        <button onClick={() => setEditingDecoy(decoy)} title="Edit" className="flex-center" style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                const baseUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
                                                setSelectedQR({ url: `${baseUrl}/dashboard?decoy=${decoy._id}`, label: decoy.label });
                                            }}
                                            title="View QR"
                                            className="flex-center"
                                            style={{ width: '40px', height: '40px', background: 'rgba(255, 170, 0, 0.05)', border: '1px solid rgba(255, 170, 0, 0.2)', borderRadius: '10px', cursor: 'pointer', color: 'var(--amber-gold)' }}
                                        >
                                            <QrCode size={18} />
                                        </button>
                                        <button onClick={() => toggleDecoyPublish(decoy)} title={decoy.published ? "Deactivate" : "Activate"} className="flex-center" style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                            {decoy.published ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                        <button onClick={() => handleDeleteDecoy(decoy._id)} title="Delete" className="flex-center" style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.03)', border: '1px solid #330000', borderRadius: '10px', cursor: 'pointer', color: '#ff4444' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="tracking"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                    >
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '2rem' }}>Tracking the Fleet</h2>
                        <div className="premium-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                                <thead style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                                    <tr>
                                        <th style={{ padding: '1.5rem', fontWeight: '600', color: 'var(--text-secondary)' }}>TEAM NAME</th>
                                        <th style={{ padding: '1.5rem', fontWeight: '600', color: 'var(--text-secondary)' }}>POSITION</th>
                                        <th style={{ padding: '1.5rem', fontWeight: '600', color: 'var(--text-secondary)' }}>START TIME</th>
                                        <th style={{ padding: '1.5rem', fontWeight: '600', color: 'var(--text-secondary)' }}>STATUS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allTeams.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No crew members on the horizon.</td>
                                        </tr>
                                    ) : allTeams.map(team => (
                                        <tr key={team._id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s ease' }}>
                                            <td style={{ padding: '1.5rem', fontWeight: '700' }}>{team.username.toUpperCase()}</td>
                                            <td style={{ padding: '1.5rem' }}>
                                                <span style={{ color: 'var(--amber-gold)', fontWeight: '600' }}>
                                                    {team.status === 'finished' ? '🏁 FINISHED' : `📍 Level ${team.currentLevel}`}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.5rem', color: 'var(--text-secondary)' }}>{formatTime(team.startTime)}</td>
                                            <td style={{ padding: '1.5rem' }}>
                                                <span style={{
                                                    color: team.status === 'finished' ? '#4caf50' : 'var(--amber-gold)',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '700',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    {team.status.toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MCQ Editor Modal */}
            <AnimatePresence>
                {editingClue && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <div className="premium-card" style={{ width: '90%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                                <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Edit Landmark {editingClue.level}</h2>
                                <button onClick={() => setEditingClue(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={24} /></button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--amber-gold)', marginBottom: '0.8rem', display: 'block', letterSpacing: '1px' }}>VALIDATION TYPE</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '10px' }}>
                                        <button
                                            onClick={() => setEditingClue({ ...editingClue, type: 'mcq' })}
                                            style={{
                                                flex: 1, padding: '0.6rem', border: 'none', borderRadius: '8px', cursor: 'pointer',
                                                background: editingClue.type === 'mcq' ? 'rgba(255, 170, 0, 0.1)' : 'transparent',
                                                color: editingClue.type === 'mcq' ? 'var(--amber-gold)' : 'var(--text-secondary)',
                                                fontWeight: '600'
                                            }}
                                        >
                                            MULTIPLE CHOICE
                                        </button>
                                        <button
                                            onClick={() => setEditingClue({ ...editingClue, type: 'text' })}
                                            style={{
                                                flex: 1, padding: '0.6rem', border: 'none', borderRadius: '8px', cursor: 'pointer',
                                                background: editingClue.type === 'text' ? 'rgba(255, 170, 0, 0.1)' : 'transparent',
                                                color: editingClue.type === 'text' ? 'var(--amber-gold)' : 'var(--text-secondary)',
                                                fontWeight: '600'
                                            }}
                                        >
                                            TEXT INPUT (Q&A)
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--amber-gold)', marginBottom: '0.8rem', display: 'block', letterSpacing: '1px' }}>QUESTION / RIDDLE</label>
                                    <textarea
                                        className="input-field"
                                        value={editingClue.mcqQuestion}
                                        onChange={e => setEditingClue({ ...editingClue, mcqQuestion: e.target.value })}
                                        placeholder="The riddle or question..."
                                        style={{ minHeight: '100px', width: '100%', resize: 'none' }}
                                    />
                                </div>

                                {editingClue.type === 'mcq' ? (
                                    <div>
                                        <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--amber-gold)', marginBottom: '0.8rem', display: 'block', letterSpacing: '1px' }}>OPTIONS (CHECK THE CORRECT ONE)</label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                            {(editingClue.mcqOptions || ["", "", "", ""]).map((opt, i) => (
                                                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                    <input
                                                        type="radio"
                                                        name="mcqAnswer"
                                                        checked={editingClue.mcqAnswer === opt}
                                                        onChange={() => setEditingClue({ ...editingClue, mcqAnswer: opt })}
                                                        style={{ width: '22px', height: '22px', accentColor: 'var(--amber-gold)', cursor: 'pointer' }}
                                                    />
                                                    <input
                                                        className="input-field"
                                                        value={opt}
                                                        onChange={e => handleOptionChange(i, e.target.value)}
                                                        placeholder={`Option ${i + 1}`}
                                                        style={{ flex: 1, padding: '12px' }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--amber-gold)', marginBottom: '0.8rem', display: 'block', letterSpacing: '1px' }}>ACCEPTED ANSWER</label>
                                        <input
                                            className="input-field"
                                            value={editingClue.mcqAnswer}
                                            onChange={e => setEditingClue({ ...editingClue, mcqAnswer: e.target.value })}
                                            placeholder="The exact answer to solve the level..."
                                            style={{ width: '100%', padding: '12px' }}
                                        />
                                        <p style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Matches are case-insensitive for text inputs.</p>
                                    </div>
                                )}

                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--amber-gold)', marginBottom: '0.8rem', display: 'block', letterSpacing: '1px' }}>REVEALED CLUE TO NEXT LOCATION</label>
                                    <textarea
                                        className="input-field"
                                        value={editingClue.clueText}
                                        onChange={e => setEditingClue({ ...editingClue, clueText: e.target.value })}
                                        placeholder="Where should they go next?"
                                        style={{ minHeight: '80px', width: '100%', resize: 'none' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '1.2rem', marginTop: '1rem' }}>
                                    <button className="gold-button" style={{ flex: 1.5 }} onClick={() => handleSaveClue(editingClue)}>Save Milestone</button>
                                    <button className="gold-button" style={{ flex: 1, background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }} onClick={() => setEditingClue(null)}>Cancel</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* Decoy Editor Modal */}
            <AnimatePresence>
                {editingDecoy && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1001 }}>
                        <div className="premium-card" style={{ padding: '2.5rem', width: '90%', maxWidth: '450px', border: '1px solid rgba(255, 170, 0, 0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                                <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Ghost Trap</h2>
                                <button onClick={() => setEditingDecoy(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={24} /></button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--amber-gold)', marginBottom: '0.8rem', display: 'block', letterSpacing: '1px' }}>ADMIN LABEL</label>
                                    <input className="input-field" value={editingDecoy.label} onChange={e => setEditingDecoy({ ...editingDecoy, label: e.target.value })} placeholder="e.g. Fake Fountain" style={{ width: '100%' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--amber-gold)', marginBottom: '0.8rem', display: 'block', letterSpacing: '1px' }}>TROLL MESSAGE</label>
                                    <textarea className="input-field" value={editingDecoy.message} onChange={e => setEditingDecoy({ ...editingDecoy, message: e.target.value })} placeholder="Ha! You've been fooled..." style={{ minHeight: '100px', width: '100%', resize: 'none' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button className="gold-button" style={{ flex: 1 }} onClick={() => handleSaveDecoy(editingDecoy)}>Set Trap</button>
                                    <button className="gold-button" style={{ flex: 1, background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }} onClick={() => setEditingDecoy(null)}>Abort</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* QR Modal */}
            <AnimatePresence>
                {selectedQR && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}
                        onClick={() => setSelectedQR(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="premium-card"
                            style={{ padding: '3rem', textAlign: 'center', background: '#fff', color: '#000', width: '90%', maxWidth: '400px' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: '800' }}>
                                    {selectedQR.label ? `${selectedQR.label.toUpperCase()}` : `LANDMARK ${selectedQR.level}`}
                                </h3>
                                <X size={24} onClick={() => setSelectedQR(null)} style={{ cursor: 'pointer', color: '#888' }} />
                            </div>
                            <div style={{ padding: '1.5rem', background: '#fff', border: '1px solid #eee', borderRadius: '12px', marginBottom: '2rem', display: 'inline-block' }}>
                                <QRCodeSVG id="qr-svg-download" value={selectedQR.url} size={220} />
                            </div>
                            <p style={{ color: '#666', fontSize: '0.8rem', marginBottom: '2.5rem', wordBreak: 'break-all', opacity: 0.6 }}>{selectedQR.url}</p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="gold-button" style={{ flex: 1, height: '50px' }} onClick={handleDownloadQR}>Download PNG</button>
                                <button className="gold-button" style={{ flex: 1, height: '50px', background: 'transparent', border: '2px solid #000', color: '#000' }} onClick={() => window.print()}>Print QR</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default AdminDashboard;
