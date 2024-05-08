// Importerer nødvendige moduler
// Express for at bygge webapplikationer med Node.
import express from 'express';
// Fetch er node.js-modulet til at lave HTTP-anmodninger.
import fetch from 'node-fetch';
// Middleware til håndtering af cross-origin resource sharing i Express.
import cors from 'cors';


const app = express();
const port = 2220;
const apiKey = '169792';
app.use(express.json());

// CORS options (så den lokale server godtager den/ dette ændres?)
const corsOptions = {
  origin: 'http://127.0.0.1:5500',  // Tillad anmodninger fra denne oprindelse
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',  // Tilladte HTTP metoder
  allowedHeaders: 'Content-Type, Authorization',  // Tilladte headers
  credentials: true  // Tillad cookies/session across domains
};
// Anvender CORS med de specificerede indstillinger for at håndtere specifikke anmodninger.
app.use(cors(corsOptions));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, PUT, GET, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});


// Importerer mssql-modulet for at kunne kommunikere med SQL server-database
import sql from 'mssql';
// Definerer konfigurationen til databasen
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
// Opretter asynkron funktion for at tilslutte databasen og gøre det muligt at teste forespørgsler.
// Dette gøres kontinuerligt i løbet af koden for at sikre forbindelsen til databasen uden at blokere for efterfølgende kode, men kommenteres kun denne ene gang.

async function connectToDb() {
  try {
    // Opretter forbindelse og laver en ny instance af SQL-connection
    const pool = await sql.connect(dbConfig);
    console.log('Forbundet til databasen.');
    // Test forespørgsel for at sikre, at forbindelsen virker
    const result = await pool.request().query('SELECT 1 AS number');
    console.log(result);
    // Opdager fejl ved tilslutning til databasen og logger fejlen til konsollen.
  } catch (err) {
    console.error('Fejl ved forbindelse til databasen:', err);
  }
}
// Kalder funktionen connectToDb for at oprette forbindelse til databasen.
connectToDb();




// Konstanter for sortKeys
const ProteinKey = 1110; // SortKey for protein
const kcalKey = 1030; // SortKey for kcal
const fatKey = 1310; // SortKey for fedt
const fiberKey = 1240; // SortKey for fiber

// Funktion til at hente foodID til en given søgestreng
async function fetchFoodID(searchString) {
  // API forventer første bogstav er stort, sikres derfor her.
  searchString = searchString.charAt(0).toUpperCase() + searchString.slice(1);
  // URL til at hente foodID'et ud fra vores search-string.
  const url = `https://nutrimonapi.azurewebsites.net/api/FoodItems/BySearch/${searchString}`;
  try {
    // GET-anmodning til at hente data fra API'et - bruger derfor API-nøglen.
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
    });
    if (response.ok) {
      const result = await response.json();
      // Sender det første foodID, hvis GET-anmodningen lykkes. Spørgsmål. Skulle dette ikke være så man kan vælge mellem alle mulighederne?
      return result[0].foodID;
    // Hvis anmodningen ikke lykkes, logges fejl til konsollen med fejlmeddelelse med response-status.
    } else {
      console.error('Failed to fetch data. Status:', response.status);
      return null;
    }
    // Hvis der sker en fejl i løbet af anmodningen, logges fejl til konsollen med fejl ved at fetche data.
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
      SELECT t.trackerId, t.mealId, t.weight, t.consumptionDate, m.mealName, m.kcal, m.protein, m.fat, m.fiber
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

