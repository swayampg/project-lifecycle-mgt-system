import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";
import fs from "fs";
import path from "path";

// Firebase Configuration (Copied from src/firebaseConfig.js)
const firebaseConfig = {
  apiKey: "AIzaSyB0yOUvC0m_IFYEISWaR1tKhA599EqtqMs",
  authDomain: "project-management-syste-dba4b.firebaseapp.com",
  projectId: "project-management-syste-dba4b",
  storageBucket: "project-management-syste-dba4b.firebasestorage.app",
  messagingSenderId: "80651715198",
  appId: "1:80651715198:web:4b03ccbbf0eeb144e64e2f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function exportFeedback() {
    console.log("Fetching feedback from Firestore...");
    try {
        const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const feedback = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
        }));

        if (feedback.length === 0) {
            console.log("No feedback found in the database.");
            return;
        }

        // 1. Export as JSON
        const jsonPath = path.resolve("feedback_dump.json");
        fs.writeFileSync(jsonPath, JSON.stringify(feedback, null, 2));
        console.log(`Successfully exported ${feedback.length} entries to JSON: ${jsonPath}`);

        // 2. Export as CSV
        const csvHeaders = ["id", "rating", "userName", "userEmail", "types", "description", "createdAt"];
        const csvRows = feedback.map(item => {
            const types = Array.isArray(item.types) ? item.types.join("; ") : (item.types || "");
            const description = (item.description || "").replace(/"/g, '""'); // Escape double quotes
            return [
                item.id,
                item.rating,
                item.userName,
                item.userEmail,
                `"${types}"`,
                `"${description}"`,
                item.createdAt
            ].join(",");
        });

        const csvContent = [csvHeaders.join(","), ...csvRows].join("\n");
        const csvPath = path.resolve("feedback_summary.csv");
        fs.writeFileSync(csvPath, csvContent);
        console.log(`Successfully exported ${feedback.length} entries to CSV: ${csvPath}`);

        console.log("\nDone! You can now open 'feedback_summary.csv' in Excel or Google Sheets.");
    } catch (error) {
        console.error("Error exporting feedback:", error);
    }
}

exportFeedback().then(() => process.exit(0));
