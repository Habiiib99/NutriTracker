import express from 'express';
import fetch from 'node-fetch';
import 'dotenv/config'
import cors from 'cors'
import authRouter from './routes/auth.js'
import dbConfig from './dbConfig.js'

const app = express();
const port = 2220;
const apiKey = '169792';
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, PUT, GET, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// importere mysql
import sql from 'mssql';

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


app.use('/api/auth', authRouter)


// Konstanter for sortKeys
const proteinKey = 1110; // SortKey for protein
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



// Antag at dbConfig er vores database konfiguration som vist tidligere
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


// Opdaterer brugeroplysninger
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

app.post('/api/auth/register', async (req, res) => {
  const { name, password, age, weight, gender, email } = req.body;
  console.log(req.body)
  try {
    const pool = await sql.connect(dbConfig);
    const user = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT userId FROM profiles WHERE email = @email');

    if (user.recordset.length !== 0) {
      console.log(user.recordset.length)
      return res.status(400).json({ message: 'En bruger med den email eksisterer allerede' });
    }

    const result = await pool.request()
      .input('userId', sql.Int, user.recordset.length + 1)
      .input('name', sql.VarChar, name)
      .input('age', sql.Int, age)
      .input('gender', sql.VarChar, gender)
      .input('weight', sql.Decimal(5, 2), weight)
      .input('email', sql.VarChar, email)
      .input('password', sql.VarChar, password)
      .input('bmr', sql.Decimal(5, 4), calculateBMR(weight, age, gender))
      .query(
        'INSERT INTO profiles VALUES (@userId, @name, @age, @gender, @weight, @email, @password, @bmr)',
      ).catch((error) => { console.error(error) })

    res.status(201).json({ message: 'Bruger oprettet', id: result.insertId })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Serverfejl ved forsøg på registrering', error: error.message });
  }
})

app.post('/api/auth/login', async (req, res) => {
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


// **MEAL CREATOR**
// 2a. Oprette et eller flere måltider, som skal bestå af 1 eller flere ingredienser
// ENDPOINT VIRKER, men ikke med weight.
/* Indsætter dette i Insomnia (url http://localhost:PORT/api/meals), men får fejl i weight.
I azure fremgår måltidet derfor, men med weight = null.:
Test i Insomnia ved at skrive:
{
  "name": "mad",
  "userId": 2,
  "ingredients": [
    {
      "foodItemId": 187,
      "weight": 100 
    },
    {
      "foodItemId": 5,
      "weight": 150
    },
    {
      "foodItemId": 3,
      "weight": 50
    }
  ]
}*/
app.post('/api/meals', async (req, res) => {
  const { mealName, userId, ingredients } = req.body; // Ingredienser som et array af objekter { foodItemId }
  try {
    let totalEnergy = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalFiber = 0;

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
        const factor = ingredient.weight / 100; // Antager, at næringsdata er pr. 100 gram
        totalEnergy += kcal * factor;
        totalProtein += protein * factor;
        totalFat += fat * factor;
        totalFiber += fiber * factor;
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
        .query('INSERT INTO meals VALUES (@mealId, @mealName, @userId, @kcal, @protein, @fat, @fiber, @ingredients)')

    }
    res.status(201).json({ mealId: meals.recordset.length + 1, mealName, userId, ingredients, totalEnergy, totalProtein, totalFat, totalFiber });
  } catch (error) {
    res.status(500).json({ message: 'Fejl ved oprettelse af måltid', error: error.message });
  }
});

// 2d. Finde et måltid og se dens ingredienser og vægt
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



// 2b Endpoint for at søge efter de rigtige fødevarer
// ENDPOINT VIRKER, men kommer kun én fødevare frem. Skal ændres så det kan vælges mellem flere.
// Test i Insomnia ved at skrive: http://localhost:PORT/api/ingredients/search?searchString=apple - husk at ændre PORT
app.get('/api/ingredients/search', async (req, res) => {
  const { searchString } = req.query;
  try {
    const foodID = await fetchFoodID(searchString);
    if (foodID) {
      res.json({ foodID });
    } else {
      res.status(404).json({ message: 'Fødevare ikke fundet' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server fejl', error });
  }
});


/* Søgefunktion e. Det skal være muligt at finde information om hver enkelt 
fødevare i datasættet samt dets samlede ernæringsindhold*/
// Endpoint for at hente næringsværdier baseret på foodID og sortKey
// ENDPOINT VIRKER
// Test ved http://localhost:2800/nutrient-value/'ingredientId'/'sortKey' (f.eks. 1/1110)

// MANGLER: mulighed for at finde det samlede ernæringsindhold, måske det er noget front end? Altså at alle sortKeys bliver hentet.
app.get('/nutrient-value/:ingredientId/:sortKey', async (req, res) => {
  try {
    const nutrientValue = await fetchNutrientValue(req.params.ingredientId, req.params.sortKey);
    if (nutrientValue) {
      res.json({ nutrientValue });
    } else {
      res.status(404).json({ message: 'Næringsværdi ikke fundet' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server fejl', error });
  }
});



// 3f. OBS - HØRER FAKTISK TIL MEAL TRACKER Slet et måltid samt mulighed for at redigere
// MANGLER MULIGHED FOR AT REDIGERE MÅLTID
app.delete('/api/meals/:id', async (req, res) => {
  const { id } = req.params; // ID for måltidet der skal slettes
  const query = 'DELETE FROM meals WHERE mealId = @mealId';

  const pool = await sql.connect(dbConfig);
  try {
    const result = await pool.request(query, [mealId]);
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






//Man skal tilføje en ny attribute "activityName" til activities tabellen i databasen før at den virker

// **ACTIVITY TRACKER** => 
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
    const { userId, activityType, minutes, activityDate } = req.body;

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
      .query('INSERT INTO activities (userId, activityType, activityName, duration, caloriesBurned, activityDate) OUTPUT INSERTED.id VALUES (@userId, @activityType, @activityName, @duration, @caloriesBurned, @activityDate)');

    // Tjek om aktiviteten blev indsat succesfuldt
    if (result.recordset.length > 0) {
      res.status(201).json({
        id: result.recordset[0].id,
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

//Funktion til at tracke aktiviteter og beregne kalorier
/*
// Definition af objekter for forskellige typer aktiviteter
 
 
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

// registrere en aktivitet (OBS: ændre denne funktions dato til kun indtil minutter, ikke sekunder)

/*
 
 
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
