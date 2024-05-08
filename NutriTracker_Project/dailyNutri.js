document.addEventListener('DOMContentLoaded', async () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || !user.userId) {
    alert('Brugeroplysninger ikke fundet. Log venligst ind igen.');
    window.location.href = 'login.html';
    return;
  }

  // Funktion til at hente data fra API'et og opdatere tabellen
  async function fetchAndUpdateTable(userId) {
    try {
      // Hent data fra serveren for de sidste 24 timer
      const response = await fetch(`http://localhost:2220/api/daily-nutri/hourly/${userId}`);
      const data = await response.json();

      // Håndter fejl fra serveren
      if (!response.ok) {
        throw new Error(data.message || 'Fejl ved hentning af data.');
      }

      // Generer tabellen baseret på modtagne data
      updateNutriTable(data);
    } catch (error) {
      console.error('Fejl ved hentning af timebaserede data:', error);
      alert('Der opstod en fejl ved hentning af data. Prøv venligst igen senere.');
    }
  }

  
  function updateNutriTable(entries) {
    // Sortér entries i omvendt rækkefølge baseret på time eller dato
    const sortedEntries = entries.slice().sort((a, b) => (b.hour || b.date) - (a.hour || a.date));
  
    // Find tabel-kroppen (tbody) og ryd tidligere data
    const tbody = document.querySelector('.nutri-entries');
    tbody.innerHTML = '';
  
    // Indsæt nye data i tabellen
    sortedEntries.forEach(entry => {
      let hourLabel = `${entry.hour}:00`;
  
      // Hvis timen er "0", så skal det vises som "24:00"
      if (entry.hour === 0) {
        hourLabel = '24:00';
      }
  
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${hourLabel}</td>
        <td>${entry.energy} kcal</td>
        <td>${entry.water} L</td>
        <td>${entry.calorieBurn} kcal</td>
        <td>${entry.surplusDeficit} kcal</td>
      `;
      tbody.appendChild(tr);
    });
  }
  
  document.addEventListener('DOMContentLoaded', async function () {
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user.userId;
    const viewMode = document.getElementById('view-mode');
  
    viewMode.addEventListener('change', function () {
      if (this.value === 'monthly') {
        fetchMonthlyData(userId);
      }
    });
  
    async function fetchMonthlyData(userId) {
      try {
        const response = await fetch(`http://localhost:2220/api/daily-nutri/monthly/${userId}`);
        const data = await response.json();
  
        const entriesContainer = document.querySelector('.nutri-entries');
        entriesContainer.innerHTML = '';
  
        data.forEach(entry => {
          const row = `
            <tr>
              <td>${entry.day}</td>
              <td>${entry.totalEnergy} kcal</td>
              <td>${entry.totalWater} L</td>
              <td>${entry.totalBurned} kcal</td>
              <td>${entry.balance} kcal</td>
            </tr>
          `;
          entriesContainer.insertAdjacentHTML('beforeend', row);
        });
      } catch (error) {
        console.error('Fejl ved hentning af månedlig data:', error);
      }
    }
  });
  
  // Tilføj en event listener til dropdown-menuen for at håndtere ændringer i visningstilstand
document.getElementById('view-mode').addEventListener('change', function () {
  const viewMode = this.value;
  fetchNutriData(viewMode);  // Kald funktionen med det valgte visningstilstand
});

// Funktion til at hente data baseret på visningstilstand
async function fetchNutriData(viewMode) {
  const user = JSON.parse(localStorage.getItem('user'));  // Få brugerdata fra localStorage
  const userId = user.userId;
  let url = '';

  // Sæt den passende URL baseret på valgmuligheden
  if (viewMode === 'daily') {
      url = `http://localhost:2220/api/daily-nutri/hourly/${userId}`;
  } else {
      url = `http://localhost:2220/api/daily-nutri/daily/${userId}`;
  }

  // Start en loading-indikator
  document.querySelector('.loading-indicator').hidden = false;

  try {
      const response = await fetch(url);
      const nutriData = await response.json();

      // Ryd tabelindholdet
      const tableBody = document.querySelector('.nutri-entries');
      tableBody.innerHTML = '';

      // Iterér over dataene og opdater tabellen
      nutriData.forEach((entry) => {
          const row = document.createElement('tr');
          row.innerHTML = `
              <td>${entry.dateTime}</td>
              <td>${entry.energyKcal} kcal</td>
              <td>${entry.waterL} L</td>
              <td>${entry.calorieBurn} kcal</td>
              <td>${entry.calorieBalance} kcal</td>
          `;
          tableBody.appendChild(row);
      });
  } catch (error) {
      console.error('Fejl ved hentning af data:', error);
  } finally {
      // Skjul loading-indikatoren
      document.querySelector('.loading-indicator').hidden = true;
  }
}

// Indlæs data med "24 Timer" som standard, når siden indlæses
fetchNutriData('daily');



  // Hent og opdater tabellen med brugerens data
  fetchAndUpdateTable(user.userId);
});
