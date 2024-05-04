// MEAL CREATOR
// Definér konstante API-nøgler
const apiKey = '169972';
const ProteinKey = 1110; // SortKey for protein
const kcalKey = 1030; // SortKey for kcal
const fatKey = 1310; // SortKey for fedt
const fiberKey = 1240; // SortKey for fiber

// Klasse til fødevareelementer
class FoodItem {
    constructor(name, foodID, kcal, protein, fat, fiber, quantity) {
        this.name = name;
        this.foodID = foodID;
        this.kcal = kcal;
        this.protein = protein;
        this.fat = fat;
        this.fiber = fiber;
        this.quantity = quantity || 0;
    }
}

// Klasse til måltider
class Meal {
    constructor(name) {
        this.name = name;
        this.ingredients = [];
    }

    // Tilføj ingrediens til måltid
    addIngredient(foodItem) {
        this.ingredients.push(foodItem);
    }

    // Beregn samlede næringsindhold for måltidet
    calculateTotalNutrients() {
        const total = {
            kcal: 0,
            protein: 0,
            fat: 0,
            fiber: 0
        };

        this.ingredients.forEach((ingredient) => {
            const quantityInKg = (ingredient.quantity || 0) / 100; // For at konvertere til per 100 gram
            total.kcal += ingredient.kcal * quantityInKg;
            total.protein += ingredient.protein * quantityInKg;
            total.fat += ingredient.fat * quantityInKg;
            total.fiber += ingredient.fiber * quantityInKg;
        });

        return total;
    }
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

// Funktion til at hente fødevare
async function fetchFoodItem(ingredientName) {
    // Henter fødevare baseret på foodID
    const foodID = await fetchFoodID(ingredientName);
    if (!foodID) return null;

    // Hent og valider 
    const kcal = await fetchAndValidateNutrient(foodID, kcalKey, 'Energy');
    const protein = await fetchAndValidateNutrient(foodID, ProteinKey, 'Protein');
    const fat = await fetchAndValidateNutrient(foodID, fatKey, 'Fat');
    const fiber = await fetchAndValidateNutrient(foodID, fiberKey, 'Fiber');

    return new FoodItem(ingredientName, foodID, kcal, protein, fat, fiber);
}

async function fetchFoodID(searchString) {
    searchString = searchString.charAt(0).toUpperCase() + searchString.slice(1);
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
            return result[0].foodID;
        } else {
            console.error('Failed to fetch data. Status:', response.status);
            return null;
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

// Hente værdien af næringsindhold
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


// Hente og validere næringsindhold
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

let currentMeal = new Meal(''); // Initialiser med en tomt måltidsnavn

// Opdaterer antallet af ingredienser
function updateIngredientCount() {
    const count = currentMeal.ingredients.length;
    document.getElementById('ingredient-count').textContent = count;
}

function populateIngredientList(results) {
    const ingredientList = document.getElementById('ingredient-list');
    // Clear previous results
    ingredientList.innerHTML = ''

    for (const result of results) {
        const option = document.createElement('option')
        option.value = result.foodName
        option.text = result.foodName

        ingredientList.appendChild(option)
    }
}

// Sørger for DOM er indlæst
document.addEventListener('DOMContentLoaded', () => {
    const mealForm = document.getElementById('meal-creator-form');
    const addIngredientBtn = document.getElementById('add-ingredient-btn');
    const ingredientsTableBody = document.getElementById('ingredientsTable').getElementsByTagName('tbody')[0];
    const mealNameInput = document.getElementById('meal-name');
    const ingredientNameInput = document.getElementById('ingredient-name');


    ingredientNameInput.addEventListener('keypress', async (event) => {
        const results = await fetchFoodItems(event.target.value)
        if (!results) {
            console.log('No results')
            return
        }

        populateIngredientList(results)


    })


    // Når der klikkes på "tilføj ingrediens" knappen
    addIngredientBtn.addEventListener('click', async () => {
        const ingredientNameInput = document.getElementById('ingredient-name').value.trim();
        const ingredientQuantityInput = parseFloat(document.getElementById('ingredient-quantity').value.trim());

        if (ingredientNameInput && ingredientQuantityInput && ingredientQuantityInput > 0) {
            const foodItem = await fetchFoodItem(ingredientNameInput);
            if (foodItem) {
                foodItem.quantity = ingredientQuantityInput;
                currentMeal.addIngredient(foodItem);
                updateIngredientsTable();
                updateNutritionalSummary();
                updateIngredientCount(); // Opdater antallet af ingredienser
            } else {
                alert('Fødevare blev ikke fundet.');
            }
        } else {
            alert('Indtast venligst en gyldig fødevare og mængde.');
        }
    });

    // Når der klikkes på "opret måltid" knappen
    mealForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const mealName = mealNameInput.value.trim();
        if (mealName && currentMeal.ingredients.length > 0) {
            currentMeal.name = mealName;
            saveMeal(currentMeal);
            alert('Måltid oprettet!');
            resetMealCreator();
        } else {
            alert('Indtast venligst et måltidsnavn og tilføj mindst en ingrediens.');
        }
    });

    // Opdater den samlede ernæringsmæssige opsummering
    function updateIngredientsTable() {
        ingredientsTableBody.innerHTML = '';
        currentMeal.ingredients.forEach((ingredient, index) => {
            const row = ingredientsTableBody.insertRow();
            row.innerHTML = `
                <td>${ingredient.name}</td>
                <td>${ingredient.foodID}</td>
                <td>${ingredient.quantity}</td>
                <td><button onclick="deleteIngredient(${index})">Slet</button></td>
            `;
        });
    }

    function updateNutritionalSummary() {
        const totalNutrients = currentMeal.calculateTotalNutrients();
        document.getElementById('total-kcal').textContent = totalNutrients.kcal.toFixed(2);
        document.getElementById('total-protein').textContent = totalNutrients.protein.toFixed(2);
        document.getElementById('total-fat').textContent = totalNutrients.fat.toFixed(2);
        document.getElementById('total-fiber').textContent = totalNutrients.fiber.toFixed(2);
    }

    async function saveMeal(meal) {
        const user = JSON.parse(localStorage.getItem('user'))
        let body = {
            mealName: meal.name,
            ingredients: meal.ingredients,
            userId: user.userId
        }

        await fetch('http://localhost:2220/api/meals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }).then(response => {
        }).then(response => { response.json() }).then((data) => { })
    }

    // Når måltid er blevet oprettet, nulstilles siden
    function resetMealCreator() {
        mealNameInput.value = '';
        document.getElementById('ingredient-name').value = '';
        document.getElementById('ingredient-quantity').value = '';
        currentMeal = new Meal('');
        updateIngredientsTable();
        updateNutritionalSummary();
        updateIngredientCount(); // Nulstil antallet af ingredienser
    }

    // Når man vil fjerne en ingrediens
    window.deleteIngredient = (index) => {
        currentMeal.ingredients.splice(index, 1);
        updateIngredientsTable();
        updateNutritionalSummary();
        updateIngredientCount(); // Opdater antallet af ingredienser
    }
})