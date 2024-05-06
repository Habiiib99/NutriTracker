-- Dropping existing tables if they exist
DROP TABLE IF EXISTS dbo.meals;
DROP TABLE IF EXISTS dbo.profiles;
DROP TABLE IF EXISTS dbo.tracker;
DROP TABLE IF EXISTS dbo.activities;
DROP TABLE IF EXISTS dbo.ingredients;


-- Create the database if it doesn't already exist
IF NOT EXISTS(SELECT * FROM sys.databases WHERE name = 'NutriTracker')
BEGIN
  CREATE DATABASE NutriTracker;
END;
GO

USE NutriTracker;
GO

CREATE TABLE dbo.ingredients (
    ingredientId INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    ingredient VARCHAR(255) NOT NULL,
    kcal DECIMAL NOT NULL,
    protein DECIMAL NOT NULL,
    fat DECIMAL NOT NULL,
    fiber DECIMAL NOT NULL
);

CREATE TABLE dbo.profiles (
    userId INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    name VARCHAR(255) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(255) NOT NULL,
    weight DECIMAL NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    bmr DECIMAL NOT NULL
);

CREATE TABLE dbo.meals (
    mealId INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    mealName VARCHAR(255) NOT NULL,
    userId INT NOT NULL,
    kcal DECIMAL,
    protein DECIMAL,
    fat DECIMAL,
    fiber DECIMAL,
    ingredients VARCHAR(255),
    FOREIGN KEY (userId) REFERENCES dbo.profiles(userId)
);
-- add weight decimal(5,2) null;

CREATE TABLE dbo.tracker (
    trackerId INT PRIMARY KEY IDENTITY(1,1) NOT NULL,
    mealId INT,
    weight DECIMAL NOT NULL,
    userId INT NOT NULL,
    consumptionDate DATETIME NOT NULL DEFAULT GETDATE(),
    location VARCHAR(255) NOT NULL, -- Consider storing as JSON or separate latitude and longitude fields
    FOREIGN KEY (mealId) REFERENCES dbo.meals(mealId),
    FOREIGN KEY (userId) REFERENCES dbo.profiles(userId)
);


CREATE TABLE dbo.activities (
    activityId INT PRIMARY KEY IDENTITY(1,1) NOT NULL,
    userId INT NOT NULL,
    activityType VARCHAR(255) NOT NULL,
    duration DECIMAL NOT NULL,
    caloriesBurned DECIMAL NOT NULL,
    activityDate DATETIME NOT NULL,
    activityName VARCHAR(255) NOT NULL, 
    FOREIGN KEY (userId) REFERENCES dbo.profiles(userId)
);

CREATE TABLE dbo.meal_ingredients (
    mealIngredientId INT PRIMARY KEY IDENTITY(1,1) NOT NULL,
    ingredientId INT NOT NULL,
    weightOfIngredient DECIMAL NOT NULL,
    userId INT NOT NULL, -- Add userId column
    FOREIGN KEY (ingredientId) REFERENCES dbo.ingredients(ingredientId),
    FOREIGN KEY (userId) REFERENCES dbo.profiles(userId) -- Define foreign key constraint
);


CREATE TABLE dbo.waterRegistration (
    waterRegId INT IDENTITY(1,1) PRIMARY KEY,  -- Unik identifikator
    userId INT NOT NULL,  -- Reference til brugeren
    amountOfWater INT NOT NULL,  -- Mængde vand i ml
    dateAndTimeOfDrinking DATETIME NOT NULL,  -- Tidspunkt for vandindtaget
    FOREIGN KEY (userId) REFERENCES dbo.profiles(userId) ON DELETE CASCADE  -- Sletning kaskaderer til vandregistreringer
);

