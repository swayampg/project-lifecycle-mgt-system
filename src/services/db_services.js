import { db } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

/**
 * Creates a new project and an associated entry in the projectTeam collection.
 * 
 * @param {Object} formData - The project form data.
 * @param {string} userUid - The UID of the current user.
 * @returns {Promise<void>}
 */
export const createProjectWithTeam = async (formData, userUid) => {
    try {
        const proj_id = Date.now().toString();

        // 1. Add to projects collection
        await addDoc(collection(db, "projects"), {
            proj_id: proj_id,
            Name: formData.projectTitle,
            projectLeader: formData.projectLeader,
            startDate: formData.startDate,
            endDate: formData.endDate,
            description: formData.description,
            category: formData.category,
            department: formData.department,
            createdAt: new Date()
        });

        // 2. Add to projectTeam collection
        const team_id = `team_${Date.now()}`;
        await addDoc(collection(db, "projectTeam"), {
            id: team_id,
            prjid: proj_id,
            uid: userUid,
            role: "" // Initial empty role as requested
        });

    } catch (error) {
        console.error("Error creating project with team:", error);
        throw error;
    }
};
