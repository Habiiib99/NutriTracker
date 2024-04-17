// Hjælpefunktion til at hente data fra localStorage
function getData(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

// Hjælpefunktion til at formatere dagens dato som en streng
function getTodayString() {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Returnerer dato i formatet 'yyyy-mm-dd'
}

// Hjælpefunktion til at opdatere værdierne på dashboardet
function updateDashboardValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}


// Hovedfunktion til at opdatere dashboardet
function updateDashboard() {
    const todayString = getTodayString();
    const mealLog = getData('mealLog');
    const waterLog = getData('waterLog');

    // Filtrer måltidsloggen for at finde måltider for i dag
    const todaysMeals = mealLog.filter(entry => entry.time.startsWith(todayString));
    const numberOfMeals = todaysMeals.length;
    const totalEnergy = todaysMeals.reduce((acc, entry) => acc + entry.kcal, 0);

    // Antag at hver entry i mealLog har en protein property, som er det samlede protein for det måltid
    const totalProtein = todaysMeals.reduce((acc, entry) => acc + (entry.protein || 0), 0); // Tilføj en guard for tilfælde hvor protein ikke er defineret

    // Inden for updateDashboard-funktionen
    const totalFat = todaysMeals.reduce((acc, entry) => acc + (entry.fat || 0), 0);
    const totalFiber = todaysMeals.reduce((acc, entry) => acc + (entry.fiber || 0), 0);


    // Filtrer vandloggen for at finde vandindtag for i dag
    const todaysWater = waterLog.filter(entry => entry.time.startsWith(todayString));
    const totalWater = todaysWater.reduce((acc, entry) => acc + parseFloat(entry.amount), 0) / 1000; // Konverter ml til liter

    // Opdater DOM'en med de nye værdier
    updateDashboardValue('meals-today', `${numberOfMeals} Måltider i dag`);
    updateDashboardValue('energy-today', `${totalEnergy.toFixed(2)} kcal Energi i dag`);
    updateDashboardValue('water-today', `${totalWater.toFixed(2)} L Vand i dag`);
    updateDashboardValue('protein-today', `${totalProtein.toFixed(2)} g Protein i dag`);

    // Viser samlet fedt og fiber i konsollen
    console.log(`Samlet fedt i dag: ${totalFat.toFixed(2)} g`);
    console.log(`Samlet fiber i dag: ${totalFiber.toFixed(2)} g`);


}


// Sæt opdateringen af dashboardet til at køre når dokumentet er indlæst
document.addEventListener('DOMContentLoaded', updateDashboard);
