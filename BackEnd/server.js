import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
const port = 2220;
const apiKey = '169792';
app.use(express.json());

// CORS options (så min lokale server godtager den/ dette ændres?)
const corsOptions = {
  origin: 'http://127.0.0.1:5500',  // Tillad anmodninger fra denne oprindelse
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',  // Tilladte HTTP metoder
  allowedHeaders: 'Content-Type, Authorization',  // Tilladte headers
  credentials: true  // Tillad cookies/session across domains
};
// Anvend CORS med de specificerede indstillinger
app.use(cors(corsOptions));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, PUT, GET, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});


// importere mysql
import sql from 'mssql';
const dbConfig = {
  user: 'Habib',
  password: 'Dhdh2399!',
  server: 'servertesthabib.database.windows.net',
  database: 'NutriTrackerOK',
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


app.post('/register', async (req, res) => {
  const { name, password, age, weight, gender, email } = req.body;
  console.log(req.body);

  try {
    const pool = await sql.connect(dbConfig);
    const user = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT userId FROM profiles WHERE email = @email');

    if (user.recordset.length !== 0) {
      console.log(user.recordset.length);
      return res.status(400).json({ message: 'En bruger med den email eksisterer allerede' });
    }

    // Siden userId er en IDENTITY kolonne, behøver du ikke at sætte den her.
    const result = await pool.request()
      .input('name', sql.VarChar, name)
      .input('age', sql.Int, age)
      .input('gender', sql.VarChar, gender)
      .input('weight', sql.Decimal(5, 2), weight)
      .input('email', sql.VarChar, email)
      .input('password', sql.VarChar, password)
      .input('bmr', sql.Decimal(5, 4), calculateBMR(weight, age, gender))
      .query('INSERT INTO profiles (name, age, gender, weight, email, password, bmr) OUTPUT INSERTED.userId VALUES (@name, @age, @gender, @weight, @email, @password, @bmr)');

    // Bruger OUTPUT INSERTED.userId for at få den genererede ID
    res.status(201).json({ message: 'Bruger oprettet', id: result.recordset[0].userId });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Serverfejl ved forsøg på registrering', error: error.message });
  }
});


app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body)

  try {
    const pool = await sql.connect(dbConfig);
    const user = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT userId, name, age, gender, weight, email, password, bmr FROM profiles WHERE email = @email');

    if (user.recordset.length === 0) {
      console.log(user.recordset.length)
      return res.status(404).json({ message: 'Ugyldig email' });
    }
    console.log(user.recordset)
    if (user.recordset[0].password != password) {
      return res.status(401).json({ message: 'Ugyldigt password' });
    }

    delete user.recordset[0].password
    res.status(200).json({ message: 'Login succesfuldt', user: user.recordset[0] })

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Serverfejl ved forsøg på login', error: error.message });
  }
});



