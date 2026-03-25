# 🏛️ PropertyIQ: Asset Intelligence & Audit System

PropertyIQ is an advanced **Explainable Decision-Support System** designed to evaluate residential property investments across the UK. Unlike "black-box" investment tools, PropertyIQ prioritizes transparency by breaking down socio-economic factors, industry dependencies, and yield-to-risk probabilities using raw ONS (Office for National Statistics) data patterns.



---

## 🚀 Key Features

* **Asset Explorer:** High-performance filtering and search for 1,000+ property listings.
* **Deep-Dive Analysis:** Dynamic visualization of investment pillars (Income Strength, Energy Standards, Resale Speed).
* **Risk Intelligence:** Automated audit nodes for council tax bands, EPC compliance, and tenure risks.
* **System Documentation:** Built-in "Explain" module detailing the technical architecture and logic.
* **Premium UX:** Inertia-based smooth scrolling via Lenis and animated Skeleton loading states for data fetching.

---

## 🛠️ Technology Stack

### **Frontend**
- **React.js** (Vite-powered)
- **Tailwind CSS** (v4 Modern Architecture)
- **Recharts** (SVG-based Data Visualization)
- **Lucide React** (Consistent Iconography)
- **Lenis** (High-fidelity Smooth Scroll)

### **Backend & Data**
- **Flask** (Python Micro-framework)
- **Pandas** (Advanced Data Transformation & CSV Parsing)
- **CORS** (Configured for cross-origin local development)

---

## ⚙️ Quick Start

This project is organized in a single-root structure. Follow these steps to get the environment running:



### 1. Install Dependencies
**Backend (Python):**
```bash
pip install flask flask-cors pandas

Frontend (Node):
npm install

(Start Flask API):
python app.py

(Start Vite Dev Server):
npm run dev