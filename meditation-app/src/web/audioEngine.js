/**
 * AudioEngine — owns the Web Audio context, the analyser graph and the
 * session clock. Extracted from player.html so audio scheduling lives in
 * one module.
 */
window.AudioEngine = (function () {
    'use strict';

    let audioCtx = null;
    let analyser = null;
    let sourceNode = null;
    let graphElement = null;
    let sessionClock = null;
    let sessionStartedAt = 0;

    /**
     * Ensure a running AudioContext exists and is resumed.
     * @returns {AudioContext}
     */
    function ensureContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    }

    /**
     * Attach an analyser to the given audio element (idempotent).
     * @param {AudioContext} ctx - the audio context to build the graph in.
     * @param {HTMLAudioElement} audioElement - element to analyse.
     * @returns {AnalyserNode|null} the analyser, or null if analysis failed.
     */
    function setupAnalyser(ctx, audioElement) {
        if (!ctx || !audioElement) return analyser || null;
        if (graphElement === audioElement) return analyser;

        try { if (sourceNode) sourceNode.disconnect(); } catch (e) { }
        try { if (analyser) analyser.disconnect(); } catch (e) { }

        analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.92;
        try {
            sourceNode = ctx.createMediaElementSource(audioElement);
            sourceNode.connect(analyser);
            analyser.connect(ctx.destination);
            graphElement = audioElement;
        } catch (err) {
            console.warn('Audio analysis unavailable:', err);
            sourceNode = null;
            graphElement = null;
        }
        return analyser;
    }

    /**
     * Resume the context if needed and start playback of the element.
     * @param {HTMLAudioElement} audioElement
     * @returns {Promise} the play() promise.
     */
    function playElement(audioElement) {
        const ctx = ensureContext();
        if (ctx.state !== 'running') ctx.resume();
        return audioElement.play();
    }

    /**
     * Mark the session start time relative to the element's current position.
     * @param {number} currentSeconds - audioElement.currentTime (seconds).
     */
    function markSessionStart(currentSeconds) {
        if (!sessionStartedAt) {
            sessionStartedAt = Date.now() - Math.round((currentSeconds || 0) * 1000);
        }
    }

    function getSessionStartedAt() {
        return sessionStartedAt;
    }

    function resetSessionStartedAt() {
        sessionStartedAt = 0;
    }

    /**
     * Start the 500ms session clock tick (idempotent).
     * @param {Function} tick - callback invoked immediately and every 500ms.
     */
    function startSessionClock(tick) {
        stopSessionClock();
        sessionClock = setInterval(tick, 500);
        if (typeof tick === 'function') tick();
    }

    function stopSessionClock() {
        if (sessionClock) {
            clearInterval(sessionClock);
            sessionClock = null;
        }
        sessionStartedAt = 0;
    }

    function isClockRunning() {
        return sessionClock !== null;
    }

    return {
        ensureContext: ensureContext,
        setupAnalyser: setupAnalyser,
        playElement: playElement,
        markSessionStart: markSessionStart,
        getSessionStartedAt: getSessionStartedAt,
        resetSessionStartedAt: resetSessionStartedAt,
        startSessionClock: startSessionClock,
        stopSessionClock: stopSessionClock,
        isClockRunning: isClockRunning,
        get ctx() { return audioCtx; }
    };
})();
