
// Klasse for tilføjet måltid
class TrackedMeal {
    constructor(mealName, weight, time, kcal, protein, fat, fiber) {
        this.mealName = mealName;
        this.weight = weight;
        this.time = time;
        this.kcal = kcal;
        this.protein = protein;
        this.fat = fat;
        this.fiber = fiber;
    }
}

// Klasse for tilføjet vandindtag
class TrackedWater {
    constructor(amount, time) {
        this.amount = amount;
        this.time = time;
    }
}

// Hjælpefunktioner for måltider og vandindtag
function getMeals() {
    return JSON.parse(localStorage.getItem('meals')) || [];
}

function getMealLog() {
    return JSON.parse(localStorage.getItem('mealLog')) || [];
}

function saveMealLog(mealLog) {
    localStorage.setItem('mealLog', JSON.stringify(mealLog));
}

function getWaterLog() {
    return JSON.parse(localStorage.getItem('waterLog')) || [];
}

function saveWaterLog(waterLog) {
    localStorage.setItem('waterLog', JSON.stringify(waterLog));
}

// Handlinger for måltider og vandindtag
function addMealRegistration() {
    const mealDropdown = document.getElementById('meal-select-dropdown');
    const selectedMealIndex = mealDropdown.value;
    const selectedMeal = getMeals()[selectedMealIndex];

    if (!selectedMeal) {
        alert('Vælg venligst et måltid fra listen.');
        return;
    }

    const mealLogEntry = new TrackedMeal(
        selectedMeal.name,
        selectedMeal.totalWeight,
        document.getElementById('meal-time').value,
        selectedMeal.totalKcal,
        selectedMeal.totalProtein,
        selectedMeal.totalFat,
        selectedMeal.totalFiber
    );

    const mealLog = getMealLog();
    mealLog.push(mealLogEntry);
 
    saveMealLog(mealLog);
    updateMealLogDisplay(); // Opdater visningen efter tilføjelse
    updateDashboard();    // Opdaterer dashboardet med nye data    
}

function addWaterIntake() {
    const waterIntake = document.getElementById('water-intake').value;
    const waterIntakeTime = document.getElementById('water-intake-time').value;
    const waterLogEntry = new TrackedWater(waterIntake, waterIntakeTime);
    const waterLog = getWaterLog();
    waterLog.push(waterLogEntry);
    saveWaterLog(waterLog);
    updateWaterLogDisplay();
    updateDashboard();    // Opdaterer dashboardet med nye data
}

// Funktion til at opdatere visningen af måltidsregistreringer
function updateMealLogDisplay() {
    const mealLog = getMealLog();
    const registeredMealsContainer = document.getElementById('registered-meals');
    
    registeredMealsContainer.innerHTML = '';

    mealLog.forEach((entry, index) => {
        const mealEntryDiv = document.createElement('div');
        mealEntryDiv.className = 'meal-entry';
        mealEntryDiv.innerHTML = `
            <div class="meal-details">
            <span class="meal-name">${entry.mealName}</span>
            <input type="number" class="edit-meal-weight" value="${entry.weight}" data-index="${index}">g
            <input type="datetime-local" class="edit-meal-time" value="${entry.time}" data-index="${index}">
            <span class="meal-kcal">${entry.kcal} kcal</span> 
            <span class="meal-protein">${entry.protein}g protein</span>
            <span class="meal-fat">${entry.fat}g fat</span>
            <span class="meal-fiber">${entry.fiber}g fiber</span>
        </div>
        <div class="meal-actions">
            <button class="save-meal-changes" data-index="${index}">Gem</button>
            <button class="delete-meal-btn" data-index="${index}">Slet</button>
        </div>
    `;

        registeredMealsContainer.appendChild(mealEntryDiv);
    });
}


function deleteMeal(index) {
    const mealLog = getMealLog();
    if (index >= 0 && index < mealLog.length) {
      if (confirm('Er du sikker på, at du vil slette dette måltid?')) {
        mealLog.splice(index, 1); // Fjern måltidet fra arrayet
        saveMealLog(mealLog); // Gem den opdaterede måltidslog
        updateMealLogDisplay(); // Opdater visningen
      }
    } else {
      alert('Noget gik galt. Kunne ikke finde måltidet.');
    }
  }
  

  window.deleteMeal = deleteMeal;

// I stedet for at tilføje event listeners i updateMealLogDisplay, brug event delegation
const registeredMealsContainer = document.getElementById('registered-meals');
registeredMealsContainer.addEventListener('click', (event) => {
    const index = event.target.dataset.index;
    if (event.target.classList.contains('edit-meal-btn')) {
        editMealLogEntry(index);
    } else if (event.target.classList.contains('delete-meal-btn')) {
        deleteMealLogEntry(index);
    }
});

