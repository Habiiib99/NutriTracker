// Example of data usage

const apiKey = '169972';

export async function getMeals() {
  return await fetch('http://localhost:3000/meals', {
    method: 'GET',
    headers: {
      'content-type': 'application/json', // Angiver, at forespørgslen sendes med JSON-indhold
      'X-API-Key': apiKey, // Sender API-nøglen som en del af forespørgslen for at godkende anmodningen
    },
  })

}