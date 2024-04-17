// Konstanter for sortKeys
const ProteinKey = 1110; // SortKey for protein
const kcalKey = 1030; // SortKey for kcal
const fatKey = 1310; // SortKey for fedt
const fiberKey = 1240; // SortKey for fiber

// Indlæser DOM
document.addEventListener('DOMContentLoaded', () => {
  // Hent DOM-elementer
    const searchForm = document.getElementById('search-form');
    const foodSearchInput = document.getElementById('food-search');
    const loadingIndicator = document.getElementById('loading-indicator');
  
    searchForm.addEventListener('submit', async (event) => {
      event.preventDefault(); // Forhindre formular fra at opdatere siden

      // Hent og trim søgestrengen fra inputfeltet
      let searchString = foodSearchInput.value.trim();
  
      if (searchString) {
        // Formater søgestrengen til at starte med stort bogstav (kan evt hjælpe med at forbedre søgningen)
        searchString = searchString.charAt(0).toUpperCase() + searchString.slice(1);
        // Vis loading-indikator
        loadingIndicator.style.display = 'block';
        try {
          const foodID = await fetchFoodID(searchString);
          if (foodID) {
            // Hent og vis næringsdata
            const energy = await fetchNutrientValue(foodID, kcalKey, 'Energy');
            const protein = await fetchNutrientValue(foodID, ProteinKey, 'Protein');
            const fat = await fetchNutrientValue(foodID, fatKey, 'Fat');
            const fiber = await fetchNutrientValue(foodID, fiberKey, 'Fiber');
  
            // // Opdater tabellen i html med data
            document.getElementById('ID').textContent = foodID;
            document.getElementById('foodName').textContent = searchString;
            document.getElementById('kcal').textContent = energy;
            document.getElementById('protein').textContent = protein;
            document.getElementById('fedt').textContent = fat;
            document.getElementById('fiber').textContent = fiber;
          } else {
            alert('Ingen fødevarer fundet med det navn.');
          }
        } catch (error) {
          console.error('Der opstod en fejl:', error);
          alert('Kunne ikke hente information. Prøv igen senere.');
        } finally {
          // Skjul loading-indikator uanset resultat
          loadingIndicator.style.display = 'none';
        }
      } else {
        alert('Indtast venligst en gyldig fødevare.');
      }
    });
  });

