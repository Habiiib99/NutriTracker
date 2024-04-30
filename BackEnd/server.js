import express from 'express';
import fetch from 'node-fetch';

const app = express();
const port = 2220;
const apiKey = '169792';
app.use(express.json());


// importere mysql
import sql from 'mssql';
const dbConfig = {
  user: 'Habib',
  password: 'Dhdh2399!',
  server: 'servertesthabib.database.windows.net',
  database: 'test',
  options: {
    encrypt: true, // for Azure
    trustServerCertificate: false // nødvendig for lokal udvikling, ikke nødvendig for Azure
  }
};
async function connectToDb() {
  try {
    // Opretter forbindelse og laver en ny instance af SQL-connection
    const pool = await sql.connect(dbConfig);
    console.log('Forbundet til databasen.');
    // Her kan du køre en test forespørgsel for at sikre, at forbindelsen virker
    const result = await pool.request().query('SELECT 1 AS number');
    console.log(result);
  } catch (err) {
    console.error('Fejl ved forbindelse til databasen:', err);
  }
}
connectToDb();




// Konstanter for sortKeys
const ProteinKey = 1110; // SortKey for protein
const kcalKey = 1030; // SortKey for kcal
const fatKey = 1310; // SortKey for fedt
const fiberKey = 1240; // SortKey for fiber

