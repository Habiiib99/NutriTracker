// Funktion til at hente måltidslog fra localStorage
function getMealLog() {
    // Funktionen skal returnere måltidsloggen fra localStorage
    return JSON.parse(localStorage.getItem('mealLog')) || [];
  }
  
  // Funktion til at hente vandloggen fra localStorage
  function getWaterLog() {
    // Funktionen skal returnere vandloggen fra localStorage
    return JSON.parse(localStorage.getItem('waterLog')) || [];
  }

// Funktion for at hente data fra de seneste 7 dage
  function getReportData() {
    const today = new Date();
    const reportData = [];
  
    // Gøres vha. et for-loop som går indtil 7
    for (let i = 0; i < 7; i++) {
        const reportDate = new Date(today);
        reportDate.setDate(reportDate.getDate() - i);
        const dateString = reportDate.toISOString().split('T')[0];
  
        // Filtrer data baseret på datoen
        const todaysMeals = getMealLog().filter(entry => entry.time.startsWith(dateString));
        const todaysWater = getWaterLog().filter(entry => entry.time.startsWith(dateString));
  
        // Opsummer data
        const mealsCount = todaysMeals.length;
        const totalKcal = todaysMeals.reduce((sum, meal) => sum + meal.kcal, 0);
        const totalProtein = todaysMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
        const totalWater = todaysWater.reduce((sum, water) => sum + parseFloat(water.amount), 0) / 1000;
        
        // Inden for getReportData-funktionen
        const totalFat = todaysMeals.reduce((sum, meal) => sum + (meal.fat || 0), 0);
        const totalFiber = todaysMeals.reduce((sum, meal) => sum + (meal.fiber || 0), 0);

        reportData.push({
            date: dateString,
            meals: mealsCount,
            water: totalWater.toFixed(2) + ' L',
            energy: totalKcal + ' kcal',
            protein: totalProtein + 'g',
            fat: totalFat + 'g',
            fiber: totalFiber + 'g'
        });
    }
  
    return reportData.reverse();
}

  
// Funktion til at opdaterer data i html
function renderReport(reportData) {
  const reportEntriesContainer = document.querySelector('.report-entries');
  reportEntriesContainer.innerHTML = '';

  // Vend rækkefølgen af reportData, så den seneste dato vises øverst
  reportData.reverse();

  reportData.forEach((data) => {
    const entryRow = document.createElement('tr');
    entryRow.innerHTML = `
      <td>${data.date}</td>
      <td>${data.meals} Måltider</td>
      <td>${data.water}</td>
      <td>${data.energy}</td>
      <td>${data.protein}</td>
      <td>${data.fat}</td>
      <td>${data.fiber}</td>
    `;
    reportEntriesContainer.appendChild(entryRow);
  });
}

// Når DOM er indlæst, render den rapporten for de sidste 7 dage
document.addEventListener('DOMContentLoaded', () => {
  const reportData = getReportData();
  renderReport(reportData);
});

  