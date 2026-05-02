// Control Panel functionality
document.addEventListener('DOMContentLoaded', function() {
    const runOwnerAiBtn = document.getElementById('run-owner-ai');
    const generateBeatBtn = document.getElementById('generate-beat');
    const generateLyricsBtn = document.getElementById('generate-lyrics');
    const produceSongBtn = document.getElementById('produce-song');
    const outputConsole = document.getElementById('output-console');

    function logToConsole(message) {
        outputConsole.textContent += message + '\n';
        outputConsole.scrollTop = outputConsole.scrollHeight;
    }

    async function runCommand(endpoint, commandName) {
        logToConsole(`Starting ${commandName}...`);
        try {
            const response = await fetch(endpoint, { method: 'POST' });
            const data = await response.json();

            if (data.success) {
                logToConsole(`✓ ${commandName} completed successfully`);
                logToConsole(`Output: ${data.output}`);
                if (data.error) {
                    logToConsole(`Warnings: ${data.error}`);
                }
            } else {
                logToConsole(`✗ ${commandName} failed: ${data.error}`);
            }
        } catch (error) {
            logToConsole(`✗ ${commandName} error: ${error.message}`);
        }
    }

    runOwnerAiBtn.addEventListener('click', function() {
        runCommand('/api/ai/run_owner', 'Run Owner AI');
    });

    generateBeatBtn.addEventListener('click', function() {
        runCommand('/api/ai/music/generate_beat', 'Generate Beat');
    });

    generateLyricsBtn.addEventListener('click', function() {
        runCommand('/api/ai/music/generate_lyrics', 'Generate Lyrics');
    });

    produceSongBtn.addEventListener('click', function() {
        runCommand('/api/ai/music/produce_song', 'Produce Song');
    });
});