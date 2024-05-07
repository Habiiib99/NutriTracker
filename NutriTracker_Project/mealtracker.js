const apiKey = '169792'
// Opdater dropdown-listen over måltider
function populateMealDropdown() {
  fetch('http://localhost:2220/api/meals')  // Tilpas URL efter din opsætning
    .then(response => response.json())
    .then(meals => {
      const mealDropdown = document.getElementById('meal-select-dropdown');
      mealDropdown.innerHTML = ''; // Ryd tidligere indhold

      // Loop gennem måltiderne og tilføj dem som <option> i dropdown
      meals.forEach(meal => {
        const option = document.createElement('option');
        option.value = meal.mealId;  // Brug unikt ID for valgmuligheden
        option.textContent = meal.mealName; // Vis måltidets navn
        mealDropdown.appendChild(option);
      });
    })
    .catch(error => {
      console.error('Error loading meals:', error);
    });
}

// Når dropdown-menuen ændres, skal vi vise måltidets samlede vægt
document.getElementById('meal-select-dropdown').addEventListener('change', async function () {
  const mealId = this.value;
  if (!mealId) {
    document.getElementById('meal-weight').value = ''; // Ryd hvis ingen måltid er valgt
    return;
  }

  try {
    // Hent vægten fra serveren
    const response = await fetch(`http://localhost:2220/api/meals/weight/${mealId}`);
    if (response.ok) {
      const { totalWeight } = await response.json();
      // Opdater inputfeltet for vægten
      document.getElementById('meal-weight').value = totalWeight;
    } else {
      console.error('Kunne ikke hente vægt:', await response.json());
    }
  } catch (error) {
    console.error('Fejl ved hentning af vægt:', error);
  }
});

// Funktion til at registrere et måltid i tracker-tabellen
async function registerMeal() {
  const mealId = document.getElementById('meal-select-dropdown').value;
  const weight = document.getElementById('meal-weight').value;
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.userId;
  const consumptionDate = document.getElementById('meal-time').value || new Date().toISOString(); // Brug dato/tid fra input eller nuværende tid
  let location = 'Unknown';

  // Kontroller, at alle nødvendige data er til stede
  if (!mealId || !weight || !userId) {
    alert('Sørg for at have valgt en måltid, indtastet vægt og være logget ind.');
    return;
  }

  // Hent brugerens geolocation
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        location = `Latitude: ${position.coords.latitude}, Longitude: ${position.coords.longitude}`;
        sendMealData();
      },
      (error) => {
        console.warn('Geolocation ikke tilgængelig:', error.message);
        sendMealData(); // Send data alligevel med 'Unknown' location
      }
    );
  } else {
    sendMealData(); // Send data alligevel med 'Unknown' location
  }

  // Funktion til at sende måltidsdata til serveren
  async function sendMealData() {
    try {
      const response = await fetch('http://localhost:2220/api/meal-tracker/track-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealId, weight, userId, consumptionDate, location })
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
      } else {
        console.error('Fejl ved registrering:', await response.json());
      }
    } catch (error) {
      console.error('Serverfejl ved registrering:', error);
    }
  }
}

// Tilføj event listener til 'Registrér måltid'-knappen
document.getElementById('meal-registration-form').addEventListener('submit', function (event) {
  event.preventDefault();
  registerMeal();
});


// Funktion til at hente og vise gemte måltider
async function updateMealLogDisplay() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || !user.userId) {
    console.error('Bruger ikke fundet.');
    return;
  }

  try {
    const response = await fetch(`http://localhost:2220/api/meal-tracker/intakes/${user.userId}`);
    const mealLog = await response.json();

    const mealLogContainer = document.getElementById('registered-meals');
    mealLogContainer.innerHTML = '';

    mealLog.forEach(entry => {
      const mealEntryDiv = document.createElement('div');
      mealEntryDiv.className = 'meal-entry';
      mealEntryDiv.innerHTML = `
          <div class="meal-details">
            <span class="meal-name">${entry.mealName}</span>
            <span class="meal-weight">${entry.weight}g</span>
            <span class="meal-time">${new Date(entry.consumptionDate).toLocaleString()}</span>
            <span class="meal-location">${entry.location}</span>
          </div>
          <div class="meal-actions">
            <button class="edit-meal-btn" data-id="${entry.trackerId}">Rediger</button>
            <button class="delete-meal-btn" data-id="${entry.trackerId}">Slet</button>
          </div>
        `;
      mealLogContainer.appendChild(mealEntryDiv);
    });
  } catch (error) {
    console.error('Fejl ved hentning af måltider:', error);
  }
}

