# 📘 Harmonized Tariff Schedule (HTS) Engine Documentation

This document provides a comprehensive overview of the **HTS MERN Application**, designed to help both technical and non-technical stakeholders understand how the system works—from its core purpose to the intricate data transformation processes that power it.

---

## 🚀 1. What is the HTS App?

The **HTS MERN App** is a specialized search engine and duty rate calculator for the **Harmonized Tariff Schedule (HTS)**. It allows users (like importers, exporters, and logistics managers) to find the correct tariff codes and associated duty rates for imported goods.

### **Core Functionality**
- **🔍 Global Keyword Search**: Instantly find HTS codes by entering a product description (e.g., "men's cotton shirt") or a partial HTS code.
- **📊 Real-time Filtering**: Narrow down results by category, material, gender, fabric type, or country.
- **💰 Duty Rate Lookup**: Instantly see General, Special (Free Trade Agreements), and Other duty rates.
- **🚩 Category-Based Alerts**: Automatically flags specific HTS categories that might require special attention (e.g., high-risk or regulated goods).
- **💡 Smart Highlighting**: Visually highlights keywords within descriptions for easier scanning.

---

## 📂 2. Understanding the Raw HTS Data

The app's intelligence starts with raw data, typically found in a large file named `master.json`. This file is exported from official sources (like the US International Trade Commission) and is extremely verbose.

### **🏢 Data Contents**
Each record in the raw data represent a specific "leaf" or "branch" of the tariff schedule. Key fields include:
- `htsno`: The HTS code (e.g., `6101.20.00.10`).
- `indent`: A number (0, 1, 2, etc.) indicating the hierarchical level of the code.
- `description`: The official text describing the goods.
- `general`: The standard duty rate for most countries.
- `special`: Reduced rates or exemptions for specific trade partners (e.g., "Free (AU,KR,CL)").
- `other`: The high duty rate for non-favored nations.
- `superior`: A flag indicating if this is a "parent" category without its own code.
- `units`: The units of measure used for reporting (e.g., "kg", "doz.").
- `footnotes`: Additional legal notes or references.

### **🎯 What is Relevant to Us?**
Not everything in the raw data is needed for a user-friendly app. We focus on:
1. **The Code (`htsno`)**: Used for searching and sorting.
2. **The Description**: Tells the user exactly what the product is.
3. **Duty Rates (`general`, `special`, `other`)**: The "price" of importing.
4. **Units**: How much of the product must be declared.
5. **Hierarchy (`indent`)**: Crucial for understanding which category belongs to which parent.

---

## 🧼 3. The Sanitization Process (How We Clean the Data)

Raw HTS data is messy—it often contains HTML tags, inconsistent formatting, and "orphan" records that lack explicitly defined duty rates (they are meant to be inherited). 

Our custom **HTS Processor Service** (`htsProcessor.js`) performs a 4-stage transformation:

### **Stage 1: Basic Cleaning & Filtering**
- **HTML Removal**: Replaces messy tags like `<i>` or `<b>` with clean text.
- **Deduplication**: Ensures no HTS code is processed twice.
- **Skipping "Superior" Records**: We ignore rows that are just placeholders and don't represent actual importable items.

### **Stage 2: Building the Tree (Hierarchy)**
- **Strict Leveling**: We calculate the "depth" of each code based on its structure (e.g., `6101` is Level 0, while `6101.20.00` is Level 2).
- **Parent Derivation**: We automatically link each code to its logical "parent." If `6101.20.10` exists but `6101.20` doesn't, we look further up to `6101` to find a parent.

### **Stage 3: Duty Rate Inheritance (The "Smart" Move)**
This is the most critical technical step. In the raw HTS, a parent might have a duty rate of "15.9%", but its sub-codes might have a blank field.
- **Logic**: If a specific code has a blank duty rate, our system "crawls up the tree" to find the nearest ancestor that **does** have a rate and pulls it down. This ensures every final item shows an accurate duty cost.

### **Stage 4: Validation & Saving**
Finally, the system runs a health check:
- ✅ Checks for "orphans" (codes without valid parents).
- ✅ Ensures no HTML tags were missed.
- ✅ Validates that every code has a correct depth level.
- 💾 Saves the polished result as `clean_hts.json`.

---

## 🛠️ 4. Technical Architecture Summary

For developers, here is the high-level stack:

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React (Vite) | Renders the searchable UI and manages user interactions. |
| **State Management** | Context API & Reducers | Handles global filters, searches, and UI states (loading, modals). |
| **Backend** | Node.js & Express | Serves the processed HTS data via specialized API endpoints. |
| **Data Logic** | Custom Node.js Scripts | Orchestrates the `master.json` → `clean_hts.json` transformation. |
| **Storage** | In-Memory JSON | Built for speed; the entire HTS dataset is kept in memory on the server. |

---

## 💡 Summary for Users
In short, this app takes a massive, complex, and messy legal document (the Harmonized Tariff Schedule) and transforms it into a **fast, clean, and interactive tool**. It handles the "heavy lifting" of hierarchy and duty rate logic behind the scenes, so you can find what you need in seconds.
