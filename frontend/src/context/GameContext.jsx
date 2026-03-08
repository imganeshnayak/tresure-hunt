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
        const startTime = Date.now();
        setGameState(prev => ({
            ...prev,
            startTime,
            status: 'playing',
            currentLevel: level,
            hintsUsed: [],
            revealedClue: null,
            decoyMessage: null,
            lockedMessage: null
        }));

        if (user) {
            // Only reset score on a fresh start (idle), not when relinking
            await api.post('/game/progress', {
                level: level,
                score: gameState.status === 'idle' ? 0 : gameState.score,
                hintsUsed: gameState.status === 'idle' ? [] : gameState.hintsUsed
            });
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

    const submitAnswer = async (answer, username) => {
        const currentClue = clues.find(c => c.level === gameState.currentLevel);
        if (!currentClue) return { success: false, message: 'Clue not found' };

        try {
            // Verify with backend securely
            const verifyRes = await api.post('/game/verify-answer', {
                answer: answer,
                level: gameState.currentLevel
            });

            const isCorrect = verifyRes.data.success;

            if (isCorrect) {
                const revealedClue = verifyRes.data.clueText;

                // Re-fetch or filter published clues to get the latest count
                const sortedClues = [...clues]
                    .filter(c => user.role === 'admin' || c.published)
                    .sort((a, b) => a.level - b.level);

                const currentIndex = sortedClues.findIndex(c => c.level === gameState.currentLevel);
                const isFinished = currentIndex === sortedClues.length - 1;

                const nextClue = isFinished ? null : sortedClues[currentIndex + 1];
                const nextLevel = isFinished ? gameState.currentLevel : nextClue.level;
                const newScore = gameState.score + 100;

                if (isFinished) {
                    const timeTaken = Math.floor((Date.now() - gameState.startTime) / 1000);
                    await api.post('/game/finish', { score: newScore, time: timeTaken });
                    fetchData(); // Refresh leaderboard and teams
                } else if (user) {
                    // We advance the level in DB but keep the user on current screen to see the clue
                    await api.post('/game/progress', {
                        level: nextLevel,
                        score: newScore,
                        hintsUsed: gameState.hintsUsed
                    });
                }

                setGameState(prev => ({
                    ...prev,
                    // We DON'T auto-advance currentLevel here so they can read the clue
                    // They advance by scanning the next QR code
                    status: isFinished ? 'finished' : 'playing',
                    score: newScore,
                    revealedClue: revealedClue
                }));
                return { success: true, finished: isFinished, clueText: revealedClue };
            }
            return { success: false };
        } catch (err) {
            // Handle the sequential lock 403
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
