# YouTube Draft Scheduler ⏰

This project automates the process of **scheduling YouTube drafts** using JavaScript directly in the **YouTube Studio** page.  
It helps creators schedule multiple uploaded drafts at once with precise control over **date, time, visibility, and gaps** between videos.

---

## ✨ Features
- Automatically opens each **draft video** and schedules it.  
- Supports `Public`, `Unlisted`, or `Private` visibility modes.  
- Configurable:
  - **Start time** for the first video.
  - **Gap between uploads** (e.g., every 15 minutes).
  - **Number of videos** to schedule.  
- Handles **"Made for kids"** settings automatically.  
- Ensures first scheduled time is always in the **future** (avoids YouTube errors).  
- Includes debugging mode for troubleshooting.

---

## 📂 File
- **`schedule_drafts.js`** → main automation script.  

---

## 🛠️ Prerequisites
1. A desktop browser (tested with **Chrome**).  
2. A YouTube channel with videos already uploaded as **drafts** (not yet published).  
3. Basic ability to run JavaScript inside Developer Tools.  

---

## 🚀 Usage

1. Open [YouTube Studio Uploads](https://studio.youtube.com/channel/UC/videos/upload).  
   - Make sure you can see your **draft videos**.

2. Open **Developer Tools** in your browser (press `F12` or `Ctrl+Shift+I`).  

3. Go to the **Console** tab.  

4. Paste the content of `schedule_drafts.js` into the console.  

5. Adjust configuration inside the script before running:
   ```js
   const MODE = 'publish_drafts'; // main action
   const DEBUG_MODE = true;
   const MADE_FOR_KIDS = false;

   const VISIBILITY = 'Public';   // 'Private' | 'Unlisted' | 'Public'
   const DATE_OFFSET = 0;         // 0 = today, 1 = tomorrow, etc.
   const START_TIME = "08:00";    // HH:MM (24h format)
   const GAP_MINUTES = 15;        // gap between videos in minutes
   const COUNT = 5;               // number of videos to schedule
   ```

   Example:  
   - First video scheduled at **08:00 today**.  
   - Each following video 15 minutes later.  
   - Maximum of 5 drafts scheduled.  

6. Press **Enter** to run the script.  
   - The script will iterate over your drafts and schedule them automatically.  

---

## ⚡ Example Run

Suppose you have **6 drafts** ready.  
Config:
```js
DATE_OFFSET = 0       // today
START_TIME = "09:00"  // 9 AM
GAP_MINUTES = 30      // every 30 minutes
COUNT = 4             // schedule only 4 drafts
```

Result:
- Draft #1 → scheduled at **09:00**  
- Draft #2 → scheduled at **09:30**  
- Draft #3 → scheduled at **10:00**  
- Draft #4 → scheduled at **10:30**  
- Draft #5+ will remain unscheduled  

---

## 📌 Notes
- You must keep the YouTube Studio **open and focused** while the script runs.  
- Script interacts directly with YouTube Studio’s DOM, so small **UI changes by YouTube** may break it.  
- If scheduling fails for a video, it logs the error in the **Console**.  
- Debug mode (`DEBUG_MODE = true`) prints additional info in the console.  

---

## 📄 License
MIT License — feel free to use and adapt.