// Tilføj event listener til at håndtere redigering og sletning af måltider
document.getElementById('registered-meals').addEventListener('click', function (event) {
  const trackerId = event.target.dataset.id;
  if (event.target.classList.contains('delete-meal-btn') && trackerId) {
    deleteMeal(trackerId);
  } else if (event.target.classList.contains('edit-meal-btn') && trackerId) {
    editMeal(trackerId);
  }
});

// Funktion til at slette et måltid
async function deleteMeal(trackerId) {
  try {
    const response = await fetch(`http://localhost:2220/api/meal-tracker/intake/${trackerId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();
    if (response.ok) {
      alert(result.message);
      updateMealLogDisplay(); // Opdater måltidslog
    } else {
      console.error('Fejl ved sletning:', result);
    }
  } catch (error) {
    console.error('Fejl ved sletning af måltid:', error);
  }
}

// Funktion til at redigere et måltid (kun dato/tidspunkt)
async function editMeal(trackerId) {
  const newDate = prompt('Indtast nyt tidspunkt (yyyy-mm-dd hh:mm:ss):');
  if (!newDate) return;

  try {
    const response = await fetch(`http://localhost:2220/api/meal-tracker/intake/${trackerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consumptionDate: newDate })
    });

    const result = await response.json();
    if (response.ok) {
      alert(result.message);
      updateMealLogDisplay(); // Opdater måltidslog
    } else {
      console.error('Fejl ved redigering:', result);
    }
  } catch (error) {
    console.error('Fejl ved redigering af måltid:', error);
  }
}

// Når dokumentet er indlæst, skal du opdatere måltidsloggen
document.addEventListener('DOMContentLoaded', updateMealLogDisplay);



// Når dokumentet er indlæst, skal du opdatere måltidslog og dropdown
document.addEventListener('DOMContentLoaded', () => {
  populateMealDropdown();
});








//Mealtracker til ingredienser

const ingredient = document.getElementById('ingredient');
let ingredientId;
//Kode til at søge efter ingredienser
function populateIngredientList(results) {
  const ingredientList = document.getElementById('ingredient-list');
  // Clear previous results
  ingredientList.innerHTML = ''

  for (const result of results) {
    const option = document.createElement('option')
    option.value = result.foodName
    option.text = result.foodName
    option.id = result.foodID;
    ingredientList.appendChild(option)
  }

  document.getElementById('ingredient').addEventListener('input', function(event) {
    const selectedOption = document.querySelector(`#ingredient-list option[value="${event.target.value}"]`);
    if (selectedOption) {
      ingredientId = selectedOption.id;
      console.log(ingredientId);
      document.getElementById('foodID').value = ingredientId;
    }
  });
  
}

async function fetchFoodItems(input) {
  const searchString = input.charAt(0).toUpperCase() + input.slice(1);
  const url = `https://nutrimonapi.azurewebsites.net/api/FoodItems/BySearch/${searchString}`;

  try {
    let response = await fetch(url, {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        'X-API-Key': apiKey,
      },
    });

    if (response.ok) {
      let result = await response.json();
      return result
    } else {
      console.error('Failed to fetch data. Status:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
}

ingredient.addEventListener('keypress', async (event) => {
  const results = await fetchFoodItems(event.target.value)
  if (!results) {
    console.log('No results')
    return
  }

  populateIngredientList(results)


})
const ProteinKey = 1110; // SortKey for protein
const kcalKey = 1030; // SortKey for kcal
const fatKey = 1310; // SortKey for fedt
const fiberKey = 1240; // SortKey for fiber


async function fetchNutrientValue(foodID, sortKey, nutrientName) {
  const url = `https://nutrimonapi.azurewebsites.net/api/FoodCompSpecs/ByItem/${foodID}/BySortKey/${sortKey}`;

  try {
      let response = await fetch(url, {
          method: 'GET',
          headers: {
              'content-type': 'application/json',
              'X-API-Key': apiKey,
          },
      });

      if (response.ok) {
          let result = await response.json();
          if (result.length > 0) {
              return result[0].resVal;
          } else {
              console.log(`${nutrientName} not found for foodID: ${foodID}`);
              return null;
          }
      } else {
          console.error('Failed to fetch nutrient value. Status:', response.status);
          return null;
      }
  } catch (error) {
      console.error('Error fetching nutrient value:', error);
      return null;
  }
}


async function fetchAndValidateNutrient(foodID, sortKey, nutrientName) {
  const value = await fetchNutrientValue(foodID, sortKey, nutrientName);
  const numberValue = parseFloat(value);

  if (!isNaN(numberValue)) {
      return numberValue;
  } else {
      console.error(`Value for ${nutrientName} is not a number:`, value);
      return 0;
  }
}

async function addIngredient(ingredientName) {
  const foodID = document.getElementById('foodID').value;
  const kcal = await fetchAndValidateNutrient(foodID, kcalKey, 'Energy');
  const protein = await fetchAndValidateNutrient(foodID, ProteinKey, 'Protein');
  const fat = await fetchAndValidateNutrient(foodID, fatKey, 'Fat');
  const fiber = await fetchAndValidateNutrient(foodID, fiberKey, 'Fiber');
  try {
    const response = await fetch('http://localhost:2220/meal-tracker/ingredient', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ingredient: ingredientName,
        kcal: kcal, 
        protein: protein,
        fat: fat,
        fiber: fiber
      })
    });

    if (!response.ok) {
      throw new Error('Fejl ved tilføjelse af ingrediens');
    }

    const data = await response.json(); 
    return data; 

  } catch (error) {
    console.error('Fejl ved tilføjelse af ingrediens:', error);
    throw error;
  }}