app.get('/api/meal-tracker/intakes-ingredient/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const pool = await sql.connect(dbConfig);
    const query = `
      SELECT t.trackerId, t.mealIngredientId, t.weight, t.consumptionDate, 
             mi.ingredientId, mi.weightOfIngredient,
             i.ingredient, i.kcal, i.protein, i.fat, i.fiber
      FROM dbo.tracker t
      JOIN dbo.meal_ingredients mi ON t.mealIngredientId = mi.mealIngredientId
      JOIN dbo.ingredients i ON mi.ingredientId = i.ingredientId
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
  const { weight } = req.body;

  try {
    const pool = await sql.connect(dbConfig);
    const query = 'UPDATE tracker SET weight = @weight WHERE trackerId = @trackerId';
    const result = await pool.request()
      .input('weight', sql.Decimal(10, 2), weight)
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

// Endpoint til at registrere vandindtag
app.post('/api/water-tracker', async (req, res) => {
  try {
      const { userId, amountOfWater, dateAndTimeOfDrinking } = req.body;

      // Kontroller, om nødvendige felter er udfyldt
      if (!userId || !amountOfWater || !dateAndTimeOfDrinking) {
          return res.status(400).json({ message: 'Udfyld venligst alle nødvendige felter: userId, amountOfWater, og dateAndTimeOfDrinking.' });
      }

      // Trim datoen til minutter (uden sekunder)
      const date = new Date(dateAndTimeOfDrinking);
      const dateTrimmed = date.toISOString().slice(0, 16);

      // Forbind til databasen
      const pool = await sql.connect(dbConfig);

      // Indsæt registrering i waterRegistration-tabellen
      const result = await pool.request()
          .input('userId', sql.Int, userId)
          .input('amountOfWater', sql.Int, amountOfWater)
          .input('dateAndTimeOfDrinking', sql.DateTime, new Date(dateTrimmed))
          .query('INSERT INTO dbo.waterRegistration (userId, amountOfWater, dateAndTimeOfDrinking) OUTPUT INSERTED.waterRegId VALUES (@userId, @amountOfWater, @dateAndTimeOfDrinking)');

      // Tjek om registreringen blev tilføjet korrekt
      if (result.recordset.length > 0) {
          res.status(201).json({
              waterRegId: result.recordset[0].waterRegId,
              userId,
              amountOfWater,
              dateAndTimeOfDrinking: dateTrimmed
          });
      } else {
          res.status(500).json({ message: 'Fejl ved tilføjelse af vandindtag til databasen.' });
      }
  } catch (error) {
      console.error('Fejl ved registrering af vandindtag:', error);
      res.status(500).json({ message: 'Fejl ved registrering af vandindtag.', error: error.message });
  }
});

// Endpoint til at opdatere vandindtag
app.put('/api/water-tracker/:id', async (req, res) => {
  const { id } = req.params;  // ID fra URL
  const { amountOfWater } = req.body;  // Ny vandmængde

  try {
      if (!amountOfWater || isNaN(amountOfWater)) {
          return res.status(400).json({ message: 'Indtast venligst en gyldig vandmængde.' });
      }

      // Forbind til databasen
      const pool = await sql.connect(dbConfig);

      // Opdater vandmængden for det angivne ID
      const result = await pool.request()
          .input('amountOfWater', sql.Int, amountOfWater)
          .input('waterRegId', sql.Int, id)
          .query('UPDATE dbo.waterRegistration SET amountOfWater = @amountOfWater WHERE waterRegId = @waterRegId');

      if (result.rowsAffected[0] > 0) {
          res.json({ message: 'Vandindtag opdateret.' });
      } else {
          res.status(404).json({ message: 'Vandindtag ikke fundet.' });
      }
  } catch (error) {
      console.error('Fejl ved opdatering af vandindtag:', error);
      res.status(500).json({ message: 'Fejl ved opdatering af vandindtag.', error: error.message });
  }
});

// Endpoint til at slette vandindtag
app.delete('/api/water-tracker/:id', async (req, res) => {
  const { id } = req.params;

  try {
      // Forbind til databasen
      const pool = await sql.connect(dbConfig);

      // Slet posten baseret på ID
      const result = await pool.request()
          .input('waterRegId', sql.Int, id)
          .query('DELETE FROM dbo.waterRegistration WHERE waterRegId = @waterRegId');

      if (result.rowsAffected[0] > 0) {
          res.json({ message: 'Vandindtag slettet.' });
      } else {
          res.status(404).json({ message: 'Vandindtag ikke fundet.' });
      }
  } catch (error) {
      console.error('Fejl ved sletning af vandindtag:', error);
      res.status(500).json({ message: 'Fejl ved sletning af vandindtag.', error: error.message });
  }
});


// Endpoint til at hente vandindtag for en bestemt bruger
app.get('/api/water-tracker/user/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
      // Forbind til databasen
      const pool = await sql.connect(dbConfig);

      // Hent vandindtagene for brugeren
      const result = await pool.request()
          .input('userId', sql.Int, userId)
          .query('SELECT waterRegId, amountOfWater, dateAndTimeOfDrinking FROM dbo.waterRegistration WHERE userId = @userId ORDER BY dateAndTimeOfDrinking DESC');

      res.json(result.recordset);
  } catch (error) {
      console.error('Fejl ved hentning af vandindtag:', error);
      res.status(500).json({ message: 'Fejl ved hentning af vandindtag.', error: error.message });
  }
});


// Endpoint til ingredienser 

app.post('/meal-tracker/ingredient', async (req, res) => {
  const { ingredient, kcal, protein, fat, fiber } = req.body;

  try {
    const pool = await sql.connect(dbConfig);
    const query = `
      INSERT INTO dbo.ingredients (ingredient, kcal, protein, fat, fiber)
      VALUES (@ingredient, @kcal, @protein, @fat, @fiber);
      SELECT SCOPE_IDENTITY() AS ingredientId;
    `;
    const result = await pool.request()
      .input('ingredient', sql.VarChar(255), ingredient)
      .input('kcal', sql.Decimal(10, 2), kcal)
      .input('protein', sql.Decimal(10, 2), protein)
      .input('fat', sql.Decimal(10, 2), fat)
      .input('fiber', sql.Decimal(10, 2), fiber)
      .query(query);

    const ingredientId = result.recordset[0].ingredientId;

    res.status(201).json({ message: 'Ingrediens tilføjet til ingredients-tabellen', ingredientId });
  } catch (error) {
    console.error('Fejl ved tilføjelse af ingrediens:', error);
    res.status(500).json({ message: 'Serverfejl', error: error.message });
  }
});


app.post('/meal-tracker/meal-ingredients', async (req, res) => {
  const {ingredientId, weightOfIngredient, userId } = req.body;

  try {
    const pool = await sql.connect(dbConfig);
    const query = `
    INSERT INTO dbo.meal_ingredients (ingredientId, weightOfIngredient, userId)
    VALUES (@ingredientId, @weightOfIngredient, @userId);
    SELECT SCOPE_IDENTITY() AS mealIngredientId;
    `;
    const result = await pool.request()
      .input('ingredientId', sql.Int, ingredientId)
      .input('weightOfIngredient', sql.Decimal(10, 2), weightOfIngredient)
      .input('userId', sql.Int, userId) 
      .query(query);

    const mealIngredientId = result.recordset[0].mealIngredientId;
    res.status(201).json({ message: 'Ingrediens tilføjet til meal_ingredients-tabellen', mealIngredientId });
  } catch (error) {
    console.error('Fejl ved tilføjelse af ingrediens til måltidsingredienser:', error);
    res.status(500).json({ message: 'Serverfejl', error: error.message });
  }
});



app.post('/meal-tracker/track-ingredient', async (req, res) => {
  const { mealIngredientId, weight, userId, consumptionDate, location } = req.body;

  try {
    const pool = await sql.connect(dbConfig);
    const query = `
      INSERT INTO dbo.tracker (mealIngredientId, weight, userId, consumptionDate, location)
      VALUES (@mealIngredientId, @weight, @userId, @consumptionDate, @location)
    `;
    await pool.request()
      .input('mealIngredientId', sql.Int, mealIngredientId) // Change input parameter to mealIngredientId
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







/// **DAILY NUTRI** -- skal opdateres/ændres
app.get('/api/daily-nutri/hourly/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const pool = await sql.connect(dbConfig);

    // Hent kalorie- og vandindtag for de seneste 24 timer
    const foodIntakeQuery = `
      SELECT DATEPART(hour, consumptionDate) AS hour, SUM(weight) AS totalWeight
      FROM tracker
      WHERE userId = @userId AND consumptionDate >= DATEADD(hour, -24, GETDATE())
      GROUP BY DATEPART(hour, consumptionDate)
    `;
    const waterIntakeQuery = `
      SELECT DATEPART(hour, dateAndTimeOfDrinking) AS hour, SUM(amountOfWater) AS totalWater
      FROM waterRegistration
      WHERE userId = @userId AND dateAndTimeOfDrinking >= DATEADD(hour, -24, GETDATE())
      GROUP BY DATEPART(hour, dateAndTimeOfDrinking)
    `;

    // Hent aktivitetsforbrænding
    const activityQuery = `
      SELECT DATEPART(hour, activityDate) AS hour, SUM(caloriesBurned) AS totalCaloriesBurned
      FROM activities
      WHERE userId = @userId AND activityDate >= DATEADD(hour, -24, GETDATE())
      GROUP BY DATEPART(hour, activityDate)
    `;

    // Basalforbrænding (BMR) for bruger fordelt på 24 timer
    const bmrQuery = `SELECT bmr FROM profiles WHERE userId = @userId`;

    // Udfør SQL-forespørgsler
    const foodIntake = await pool.request().input('userId', sql.Int, userId).query(foodIntakeQuery);
    const waterIntake = await pool.request().input('userId', sql.Int, userId).query(waterIntakeQuery);
    const activityBurn = await pool.request().input('userId', sql.Int, userId).query(activityQuery);
    const bmr = await pool.request().input('userId', sql.Int, userId).query(bmrQuery);

    // Saml og beregn data for hver time
    const hourlyData = [];
    const bmrPerHour = bmr.recordset[0].bmr / 24;

    for (let hour = 0; hour < 24; hour++) {
      const food = foodIntake.recordset.find((row) => row.hour === hour)?.totalWeight || 0;
      const water = waterIntake.recordset.find((row) => row.hour === hour)?.totalWater || 0;
      const activity = activityBurn.recordset.find((row) => row.hour === hour)?.totalCaloriesBurned || 0;
      const totalBurn = bmrPerHour + activity;
      const surplusDeficit = food - totalBurn;

      hourlyData.push({
        hour,
        energy: food,
        water: (water / 1000).toFixed(2),
        calorieBurn: totalBurn.toFixed(2),
        surplusDeficit: surplusDeficit.toFixed(2),
      });
    }

    res.json(hourlyData);
  } catch (error) {
    console.error('Fejl ved hentning af timebaseret data:', error);
    res.status(500).json({ message: 'Fejl ved hentning af timebaseret data', error: error.message });
  }
});





// Endpoint for at få den daglige kaloriebalance i løbet af en måned
app.get('/api/daily-nutri/monthly/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const pool = await sql.connect(dbConfig);
    const query = `
      SELECT 
        CONVERT(VARCHAR(10), consumptionDate, 120) AS day,
        SUM(kcal) AS totalEnergy,
        SUM(amountOfWater) / 1000 AS totalWater,  -- Omregn til liter
        SUM(caloriesBurned) AS totalBurned,
        (SUM(kcal) - SUM(caloriesBurned)) AS balance
      FROM dbo.tracker
      LEFT JOIN dbo.waterRegistration ON dbo.tracker.userId = dbo.waterRegistration.userId
      WHERE dbo.tracker.userId = @userId
      AND consumptionDate >= DATEADD(MONTH, -1, GETDATE())
      GROUP BY CONVERT(VARCHAR(10), consumptionDate, 120)
      ORDER BY day ASC;
    `;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(query);

    res.json(result.recordset);
  } catch (error) {
    console.error('Fejl ved hentning af månedlige data:', error);
    res.status(500).json({ message: 'Serverfejl', error: error.message });
  }
});



app.listen(port, () => {
  console.log(`Server kører på http://localhost:${port}`);
});
