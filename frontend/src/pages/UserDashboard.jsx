import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import {
    QrCode, Timer, Shield, Trophy, CheckCircle, XCircle,
    Skull, AlertTriangle, Play, X, LogOut, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QrScanner from '../components/QrScanner';

const UserDashboard = () => {
    const {
        gameState,
        clues,
        startHunt,
        submitAnswer,
        scanDecoy,
        leaderboard,
        loading,
        clearAlerts
    } = useGame();
    const { user, logout } = useAuth();

    const currentClue = clues.find(c => c.level === gameState.currentLevel);
    const [searchParams, setSearchParams] = useSearchParams();
    const [isScanning, setIsScanning] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [feedback, setFeedback] = useState(null);
    const [textAnswer, setTextAnswer] = useState('');

    // Re-usable: resolve an 'unlock' param that may be a MongoDB _id or a legacy level number
    const resolveUnlockParam = (unlock) => {
        if (!unlock || unlock.trim() === '') return null;
        const isObjectId = /^[a-f\d]{24}$/i.test(unlock);
        if (isObjectId) {
            const clue = clues.find(c => c._id === unlock);
            return clue ? clue.level : null; // null = clues not loaded yet, retry on next render
        }
        const n = parseInt(unlock);
        return isNaN(n) ? null : n;
    };

    // Handle initial link scan (from phone camera)
    useEffect(() => {
        const unlock = searchParams.get('unlock');
        const decoy = searchParams.get('decoy');

        if (unlock && unlock.trim() !== '') {
            const level = resolveUnlockParam(unlock);
            if (level !== null) {
                startHunt(level);
                setSearchParams({}, { replace: true });
            }
            // If level is null, clues aren't loaded yet — wait for re-render with clues in deps
        } else if (decoy && decoy.trim() !== '') {
            scanDecoy(decoy);
            setSearchParams({}, { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, clues]); // clues needed to resolve _id → current level

    useEffect(() => {
        let interval;
        if (gameState.status === 'playing' && gameState.startTime) {
            interval = setInterval(() => {
                const start = new Date(gameState.startTime).getTime();
                const now = new Date().getTime();
                setElapsedTime(Math.floor((now - start) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameState.status, gameState.startTime]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleOptionClick = async (option) => {
        const res = await submitAnswer(option);
        if (res.success) {
            setFeedback({ type: 'success', message: 'Transmission Verified!' });
            setTimeout(() => setFeedback(null), 3000);
        } else {
            setFeedback({ type: 'error', message: 'Frequency Mismatch (Wrong Answer)' });
            setTimeout(() => setFeedback(null), 3000);
        }
    };

    const handleTextSubmit = async (e) => {
        e.preventDefault();
        if (!textAnswer.trim()) return;
        const res = await submitAnswer(textAnswer.trim());
        if (res.success) {
            setFeedback({ type: 'success', message: 'Transmission Verified!' });
            setTextAnswer('');
            setTimeout(() => setFeedback(null), 3000);
        } else {
            setFeedback({ type: 'error', message: 'Access Key Rejected' });
            setTimeout(() => setFeedback(null), 3000);
        }
    };

    const handleScanSuccess = (decodedText) => {
        setIsScanning(false);

        // Parse URL params from QR content
        let unlockRaw = null;
        let decoyRaw = null;
        try {
            // Try to parse as a full URL first
            const url = new URL(decodedText);
            unlockRaw = url.searchParams.get('unlock');
            decoyRaw = url.searchParams.get('decoy');
        } catch {
            // Plain text fallback (legacy raw level number)
            unlockRaw = decodedText?.trim();
        }

        if (unlockRaw) {
            const level = resolveUnlockParam(unlockRaw);
            if (level !== null) {
                startHunt(level);
                setFeedback({ type: 'success', message: `Station Node Linked!` });
                setTimeout(() => setFeedback(null), 3000);
            } else {
                setFeedback({ type: 'error', message: 'QR recognised but station data is still loading. Try again.' });
                setTimeout(() => setFeedback(null), 3000);
            }
        } else if (decoyRaw) {
            scanDecoy(decoyRaw.split('&')[0]);
        } else {
            setFeedback({ type: 'error', message: 'That be no map I recognize!' });
            setTimeout(() => setFeedback(null), 3000);
        }
    };

    if (loading) {
        return (
            <div className="flex-center" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
                <div style={{ textAlign: 'center' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} style={{ marginBottom: '2rem' }}>
                        <Shield size={60} color="var(--amber-gold)" />
                    </motion.div>
                    <h2 className="pirate-font" style={{ color: 'var(--amber-gold)', fontSize: '2rem' }}>DECRYPTING NODE...</h2>
                </div>
            </div>
        );
    }

    if (gameState.status === 'finished') {
        return (
            <div className="flex-center" style={{ minHeight: '100vh', padding: '2rem', flexDirection: 'column', background: 'var(--bg-primary)' }}>
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="premium-card"
                    style={{ maxWidth: '600px', width: '100%', padding: '4rem 3rem', textAlign: 'center', marginBottom: '3rem' }}
                >
                    <Trophy size={80} color="var(--amber-gold)" style={{ marginBottom: '2rem', filter: 'drop-shadow(0 0 20px var(--accent-glow))' }} />
                    <h1 style={{ fontSize: '4rem', fontWeight: '900', letterSpacing: '-2px', marginBottom: '1rem', color: 'var(--amber-gold)' }}>VICTORY</h1>
                    <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '3rem' }}>The treasure has been claimed. Your journey into legend begins here.</p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }} className="grid-2">
                        <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.5rem', letterSpacing: '1px' }}>TIME TAKEN</p>
                            <p style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--amber-gold)' }}>{formatTime(elapsedTime)}</p>
                        </div>
                        <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.5rem', letterSpacing: '1px' }}>FINAL SCORE</p>
                            <p style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--amber-gold)' }}>{gameState.score}</p>
                        </div>
                    </div>

                    <button className="gold-button" style={{ width: '100%', height: '60px', fontSize: '1.1rem' }} onClick={logout}>RETIRE TO SHORE (LOGOUT)</button>
                </motion.div>

                {leaderboard.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="premium-card"
                        style={{ maxWidth: '600px', width: '100%' }}
                    >
                        <h3 style={{ marginBottom: '2rem', textAlign: 'center' }}>HALL OF LEGENDS</h3>
                        <div style={{ overflowX: 'auto', width: '100%' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>RANK</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>TEAM</th>
                                        <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>SCORE</th>
                                        <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>TIME</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaderboard.slice(0, 5).map((entry, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '1rem', fontWeight: '700', color: i === 0 ? 'var(--amber-gold)' : 'inherit' }}>#{i + 1}</td>
                                            <td style={{ padding: '1rem', fontWeight: '600' }}>{entry.username.toUpperCase()}</td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>{entry.score}</td>
                                            <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                                                {entry.finishTime && entry.startTime
                                                    ? formatTime(Math.floor((new Date(entry.finishTime) - new Date(entry.startTime)) / 1000))
                                                    : '---'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </div>
        );
    }

    return (
        <div className="container" style={{ minHeight: '100vh' }}>
            {/* Header */}
            <div className="mobile-stack" style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '2px', marginBottom: '0.5rem' }}>
                        {user.role === 'admin' ? 'COMMANDER' : 'OPERATIVE'}
                    </h2>
                    <h1 style={{ fontSize: '2.8rem', fontWeight: '900', color: 'var(--amber-gold)', letterSpacing: '-1px' }}>
                        TEAM {user.username.toUpperCase()}
                    </h1>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div className="premium-card" style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.8rem', borderRadius: '12px', width: 'auto' }}>
                        <Timer size={18} color="var(--amber-gold)" />
                        <span style={{ fontFamily: 'Inter', fontWeight: '700', fontSize: '1rem', tabularNums: true }}>{formatTime(elapsedTime)}</span>
                    </div>
                    <div className="premium-card" style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.8rem', borderRadius: '12px', width: 'auto' }}>
                        <Shield size={18} color="var(--amber-gold)" />
                        <span style={{ fontWeight: '700', fontSize: '1rem' }}>STATION {gameState.currentLevel}</span>
                    </div>
                    <button
                        className="gold-button"
                        onClick={() => setIsScanning(true)}
                        style={{ height: '52px', padding: '0 1.5rem' }}
                    >
                        <QrCode size={20} />
                        SCAN
                    </button>
                    <button onClick={logout} title="Logout" style={{ width: '52px', height: '52px', borderRadius: '12px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <LogOut size={20} />
                    </button>
                </div>
            </div>

            {/* Decoy QR Troll Screen */}
            <AnimatePresence>
                {gameState.decoyMessage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(15px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}
                        onClick={() => clearAlerts()}
                    >
                        <motion.div
                            className="premium-card"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            style={{ padding: '4rem 3rem', textAlign: 'center', maxWidth: '450px', border: '1px solid rgba(255, 170, 0, 0.2)' }}
                        >
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                style={{ marginBottom: '2rem' }}
                            >
                                <Skull size={80} color="var(--amber-gold)" style={{ opacity: 0.8 }} />
                            </motion.div>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--amber-gold)', marginBottom: '1.5rem', letterSpacing: '-1px' }}>SYSTEM BREACH</h2>
                            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '3rem', lineHeight: '1.6' }}>
                                "{gameState.decoyMessage}"
                            </p>
                            <button className="gold-button" style={{ width: '100%' }} onClick={(e) => {
                                e.stopPropagation();
                                clearAlerts();
                            }}>
                                RELINK TO STATION {gameState.currentLevel}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); clearAlerts(); }}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', marginTop: '1.5rem', cursor: 'pointer', fontSize: '0.8rem', textTransform: 'uppercase' }}
                            >
                                DISMISS ALERT
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sequential Lock Screen */}
            <AnimatePresence>
                {gameState.lockedMessage && !gameState.decoyMessage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}
                    >
                        <motion.div
                            className="premium-card"
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            style={{ padding: '4rem 3rem', textAlign: 'center', maxWidth: '450px', border: '1px solid var(--amber-gold)' }}
                        >
                            <div style={{ marginBottom: '2rem' }}>
                                <AlertTriangle size={80} color="var(--amber-gold)" />
                            </div>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--amber-gold)', marginBottom: '1.5rem', letterSpacing: '-1px' }}>ACCESS DENIED</h2>
                            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '3rem', lineHeight: '1.6' }}>
                                {gameState.lockedMessage}
                            </p>
                            <button className="gold-button" style={{ width: '100%' }} onClick={(e) => {
                                e.stopPropagation();
                                clearAlerts();
                            }}>
                                RETURN TO STATION {gameState.currentLevel}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); clearAlerts(); }}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', marginTop: '1.5rem', cursor: 'pointer', fontSize: '0.8rem', textTransform: 'uppercase' }}
                            >
                                CLOSE ACCESS DENIED
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {gameState.status === 'idle' ? (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}
                    >
                        <div className="premium-card" style={{ padding: '4rem 3rem', textAlign: 'center', maxWidth: '550px' }}>
                            <div style={{ marginBottom: '2.5rem' }}>
                                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 3 }}>
                                    <Play size={64} color="var(--amber-gold)" style={{ marginLeft: '8px' }} />
                                </motion.div>
                            </div>
                            <h2 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '1rem' }}>MISSION READY</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '3rem', lineHeight: '1.6' }}>
                                The grid is mapped. Locate the physical QR nodes to unlock mission data and progress through the levels.
                            </p>
                            <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
                                <button className="gold-button" onClick={() => startHunt(1)} style={{ flex: 1.5, height: '60px' }}>
                                    INITIALIZE JOURNEY
                                </button>
                                <button
                                    className="premium-card"
                                    onClick={() => setIsScanning(true)}
                                    style={{ padding: 0, cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', gap: '0.8rem', justifyContent: 'center', height: '60px', background: 'transparent' }}
                                >
                                    <QrCode size={20} />
                                    SCAN NODE
                                </button>
                            </div>
                        </div>

                        <div className="premium-card" style={{ padding: '2rem', maxWidth: '550px', width: '100%', border: '1px dashed var(--glass-border)' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--amber-gold)', marginBottom: '1.5rem', letterSpacing: '1px' }}>HOW TO PLAY</h3>
                            <ul style={{ textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.9rem', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                <li>Scan the <strong>Mission QR</strong> at each location to unlock the secret question.</li>
                                <li>Answer the question correctly to reveal the <strong>next coordinates</strong>.</li>
                                <li><strong>Anti-Cheat:</strong> You must visit locations in order. Scanning ahead will trigger a system lock!</li>
                                <li>Beware of <strong>Ghost Traps</strong> (Decoy QRs) scattered around the field!</li>
                            </ul>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="playing"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                        <div className="premium-card" style={{ padding: '4rem 3rem', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--amber-gold)', boxShadow: '0 0 10px var(--amber-gold)' }}></div>
                                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)', letterSpacing: '2px' }}>MISSION PHASE {gameState.currentLevel}</span>
                            </div>

                            {gameState.revealedClue ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    style={{ textAlign: 'center', marginTop: '2rem' }}
                                >
                                    <div style={{ marginBottom: '2.5rem' }}>
                                        <CheckCircle size={64} color="var(--amber-gold)" style={{ filter: 'drop-shadow(0 0 15px var(--accent-glow))' }} />
                                    </div>
                                    <h3 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--amber-gold)', marginBottom: '1rem', letterSpacing: '-1px' }}>DATA DECRYPTED</h3>
                                    <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '3rem' }}>The next coordinate has been extracted:</p>
                                    <div className="premium-card" style={{ padding: '2rem', background: 'rgba(255,170,0,0.03)', border: '1px dashed var(--amber-gold)' }}>
                                        <p style={{ fontSize: '1.5rem', fontWeight: '600', color: '#fff', fontStyle: 'italic', lineHeight: '1.4' }}>
                                            "{gameState.revealedClue}"
                                        </p>
                                    </div>
                                    <p style={{ marginTop: '3rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                        Move to the specified location and await further instructions.
                                    </p>
                                </motion.div>
                            ) : (
                                <div style={{ marginTop: '2rem' }}>
                                    <h3 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '3rem', lineHeight: '1.5', color: '#fff' }}>
                                        {currentClue ? `"${currentClue.mcqQuestion}"` : "ACCESSING CLOUD DATA NODE..."}
                                    </h3>

                                    {currentClue?.type === 'text' ? (
                                        <form onSubmit={handleTextSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                                            <input
                                                className="input-field"
                                                value={textAnswer}
                                                onChange={e => setTextAnswer(e.target.value)}
                                                placeholder="Enter the transmission key..."
                                                style={{ textAlign: 'center', fontSize: '1.1rem' }}
                                                autoFocus
                                            />
                                            <button type="submit" className="gold-button" style={{ height: '60px', fontSize: '1rem', fontWeight: '800' }}>
                                                EXECUTE VALIDATION
                                            </button>
                                        </form>
                                    ) : (
                                        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '2rem' }}>
                                            {currentClue?.mcqOptions.map((option, index) => (
                                                <button
                                                    key={index}
                                                    className="option-button"
                                                    onClick={() => handleOptionClick(option)}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'center', minHeight: '30px' }}>
                                        <AnimatePresence>
                                            {feedback && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0 }}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: feedback.type === 'success' ? '#4caf50' : '#ff4444' }}
                                                >
                                                    {feedback.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                                    <span style={{ fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '0.9rem' }}>{feedback.message}</span>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                            <button
                                onClick={logout}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}
                            >
                                TERMINATE SESSION
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isScanning && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}
                    >
                        <div className="premium-card" style={{ width: '100%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--glass-border)', padding: '2rem 1.5rem' }}>
                            <button
                                onClick={() => setIsScanning(false)}
                                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <X size={20} />
                            </button>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '2px', color: 'var(--amber-gold)' }}>SCANNER_ACTIVE</h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '600', marginTop: '0.4rem' }}>ALIGN QR CODE TO DECRYPT NODE</p>
                            </div>

                            <div style={{ borderRadius: '15px', overflow: 'hidden', border: '1px solid var(--glass-border)', background: '#000' }}>
                                <QrScanner onScanSuccess={handleScanSuccess} />
                            </div>

                            <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                Point your camera at the physical mission marker.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserDashboard;