async function addMealIngredient(ingredientId, weight) {
  const userId = JSON.parse(localStorage.getItem('user')).userId;

  try {
    const response = await fetch('http://localhost:2220/meal-tracker/meal-ingredients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ingredientId: ingredientId,
        weightOfIngredient: weight,
        userId: userId
      })
    });

    if (!response.ok) {
      throw new Error('Fejl ved tilføjelse af ingrediens til måltidsingredienser');
    }

    const data = await response.json(); 
    return data; 

  } catch (error) {
    console.error('Fejl ved tilføjelse af ingrediens til måltidsingredienser:', error);
    throw error;
  }}



async function trackIngredient(mealIngredientId, weight, location) {

  try {
    const response = await fetch('http://localhost:2220/meal-tracker/track-ingredient', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mealIngredientId: mealIngredientId,
      weight: weight,
      userId: JSON.parse(localStorage.getItem('user'))?.userId,
      consumptionDate: new Date().toISOString().slice(0, 16).replace('T', ' '),
      location: location
    })
  });
    
    if (!response.ok) {
    throw new Error('Fejl ved tilføjelse af ingrediens til måltidsingredienser');
  }
} catch (error) {
  console.error('Fejl ved tilføjelse af ingrediens til måltidsingredienser:', error);
  throw error;
}}


async function getLocation() {
  return new Promise((resolve, reject) => {
    // Hent brugerens geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = `Latitude: ${position.coords.latitude}, Longitude: ${position.coords.longitude}`;
          resolve(location);
        },
        (error) => {
          console.warn('Geolocation ikke tilgængelig:', error.message);
          resolve('Unknown');
        }
      );
    } else {
      resolve('Unknown');
    }
  });
}

async function registerIngredient() {
  const ingredientName = document.getElementById('ingredient').value;
  const weight = document.getElementById('ingredient-weight').value;

  try {
    const response = await addIngredient(ingredientName);
    const ingredientId = response.ingredientId;
    const response1 = await addMealIngredient(ingredientId, weight);
    const mealIngredientId = response1.mealIngredientId;
    
    // Hent brugerens position
    const location = await getLocation();
    
    await trackIngredient(mealIngredientId, weight, location);
    alert('Ingrediens tilføjet med succes til begge tabeller');
  } catch (error) {
    console.error('Fejl:', error);
    alert('Der opstod en fejl under registrering af ingrediens');
  }
}



document.getElementById('ingredient-registration-form').addEventListener('submit', function (event) {
  event.preventDefault();
  registerIngredient();
});




