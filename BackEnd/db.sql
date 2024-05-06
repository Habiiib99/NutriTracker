
CREATE SCHEMA eksamen

CREATE TABLE eksamen.ingredients (
    ingredientId INT IDENTITY(1,1) PRIMARY KEY,
    ingredientName NVARCHAR(255),
    kcal100g FLOAT,
    protein100g FLOAT,
    fiber100g FLOAT,
    fat100g FLOAT
);

CREATE TABLE eksamen.userr (
    userId INT IDENTITY(1,1) PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    pwd VARCHAR(255),
    name VARCHAR(255),
    weight FLOAT,
    dateOfBirth DATE,
    gender CHAR(1),
    dateOfCreation datetime2 DEFAULT GETDATE(),
    bslsskifte24hr FLOAT
);

CREATE TABLE eksamen.meal (
    mealId INT IDENTITY(1,1) PRIMARY KEY,
    mealName VARCHAR(255),
    createdOn DATE,
    createdByUserId INT,
    kcal100g FLOAT,
    protein100g FLOAT,
    fiber100g FLOAT,
    fat100g FLOAT,
    FOREIGN KEY (createdByUserId) REFERENCES eksamen.userr(userId) ON DELETE SET NULL -- If a user is deleted, all meals with the userId will be deleted
);

CREATE TABLE eksamen.meal_ingredients (
    mealId INT,
    ingredientId INT,
    gramsOfIngredient FLOAT,
    PRIMARY KEY (mealId, ingredientId),
    FOREIGN KEY (mealId) REFERENCES eksamen.meal(mealId) ON DELETE CASCADE, -- If a meal is deleted, all meal_ingredients with the mealId will be deleted
    FOREIGN KEY (ingredientId) REFERENCES eksamen.ingredients(ingredientId)
);

CREATE TABLE eksamen.activity (
    activityId INT IDENTITY(1,1) PRIMARY KEY,
    activityName VARCHAR(255),
    burnedKcalPrHour INT
);

CREATE TABLE eksamen.user_activities (
    user_activitiesId INT IDENTITY(1,1) PRIMARY KEY,
    activityId INT,
    userId INT,
    dateAndTimeOfActivity DATETIME,
    durationOfActivityInMinutes INT,
    burnedKcal INT,
    FOREIGN KEY (activityId) REFERENCES eksamen.activity(activityId),
    FOREIGN KEY (userId) REFERENCES eksamen.userr(userId) ON DELETE CASCADE -- If a user is deleted, all user_activities with the userId will be deleted
);

CREATE TABLE eksamen.intake (
    intakeId INT IDENTITY(1,1) PRIMARY KEY,
    mealId INT,
    ingredientId INT,
    userId INT,
    weightInGrams INT,
    totalKcal FLOAT,
    totalProtein FLOAT,
    totalFiber FLOAT,
    totalFat FLOAT,
    dateAndTimeOfIntake DATETIME,
    FOREIGN KEY (userId) REFERENCES eksamen.userr(userId) ON DELETE CASCADE, -- If a user is deleted, all intakes with the userId will be deleted
    FOREIGN KEY (mealId) REFERENCES eksamen.meal(mealId),
    FOREIGN KEY (ingredientId) REFERENCES eksamen.ingredients(ingredientId)
);

CREATE TABLE eksamen.intake_location (
    intakeId INT PRIMARY KEY,
    lat FLOAT,
    lon FLOAT,
    cityName VARCHAR(255),
    FOREIGN KEY (intakeId) REFERENCES eksamen.intake(intakeId) ON DELETE CASCADE -- If an intake is deleted, all intake_locations with the intakeId will be deleted
);


CREATE TABLE eksamen.bslsUdregning (
    age INT,
    gender CHAR(1),
    multiplyFactor FLOAT,
    rightNumber VARCHAR(5),
    PRIMARY KEY (age, gender)
)
CREATE TABLE eksamen.waterRegistration (
    waterRegId INT IDENTITY(1,1) PRIMARY KEY,
    userId INT,
    amountOfWater INT,
    dateAndTimeOfDrinking DATETIME,
    lat FLOAT,
    lon FLOAT,
    city VARCHAR(255),
    FOREIGN KEY (userId) REFERENCES eksamen.userr(userId) ON DELETE CASCADE -- If a user is deleted, all waterRegistrations with the userId will be deleted
);
