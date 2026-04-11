CREATE DATABASE IF NOT EXISTS nyumbani_hub;
USE nyumbani_hub;

CREATE TABLE IF NOT EXISTS users (
  uid VARCHAR(128) PRIMARY KEY,
  displayName VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  role ENUM('tenant', 'landlord', 'agent', 'admin') NOT NULL DEFAULT 'tenant',
  isVerified BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3,2) DEFAULT 0.00,
  reviewCount INT DEFAULT 0,
  phoneNumber VARCHAR(20),
  photoURL TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS properties (
  id VARCHAR(128) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  type ENUM('apartment', 'house', 'studio', 'bedsitter') NOT NULL,
  bedrooms INT,
  bathrooms INT,
  ownerId VARCHAR(128) NOT NULL,
  ownerType ENUM('landlord', 'agent') NOT NULL,
  status ENUM('available', 'rented', 'pending') DEFAULT 'available',
  amenities JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ownerId) REFERENCES users(uid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS applications (
  id VARCHAR(128) PRIMARY KEY,
  propertyId VARCHAR(128) NOT NULL,
  tenantId VARCHAR(128) NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  message TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (propertyId) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (tenantId) REFERENCES users(uid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(128) PRIMARY KEY,
  targetId VARCHAR(128) NOT NULL,
  reviewerId VARCHAR(128) NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (targetId) REFERENCES users(uid) ON DELETE CASCADE,
  FOREIGN KEY (reviewerId) REFERENCES users(uid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(128) PRIMARY KEY,
  userId VARCHAR(128) NOT NULL,
  propertyId VARCHAR(128) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  purpose ENUM('deposit', 'rent') NOT NULL,
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  transactionId VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(uid) ON DELETE CASCADE,
  FOREIGN KEY (propertyId) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS broadcasts (
  id VARCHAR(128) PRIMARY KEY,
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  target ENUM('all', 'agent', 'landlord', 'tenant') DEFAULT 'all',
  senderId VARCHAR(128) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (senderId) REFERENCES users(uid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(128) PRIMARY KEY,
  senderId VARCHAR(128) NOT NULL,
  receiverId VARCHAR(128) NOT NULL,
  text TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (senderId) REFERENCES users(uid) ON DELETE CASCADE,
  FOREIGN KEY (receiverId) REFERENCES users(uid) ON DELETE CASCADE
);
