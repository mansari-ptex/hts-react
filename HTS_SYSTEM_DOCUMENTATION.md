# HTS System - Comprehensive Documentation

This document provides a detailed technical and operational overview of the HTS (Harmonized Tariff Schedule) search and duty calculation system.

---

## 🏛️ System Architecture

The application is built on a **Hierarchical Tree Model**. Unlike flattened data models, this system preserves the legal structure of the HTS to ensure accurate duty propagation and description context.

### The Data Workflow
1.  **Ingestion**: `htsDownloader` fetches raw JSON from USITC (Chapters 61, 62, and 99).
2.  **Transformation**: `htsProcessor` parses indents, builds a parent-child tree, and generates synthetic IDs for grouping headings.
3.  **Refinement**: The inheritance engine crawls up the tree to resolve missing duty rates and Section 301 footnotes.
4.  **Serving**: `dataSyncService` maintains a real-time, in-memory cache for ultra-fast searches.

---

## ⚙️ Core Technical Functions

### 1. `sanitizeHTS(records, ch99Map)`
*   **Location**: `server/src/services/htsProcessor.js`
*   **What it does**: The "Brain" of the system. It uses an **Indent-based Stack Algorithm** to reconstruct the HTS hierarchy.
*   **How it works**: It iterates through official HTS rows. If it sees an indent of `2` followed by an indent of `3`, it correctly identifies the relationship. It assigns synthetic codes (`sys_group_XXX`) to rows that lack official numbers but contain critical category text.

### 2. `findInheritedField(record, field)`
*   **Location**: `server/src/services/htsProcessor.js`
*   **What it does**: Resolves the **Principle of Ancestral Inheritance**.
*   **Logic**: If a 10-digit code (e.g., `6101.20.00.10`) has no specific duty listed, this function recursively checks its parent (`6101.20.00`), then its grandparent, and so on, until it finds the legal rate. This is critical for Section 301 (China) duties.

### 3. `syncAll()`
*   **Location**: `server/src/services/htsDownloader.js`
*   **What it does**: Automates USITC data retrieval.
*   **Rename Logic**: It pulls from specific USITC export URLs and renames them to `chapter_61.json`, `chapter_62.json`, and `schedule99.json` instantly so the engine knows exactly which file is which.

### 4. `loadAndSyncData()`
*   **Location**: `server/src/services/dataSyncService.js`
*   **What it does**: Manages the local database snapshot (`clean_hts.json`). It ensures that whenever new raw files appear, the engine re-processes them and updates the live search cache without a restart.

### 5. `getEffectiveDuty(item, country)`
*   **Location**: `client/src/utils/dutyUtils.js`
*   **What it does**: The frontend calculator. It determines if General, Special, or Section 301 rates apply based on the user's selected exporting country.

---

## 🔍 How to Use the App

### For Users (Classification)
1.  **Search**: Use the top bar to search by keyword (e.g., "Cotton Shorts") or direct HTS numbers.
2.  **Context**: The search results table shows the "Breadcrumb" description (e.g., `Men's... > Of Cotton > Shorts`). This helps you confirm you are in the right category.
3.  **Detailed Breakdown**: Click the **(i)** info button to see the Hierarchy Path and exact duty calculations, including any Section 301 additives from China.

### For Admins (Database Control)
1.  **Automated Updates**: The system is scheduled via **Cron** to update itself every Monday at 3:00 AM.
2.  **Manual Force-Sync**:
    *   Find the small **dot (&bull;)** in the bottom-right corner of the screen.
    *   **Quintuple-click** (5 times) it to open the hidden **Database Administration** panel.
    *   Click "Sync with USITC Official" to force an immediate update.
3.  **Verification**: Check the **"Last Database Sync"** box in the Admin section to see exactly when your data was last refreshed.

---

## 🛠️ Maintenance & Troubleshooting

*   **Network Error during Sync**: Usually caused by USITC servers being slow or a temporary connection timeout. Wait a moment and try again.
*   **Missing 301 Duties**: Ensure `schedule99.json` is present in `server/data/raw/schedule99/`. Without this file, the engine cannot map footnotes to additional rates.
*   **Adding New Chapters**: To add new HTS chapters (e.g., Chapter 64), simply add the USITC download URL to the `SOURCES` array in `htsDownloader.js`.

---