function updateWaterLogDisplay() {
    // Hent den aktuelle vandlog
    const waterLog = getWaterLog();
    const waterLogContainer = document.getElementById('water-log-container'); // Erstat med det faktiske ID for din vandlog-container

    // Slet eksisterende indhold for at undgå duplikation
    waterLogContainer.innerHTML = '';

    // Tilføj hver vandlogpost til containeren
    waterLog.forEach((entry, index) => {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'water-entry';
        entryDiv.innerHTML = `
        <input type="number" class="edit-water-amount" value="${entry.amount}" data-index="${index}">ml
        <input type="datetime-local" class="edit-water-time" value="${entry.time}" data-index="${index}">
        <button class="save-water-changes" data-index="${index}">Gem</button>
        <button class="delete-water-btn" data-index="${index}">Slet</button>
    `;
        waterLogContainer.appendChild(entryDiv);
    });
}

function deleteMealLogEntry(index) {
    // Hent måltidsloggen
    const mealLog = getMealLog();
    mealLog.splice(index, 1); // Fjerner elementet på den specificerede index
    saveMealLog(mealLog); // Gemmer den opdaterede måltidslog
    updateMealLogDisplay(); // Opdaterer visningen
    updateDashboard();    // Opdaterer dashboardet med nye data
}

function deleteWaterEntry(index) {
    const waterLog = getWaterLog();
    waterLog.splice(index, 1);
    saveWaterLog(waterLog);
    updateWaterLogDisplay();
    updateDashboard();    // Opdaterer dashboardet med nye data
}

document.addEventListener('DOMContentLoaded', () => {
    populateMealDropdown(); // Kald denne når siden er indlæst for at fylde dropdown
    updateMealLogDisplay(); // Opdater visningen af måltidsloggen
    updateWaterLogDisplay(); // Opdater vandregistreringer ved indlæsning af siden

    const mealRegistrationForm = document.getElementById('meal-registration-form');
    mealRegistrationForm.addEventListener('submit', (event) => {
        event.preventDefault();
        addMealRegistration();
    });

    const waterIntakeForm = document.getElementById('water-intake-form');
    waterIntakeForm.addEventListener('submit', (event) => {
        event.preventDefault();
        addWaterIntake();
    });

    // Håndterer måltidsregistreringer
    const registeredMealsContainer = document.getElementById('registered-meals');
        if (registeredMealsContainer) {
            registeredMealsContainer.addEventListener('click', (event) => {
        const index = event.target.dataset.index;
        if (event.target.classList.contains('edit-meal-btn')) {
            editMealLogEntry(index);
        } else if (event.target.classList.contains('delete-meal-btn')) {
            deleteMealLogEntry(index);
        }
    });
} else {
    console.error("registered-meals container not found");
}

    // Håndterer vandregistreringer
    const waterLogContainer = document.getElementById('water-log-container');
        if (waterLogContainer) {
    waterLogContainer.addEventListener('click', (event) => {
        const index = event.target.dataset.index;
        if (event.target.classList.contains('edit-water-btn')) {
            editWaterEntry(index);
        } else if (event.target.classList.contains('delete-water-btn')) {
            deleteWaterEntry(index);
        }
    });
} else {
    console.error("water-log-container not found");
}
});

function populateMealDropdown() {
    const meals = getMeals();
    const mealDropdown = document.getElementById('meal-select-dropdown');
    // Rens dropdown for eksisterende indhold
    mealDropdown.innerHTML = '';
    meals.forEach((meal, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = meal.name;
        mealDropdown.appendChild(option);
    });
}

function editMealLogEntry(index) {
    // Hent måltidsloggen
    const mealLog = getMealLog();
    
     // Her skal du hente de nuværende værdier fra den valgte registrering
     const currentEntry = mealLog[index];

     // Antag, at du har et formular-element eller modal, hvor brugerne kan redigere informationen
     // For eksempel, du kan have input felter med id'er 'edit-meal-weight' og 'edit-meal-time'
     const editedWeight = document.getElementById('edit-meal-weight').value;
     const editedTime = document.getElementById('edit-meal-time').value;
 
     // Opdater den valgte registrering med de nye værdier
     currentEntry.weight = editedWeight;
     currentEntry.time = editedTime;
 
     // Gem den opdaterede måltidslog
    saveMealLog(mealLog);
    updateMealLogDisplay(); // Opdater visningen efter tilføjelse
    updateDashboard();    // Opdaterer dashboardet med nye data
}

function editWaterEntry(index) {
    const waterLog = getWaterLog();
    const currentEntry = waterLog[index];

    // Antag, at du har en modal eller et formular-element, hvor brugere kan indtaste nye værdier
    // For eksempel, input felter med id'er 'edit-water-amount' og 'edit-water-time'
    const editedAmount = document.getElementById('edit-water-amount').value;
    const editedTime = document.getElementById('edit-water-time').value;

    // Opdater den valgte registrering med de nye værdier
    currentEntry.amount = editedAmount;
    currentEntry.time = editedTime;

    // Gem den opdaterede vandlog
    saveWaterLog(waterLog);
    updateWaterLogDisplay();
    updateDashboard();    // Opdaterer dashboardet med nye data
}

// localStorage.clear();
