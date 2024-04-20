function setFirstTimeLocal(x) {
  if (localStorage.getItem(x) == null) {
    localStorage.setItem(x, "[]");
  }
}

// Innitializing Meal Key for fresh start
setFirstTimeLocal("meal");
setFirstTimeLocal("mealtracker");
setFirstTimeLocal("ind");

async function fetchFoodItem() {
  try {
    const response = await fetch('https://nutrimonapi.azurewebsites.net/api/FoodItems', {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
        'X-API-Key': 168795
      }
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.text();
    localStorage.setItem("fooditems", data);

  } catch (error) {
    console.error('Error during fetch:', error);
  }
}

async function getfoodData(foodID, sortkey, lkey, fqty, f) {
  try {
    const response = await fetch(`https://nutrimonapi.azurewebsites.net/api/FoodCompSpecs/ByItem/${foodID}/BySortKey/${sortkey}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json', // Change to 'application/json' for JSON response
        'X-API-Key': 168795
      }
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    //Calculating sortkey value from desired quantity fixing , to .  and rounding decimal to 2
    f[lkey] = Number(((data[0].resVal).replace(/,/g, '.') * fqty / 100).toFixed(2));

  } catch (error) {
    console.error('Error during fetch:', error);
    // Optionally rethrow the error or handle it as needed
    throw error;
  }
}


function populatefoodSelect() {
  var selectElement = document.getElementById("select1");

  // Clear existing options
  selectElement.innerHTML = "";
  let fooditems = JSON.parse(localStorage.getItem("fooditems"))
  // Add options based on fooditems array
  fooditems.forEach(function (item) {
    var option = document.createElement("option");
    option.text = item.foodName;
    option.value = item.foodID; // You can set the value to something meaningful if needed
    selectElement.add(option);
  });
}

class Meal {
  constructor(mealName, totalKcal, weight, protein, fat, fiber, addedOn, timeEaten, ingredients, mealtype) {
    this.mealName = mealName;
    this.totalKcal = totalKcal;
    this.weight = weight;
    this.protein = protein;
    this.fat = fat;
    this.fiber = fiber;
    this.addedOn = addedOn;
    this.timeEaten = timeEaten;
    this.ingredients = ingredients;
    this.mealtype = mealtype
  }
}

class Food {
  constructor(foodID, foodName, qty, energy, protein, fat, fiber) {
    this.foodID = foodID;
    this.foodName = foodName;
    this.qty = qty;
    this.energy = energy;
    this.protein = protein;
    this.fat = fat;
    this.fiber = fiber;
  }
}

class MealConsumption {
  constructor(mealIndex, mealName, addedOn) {
    this.mealIndex = mealIndex;
    this.mealName = mealName;
    this.addedOn = addedOn;
  }
}

// For Converting Date YYYY-MM-DD to DD-MM-YYYY
function convertDateFormat(ymdDate) {

  var parts = ymdDate.split("-");
  var dateObject = new Date(parts[0], parts[1] - 1, parts[2]);

  // Extract day, month, and year from the Date object
  var day = dateObject.getDate();
  var month = dateObject.getMonth() + 1; // Month is zero-based, so we add 1
  var year = dateObject.getFullYear();

  // Ensure two-digit formatting for day and month
  day = day < 10 ? "0" + day : day;
  month = month < 10 ? "0" + month : month;

  // Create the new date string in "DD-MM-YYYY" format
  var dmyDate = day + "-" + month + "-" + year;

  return dmyDate;
}

// Function use for sorting the dates
function compareDates(a, b) {
  var dateA = new Date(a);
  var dateB = new Date(b);

  return dateA - dateB;
}



function addMealmodel(mtype) {
  const modal = new bootstrap.Modal(document.getElementById('staticBackdrop'), {
    backdrop: 'static',
    keyboard: false
  });
  mealtype.value = mtype;
  localStorage.setItem("ind", "[]")
  // Trigger the modal to show
  modal.show();
}


async function addfood() {
  tfood.innerHTML = `<h3 class="pt-5 text-danger">Fetching Data from API...</h3>`;
  if (select1.selectedIndex == -1) {
    alert("Please Select any food item.");
    return;
  }

  let fid = select1.options[select1.selectedIndex].value;
  let fname = select1.options[select1.selectedIndex].text;
  let fqty = sqty.value;
  let ind = JSON.parse(localStorage.getItem("ind"));

  f = new Food(fid, fname, fqty, 0, 0, 0, 0);

  await getfoodData(fid, "1030", "energy", fqty, f);
  await getfoodData(fid, "1110", "protein", fqty, f);
  await getfoodData(fid, "1310", "fat", fqty, f);
  await getfoodData(fid, "1240", "fiber", fqty, f);

  ind.push(f);
  localStorage.setItem("ind", JSON.stringify(ind));
  tdata = `<table>
          <thead>
            <tr>
              <th class="text-center">Name</th>
              <th class="text-center">Qty.</th>
              <th class="text-center">Energy</th>
              <th class="text-center">Protien</th>
              <th class="text-center">Fat</th>
              <th class="text-center">Fiber</th>
            </tr>
          </thead>
          <tbody>`;
  let tqty = 0;
  let tenergy = 0;
  let tp = 0;
  let tfat = 0
  let tfiber = 0
  ind.forEach(e => {
    tdata += `<tr><td>${e.foodName}</td><td>${e.qty}</td><td>${e.energy}</td><td>${e.protein}</td><td>${e.fat}</td><td>${e.fiber}</td></tr>`;
    tqty += Number(e.qty);
    tenergy += Number(e.energy);
    tp += Number(e.protein);
    tfat += Number(e.fat);
    tfiber += Number(e.fiber);
  });
  tdata += `<tr><td><b>Total</b></td><td>${tqty}</td><td>${tenergy.toFixed(2)}</td><td>${tp.toFixed(2)}</td><td>${tfat.toFixed(2)}</td><td>${tfiber.toFixed(2)}</td></tr>
    </tdata></table>`;
  tfood.innerHTML = tdata;
}


function addmeal() {
  let ml = JSON.parse(localStorage.getItem("meal"));
  let m = ml.length;
  let tqty = 0;
  let tenergy = 0;
  let tp = 0;
  let tfat = 0
  let tfiber = 0
  let ind = JSON.parse(localStorage.getItem("ind"));
  ind.forEach(e => {
    tqty += Number(e.qty);
    tenergy += Number(e.energy);
    tp += Number(e.protein);
    tfat += Number(e.fat);
    tfiber += Number(e.fiber);
  });

  ml[m] = new Meal(mealName.value, tenergy, tqty, tp, tfat, tfiber, addedOn.value, timeEaten.value, ind, mealtype.value);
  localStorage.setItem("meal", JSON.stringify(ml));
  localStorage.setItem("ind", "[]");

  showmeal();
  //Clearing form
  mealForm.reset();
  tfood.innerHTML = "";

}

// Delete a Meal
function delmeal(indexToRemove) {
  let ml = JSON.parse(localStorage.getItem("meal"));
  ml.splice(indexToRemove, 1);
  localStorage.setItem("meal", JSON.stringify(ml));
  showmeal()
}

function addMealtracker(mtype) {
  const modal = new bootstrap.Modal(document.getElementById('mealtrackermodel'), {
    backdrop: 'static',
    keyboard: false
  });

  let ml = JSON.parse(localStorage.getItem("meal"));

  //Preparing Meal List avialable in Meal creator and populate Meal list
  var selectElement = document.getElementById("meallist");
  selectElement.innerHTML = "";

  for (i = 0; i < ml.length; i++) {
    if (ml[i].mealtype == mtype) {
      let option = document.createElement("option");
      option.text = ml[i].mealName;
      option.value = i; //  Index of Meal Array
      selectElement.add(option);
    }
  }

  modal.show();
}

function addmealconsumption() {
  if (meallist.selectedIndex == -1) {
    alert("Please Select any meal from list.");
    return;
  }

  mindex = meallist.options[meallist.selectedIndex].value;
  mname = meallist.options[meallist.selectedIndex].text;
  if (localStorage.getItem("mealtracker") == null) { ml = []; m = 0; }
  else {
    ml = JSON.parse(localStorage.getItem("mealtracker"));
    m = ml.length;
  }

  ml[m] = new MealConsumption(mindex, mname, addedOn.value);
  localStorage.setItem("mealtracker", JSON.stringify(ml));

  mealtrackerForm.reset();
  showmealtracker();
}

function delmealtracker(indexToRemove) {
  let ml = JSON.parse(localStorage.getItem("mealtracker"));
  ml.splice(indexToRemove, 1);
  localStorage.setItem("mealtracker", JSON.stringify(ml));
  showmealtracker()
}

// Show Meal on Meal creatoer page
function showmeal() {
  let ml = JSON.parse(localStorage.getItem("meal"));
  let tdata = "";

  for (i = 0; i < ml.length; i++) {
    tdata += `
      <tr>
          <td>${i + 1}</td>
          <td id="mealsource"><p id="mealsourceicon">+</p> ${ml[i].mealName}</td>
          <td>${(ml[i].totalKcal / ml[i].weight * 100).toFixed(2)}</td>
          <td>${convertDateFormat(ml[i].addedOn)}</td>
          <td>${ml[i].ingredients.length}</td>
          <td id="timeseaten"> <p>${ml[i].timeEaten}</p> </td>
          <td> 
              <i id="greenicon" onclick='showind(${i})' class="material-icons">book</i>
              <i id="blueicon" class="material-icons">create</i>
              <i id="redicon" onclick='delmeal(${i})' class="material-icons">delete</i>
          </td>
      </tr>`;
  }
  document.getElementById("tablebody").innerHTML = tdata;
}

function mtcompareDates(a, b) {
  var dateA = new Date(a.addedOn);
  var dateB = new Date(b.addedOn);

  return dateA - dateB;
}

function showmealtracker() {
  let mt = JSON.parse(localStorage.getItem("mealtracker"));
  let ml = JSON.parse(localStorage.getItem("meal"));
  i = 0;
  tdata = "";
  mt.sort(mtcompareDates);
  mt.forEach(element => {
    tdata += `
    <tr>
        <td>${i + 1}</td>
        <td id="mealsource"><p id="mealsourceicon">+</p> ${ml[element.mealIndex].mealName}</td>
        <td>${ml[element.mealIndex].mealtype}</td>
        <td>${ml[element.mealIndex].weight} g<br>
        ${(ml[element.mealIndex].totalKcal).toFixed(2)}Kcal</td>
        <td>${convertDateFormat(element.addedOn)}</td>
        <td id="dailycons"> <p id="dailycons-blue">30g</p>  <p id="dailycons-orange">12g</p>  
        <p id="dailycons-lightblue">2mg</p>  <p id="dailycons-red">15</p>  
      </td>
      <td> 
        <i id="greenicon" onclick='showind(${element.mealIndex})' class="material-icons">book</i>
        <i id="blueicon" class="material-icons">create</i>
        <i id="redicon" onclick='delmealtracker(${i})' class="material-icons">delete</i>
        </td>
    </tr>`;
    i++;

  });

  document.getElementById("mtbody").innerHTML = tdata;
}

function shownutrireport() {
  let mt = JSON.parse(localStorage.getItem("mealtracker"));
  let ml = JSON.parse(localStorage.getItem("meal"));
  var uniqueDates = [...new Set(mt.map(item => item.addedOn))];
  uniqueDates.sort(compareDates);
  tdata = "";
  let tenergy = 0;
  let tp = 0;
  let tfat = 0
  let tfiber = 0
  let twater = 0
  let mtData
  uniqueDates.forEach(dt => {
    ltenergy = 0;
    tp = 0;
    tfat = 0
    tfiber = 0
    twater = 0
    // Filter data for the current date
    mtData = mt.filter(item => item.addedOn === dt);
    mtData.forEach(e => {
      tenergy += ml[e.mealIndex].totalKcal;
      tp += ml[e.mealIndex].protein;
      tfat += ml[e.mealIndex].fat;
      tfiber += ml[e.mealIndex].fiber;
      if (ml[e.mealIndex].mealtype == "liquid") twater += ml[e.mealIndex].weight;
    });

    tdata += `<tr><td>${convertDateFormat(dt)}</td><td>${mtData.length} Meals</td><td>${(twater / 1000).toFixed(2)} L </td><td>${(tenergy).toFixed(2)} Kcal</td><td>${tp.toFixed(2)}</td>
            <td>${tfat.toFixed(2)}</td><td>${tfiber.toFixed(2)}</td></tr>`;
  });

  document.getElementById("nutri").innerHTML = tdata;

}

//Calculating Today Energy Intake
function todaydata(key) {
  let ml = JSON.parse(localStorage.getItem("meal"));
  let today = new Date().toISOString().split('T')[0]; // Get today's date in the format "YYYY-MM-DD"
  let total = 0;

  if (ml && ml.length > 0) {
    for (let i = 0; i < ml.length; i++) {
      if (ml[i].addedOn === today) {
        total += ml[i][key];
      }
    }
  }
  return total.toFixed(2);
}

function todaydatawater(key) {
  let ml = JSON.parse(localStorage.getItem("meal"));
  let today = new Date().toISOString().split('T')[0]; // Get today's date in the format "YYYY-MM-DD"
  let total = 0;

  if (ml && ml.length > 0) {
    for (let i = 0; i < ml.length; i++) {
      if (ml[i].addedOn === today && m[i].mtype == "liquid") {
        total += ml[i][key];
      }
    }
  }
  return total.toFixed(2);
}

function showind(i) {

  let myModal = new bootstrap.Modal(document.getElementById('indmodel'));
  myModal.show();

  let ml = JSON.parse(localStorage.getItem("meal"));

  tdata = `<table>
  <thead>
    <tr>
      <th class="text-center">Name</th>
      <th class="text-center">Qty.</th>
      <th class="text-center">Energy</th>
      <th class="text-center">Protien</th>
      <th class="text-center">Fat</th>
      <th class="text-center">Fiber</th>
    </tr>
  </thead>
  <tbody>`;
  let tqty = 0;
  let tenergy = 0;
  let tp = 0;
  let tfat = 0
  let tfiber = 0

  for (const e of ml[i].ingredients) {
    tdata += `<tr><td>${e.foodName}</td><td>${e.qty}</td><td>${e.energy}</td><td>${e.protein}</td><td>${e.fat}</td><td>${e.fiber}</td></tr>`;
    tqty += Number(e.qty);
    tenergy += Number(e.energy);
    tp += Number(e.protein);
    tfat += Number(e.fat);
    tfiber += Number(e.fiber);
  }

  tdata += `<tr><td><b>Total</b></td><td>${tqty}</td><td>${tenergy.toFixed(2)}</td><td>${tp.toFixed(2)}</td><td>${tfat.toFixed(2)}</td><td>${tfiber.toFixed(2)}</td></tr>
</tdata></table>`;
  indmodelheader.innerHTML = ml[i].mealName + " Ingredients:";
  indmdata.innerHTML = tdata;
}


//Showing Data to Dashboard
function dashboard() {
  let mt = JSON.parse(localStorage.getItem("mealtracker"));
  let ml = JSON.parse(localStorage.getItem("meal"));
  let today = new Date().toISOString().split('T')[0]; // Get today's date in the format "YYYY-MM-DD"
  let tenergy = 0;
  let tp = 0;
  let twater = 0;

  var mtData = mt.filter(item => item.addedOn === today);
  mtData.forEach(e => {
    tenergy += ml[e.mealIndex].totalKcal;
    tp += ml[e.mealIndex].protein;
    if (ml[e.mealIndex].mealtype == "liquid") twater += ml[e.mealIndex].weight;
  });

  todaym.innerHTML = mtData.length;
  todaye.innerHTML = tenergy.toFixed(2);
  todayp.innerHTML = tp.toFixed(2);
  todayw.innerHTML = (twater / 1000).toFixed(2);
}

// Call the async function to initiate the data fetching

async function fodoinsp(foodID, sortkey) {
  try {
    const response = await fetch(`https://nutrimonapi.azurewebsites.net/api/FoodCompSpecs/ByItem/${foodID}/BySortKey/${sortkey}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json', // Change to 'application/json' for JSON response
        'X-API-Key': 168795
      }
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    //Calculating sortkey value from desired quantity fixing , to .  and rounding decimal to 2
    return (Number(((data[0].resVal).replace(/,/g, '.')))).toFixed(2);

  } catch (error) {
    console.error('Error during fetch:', error);
    // Optionally rethrow the error or handle it as needed
    throw error;
  }
}

async function fdata(foodID, flag) {
  try {
    const response = await fetch(`https://nutrimonapi.azurewebsites.net/api/FoodItems/${foodID}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json', // Change to 'application/json' for JSON response
        'X-API-Key': 168795
      }
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data[flag];

  } catch (error) {
    console.error('Error during fetch:', error);
    // Optionally rethrow the error or handle it as needed
    throw error;
  }
}

async function foodinspector() {
  productimage.innerHTML = "<h3>Loading Data from API...</h3>";
  fid = select1.value;
  pid.innerHTML = fid;
  foodgroup.innerHTML = await fdata(fid, "fødevareGruppe");
  tisk.innerHTML = await fdata(fid, "taxonomicName");
  kj.innerHTML = await fodoinsp(fid, "1010");
  kcal.innerHTML = await fodoinsp(fid, "1030");
  protien.innerHTML = await fodoinsp(fid, "1110");
  fiber.innerHTML = await fodoinsp(fid, "1240");
  fedt.innerHTML = await fodoinsp(fid, "1310");
  kulhydrat.innerHTML = await fodoinsp(fid, "1210");
  vand.innerHTML = await fodoinsp(fid, "1620");
  torstof.innerHTML = await fodoinsp(fid, "1610");
  productimage.innerHTML = "<p>Sorry! Image Not Available.</p>";
}

function setTodayDate() {
  const todayDate = new Date().toISOString().split('T')[0];
  document.getElementById('addedOn').value = todayDate;
}


fetchFoodItem();







