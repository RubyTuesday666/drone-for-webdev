const API_HOST = "http://localhost:8000";
//const API_HOST = window.API_HOST || "https://drone-for-webdev.onrender.com";
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');
   
    // Fetch logs when the view-logs page is shown
    if (pageId === 'view-logs') {
        loadDroneLogs();
    }
}

// Function to fetch drone config based on ID
async function fetchDroneConfig() {
    const id = document.getElementById('droneId').value.trim();

    if (!id) {
        alert('Please enter a valid drone ID.');
        return;
    }

    try {
        console.log(`Fetching drone config for ID: ${id}`);

        const response = await fetch(`${API_HOST}/configs/${id}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                alert('Drone not found. Please try a different ID.');
            } else {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
            return;
        }

        const drone = await response.json();
        console.log('Drone Config:', drone);

    // Display the drone data in the UI
        document.getElementById('drone-data').classList.remove('hidden');
        document.getElementById('drone-id').innerText = drone.drone_id || 'N/A';
        document.getElementById('drone-name-display').innerText = drone.drone_name || 'N/A';
        document.getElementById('drone-light').innerText = drone.light || 'N/A';
        document.getElementById('drone-speed').innerText = drone.max_speed || 'N/A';
        document.getElementById('drone-country').innerText = drone.country || 'N/A';
        document.getElementById('drone-population').innerText = drone.population || 'N/A';

    } catch (error) {
        console.error('Fetch Error:', error);
        alert('Failed to fetch drone config. Please check the console for more details.');
    }
}

// Function to submit temperature log
async function submitTemperature() {
    const droneId = document.getElementById('log-droneId').value.trim();
    const drone_name = document.getElementById('log-drone-name').value.trim();
    const country = document.getElementById('country').value.trim();
    const temperature = document.getElementById('temperature').value.trim();

    if (!droneId || !temperature) {
        alert('Please enter both Drone ID and Temperature.');
        return;
    }

    try {
        const response = await fetch(`${API_HOST}/logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                drone_id: Number(droneId),
                drone_name: drone_name,
                country: country,
                celsius: parseFloat(temperature),
                created: new Date().toISOString(),
            }),
        });

        if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    // For check data
    const responseData = await response.json();
    console.log('Response from server:', responseData); 
    alert('Temperature data submitted successfully!');
        document.getElementById('log-droneId').value = '';
        document.getElementById('drone-name').value = '';
        document.getElementById('country').value = '';
        document.getElementById('temperature').value = '';

        // Update logs after submission
        showPage('view-logs'); // Switch to logs page after submission
        loadDroneLogs(); // Call this to reload logs

    } catch (error) {
        console.error('Error submitting temperature:', error);
        alert('Failed to submit temperature data.');
    }
}
// Function Update Drone Data
async function updateDroneData() {
    const droneId = document.getElementById('log-droneId').value.trim();
    const droneName = document.getElementById('log-drone-name').value.trim();
    const country = document.getElementById('log-country').value.trim();
    const temperature = document.getElementById('log-temperature').value.trim();

    if (!droneId || !temperature) {
        alert('Please enter both Drone ID and Temperature.');
        return;
    }

    try {
        const response = await fetch(`${API_HOST}/logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                drone_id: Number(droneId),
                drone_name: droneName,
                country: country,
                celsius: parseFloat(temperature),
                updated: new Date().toISOString(),
            }),
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Error: ${response.status} - ${errorData}`);
        }

        const updatedData = await response.json();
        console.log('Updated Data:', updatedData);
        alert('Drone data updated successfully!');

        // Reset filled form
        document.getElementById('log-droneId').value = '';
        document.getElementById('log-drone-name').value = '';
        document.getElementById('log-country').value = '';
        document.getElementById('log-temperature').value = '';

        // Loading an update data in Logs page
        showPage('view-logs');
        loadDroneLogs(); 

    } catch (error) {
        console.error('Error updating drone data:', error);
        alert('Failed to update drone data. Please try again.');
    }
}

// Function to load drone logs with pagination
async function loadDroneLogs(page = 1) {
    const logsTable = document.getElementById('logs-table-body');
    if (!logsTable) {
        console.error('Logs table body not found!');
        return;
    }
    logsTable.innerHTML = ''; // Clear the table
    const pageSize = 20;

    try {
        const response = await fetch(`${API_HOST}/logs?page=${page}&pageSize=${pageSize}`);
        if (!response.ok) {
            throw new Error('Failed to fetch logs');
        }

        const data = await response.json();
        const logs = data.logs;

        // แสดง log ในตาราง
        logs.forEach(log => {
            const rowHTML = `
                <tr>
                    <td>${log.created}</td>
                    <td>${log.country}</td>
                    <td>${log.drone_id}</td>
                    <td>${log.drone_name}</td>
                    <td>${log.celsius}</td>
                </tr>
            `;
            logsTable.innerHTML += rowHTML;
        });

        // Update page controling
        const pageNumberElement = document.getElementById('page-number');
        if (pageNumberElement) {
            pageNumberElement.textContent = `Page ${page}`;
        }
    } catch (error) {
        logsTable.innerHTML = '<tr><td colspan="5">Error loading logs</td></tr>';
        console.error('Error fetching drone logs:', error);
    }
    }
