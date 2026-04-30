CREATE DATABASE IF NOT EXISTS nyumbani_hub;
USE nyumbani_hub;

CREATE TABLE IF NOT EXISTS users (
  uid VARCHAR(128) PRIMARY KEY,
  displayname VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT,
  role VARCHAR(20) DEFAULT 'tenant',
  isverified BOOLEAN DEFAULT FALSE,
  emailverified BOOLEAN DEFAULT FALSE,
  verificationtoken VARCHAR(128),
  rating DECIMAL(3,2) DEFAULT 0.00,
  reviewcount INT DEFAULT 0,
  phonenumber VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Kenya',
  photourl TEXT,
  documenturl TEXT,
  documenttype VARCHAR(50),
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migration logic to handle old schema casing if it exists
DO $$ 
BEGIN
  -- Rename displayName to displayname if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'displayName') THEN
    ALTER TABLE users RENAME COLUMN "displayName" TO displayname;
  END IF;
  
  -- Rename isVerified to isverified if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'isVerified') THEN
    ALTER TABLE users RENAME COLUMN "isVerified" TO isverified;
  END IF;

  -- Rename emailVerified to emailverified if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'emailVerified') THEN
    ALTER TABLE users RENAME COLUMN "emailVerified" TO emailverified;
  END IF;

  -- Rename phoneNumber to phonenumber if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phoneNumber') THEN
    ALTER TABLE users RENAME COLUMN "phoneNumber" TO phonenumber;
  END IF;

  -- Rename photoURL to photourl if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'photoURL') THEN
    ALTER TABLE users RENAME COLUMN "photoURL" TO photourl;
  END IF;
  
  -- Ensure country column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'country') THEN
    ALTER TABLE users ADD COLUMN country VARCHAR(100) DEFAULT 'Kenya';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS properties (
  id VARCHAR(128) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  type ENUM('apartment', 'house', 'studio', 'bedsitter') NOT NULL,
  bedrooms INT,
  bathrooms INT,
  ownerid VARCHAR(128) NOT NULL,
  ownertype ENUM('landlord', 'agent') NOT NULL,
  status ENUM('available', 'rented', 'pending') DEFAULT 'available',
  amenities JSON,
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ownerid) REFERENCES users(uid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS applications (
  id VARCHAR(128) PRIMARY KEY,
  propertyid VARCHAR(128) NOT NULL,
  tenantid VARCHAR(128) NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  message TEXT,
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (propertyid) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (tenantid) REFERENCES users(uid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(128) PRIMARY KEY,
  targetid VARCHAR(128) NOT NULL,
  reviewerid VARCHAR(128) NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (targetid) REFERENCES users(uid) ON DELETE CASCADE,
  FOREIGN KEY (reviewerid) REFERENCES users(uid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(128) PRIMARY KEY,
  userid VARCHAR(128) NOT NULL,
  propertyid VARCHAR(128) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  purpose ENUM('deposit', 'rent') NOT NULL,
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  transactionid VARCHAR(255),
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userid) REFERENCES users(uid) ON DELETE CASCADE,
  FOREIGN KEY (propertyid) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS broadcasts (
  id VARCHAR(128) PRIMARY KEY,
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  target ENUM('all', 'agent', 'landlord', 'tenant') DEFAULT 'all',
  senderid VARCHAR(128) NOT NULL,
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (senderid) REFERENCES users(uid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(128) PRIMARY KEY,
  senderid VARCHAR(128) NOT NULL,
  receiverid VARCHAR(128) NOT NULL,
  text TEXT NOT NULL,
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (senderid) REFERENCES users(uid) ON DELETE CASCADE,
  FOREIGN KEY (receiverid) REFERENCES users(uid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS password_resets (
  id VARCHAR(128) PRIMARY KEY,
  userid VARCHAR(128) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expiresat TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userid) REFERENCES users(uid) ON DELETE CASCADE
);
