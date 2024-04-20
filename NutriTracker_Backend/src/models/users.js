// Implementering af bruger 'routes'
const express = require('express');
const { createUser, getUserByUsername, updateUser, deleteUser } = require('../models/users');
const router = express.Router();


// POST /users - Opret en ny bruger
router.post('/', async (req, res) => {
    try {
        const { username, password, email, age, gender, weight } = req.body;
        
        // Hasher passwordet før det gemmes i databasen for at sikre sikkerhed
        // Bruger 'bcrypt' pakken til at hashe passwordet (password, saltRounds) 
        const hashedPassword = await bcrypt.hash(password, 10); // Brug bcrypt til at hashe passwordet
        
        // Gemmer hashede password sammen med andre brugeroplysninger i databasen
        await createUser(username, hashedPassword, email, age, gender, weight);
        res.status(201).send('Bruger oprettet!');
    } catch (error) {
        console.error(error);
        res.status(500).send('Fejl!');
    }
});


// GET /users/:username - Hent en bruger ved brugernavn
router.get('/:username', async (req,res) => {
    try {
        const { username } = req.params;
        const user = await getUserByUsername(username);
        res.status(200).send(user);
    } catch (error) {
        console.error(error);
        res.status(500).send('Fejl!');
    }
});

// UPDATE /users/:userId - Opdater en brugers oplysninger
router.put('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { username, password, email, age, gender, weight } = req.body;
        
        // Hasher det nye password, for at sikre data.
        // Dette er afgørende, når brugeren vælger at ændre sit password.
        const hashedPassword = await bcrypt.hash(password, 10); // Hash det nye password
        
        // Opdater brugeren i databasen med den hashede version af det nye password
        // sammen med de eventuelt andre opdaterede brugeroplysninger.
        const user = await updateUser(userId, username, hashedPassword, email, age, gender, weight);
        if (user) {
            res.status(200).send({ message: 'Bruger opdateret!' });
        } else {
            res.status(404).send({ message: 'Bruger ikke fundet.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Serverfejl!' });
    }
});


// DELETE /users/:userId - Slet en brugers profil
router.delete('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        await deleteUser(userId);
        res.status(200).send({ message: 'Bruger slettet!' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Serverfejl!' });
    }
});


// **IMPLEMENTERINF AF LOGIN FUNKTIONALITET**

// Tilføjer en rute for at håndtere login
const bcrypt = require('bcrypt');

// POST /users/login - Log en bruger ind
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await getUserByUsername(username);
        if(user) {
            // Sammenligner det indtastede password med det 'hashede' password
            const match = await bcrypt.compare(password, user.password);
            if(match) {
                res.status(200).send({ message: 'Login succesfuldt!' });
            } else {
                res.status(401).send({ message: 'Forkert brugernavn eller adgangskode.' });
            }
        } else {
            res.status(401).send({ message: 'Forkert brugernavn eller adgangskode.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Serverfejl!' });
    }
});

// **IMPLEMENTERING AF SESSIONS SÅ BRUGEREN KAN FORBLIVE LOGGET IND**
// Gør brug af 'express-session' pakken
const session = require('express-session');

app.use(session({
    secret: 'hemmelig', // Nøgle?
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Skal være 'true' hvis det er en 'https' server
}));


// POST /users/logout - Log en bruger ud
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Kunne ikke logge ud');
        }
        res.send({ message: 'Logget ud!' });
    });
});




// I forhold til validering gør vi brug af både uni tests (mocha, chai) og manuelle tests (fx. postman)
// 1. Installerer 'mocha' og 'chai' pakkerne
// 2. konfigurerer 'package.json' filen til at køre testene || lige nu står der "test": "echo \"Error: no test specified\" && exit 1",
// 3. Opretter en 'test' mappe 
// 4. Kører testene ved at skrive 'npm test' i terminalen
