// Definér konstante API-nøgler
const apiKey = '169972';

// Funktion til at hente foodID til en given søgestreng
async function fetchFoodID(searchString) {
  // Konverterer den første karakter i søgestrengen til stort bogstav, resten i små bogstaver
  searchString = searchString.charAt(0).toUpperCase() + searchString.slice(1);
  const url = `https://nutrimonapi.azurewebsites.net/api/FoodItems/BySearch/${searchString}`;

  try {
    // Starter en HTTP GET-anmodning til API'en for at hente foodID
    let response = await fetch(url, {
      method: 'GET',
      headers: {
        'content-type': 'application/json', // Angiver, at forespørgslen sendes med JSON-indhold
        'X-API-Key': apiKey, // Sender API-nøglen som en del af forespørgslen for at godkende anmodningen
      },
    });

    if (response.ok) {
      // Hvis anmodningen er vellykket (status 200 OK), fortsætter vi med følgende:
      let result = await response.json(); // Konverterer svaret fra API'en til JSON-format
      return result[0].foodID; // Returnerer foodID for det første fødevareelement i svaret
    } else {
      // Hvis anmodningen mislykkes, udskriver vi fejlmeddelelsen sammen med HTTP-statuskoden
      console.error('Failed to fetch data. Status:', response.status);
      return null; // Returnerer null for at indikere, at hentningen mislykkedes
    }
  } catch (error) {
    // Hvis der opstår en fejl under anmodningen, fanges den her
    console.error('Error fetching data:', error);
    return null; // Returnerer null for at indikere, at der opstod en fejl under hentningen
  }
}

// Funktion til at hente næringsværdier baseret på foodID og sortKey
async function fetchNutrientValue(foodID, sortKey, nutrientName) {
  const url = `https://nutrimonapi.azurewebsites.net/api/FoodCompSpecs/ByItem/${foodID}/BySortKey/${sortKey}`;

  try {
    // Starter en HTTP GET-anmodning til API'en for at hente næringsværdien
    let response = await fetch(url, {
      method: 'GET',
      headers: {
        'content-type': 'application/json', // Angiver, at forespørgslen sendes med JSON-indhold
        'X-API-Key': apiKey, // Sender API-nøglen som en del af forespørgslen for at godkende anmodningen
      },
    });

    if (response.ok) {
      // Hvis anmodningen er vellykket (status 200 OK), fortsætter vi med følgende:
      let result = await response.json(); // Konverterer svaret fra API'en til JSON-format
      if (result.length > 0) {
        return result[0].resVal; // Returnerer næringsværdien for det første element i svaret
      } else {
        console.log(`${nutrientName} not found for foodID: ${foodID}`);
        return null; // Returnerer null, da næringsværdien ikke blev fundet
      }
    } else {
      // Hvis anmodningen mislykkes, udskriver vi fejlmeddelelsen sammen med HTTP-statuskoden
      console.error('Failed to fetch nutrient value. Status:', response.status);
      return null; // Returnerer null for at indikere, at hentningen mislykkedes
    }
  } catch (error) {
    // Hvis der opstår en fejl under anmodningen, fanges den her
    console.error('Error fetching nutrient value:', error);
    return null; // Returnerer null for at indikere, at der opstod en fejl under hentningen
  }
}


