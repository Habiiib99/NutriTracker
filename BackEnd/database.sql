-- Create the database if it doesn't already exist
IF NOT EXISTS(SELECT * FROM sys.databases WHERE name = 'NutriTracker')
BEGIN
  CREATE DATABASE NutriTracker;
END;
GO

USE NutriTracker;
GO

CREATE TABLE food_items (
  id INT PRIMARY KEY IDENTITY(1,1),
  name VARCHAR(255),
  kcal DECIMAL NOT NULL,
  protein DECIMAL NOT NULL,
  fat DECIMAL NOT NULL,
  carbohydrates DECIMAL NOT NULL, -- Added carbohydrates
  fiber DECIMAL NOT NULL
);

CREATE TABLE profiles (
  id INT PRIMARY KEY IDENTITY(1,1),
  name VARCHAR(255) NOT NULL,
  age INT NOT NULL,
  gender VARCHAR(50) NOT NULL, -- Changed from VARCHAR(255) for gender as it's typically shorter
  weight DECIMAL NOT NULL
);

CREATE TABLE meals (
  id INT PRIMARY KEY IDENTITY(1,1),
  name VARCHAR(255) NOT NULL,
  userId INT NOT NULL,
  FOREIGN KEY (userId) REFERENCES profiles(id) -- Added foreign key relationship
);

CREATE TABLE meal_food_items (
  mealId INT NOT NULL, -- Renamed for clarity
  foodItemId INT NOT NULL, -- Renamed for clarity
  PRIMARY KEY (mealId, foodItemId),
  FOREIGN KEY (mealId) REFERENCES meals(id),
  FOREIGN KEY (foodItemId) REFERENCES food_items(id)
);

CREATE TABLE activities (
  id INT PRIMARY KEY IDENTITY(1,1),
  userId INT NOT NULL,
  activityType VARCHAR(255) NOT NULL,
  duration DECIMAL NOT NULL,
  caloriesBurned DECIMAL NOT NULL,
  activityDate DATETIME NOT NULL,
  FOREIGN KEY (userId) REFERENCES profiles(id)
);


-- Geolokation 
ALTER TABLE meal_food_items ADD latitude DECIMAL(9,6), longitude DECIMAL(9,6);

