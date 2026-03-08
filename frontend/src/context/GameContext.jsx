import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from './AuthContext';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
    const { user } = useAuth();
    const [clues, setClues] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [allTeams, setAllTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    const [gameState, setGameState] = useState({
        currentLevel: 1,
        startTime: null,
        status: 'idle',
        score: 0,
        hintsUsed: [],
        revealedClue: null, // Store clue for next location
        lockedMessage: null, // Set when user scans a wrong-level QR
        decoyMessage: null   // Set when user scans a fake/decoy QR
    });

    const fetchData = async () => {
        try {
            // Leaderboard is always public
            const lbRes = await api.get('/game/leaderboard');
            setLeaderboard(lbRes.data);

            if (user) {
                const endpoint = user.role === 'admin' ? '/clues' : '/clues/published';
                const res = await api.get(endpoint);
                setClues(res.data);

                if (user.role === 'admin') {
                    const teamsRes = await api.get('/game/all-teams');
                    setAllTeams(teamsRes.data);
                }
            }
        } catch (err) {
            console.error('Error fetching game data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const startHunt = async (level = 1) => {
        try {
            // Call backend FIRST — it enforces sequential order.
            // If the user scans a future station's QR, backend returns 403 locked.
            await api.post('/game/progress', {
                level,
                score: gameState.score,
                hintsUsed: gameState.hintsUsed
            });

            // Backend accepted — safe to update local UI state
            setGameState(prev => ({
                ...prev,
                startTime: prev.startTime || Date.now(),
                status: 'playing',
                currentLevel: level,
                hintsUsed: prev.hintsUsed || [],
                revealedClue: null,
                decoyMessage: null,
                lockedMessage: null
            }));
        } catch (err) {
            // Backend rejected — show locked overlay, do NOT change currentLevel
            if (err.response?.status === 403 && err.response?.data?.locked) {
                setGameState(prev => ({
                    ...prev,
                    lockedMessage: err.response.data.message,
                    decoyMessage: null
                }));
            }
        }
    };

    const useHint = async (level) => {
        if (!gameState.hintsUsed.includes(level)) {
            const newHints = [...gameState.hintsUsed, level];
            const newScore = Math.max(0, gameState.score - 50);

            setGameState(prev => ({
                ...prev,
                hintsUsed: newHints,
                score: newScore
            }));

            if (user) {
                await api.post('/game/progress', {
                    level: gameState.currentLevel,
                    score: newScore,
                    hintsUsed: newHints
                });
            }
        }
    };

    const scanDecoy = async (decoyId) => {
        try {
            const res = await api.get(`/decoys/${decoyId}`);
            setGameState(prev => ({ ...prev, decoyMessage: res.data.message, lockedMessage: null }));
            return { isDecoy: true, message: res.data.message };
        } catch (err) {
            return { isDecoy: false };
        }
    };

    const submitAnswer = async (answer) => {
        try {
            // verify-answer handles: sequential lock, answer check, level advance, score update — all in one call
            const verifyRes = await api.post('/game/verify-answer', {
                answer,
                level: gameState.currentLevel
            });

            const { success, clueText, nextLevel, finished } = verifyRes.data;

            if (success) {
                const newScore = gameState.score + 100;
                if (finished) {
                    fetchData(); // Refresh leaderboard
                }
                setGameState(prev => ({
                    ...prev,
                    status: finished ? 'finished' : 'playing',
                    score: newScore,
                    revealedClue: clueText
                    // currentLevel stays the same here — advances when user scans next QR
                }));
                return { success: true, finished, clueText };
            }
            return { success: false };
        } catch (err) {
            if (err.response?.status === 403 && err.response?.data?.locked) {
                setGameState(prev => ({ ...prev, lockedMessage: err.response.data.message, decoyMessage: null }));
                return { success: false, locked: true, message: err.response.data.message };
            }
            return { success: false };
        }
    };

    const updateClue = async (clueData) => {
        try {
            const res = await api.post('/clues', clueData);
            await fetchData(); // Refresh everything
            return true;
        } catch (err) {
            return false;
        }
    };

    const deleteClue = async (id) => {
        if (!id) {
            console.error('Delete clue error: No ID provided');
            return false;
        }
        try {
            await api.delete(`/clues/${id}`);
            await fetchData();
            return true;
        } catch (err) {
            console.error('Delete clue error:', err);
            return false;
        }
    };

    const reorderClues = async (orderedIds) => {
        try {
            await api.post('/clues/reorder', { orderedIds });
            await fetchData();
            return true;
        } catch (err) {
            console.error('Reorder error:', err);
            return false;
        }
    };

    const clearAlerts = () => {
        setGameState(prev => ({
            ...prev,
            decoyMessage: null,
            lockedMessage: null
        }));
    };

    return (
        <GameContext.Provider value={{
            clues,
            setClues,
            gameState,
            allTeams,
            startHunt,
            submitAnswer,
            scanDecoy,
            useHint,
            leaderboard,
            loading,
            updateClue,
            deleteClue,
            reorderClues,
            clearAlerts,
            refreshData: fetchData
        }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => useContext(GameContext);
