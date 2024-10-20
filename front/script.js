function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');

    // Fetch logs when the view-logs page is shown
    if (pageId === 'view-logs') {
        fetchDroneLogs();
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

        const response = await fetch(`http://localhost:8000/configs/${id}`);
        
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
        document.getElementById('drone-name').innerText = drone.drone_name || 'N/A';
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
    const temperature = document.getElementById('temperature').value.trim();

    if (!droneId || !temperature) {
        alert('Please enter both Drone ID and Temperature.');
        return;
    }

    try {
        const response = await fetch(`http://localhost:8000/logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                drone_id: Number(droneId),  // Ensure drone_id is a number
                celsius: parseFloat(temperature), // Ensure temperature is a number
                created: new Date().toISOString(),
            }),
        });

        if (!response.ok) throw new Error(`Error: ${response.status} ${response.statusText}`);

        alert('Temperature data submitted successfully!');
        document.getElementById('log-droneId').value = '';
        document.getElementById('temperature').value = '';

        showPage('view-logs'); // Switch to logs page after submission
    } catch (error) {
        console.error('Error submitting temperature:', error);
        alert('Failed to submit temperature data.');
    }
}

// Function to fetch and display all logs from paginated API
async function loadDroneLogs(page = 1) {
    const logsTable = document.getElementById('logs-table').getElementsByTagName('tbody')[0];
    logsTable.innerHTML = ''; // Clear the table

    try {
        const response = await fetch(`http://localhost:8000/logs?page=${page}&pageSize=${pageSize}`);
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

        // อัปเดตการควบคุมหน้า
        document.getElementById('page-number').textContent = `Page ${page}`;
    } catch (error) {
        logsTable.innerHTML = '<tr><td colspan="5">Error loading logs</td></tr>';
        console.error('Error fetching drone logs:', error);
    }
}