// opdater brugeroplysninger
app.put('/api/users/:userId', async (req, res) => {
  const { userId } = req.params;
  const { name, age, gender, weight, email } = req.body;

  try {
    const pool = await sql.connect(dbConfig);

    // Beregn den nye BMR baseret på opdaterede vægt, alder, og køn
    const bmr = calculateBMR(weight, age, gender);

    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('name', sql.VarChar, name)
      .input('age', sql.Int, age)
      .input('gender', sql.VarChar, gender)
      .input('weight', sql.Decimal(5, 2), weight)
      .input('email', sql.VarChar, email)
      .input('bmr', sql.Decimal(10, 4), bmr)  // Tilføj BMR som input parameter
      .query('UPDATE profiles SET name = @name, age = @age, gender = @gender, weight = @weight, email = @email, bmr = @bmr WHERE userId = @userId');

    if (result.rowsAffected[0] > 0) {
      res.status(200).json({ message: 'Bruger opdateret', bmr: bmr });
    } else {
      res.status(404).json({ message: 'Bruger ikke fundet' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server fejl', error: error.message });
  }
});



app.delete('/delete/:userId', async (req, res) => {
  console.log(req.params)
  const { userId } = req.params

  const pool = await sql.connect(dbConfig)

  pool.request().input('userId', sql.Int, userId)
    .query('DELETE FROM meals WHERE userId = @userId').then(() => {

      pool
        .request()
        .input('userId', sql.Int, userId)
        .query('DELETE FROM profiles WHERE userId = @userId').then((result) => {
          return res.status(201).json({ message: 'Bruger slettet' })
        }).catch((error) => {
          return res.status(500).json({
            message: 'Serverfejl ved forsøg på sletning af bruger', error: error,
          })
        })
    })
});






// **MEAL CREATOR**
// Endpoint for at oprette et måltid
app.post('/api/meals', async (req, res) => {
  const { mealName, userId, ingredients } = req.body; // Ingredienser som et array af objekter { foodItemId }
  console.log(req.body)
  try {
    let totalEnergy = req.body.kcal;
    let totalProtein = req.body.protein;
    let totalFat = req.body.fat;
    let totalFiber = req.body.fiber;

    // Bruger pool til at oprette en forbindelse til databasen - men kun til at oprette måltidet så ikke hele databasen. (Mere effektivt)
    const pool = await sql.connect(dbConfig);
    const meals = await pool.query('SELECT * FROM meals')

    const mealResult = await pool.request()
      .input('mealId', sql.Int, meals.recordset.length + 1)
      .input('mealName', sql.VarChar, mealName)
      .input('userId', sql.Int, userId)
      .query('INSERT INTO meals (mealId, mealName, userId) OUTPUT INSERTED.mealId VALUES (@mealId, @mealName, @userId)');
    const mealId = mealResult.recordset[0].insertId;

    for (const ingredient of ingredients) {
      const ingredientDetailsResult = await pool.request()
        .input('ingredientId', sql.Int, ingredient.ingredientId)
        .query('SELECT kcal, protein, fat, fiber FROM ingredients WHERE ingredientId = @ingredientId');

      const ingredientDetails = ingredientDetailsResult.recordset;

      if (ingredientDetails.length > 0) {
        const { kcal, protein, fat, fiber } = ingredientDetails[0];

        // 2c. Beregn bidrag fra hver ingrediens baseret på vægten
        /*const factor = ingredient.weight / 100; // Antager, at næringsdata er pr. 100 gram
        totalEnergy += kcal * factor;
        totalProtein += protein * factor;
        totalFat += fat * factor;
        totalFiber += fiber * factor;*/
      }

      // Indsæt ingrediens i måltidet    
      const insertIngredientResult = await pool.request()
        .input('kcal', sql.Decimal(5, 2), totalEnergy)
        .input('protein', sql.Decimal(5, 2), totalProtein)
        .input('fat', sql.Decimal(5, 2), totalFat)
        .input('userId', sql.Int, userId)
        .input('fiber', sql.Decimal(5, 2), totalFiber)
        .input('mealId', sql.Int, meals.recordset.length + 1)
        .input('mealName', sql.VarChar, mealName)
        .input('ingredients', sql.VarChar, JSON.stringify(ingredients))
        .query('update meals set kcal = @kcal, protein = @protein, fat= @fat, fiber= @fiber, ingredients= @ingredients where mealId = @mealId')

    }
    res.status(201).json({ mealId: meals.recordset.length + 1, mealName, userId, ingredients, totalEnergy, totalProtein, totalFat, totalFiber });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Fejl ved oprettelse af måltid', error: error.message });
  }
});










// Finde et måltid og se dens ingredienser og vægt
// ENDPOINT VIRKER
// Test i Insomnia ved at skrive: http://localhost:PORT/api/meals/1 - husk at ændre PORT
app.get('/api/meals/:id', async (req, res) => {
  const pool = await sql.connect(dbConfig);

  try {
    const { id } = req.params; // Hent værdien af :id parameteren fra req.params

    // Hent måltidet og dets basale oplysninger
    const mealQuery = 'SELECT * FROM meals WHERE mealId = @mealId';
    const mealResults = await pool.request()
      .input('mealId', sql.Int, mealId) // Tilføjet input-parametrisering
      .query(mealQuery);
    if (mealResults.recordset.length === 0) {
      return res.status(404).json({ message: 'Måltid ikke fundet' });
    }
    const meal = mealResults.recordset[0];
    // Hent alle ingredienser tilknyttet dette måltid
    const ingredientsQuery = 'SELECT fi.name, mfi.weight FROM meal_food_items mfi JOIN food_items fi ON mfi.foodItemId = fi.id WHERE mfi.mealId = @mealId';
    const ingredientsResults = await pool.request()
      .input('mealId', sql.Int, id) // Brug 'id' fra req.params
      .query(ingredientsQuery);
    const ingredients = ingredientsResults.recordset;
    // Sammensæt det fulde måltid med ingredienser
    res.json({
      id: meal.mealId,
      name: meal.mealName,
      userId: meal.userId,
      ingredients
    });
  } catch (error) {
    res.status(500).json({ message: 'Server fejl', error: error.message });
  }
});







// **MEAL TRACKER**

// Endpoint for at hente alle måltider
app.get('/api/meals', async (req, res) => {
  try {
    // Opret forbindelse til databasen
    const pool = await sql.connect(dbConfig);

    // Udfør SQL-forespørgsel for at hente alle måltider
    const mealsQuery = 'SELECT mealId, mealName, userId, kcal, protein, fat, fiber FROM meals';
    const result = await pool.request().query(mealsQuery);

    // Send resultatet som JSON
    res.json(result.recordset);
  } catch (error) {
    console.error('Fejl ved hentning af måltider:', error);
    res.status(500).json({ message: 'Server fejl ved hentning af måltider', error: error.message });
  }
});


// Endpoint for at hente den samlede vægt af en måltid
app.get('/api/meals/weight/:mealId', async (req, res) => {
  const { mealId } = req.params;
  try {
    const pool = await sql.connect(dbConfig);

    // Hent ingredienserne til måltidet
    const query = `
      SELECT SUM(ingredient.weight) AS totalWeight
      FROM OPENJSON(
        (SELECT ingredients FROM meals WHERE mealId = @mealId)
      ) 
      WITH (
        ingredientId INT '$.ingredientId',
        weight DECIMAL(10,2) '$.weight'
      ) ingredient
    `;
    const result = await pool.request()
      .input('mealId', sql.Int, mealId)
      .query(query);

    const totalWeight = result.recordset[0]?.totalWeight || 0;
    res.json({ mealId, totalWeight });
  } catch (error) {
    console.error('Fejl ved hentning af måltidets vægt:', error);
    res.status(500).json({ message: 'Server fejl', error: error.message });
  }
});


// Endpoint til at registrere et måltid i tracker-tabellen
app.post('/api/meal-tracker/track-meal', async (req, res) => {
  const { mealId, weight, userId, consumptionDate, location } = req.body;

  try {
    const pool = await sql.connect(dbConfig);
    const query = `
      INSERT INTO dbo.tracker (mealId, weight, userId, consumptionDate, location)
      VALUES (@mealId, @weight, @userId, @consumptionDate, @location)
    `;
    await pool.request()
      .input('mealId', sql.Int, mealId)
      .input('weight', sql.Decimal(10, 2), weight)
      .input('userId', sql.Int, userId)
      .input('consumptionDate', sql.DateTime, new Date(consumptionDate))
      .input('location', sql.VarChar(255), location)
      .query(query);

    res.status(201).json({ message: 'Måltid registreret i tracker-tabellen' });
  } catch (error) {
    console.error('Fejl ved registrering af måltid:', error);
    res.status(500).json({ message: 'Serverfejl', error: error.message });
  }
});


// Endpoint til at hente alle registrerede måltider fra tracker-tabellen for en given bruger
app.get('/api/meal-tracker/intakes/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const pool = await sql.connect(dbConfig);
    const query = `
      SELECT t.trackerId, t.mealId, t.weight, t.consumptionDate, t.location, m.mealName
      FROM dbo.tracker t
      JOIN dbo.meals m ON t.mealId = m.mealId
      WHERE t.userId = @userId
      ORDER BY t.consumptionDate DESC
    `;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(query);

    res.json(result.recordset);
  } catch (error) {
    console.error('Fejl ved hentning af måltider:', error);
    res.status(500).json({ message: 'Serverfejl', error: error.message });
  }
});

app.delete('/api/meal-tracker/intake/:intakeId', async (req, res) => {
  const { intakeId } = req.params;
  try {
    const pool = await sql.connect(dbConfig);
    const query = 'DELETE FROM tracker WHERE trackerId = @trackerId';
    const result = await pool.request()
      .input('trackerId', sql.Int, intakeId)
      .query(query);

    if (result.rowsAffected[0] > 0) {
      res.json({ message: 'Måltid slettet' });
    } else {
      res.status(404).json({ message: 'Måltid ikke fundet' });
    }
  } catch (error) {
    console.error('Fejl ved sletning af måltid:', error);
    res.status(500).json({ message: 'Serverfejl', error: error.message });
  }
});

app.put('/api/meal-tracker/intake/:intakeId', async (req, res) => {
  const { intakeId } = req.params;
  const { consumptionDate } = req.body;

  try {
    const pool = await sql.connect(dbConfig);
    const query = 'UPDATE tracker SET consumptionDate = @consumptionDate WHERE trackerId = @trackerId';
    const result = await pool.request()
      .input('consumptionDate', sql.DateTime, consumptionDate)
      .input('trackerId', sql.Int, intakeId)
      .query(query);

    if (result.rowsAffected[0] > 0) {
      res.json({ message: 'Måltid opdateret' });
    } else {
      res.status(404).json({ message: 'Måltid ikke fundet' });
    }
  } catch (error) {
    console.error('Fejl ved opdatering af måltid:', error);
    res.status(500).json({ message: 'Serverfejl', error: error.message });
  }
});



//activityTracker

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


// Endpoint for at tilføje en aktivitet (OBS: ændre denne funktions dato til kun indtil minutter, ikke sekunder)
app.post('/activityTracker', async (req, res) => {
    try {
        const { userId, activityType, minutes,} = req.body;

        // Aktiviteter baseret på type
        const activities = {
            everyday: almindeligeHverdagsaktiviteter,
            sports: sportsAktiviteter,
            work: forskelligeTyperArbejde
        };

        // Hent den relevante liste af aktiviteter baseret på typen
        const activityList = activities[activityType];

        // Søg efter den specificerede aktivitet
        const activityName = req.body.activityName;
        const caloriesPerHour = activityList[activityName];

        const date = new Date().toISOString();
        const activityDate = date.slice(0, 16);

        // Beregn kalorier
        if (!activityName || isNaN(minutes) || caloriesPerHour === undefined) {
            return res.status(400).send("Indtast venligst både aktivitet og antal minutter.");
        }

        const calories = (caloriesPerHour * minutes) / 60;

        // Forbinder til databasen
        const pool = await sql.connect(dbConfig);

        // Indsæt aktivitet i databasen
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .input('activityType', sql.VarChar, activityType)
            .input('activityName', sql.VarChar, activityName)
            .input('duration', sql.Decimal(5, 2), parseFloat(minutes))
            .input('caloriesBurned', sql.Decimal(10, 2), parseFloat(calories))
            .input('activityDate', sql.DateTime, new Date(activityDate))
            .query('INSERT INTO activities (userId, activityType, activityName, duration, caloriesBurned, activityDate) OUTPUT INSERTED.userId VALUES (@userId, @activityType, @activityName, @duration, @caloriesBurned, @activityDate)');

        // Tjek om aktiviteten blev indsat succesfuldt
        if (result.recordset.length > 0) {
            res.status(201).json({
                activityId: result.recordset[0].id,
                userId,
                activityType,
                activityName,
                duration: minutes,
                caloriesBurned: calories,
                activityDate
            });
        } else {
            res.status(500).json({ message: 'Fejl ved tilføjelse af aktivitet til database.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Fejl ved oprettelse af aktivitet.', error: error.message });
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
