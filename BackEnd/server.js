import express from 'express';
import fetch from 'node-fetch';

const app = express();
const port = 2000;
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
import bcrypt from 'bcrypt';
// Husk at bruge middleware for at parse JSON body
app.use(express.json());
app.post('/api/users', async (req, res) => {
  const { name, age, gender, weight, email, password } = req.body;
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
      .query('INSERT INTO profiles (name, age, gender, weight, email, password) OUTPUT INSERTED.id VALUES (@name, @age, @gender, @weight, @email, @password)');
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

app.delete('/api/users/:userId', async (req, res) => {
  const userId = req.params.userId;
  const query = 'DELETE FROM profiles WHERE id = ?';
  try {
    const result = await db.query(query, [userId]);
    if (result.affectedRows) {
      res.json({ message: 'Bruger slettet' });
    } else {
      res.status(404).json({ message: 'Bruger ikke fundet' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server fejl', error: error.message });
  }
});
app.put('/api/users/:userId', async (req, res) => {
  const { name, age, gender, weight } = req.body;
  const userId = req.params.userId;
  const query = 'UPDATE profiles SET name = ?, age = ?, gender = ?, weight = ? WHERE id = ?';
  try {
    const result = await db.query(query, [name, age, gender, weight, userId]);
    if (result.affectedRows) {
      res.json({ message: 'Bruger opdateret', id: userId, name, age, gender, weight });
    } else {
      res.status(404).json({ message: 'Bruger ikke fundet' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server fejl', error: error.message });
  }
});

// Logik for at logge en bruger ind
import jwt from 'jsonwebtoken';
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  // Først, find brugeren i databasen
  const query = 'SELECT id, password FROM profiles WHERE email = ?';
  try {
    const results = await db.query(query, [email]);
    if (results.length === 0) {
      return res.status(401).json({ message: 'Ugyldig email eller adgangskode' });
    }
    const user = results[0];
    // Sammenlign det indtastede password med det hashede password i databasen
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Ugyldig email eller adgangskode' });
    }
    // Hvis passwords matcher, generer en JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    // Send token tilbage til brugeren
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Serverfejl', error: error.message });
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

    const mealResult = await db.request().query('INSERT INTO meals (name, userId) VALUES (?, ?)', [name, userId]);
    const mealId = mealResult.recordset[0].insertId;

    for (const ingredient of ingredients) {
      const ingredientDetailsResult = await db.request().query('SELECT kcal, protein, fat, carbohydrates, fiber FROM food_items WHERE id = ?', [ingredient.foodItemId]);
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

      await db.request().query('INSERT INTO meal_food_items (mealId, foodItemId, weight) VALUES (?, ?, ?)', [mealId, ingredient.foodItemId, ingredient.weight]);
    }

    // Gem total næringsdata i måltidet
    await db.request().query('UPDATE meals SET totalEnergy = ?, totalProtein = ?, totalFat = ?, totalCarbohydrates = ?, totalFiber = ? WHERE id = ?', [totalEnergy, totalProtein, totalFat, totalCarbohydrates, totalFiber, mealId]);

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
function calculateBMR(weight, height, age, gender) {
  let bmr;
  if (gender === 'male') {
    bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }
  return bmr;
}

// registrere en aktivitet
app.post('/api/activity-tracker/activities', async (req, res) => {
  const { userId, activityType, duration, date } = req.body;
  const caloriesBurned = calculateCalories(activityType, duration); // Denne funktion skal du definere
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
// beregne basalstofskifte
app.get('/api/activity-tracker/bmr/:userId', async (req, res) => {
  const { userId } = req.params;
  
  // Antag at vi har en funktion til at hente en brugers alder, vægt og køn baseret på userId
  const user = await getUserDetails(userId); // Denne funktion skal du definere
  
  const bmr = calculateBMR(user.weight, user.height, user.age, user.gender); // Denne funktion skal du definere
  
  res.json({ userId, bmr });
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
