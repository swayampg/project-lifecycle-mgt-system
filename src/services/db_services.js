import { db } from '../firebaseConfig';
import { collection, addDoc, query, where, getDocs, doc, deleteDoc, getDoc } from 'firebase/firestore';

/**
 * Finds a user by their email address.
 * @param {string} email 
 * @returns {Promise<Object|null>}
 */
export const findUserByEmail = async (email) => {
    try {
        const q = query(collection(db, "users"), where("email", "==", email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            return { uid: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
        }
    } catch (error) {
        console.error("Error finding user by email:", error);
    }
    return null;
};

/**
 * Sends a project invitation to a user.
 * @param {Object} projectData 
 * @param {Object} recipient 
 * @param {string} role 
 * @returns {Promise<void>}
 */
export const sendInvitation = async (projectData, recipient, role) => {
    try {
        await addDoc(collection(db, "invitations"), {
            prjid: projectData.proj_id,
            projectName: projectData.Name,
            recipientUid: recipient.uid,
            senderName: projectData.projectLeader,
            role: role,
            status: "pending",
            createdAt: new Date()
        });
    } catch (error) {
        console.error("Error sending invitation:", error);
        throw error;
    }
};

/**
 * Fetches pending invitations for a user.
 * @param {string} userUid 
 * @returns {Promise<Array>}
 */
export const getInvitationsForUser = async (userUid) => {
    try {
        const q = query(collection(db, "invitations"), where("recipientUid", "==", userUid), where("status", "==", "pending"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching invitations:", error);
        return [];
    }
};

/**
 * Responds to a project invitation.
 * @param {Object} invitation 
 * @param {boolean} accept 
 * @returns {Promise<void>}
 */
export const respondToInvitation = async (invitation, accept) => {
    try {
        if (accept) {
            const team_id = `team_${Date.now()}`;
            await addDoc(collection(db, "projectTeam"), {
                id: team_id,
                prjid: invitation.prjid,
                uid: invitation.recipientUid,
                role: invitation.role
            });
        }
        await deleteDoc(doc(db, "invitations", invitation.id));
    } catch (error) {
        console.error("Error responding to invitation:", error);
        throw error;
    }
};

/**
 * Fetches all projects where the user is a team member.
 * @param {string} userUid 
 * @returns {Promise<Array>}
 */
export const getUserProjects = async (userUid) => {
    try {
        // 1. Get all team memberships for the user
        const teamQuery = query(collection(db, "projectTeam"), where("uid", "==", userUid));
        const teamSnapshot = await getDocs(teamQuery);
        const projIds = teamSnapshot.docs.map(doc => doc.data().prjid);

        if (projIds.length === 0) return [];

        // 2. Fetch the actual project data for those IDs
        const projectsQuery = query(collection(db, "projects"), where("proj_id", "in", projIds));
        const projectsSnapshot = await getDocs(projectsQuery);

        return projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching user projects:", error);
        return [];
    }
};

/**
 * Creates a new project and an associated entry in the projectTeam collection.
 * 
 * @param {Object} formData - The project form data.
 * @param {string} userUid - The UID of the current user.
 * @param {string} creatorRole - The role selected by the creator.
 * @returns {Promise<string>} - The proj_id of the new project.
 */
export const createProjectWithTeam = async (formData, userUid, creatorRole = "Project Leader") => {
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
            role: creatorRole
        });

        return proj_id;

    } catch (error) {
        console.error("Error creating project with team:", error);
        throw error;
    }
};
