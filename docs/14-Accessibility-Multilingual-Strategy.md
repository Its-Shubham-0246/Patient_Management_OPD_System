# Smart OPD – Accessibility & Multilingual Strategy (WCAG 2.1 AA & Hindi Localization)
## Single-Clinic Outpatient Department Management System

> **Document ID:** 14-Accessibility-Multilingual-Strategy.md  
> **Version:** 2.0.0 (Master Release)  
> **Status:** Stage A Architectural Baseline – Fully Detailed  
> **Date:** 2026-11-11  
> **Standards:** W3C Web Content Accessibility Guidelines (WCAG) 2.1 Level AA  
> **Localization Architecture:** `i18next` + `react-i18next` (English & Hindi Baseline)  

---

## 1. Web Accessibility Framework (WCAG 2.1 Level AA)

Healthcare software must accommodate diverse demographics, including elderly patients with declining vision, motor-impaired individuals, and front-desk personnel operating in noisy, high-stress clinic environments:

```
+-----------------------------------------------------------------------------------------------+
| WCAG 2.1 LEVEL AA COMPLIANCE MATRIX                                                           |
+---------------------+-------------------------------+-----------------------------------------+
| Principle           | Guideline Enforced            | Smart OPD Implementation                |
+---------------------+-------------------------------+-----------------------------------------+
| **Perceivable**     | 1.4.3 Minimum Contrast        | Text contrast ratio ≥ 4.5:1 against     |
|                     |                               | backgrounds; Large headers ≥ 7:1.       |
|                     | 1.3.1 Info and Relationships  | Semantic HTML5 (`<main>`, `<nav>`) and  |
|                     |                               | accessible ARIA labels for icons.       |
| **Operable**        | 2.1.1 Keyboard Navigable      | All buttons, modals, and forms operable |
|                     |                               | via `Tab`, `Enter`, and `Escape`.       |
|                     | 2.4.7 Focus Visible           | Distinct 2px high-contrast focus rings. |
| **Understandable**  | 3.1.2 Language of Parts       | Correct `lang="en"` or `lang="hi"` tags.|
|                     | 3.3.1 Error Identification    | Clear inline form error messages.       |
| **Robust**          | 4.1.3 Status Messages         | `aria-live="polite"` for dynamic token  |
|                     |                               | waiting room queue updates.             |
+---------------------+-------------------------------+-----------------------------------------+
```

---

## 2. Keyboard Ergonomics & Clinic Hotkeys

Front-desk receptionists and attending physicians can execute high-frequency operations without touching a mouse:

| Hotkey Combination | Target Action | Screen Availability |
|---|---|---|
| `Alt + C` or `⌘K` | Quick-search patient by mobile/UHID and open Check-In Drawer | App-Wide (Receptionist) |
| `Alt + N` | Call next patient in queue ("Call Next ▶") | Doctor Workspace |
| `Alt + P` | One-click preview & print prescription PDF | Doctor Workspace |
| `Escape` | Dismiss modal dialog, drawer, or dropdown menu | App-Wide |
| `Tab` / `Shift + Tab` | Sequentially navigate form inputs and table action buttons | App-Wide |

---

## 3. Multilingual Localization Architecture (`react-i18next`)

### 3.1 Language Strategy & Devanagari Typography
1. **English (`en`)**: Primary administrative, billing, and clinical terminology language.
2. **Hindi (`hi`)**: Complete localization for the patient self-service portal, check-in kiosk, SMS notifications, and waiting room announcements.
3. **Typography Pairing**:
   - English typography: **Inter** (Clean, neutral geometric sans-serif).
   - Hindi typography: **Noto Sans Devanagari** (Google font engineered for high-legibility on low-resolution mobile screens).

### 3.2 Translation Namespace Directory Structure
```
client/src/locales/
├── en/
│   ├── common.json
│   ├── auth.json
│   ├── queue.json
│   ├── portal.json
│   └── rx.json
└── hi/
    ├── common.json
    ├── auth.json
    ├── queue.json
    ├── portal.json
    └── rx.json
```

### 3.3 Sample Localization Dictionaries

```json
// locales/en/queue.json
{
  "token": "Token",
  "now_calling": "Now Calling",
  "room": "Room",
  "waiting": "Waiting Patients",
  "est_wait": "Estimated Wait Time",
  "call_next": "Call Next",
  "emergency": "Emergency Case"
}

// locales/hi/queue.json
{
  "token": "टोकन",
  "now_calling": "वर्तमान टोकन",
  "room": "कमरा",
  "waiting": "प्रतीक्षारत मरीज",
  "est_wait": "अनुमानित प्रतीक्षा समय",
  "call_next": "अगला मरीज बुलाएं",
  "emergency": "आपातकालीन मामला"
}
```

---

## 4. Accessible Waiting Room TV Display & Bilingual Voice Prompts

To ensure illiterate or visually impaired patients in the waiting lounge never miss their consultation:
1. **Audible Chime Alert**: When a doctor triggers "Call Next", the waiting room display plays a pleasant two-tone chime (`chime.mp3`).
2. **Web Speech API Voice Synthesis**:
   - Synthesizes dynamic audio announcement in both Hindi and English:
     *"टोकन नंबर 14, कृपया कमरा नंबर 1 में जाएं / Token Number 14, please proceed to Room 1, Dr. Sharma."*
3. **High-Visibility Visual Banner**: The active token renders in **72pt+ extra-bold white typography** on a high-contrast deep navy background with flashing teal border accents.

---

## 5. Practical Recommendations, Risks & Acceptance Criteria

### 5.1 Recommendations
1. **Dual Language Patient Receipts**: Money receipts and appointment cards should print patient instructions in both English and Hindi.
2. **Preserve Medical Terminology in English**: Drug names (e.g., *Paracetamol 650mg*) must remain in English/Latin scripts to eliminate pharmacological dispensing errors by pharmacists.

### 5.2 Key Risks & Mitigations
- **Risk 1: Browser Speech Synthesis Variance**: Different smart TV browsers have varying voice engine qualities.
  - *Mitigation*: The system checks for `window.speechSynthesis` availability; if unsupported, it gracefully falls back to playing the audio chime file (`chime.mp3`).
- **Risk 2: Devanagari Font Rendering Clipping**: Long Hindi words clipping table cells.
  - *Mitigation*: Set flexible container widths (`min-w-[120px]`) and enforce `break-words` in Tailwind.

### 5.3 Acceptance Criteria
- [x] Text contrast ratio verified ≥ 4.5:1 across all color tokens.
- [x] Complete keyboard navigation across all forms, tables, and dialogs.
- [x] Dual-language English and Hindi localization for patient portal.
- [x] Waiting room TV display with visual token banner, chime sound, and bilingual voice prompt.
