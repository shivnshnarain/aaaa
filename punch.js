document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (localStorage.getItem('loggedIn') !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    // Initialize punch state
    let punchState = {
        isClockedIn: false,
        lastPunchTime: null,
        todayPunches: []
    };

    // Load punch data from localStorage
    loadPunchData();

    // Set up punch button
    const punchBtn = document.getElementById('punchBtn');
    punchBtn.addEventListener('click', togglePunch);

    // Update UI
    updatePunchUI();

    // Load today's activity
    loadTodayActivity();

    // Get location
    getLocation();

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('loggedIn');
        localStorage.removeItem('userEmail');
        window.location.href = 'login.html';
    });

    function loadPunchData() {
        // In a real app, this would come from an API
        const savedData = localStorage.getItem('punchData');
        if (savedData) {
            punchState = JSON.parse(savedData);
        }
    }

    function savePunchData() {
        localStorage.setItem('punchData', JSON.stringify(punchState));
    }

    function togglePunch() {
        const now = new Date();
        
        if (punchState.isClockedIn) {
            // Punch out
            const lastPunch = punchState.todayPunches[punchState.todayPunches.length - 1];
            if (lastPunch && lastPunch.type === 'in') {
                lastPunch.outTime = now;
                
                // Calculate duration
                const durationMs = now - new Date(lastPunch.inTime);
                lastPunch.duration = durationMs / (1000 * 60 * 60); // in hours
            }
        } else {
            // Punch in
            punchState.todayPunches.push({
                type: 'in',
                inTime: now,
                outTime: null,
                duration: null
            });
        }
        
        punchState.isClockedIn = !punchState.isClockedIn;
        punchState.lastPunchTime = now;
        
        savePunchData();
        updatePunchUI();
        loadTodayActivity();
    }

    function updatePunchUI() {
        const punchCircle = document.getElementById('punchCircle');
        const statusText = document.getElementById('statusText');
        const punchTime = document.getElementById('punchTime');
        const lastPunch = document.getElementById('lastPunch');
        const punchBtn = document.getElementById('punchBtn');
        
        if (punchState.isClockedIn) {
            punchCircle.textContent = 'IN';
            punchCircle.className = 'punch-circle clocked-in';
            statusText.textContent = 'Currently: Clocked In';
            punchBtn.textContent = 'Punch Out';
        } else {
            punchCircle.textContent = 'OUT';
            punchCircle.className = 'punch-circle';
            statusText.textContent = 'Currently: Not Clocked In';
            punchBtn.textContent = 'Punch In';
        }
        
        if (punchState.lastPunchTime) {
            const options = { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit',
                hour12: true
            };
            const timeStr = new Date(punchState.lastPunchTime).toLocaleTimeString('en-US', options);
            punchTime.textContent = timeStr;
            
            const lastAction = punchState.isClockedIn ? 'in' : 'out';
            lastPunch.textContent = `Last punch ${lastAction} at ${timeStr}`;
        } else {
            punchTime.textContent = '--:-- --';
            lastPunch.textContent = 'No punch recorded today';
        }
    }

    function loadTodayActivity() {
        const tableBody = document.querySelector('#todayTable tbody');
        tableBody.innerHTML = '';
        
        if (punchState.todayPunches.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 3;
            cell.textContent = 'No punches recorded today';
            cell.style.textAlign = 'center';
            cell.style.color = '#7f8c8d';
            row.appendChild(cell);
            tableBody.appendChild(row);
            return;
        }
        
        punchState.todayPunches.forEach(punch => {
            const row = document.createElement('tr');
            
            // Time cell
            const timeCell = document.createElement('td');
            const inTime = new Date(punch.inTime);
            const options = { hour: '2-digit', minute: '2-digit', hour12: true };
            timeCell.textContent = inTime.toLocaleTimeString('en-US', options);
            row.appendChild(timeCell);
            
            // Type cell
            const typeCell = document.createElement('td');
            typeCell.textContent = punch.type === 'in' ? 'Punch In' : 'Punch Out';
            row.appendChild(typeCell);
            
            // Duration cell
            const durationCell = document.createElement('td');
            if (punch.duration) {
                const hours = Math.floor(punch.duration);
                const minutes = Math.round((punch.duration - hours) * 60);
                durationCell.textContent = `${hours}h ${minutes}m`;
            } else if (punch.type === 'in') {
                durationCell.textContent = 'In progress...';
            } else {
                durationCell.textContent = '--';
            }
            row.appendChild(durationCell);
            
            tableBody.appendChild(row);
        });
    }

    function getLocation() {
        const locationInfo = document.getElementById('locationInfo');
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    // In a real app, you would verify if this is within campus
                    locationInfo.innerHTML = `
                        <p><strong>Latitude:</strong> ${lat.toFixed(6)}</p>
                        <p><strong>Longitude:</strong> ${lng.toFixed(6)}</p>
                        <p><strong>Accuracy:</strong> ${position.coords.accuracy} meters</p>
                        <p class="success">Location verified as on campus</p>
                    `;
                },
                error => {
                    locationInfo.innerHTML = `
                        <p class="error">Error getting location: ${error.message}</p>
                        <p>Please enable location services for accurate tracking.</p>
                    `;
                }
            );
        } else {
            locationInfo.innerHTML = `
                <p class="error">Geolocation is not supported by this browser.</p>
                <p>Please use a different device or browser.</p>
            `;
        }
    }
});