// Funktion til at registrere vandindtag
async function registerWaterIntake() {
  const waterAmount = document.getElementById('water-amount').value; // Vandmængde i ml
  const user = JSON.parse(localStorage.getItem('user')); // Hent brugeroplysninger fra localStorage
  if (!user || !user.userId) {
      alert('Bruger ikke fundet. Sørg for, at du er logget ind.');
      return;
  }
  const userId = user.userId;
  const consumptionDate = new Date().toISOString(); // Automatisk aktuelt tidspunkt
  let location = 'Unknown';

  // Kontroller, at alle nødvendige data er til stede
  if (!waterAmount || !userId) {
      alert('Sørg for at være logget ind og indtaste mængden af vand.');
      return;
  }

  // Hent geolocation, hvis det er tilgængeligt
  if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
          (position) => {
              location = `Latitude: ${position.coords.latitude}, Longitude: ${position.coords.longitude}`;
              sendWaterData(); // Send data, når lokationen er fundet
          },
          (error) => {
              console.warn('Geolocation ikke tilgængelig:', error.message);
              sendWaterData(); // Send data med 'Unknown' lokation
          }
      );
  } else {
      sendWaterData(); // Send data med 'Unknown' lokation
  }

  // Funktion til at sende vandindtagsdata til serveren
  async function sendWaterData() {
      try {
          const response = await fetch('http://localhost:2220/api/water-tracker', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, amountOfWater: waterAmount, dateAndTimeOfDrinking: consumptionDate, location })
          });

          if (response.ok) {
              const result = await response.json();
              alert(result.message);
          } else {
              const error = await response.json();
              console.error('Fejl ved registrering:', error);
          }
      } catch (error) {
          console.error('Serverfejl ved registrering:', error);
      }
  }
}

// Rediger vandindtag
async function editWaterIntake(id) {
  const newAmount = prompt('Indtast ny vandmængde (ml):');
  if (!newAmount || isNaN(newAmount)) {
      alert('Indtast venligst en gyldig vandmængde.');
      return;
  }

  try {
      const response = await fetch(`http://localhost:2220/api/water-tracker/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amountOfWater: newAmount })
      });

      const result = await response.json();
      if (response.ok) {
          alert(result.message);
          // Opdater visningen af vandindtag
          updateWaterLogDisplay();
      } else {
          console.error('Fejl ved redigering:', result);
      }
  } catch (error) {
      console.error('Fejl ved redigering af vandindtag:', error);
  }
}

// Slet vandindtag
async function deleteWaterIntake(id) {
  try {
      const response = await fetch(`http://localhost:2220/api/water-tracker/${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      if (response.ok) {
          alert(result.message);
          // Opdater visningen af vandindtag
          updateWaterLogDisplay();
      } else {
          console.error('Fejl ved sletning:', result);
      }
  } catch (error) {
      console.error('Fejl ved sletning af vandindtag:', error);
  }
}




async function updateWaterLogDisplay() {
  const user = JSON.parse(localStorage.getItem('user')); // Hent brugerens ID fra localStorage
  if (!user || !user.userId) {
      console.error('Bruger ikke fundet.');
      return;
  }

  try {
      // Send GET-anmodning til backend for at hente vandindtagene
      const response = await fetch(`http://localhost:2220/api/water-tracker/user/${user.userId}`);
      const waterLog = await response.json();

      // Reference til HTML-elementet, hvor loggen vises
      const waterLogContainer = document.getElementById('registered-water');
      waterLogContainer.innerHTML = '';

      // Gennemgå vandindtagsdataene og generer HTML for hver post
      waterLog.forEach(entry => {
          const waterEntryDiv = document.createElement('div');
          waterEntryDiv.className = 'water-entry';
          waterEntryDiv.innerHTML = `
              <div class="water-details">
                  <span class="water-amount">${entry.amountOfWater} ml</span>
                  <span class="water-time">${new Date(entry.dateAndTimeOfDrinking).toLocaleString()}</span>
              </div>
              <div class="water-actions">
                  <button class="edit-water-btn" data-id="${entry.waterRegId}">Rediger</button>
                  <button class="delete-water-btn" data-id="${entry.waterRegId}">Slet</button>
              </div>
          `;
          waterLogContainer.appendChild(waterEntryDiv);
      });
  } catch (error) {
      console.error('Fejl ved hentning af vandindtag:', error);
  }
}



// Opdater visningen af vandindtag efter registrering
document.getElementById('water-registration-form').addEventListener('submit', function (event) {
  event.preventDefault();
  registerWaterIntake().then(updateWaterLogDisplay);
});

// Håndter klik på rediger/slet-knapperne
document.getElementById('registered-water').addEventListener('click', function (event) {
  const waterRegId = event.target.dataset.id;
  if (event.target.classList.contains('delete-water-btn') && waterRegId) {
      deleteWaterIntake(waterRegId).then(updateWaterLogDisplay);
  } else if (event.target.classList.contains('edit-water-btn') && waterRegId) {
      editWaterIntake(waterRegId).then(updateWaterLogDisplay);
  }
});





document.getElementById('ingredient-registration-form').addEventListener('submit', function (event) {
event.preventDefault();
registerIngredient()
})