// Funktion til at hente foodID til en given søgestreng
async function fetchFoodID(searchString) {
  searchString = searchString.charAt(0).toUpperCase() + searchString.slice(1);
  const url = `https://nutrimonapi.azurewebsites.net/api/FoodItems/BySearch/${searchString}`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
    });
    if (response.ok) {
      const result = await response.json();
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
// Funktion til at hente næringsværdier baseret på foodID og sortKey
async function fetchNutrientValue(foodID, sortKey) {
  const url = `https://nutrimonapi.azurewebsites.net/api/FoodCompSpecs/ByItem/${foodID}/BySortKey/${sortKey}`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
    });
    if (response.ok) {
      const result = await response.json();
      if (result.length > 0) {
        return result[0].resVal;
      } else {
        console.log(`Nutrient value not found for foodID: ${foodID}`);
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

// Endpoint for at søge efter fødevarer
app.get('/search-food/:searchString', async (req, res) => {
  try {
    const foodID = await fetchFoodID(req.params.searchString);
    if (foodID) {
      res.json({ foodID });
    } else {
      res.status(404).json({ message: 'Fødevare ikke fundet' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server fejl', error });
  }
});
// Endpoint for at hente næringsværdier baseret på foodID og sortKey
app.get('/nutrient-value/:foodID/:sortKey', async (req, res) => {
  try {
    const nutrientValue = await fetchNutrientValue(req.params.foodID, req.params.sortKey);
    if (nutrientValue) {
      res.json({ nutrientValue });
    } else {
      res.status(404).json({ message: 'Næringsværdi ikke fundet' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server fejl', error });
  }
});


// **BRUGERSTYRING**

// Funktion til bmr
function calculateBMR(weight, age, gender) {
  let bmr = 0;  // Basalstofskifte i MJ/dag

  // Konverter alder til et tal for at kunne anvende i logik
  age = parseInt(age, 10);

  if (gender === 'male') {
    if (age <= 3) {
      bmr = 0.249 * weight - 0.13;
    } else if (age <= 10) {
      bmr = 0.095 * weight + 2.11;
    } else if (age <= 18) {
      bmr = 0.074 * weight + 2.75;
    } else if (age <= 30) {
      bmr = 0.064 * weight + 2.84;
    } else if (age <= 60) {
      bmr = 0.0485 * weight + 3.67;
    } else if (age <= 75) {
      bmr = 0.0499 * weight + 2.93;
    } else {
      bmr = 0.035 * weight + 3.43;
    }
  } else if (gender === 'female') { // female
    if (age <= 3) {
      bmr = 0.244 * weight - 0.13;
    } else if (age <= 10) {
      bmr = 0.085 * weight + 2.03;
    } else if (age <= 18) {
      bmr = 0.056 * weight + 2.90;
    } else if (age <= 30) {
      bmr = 0.0615 * weight + 2.08;
    } else if (age <= 60) {
      bmr = 0.0364 * weight + 3.47;
    } else if (age <= 75) {
      bmr = 0.0386 * weight + 2.88;
    } else {
      bmr = 0.0410 * weight + 2.61;
    }
  }

  return bmr 

}

import bcrypt from 'bcrypt';
// Husk at bruge middleware for at parse JSON body
app.use(express.json());

app.post('/api/users', async (req, res) => {
  const { name, age, gender, weight, email, password } = req.body;
  
  // Beregner BMR
  const bmr = calculateBMR(weight, age, gender);
  
  try {
    // Forbinder til databasen
    const pool = await sql.connect(dbConfig);
    // Hasher brugerens password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Udfører SQL query med parameterized inputs
    const result = await pool.request()
      .input('name', sql.VarChar, name)
      .input('age', sql.Int, age)
      .input('gender', sql.VarChar, gender)
      .input('weight', sql.Decimal(5, 2), weight)
      .input('email', sql.VarChar, email)
      .input('password', sql.VarChar, hashedPassword)
      .input('bmr', sql.Decimal(10, 4), bmr)
      .query('INSERT INTO profiles (name, age, gender, weight, bmr, email, password) OUTPUT INSERTED.id VALUES (@name, @age, @gender, @weight, @bmr, @email, @password)');
      
      // Genererer en JWT for den nye bruger
    const newUser = { id: result.recordset[0].id, name, age, gender, weight, email };
    const token = jwt.sign({ userId: newUser.id }, 'test', { expiresIn: '1h' });
    
    // Sender det nye brugerobjekt og token tilbage som respons
    res.status(201).json({ newUser, token });
  } catch (error) {
    // Logger fejlen og sender en fejlmeddelelse tilbage til klienten
    console.error(error);
    res.status(500).json({ message: 'Fejl ved oprettelse af bruger', error: error.message });
  }
});



// Antag at dbConfig er din database konfiguration som vist tidligere
sql.connect(dbConfig).then(pool => {
  // Nu kan du bruge pool i resten af din applikation
  app.delete('/api/users/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query('DELETE FROM profiles WHERE id = @userId');

      if (result.rowsAffected[0] > 0) {
        res.json({ message: 'Bruger slettet' });
      } else {
        res.status(404).json({ message: 'Bruger ikke fundet' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Server fejl', error: error.message });
    }
  });

}).catch(err => {
  console.error('Fejl ved forbindelse til databasen:', err);
});


// Opdatere brugeroplysninger
app.put('/api/users/:userId', async (req, res) => {
  const { name, age, gender, weight } = req.body;
  const userId = req.params.userId;

   // Beregner ny BMR
   const bmr = calculateBMR(weight, age, gender);

  try {
    const pool = await sql.connect(dbConfig); // sikre at forbindelsen er aktiv

    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('name', sql.VarChar, name)
      .input('age', sql.Int, age)
      .input('gender', sql.VarChar, gender)
      .input('weight', sql.Decimal(5, 2), weight)
      .input('bmr', sql.Decimal(10, 4), bmr)
      .query('UPDATE profiles SET name = @name, age = @age, gender = @gender, weight = @weight, bmr = @bmr WHERE id = @userId');


    if (result.rowsAffected[0] > 0) {
      res.json({ message: 'Bruger opdateret', id: userId, name, age, gender, weight });
    } else {
      res.status(404).json({ message: 'Bruger ikke fundet' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server fejl', error: error.message });
  }
});


// Logik for at logge en bruger ind (**opdateres med evt frontend**)
import jwt from 'jsonwebtoken';

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Simulerer en brugersøgning i databasen
    const user = await db.query('SELECT id, password FROM profiles WHERE email = ?', [email]);
    if (user.length === 0) {
      return res.status(401).json({ message: 'Ugyldig email eller adgangskode' });
    }

    // Sammenlign det indtastede password med det hashede password i databasen
    const isMatch = await bcrypt.compare(password, user[0].password);

    // Hvis passwords matcher, generer en JWT
    if (isMatch) {
      const token = jwt.sign(
        { userId: user[0].id },
        'your_static_secret_here',  // Statisk 'hemmelighed'
        { expiresIn: '1h' }
      );

      // Send token tilbage til brugeren
      res.json({ token });
    } else {
      res.status(401).json({ message: 'Ugyldig email eller adgangskode' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Serverfejl ved forsøg på login', error: error.message });
  }
});




// **MEAL CREATOR**
app.post('/api/meals', async (req, res) => {
  const { name, userId, ingredients } = req.body; // Ingredienser som et array af objekter { foodItemId, weight }
  try {
    let totalEnergy = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbohydrates = 0;
    let totalFiber = 0;

    // Bruger pool til at oprette en forbindelse til databasen - men kun til at oprette måltidet så ikke hele databasen. (Mere effektivt)
    const pool = await sql.connect(dbConfig);

    const mealResult = await pool.request()
    .input('name', sql.VarChar, name)
    .input('userId', sql.Int, userId)
    .query('INSERT INTO meals (name, userId) OUTPUT INSERTED.id VALUES (@name, @userID)');
    const mealId = mealResult.recordset[0].insertId;

    for (const ingredient of ingredients) {
      const ingredientDetailsResult = await pool.request()
    .input('foodItemId', sql.Int, ingredient.foodItemId)
    .query('SELECT kcal, protein, fat, carbohydrates, fiber FROM food_items WHERE id = @foodItemId');

      const ingredientDetails = ingredientDetailsResult.recordset;

      if (ingredientDetails.length > 0) {
        const { kcal, protein, fat, carbohydrates, fiber } = ingredientDetails[0];

        // Beregn bidrag fra hver ingrediens baseret på vægten
        const factor = ingredient.weight / 100; // Antager, at næringsdata er pr. 100 gram
        totalEnergy += kcal * factor;
        totalProtein += protein * factor;
        totalFat += fat * factor;
        totalCarbohydrates += carbohydrates * factor;
        totalFiber += fiber * factor;
      }

    // Indsæt ingrediens i måltidet    
    const insertIngredientResult = await pool.request()
    .input('mealId', sql.Int, mealId)
    .input('foodItemId', sql.Int, ingredient.foodItemId)
    .input('weight', sql.Decimal(5, 2), ingredient.weight)
    .query('INSERT INTO meal_food_items (mealId, foodItemId, weight) VALUES (@mealId, @foodItemId, @weight)'); 
    }

    // Gem total næringsdata i måltidet
    const saveMealResult = await pool.request()
    .input('totalEnergy', sql.Decimal(5, 2), totalEnergy)
    .input('totalProtein', sql.Decimal(5, 2), totalProtein)
    .input('totalFat', sql.Decimal(5, 2), totalFat)
    .input('totalCarbohydrates', sql.Decimal(5, 2), totalCarbohydrates)
    .input('totalFiber', sql.Decimal(5, 2), totalFiber)
    .input('mealId', sql.Int, mealId)
    .query('UPDATE meals SET totalEnergy = @totalEnergy, totalProtein = @totalProtein, totalFat = @totalFat, totalCarbohydrates = @totalCarbohydrates, totalFiber = @totalFiber WHERE id = @mealId');
    
    // Send respons med det nye måltid
    res.status(201).json({ id: mealId, name, userId, ingredients, totalEnergy, totalProtein, totalFat, totalCarbohydrates, totalFiber });
  } catch (error) {
    res.status(500).json({ message: 'Fejl ved oprettelse af måltid', error: error.message });
  }
});

// Søge efter ingredienser
app.get('/api/ingredients/search', async (req, res) => {
  const { searchString } = req.query; // Antager at søgestrengen sendes som en query parameter
  try {
    const foodID = await fetchFoodID(searchString);
    if (foodID) {
      const nutrientValue = await fetchNutrientValue(foodID, "nødvendig sortKey"); // Du skal vide, hvilken sortKey der er relevant for din app
      res.json({ nutrientValue });
    } else {
      res.status(404).json({ message: 'Ingrediens ikke fundet' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server fejl', error });
  }
});

// Finde et måltid og se dens ingredienser og vægt
app.get('/api/meals/:mealId', async (req, res) => {
  const { mealId } = req.params;
  try {
    // Hent måltidet og dets basale oplysninger
    const mealQuery = 'SELECT * FROM meals WHERE id = ?';
    const mealResults = await db.query(mealQuery, [mealId]);
    if (mealResults.length === 0) {
      return res.status(404).json({ message: 'Måltid ikke fundet' });
    }
    const meal = mealResults[0];
    // Hent alle ingredienser tilknyttet dette måltid
    const ingredientsQuery = 'SELECT fi.name, mfi.weight FROM meal_food_items mfi JOIN food_items fi ON mfi.foodItemId = fi.id WHERE mfi.mealId = ?';
    const ingredients = await db.query(ingredientsQuery, [mealId]);
    // Sammensæt det fulde måltid med ingredienser
    res.json({ 
      id: meal.id, 
      name: meal.name, 
      userId: meal.userId, 
      ingredients 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server fejl', error: error.message });
  }
});

// Slet et måltid
app.delete('/api/meals/:mealId', async (req, res) => {
  const { mealId } = req.params; // ID for måltidet der skal slettes
  const query = 'DELETE FROM meals WHERE id = ?';
  try {
    const result = await db.query(query, [mealId]);
    if (result.affectedRows) {
      res.json({ message: 'Måltid slettet' });
    } else {
      res.status(404).json({ message: 'Måltid ikke fundet' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Fejl ved sletning af måltid', error: error.message });
  }
});



// **MEAL TRACKER**
app.post('/api/meal-tracker/track-meal', async (req, res) => {
  const { mealId, userId, intakeDate, servings } = req.body;
  const query = 'INSERT INTO intakes (mealId, userId, intakeDate, servings) VALUES (?, ?, ?, ?)';
  try {
    const result = await db.query(query, [mealId, userId, intakeDate, servings]);
    res.status(201).json({ id: result.insertId, mealId, userId, intakeDate, servings });
  } catch (error) {
    res.status(500).json({ message: 'Fejl ved registrering af næringsindtag', error: error.message });
  }
});

// se indtag af en enkelt ingrediens
app.get('/api/meal-tracker/intake/:userId', async (req, res) => {
  const { userId } = req.params;
  const query = 'SELECT * FROM intakes WHERE userId = ?';
  try {
    const results = await db.query(query, [userId]);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Fejl ved hentning af næringsindtag', error: error.message });
  }
});
// registrere indtag en enkelt ingrediens
app.post('/api/meal-tracker/track-ingredient', async (req, res) => {
  // Automatisk tildeling af nuværende dato og tid.
  const intakeDate = new Date();
  
  // Lokationen antages at blive sendt med i request body.
  // Hvis ikke, skal du tilføje logik for at bestemme lokationen her.
  const { foodItemId, userId, weight, location } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO intakes (foodItemId, userId, intakeDate, weight, location) VALUES (?, ?, ?, ?, ?)',
      [foodItemId, userId, intakeDate, weight, location]
    );
    
    res.status(201).json({
      id: result.insertId,
      foodItemId,
      userId,
      intakeDate: intakeDate.toISOString(), // Konverterer Date objektet til en ISO string.
      weight,
      location
    });
  } catch (error) {
    res.status(500).json({ message: 'Fejl ved registrering af ingrediensindtag', error: error.message });
  }
});

// vise brugerens næringsindtag
app.get('/api/meal-tracker/intake/:userId', async (req, res) => {
  const { userId } = req.params;
  const query = 'SELECT * FROM intakes WHERE userId = ?';
  try {
    const results = await db.query(query, [userId]);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Fejl ved hentning af næringsindtag', error: error.message });
  }
});
// redigere en registrering
app.put('/api/meal-tracker/intake/:intakeId', async (req, res) => {
  const { intakeId } = req.params;
  const { mealId, foodItemId, intakeDate, servings, weight } = req.body;
  const query = 'UPDATE intakes SET mealId = ?, foodItemId = ?, intakeDate = ?, servings = ?, weight = ? WHERE id = ?';
  try {
    const result = await db.query(query, [mealId, foodItemId, intakeDate, servings, weight, intakeId]);
    if (result.affectedRows) {
      res.json({ message: 'Næringsindtag opdateret', id: intakeId });
    } else {
      res.status(404).json({ message: 'Næringsindtag ikke fundet' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Fejl ved opdatering af næringsindtag', error: error.message });
  }
});
// slette en registrering
app.delete('/api/meal-tracker/intake/:intakeId', async (req, res) => {
  const { intakeId } = req.params;
  const query = 'DELETE FROM intakes WHERE id = ?';
  try {
    const result = await db.query(query, [intakeId]);
    if (result.affectedRows) {
      res.json({ message: 'Næringsindtag slettet' });
    } else {
      res.status(404).json({ message: 'Næringsindtag ikke fundet' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Fejl ved sletning af næringsindtag', error: error.message });
  }
});






// **ACTIVITY TRACKER** => Dette skal opdateres/ændres


//Funktion til at tracke aktiviteter og beregne kalorier
/*
// Definition af objekter for forskellige typer aktiviteter
const almindeligeHverdagsaktiviteter = {
    "Almindelig gang": 215,
    "Gang ned af trapper": 414,
    "Gang op af trapper": 1079,
    "Slå græs med manuel græsslåmaskine": 281,
    "Lave mad og redde senge": 236,
    "Luge ukrudt": 362,
    "Rydde sne": 481,
    "Læse eller se TV": 74,
    "Stå oprejst": 89,
    "Cykling i roligt tempo": 310,
    "Tørre støv af": 163,
    "Vaske gulv": 281,
    "Pudse vinduer": 259
};

const sportsAktiviteter = {
    "Cardio": 814,
    "Hård styrketræning": 348,
    "Badminton": 318,
    "Volleyball": 318,
    "Bordtennis": 236,
    "Dans i højt tempo": 355,
    "Dans i moderat tempo": 259,
    "Fodbold": 510,
    "Rask gang": 384,
    "Golf": 244,
    "Håndbold": 466,
    "Squash": 466,
    "Jogging": 666,
    "Langrend": 405,
    "Løb i moderat tempo": 872,
    "Løb i hurtigt tempo": 1213,
    "Ridning": 414,
    "Skøjteløb": 273,
    "Svømning": 296,
    "Cykling i højt tempo": 658
};

const forskelligeTyperArbejde = {
    "Bilreparation": 259,
    "Gravearbejde": 414,
    "Landbrugsarbejde": 236,
    "Let kontorarbejde": 185,
    "Male hus": 215,
    "Murerarbejde": 207,
    "Hugge og slæbe på brænde": 1168
};

// Referencer til HTML-elementer
const activityTypeSelect = document.getElementById("activityType");
const activityNameSelect = document.getElementById("activityName");
const minutesInput = document.getElementById("minutes");

// Funktion til at udfylde aktivitetsdropdown-menuen baseret på den valgte type
activityTypeSelect.addEventListener("change", function() {
    const selectedType = this.value;
    let activities;
    if (selectedType === "everyday") {
        activities = almindeligeHverdagsaktiviteter;
    } else if (selectedType === "sports") {
        activities = sportsAktiviteter;
    } else if (selectedType === "work") {
        activities = forskelligeTyperArbejde;
    }
    populateActivityDropdown(activities);
});

// Funktion til at udfylde aktivitetsdropdown-menuen
function populateActivityDropdown(activities) {
    activityNameSelect.innerHTML = "";
    for (const activity in activities) {
        const option = document.createElement("option");
        option.value = activity;
        option.textContent = activity;
        activityNameSelect.appendChild(option);
    }
}

// Kald populateActivityDropdown() initialt for at udfylde dropdown-menuen
populateActivityDropdown(almindeligeHverdagsaktiviteter);

function calculateCalories() {
    const selectedActivity = activityNameSelect.value;
    const minutes = parseInt(minutesInput.value);
    const caloriesPerHour = activityTypeSelect.value === "everyday" ? almindeligeHverdagsaktiviteter[selectedActivity] :
                            activityTypeSelect.value === "sports" ? sportsAktiviteter[selectedActivity] :
                            activityTypeSelect.value === "work" ? forskelligeTyperArbejde[selectedActivity] : null;
    if (!selectedActivity || isNaN(minutes) || caloriesPerHour === null) {
        console.log("Indtast venligst både aktivitet og antal minutter.");
        return;
    }
    const calories = (caloriesPerHour * minutes) / 60;
    console.log(`Kalorier forbrændt: ${calories}`);
}
*/

// registrere en aktivitet
app.post('/api/activity-tracker/activities', async (req, res) => {
  const { userId, activityType, duration, date } = req.body;
  const caloriesBurned = calculateCalories(activityType, duration); // funktion til kalorie beregning (måske ændres)

  try {
    const result = await db.query(
      'INSERT INTO activities (userId, activityType, duration, caloriesBurned, date) VALUES (?, ?, ?, ?, ?)',
      [userId, activityType, duration, caloriesBurned, date]
    );
    res.status(201).json({
      id: result.insertId,
      userId,
      activityType,
      duration,
      caloriesBurned,
      date
    });
  } catch (error) {
    res.status(500).json({ message: 'Fejl ved registrering af aktivitet', error: error.message });
  }
});


// endpoint til stofskifte 
app.get('/api/activity-tracker/bmr/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const userDetails = await getUserDetails(userId);
    const bmr = calculateBMR(userDetails.weight, userDetails.age, userDetails.gender);

    res.json({ userId, bmr: bmr });
  } catch (error) {
    res.status(500).json({ message: 'Fejl ved beregning af basalstofskifte', error: error.message });
  }
});





// **DAILY NUTRI** -- skal opdateres/ændres
app.get('/api/daily-nutri/hourly/:userId', async (req, res) => {
  const { userId } = req.params;
  // Her skal du hente indtag og aktiviteter fra databasen, og derefter gruppere og beregne dem pr. time
  // Lad os antage, at du har en funktion der kan gøre dette
  try {
    const hourlyData = await getHourlyNutriData(userId);
    res.json(hourlyData);
  } catch (error) {
    res.status(500).json({ message: 'Fejl ved hentning af timebaseret data', error: error.message });
  }
});

app.get('/api/daily-nutri/daily/:userId', async (req, res) => {
  const { userId } = req.params;
  // Her skal du hente og gruppere data pr. dag
  // Antager igen, at du har en funktion der kan hente og beregne disse data
  try {
    const dailyData = await getDailyNutriData(userId);
    res.json(dailyData);
  } catch (error) {
    res.status(500).json({ message: 'Fejl ved hentning af daglig data', error: error.message });
  }
});



app.listen(port, () => {
  console.log(`Server kører på http://localhost:${port}`);
});
