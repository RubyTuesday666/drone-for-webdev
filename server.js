const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const app = express();

app.use(cors());  

app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend'))); // For serving static files


const droneconfigserver = 'https://script.google.com/macros/s/AKfycbzwclqJRodyVjzYyY-NTQDb9cWG6Hoc5vGAABVtr5-jPA_ET_2IasrAJK4aeo5XoONiaA/exec'
const dronelogserver = 'https://app-tracking.pockethost.io/api/collections/drone_logs/records'

app.use(bodyParser.json());

// GET / configs / s --> get drone configurations based on ID
app.get("/configs/:id", (req, res) => {

    const id = Number(req.params.id);
  
    axios
      .get(droneconfigserver)
      .then((response) => {
        const data = response.data.data;
  
        const drone = data.find((d) => d.drone_id === id);
  
        if (!drone) {
          return res.status(404).send({ error: "drone_id not found" });
        }
        if (drone.max_speed == null) {
          drone.max_speed = 100;
        } else if (drone.max_speed > 110) {
          drone.max_speed = 110;
        }
  
        res.send({
          drone_id: drone.drone_id,
          drone_name: drone.drone_name,
          light: drone.light,
          country: drone.country,
          max_speed: drone.max_speed,
          population: drone.population,
        });
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        res.status(500).send("Error fetching data");
      });
  });

  // Finding status by droneId
app.get('/status/:id', async (req, res) => {
    const droneId = Number(req.params.id);
    try {
        const response = await axios.get(droneconfigserver);
        const droneStatusData = response.data.data;
        const droneStatus = droneStatusData.find(status => status.drone_id === droneId);

        if (droneStatus) {
            res.json({ condition: droneStatus.condition || "unknown" });
        } else {
            res.status(404).json({ message: "Drone status not found" });
        }
        res.send(droneStatus)
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error" });
    }
});

// Get log from API (ALL)
app.get('/logs', async (req, res) => {
  try {
      const { page = 1, pageSize = 20 } = req.query; // page 1-20
      let allLogs = [];
      let currentPage = 1;
      let hasMorePages = true;

      while (hasMorePages) {
          const response = await axios.get(`https://app-tracking.pockethost.io/api/collections/drone_logs/records?page=${currentPage}`);
          const logs = response.data.items;

          if (!logs || logs.length === 0) {
              hasMorePages = false;
          } else {
              allLogs = allLogs.concat(logs);
              currentPage++;
          }
      }
      const filteredLogs = allLogs.filter(log =>
          log.created && log.country && log.drone_id && log.drone_name && log.celsius
      );

      const sortedLogs = filteredLogs.sort((a, b) => new Date(b.created) - new Date(a.created));
      const startIndex = (page - 1) * pageSize;
      const paginatedLogs = sortedLogs.slice(startIndex, startIndex + pageSize);

      // response to client
      res.json({ logs: paginatedLogs, total: sortedLogs.length });
  } catch (error) {
      console.error('Error fetching logs:', error);
      res.status(500).send('Error fetching logs');
  }
});

app.post('/logs', async (req, res) => {
    try {
    const logData = req.body;

        // Check if there is data in logData
        if (!logData || Object.keys(logData).length === 0) {
          return res.status(400).json({ message: "No log data provided"
          });
          
        }
    // Response infromation from Drone Log Server
    const response = await axios.post(dronelogserver, logData, {
        headers: {
            'Content-Type': 'application/json' 
                    }
                });

                let dronepostlogs = response.data;
                res.json(dronepostlogs);
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: "Error" }); 
            }
        });
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'front', 'index.html'));
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
