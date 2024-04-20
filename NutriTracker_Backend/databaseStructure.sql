-- THIS SHOULD BE UPDATED IN ACCORDANCE WITH THE CLASSES YOU'VE DEFINED ALREADY


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
  fiber DECIMAL NOT NULL,
);

CREATE TABLE meals (
id INT PRIMARY KEY IDENTITY(1,1),
  name VARCHAR(255) NOT NULL,
  userId INT NOT NULL,
);

CREATE TABLE meal_food_items (
  meal INT NOT NULL,
  foodItem INT NOT NULL,
  PRIMARY KEY (meal, foodItem),
  FOREIGN KEY (meal) REFERENCES meals(id),
  FOREIGN KEY (foodItem) REFERENCES food_items(id)
);

CREATE TABLE profiles (
id INT PRIMARY KEY IDENTITY(1,1),
  name VARCHAR(255) NOT NULL,
  age INT NOT NULL,
  gender VARCHAR(255) NOT NULL,
  weight DECIMAL NOT NULL,
);