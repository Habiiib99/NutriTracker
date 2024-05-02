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
    ingredientId INT PRIMARY KEY NOT NULL,
    ingredient VARCHAR NOT NULL,
    kcal DECIMAL NOT NULL,
    protein DECIMAL NOT NULL,
    fat DECIMAL NOT NULL,
    fiber DECIMAL NOT NULL
);

CREATE TABLE dbo.profiles (
    userId INT PRIMARY KEY NOT NULL,
    name VARCHAR NOT NULL,
    age INT NOT NULL,
    gender VARCHAR NOT NULL,
    weight DECIMAL NOT NULL,
    email VARCHAR NOT NULL,
    password VARCHAR NOT NULL,
    bmr DECIMAL NOT NULL
);

CREATE TABLE dbo.meals (
    mealId INT PRIMARY KEY NOT NULL,
    mealName VARCHAR NOT NULL,
    userId INT NOT NULL,
    kcal DECIMAL,
    protein DECIMAL,
    fat DECIMAL,
    fiber DECIMAL,
    ingredients VARCHAR,
    ingredientId INT,
    FOREIGN KEY (userId) REFERENCES dbo.profiles(userId)
);
-- add weight decimal(5,2) null;

CREATE TABLE dbo.tracker (
    trackerId INT PRIMARY KEY IDENTITY(1,1) NOT NULL,
    mealId INT,
    weight DECIMAL NOT NULL,
    userId INT NOT NULL,
    consumptionDate DATETIME NOT NULL DEFAULT GETDATE(),
    location VARCHAR NOT NULL, -- Consider storing as JSON or separate latitude and longitude fields
    FOREIGN KEY (mealId) REFERENCES dbo.meals(mealId),
    FOREIGN KEY (userId) REFERENCES dbo.profiles(userId)
);


CREATE TABLE dbo.activities (
    activityId INT PRIMARY KEY NOT NULL,
    userId INT NOT NULL,
    activityType VARCHAR NOT NULL,
    duration DECIMAL NOT NULL,
    caloriesBurned DECIMAL NOT NULL,
    activityDate DATETIME NOT NULL,
    activityName VARCHAR (100) NOT NULL, 
    FOREIGN KEY (userId) REFERENCES dbo.profiles(userId)
);
