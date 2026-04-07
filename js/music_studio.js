// Music Studio functionality
document.addEventListener('DOMContentLoaded', function() {
    const projectsList = document.getElementById('projects-list');
    const beatsList = document.getElementById('beats-list');
    const lyricsList = document.getElementById('lyrics-list');
    const newProjectBtn = document.getElementById('new-project');

    function loadProjects() {
        fetch('/api/music/projects')
            .then(response => response.json())
            .then(data => {
                projectsList.innerHTML = '';
                data.projects.forEach(project => {
                    const div = document.createElement('div');
                    div.textContent = project;
                    div.addEventListener('click', () => loadProject(project));
                    projectsList.appendChild(div);
                });
            })
            .catch(error => console.error('Error loading projects:', error));
    }

    function loadBeats() {
        fetch('/api/music/beats')
            .then(response => response.json())
            .then(data => {
                beatsList.innerHTML = '';
                data.beats.forEach(beat => {
                    const div = document.createElement('div');
                    div.textContent = beat;
                    div.addEventListener('click', () => selectBeat(beat));
                    beatsList.appendChild(div);
                });
            })
            .catch(error => console.error('Error loading beats:', error));
    }

    function loadLyrics() {
        fetch('/api/music/lyrics')
            .then(response => response.json())
            .then(data => {
                lyricsList.innerHTML = '';
                data.lyrics.forEach(lyric => {
                    const div = document.createElement('div');
                    div.textContent = lyric;
                    div.addEventListener('click', () => selectLyrics(lyric));
                    lyricsList.appendChild(div);
                });
            })
            .catch(error => console.error('Error loading lyrics:', error));
    }

    function loadProject(projectName) {
        // Placeholder for loading project details
        console.log('Loading project:', projectName);
    }

    function selectBeat(beatName) {
        // Placeholder for beat selection
        console.log('Selected beat:', beatName);
    }

    function selectLyrics(lyricsName) {
        // Placeholder for lyrics selection
        console.log('Selected lyrics:', lyricsName);
    }

    newProjectBtn.addEventListener('click', function() {
        const projectName = prompt('Enter project name:');
        if (projectName) {
            fetch('/api/music/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: projectName })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    loadProjects();
                } else {
                    alert('Failed to create project: ' + data.error);
                }
            })
            .catch(error => console.error('Error creating project:', error));
        }
    });

    // Load initial data
    loadProjects();
    loadBeats();
    loadLyrics();
});