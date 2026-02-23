import { db } from '../firebaseConfig';
import { collection, addDoc, query, where, getDocs, doc, deleteDoc, getDoc, updateDoc } from 'firebase/firestore';

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
 * Fetches a single project by its proj_id.
 * @param {string} projId 
 * @returns {Promise<Object|null>}
 */
export const getProjectById = async (projId) => {
    try {
        const q = query(collection(db, "projects"), where("proj_id", "==", projId));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
        }
    } catch (error) {
        console.error("Error fetching project by ID:", error);
    }
    return null;
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

        // 3. Add default phases to project-phases collection
        const defaultPhases = [
            'Requirement Analysis',
            'Design',
            'Implementation',
            'Testing',
            'Completions'
        ];

        for (const phaseName of defaultPhases) {
            await addDoc(collection(db, "project-phases"), {
                phaseId: `phase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                phaseName: phaseName,
                proj_id: proj_id,
                projectName: formData.projectTitle, // Store project name
                tasks: [] // Initialize with empty tasks
            });
        }

        return proj_id;

    } catch (error) {
        console.error("Error creating project with team:", error);
        throw error;
    }
};
/**
 * Fetches all team members for a specific project, including their names and roles.
 * @param {string} projId 
 * @returns {Promise<Array>}
 */
export const getProjectTeamMembers = async (projId) => {
    try {
        const q = query(collection(db, "projectTeam"), where("prjid", "==", projId));
        const teamSnapshot = await getDocs(q);
        const teamMembers = [];

        for (const teamDoc of teamSnapshot.docs) {
            const memberData = teamDoc.data();
            const userDoc = await getDoc(doc(db, "users", memberData.uid));
            if (userDoc.exists()) {
                teamMembers.push({
                    uid: memberData.uid,
                    fullName: userDoc.data().fullName,
                    role: memberData.role
                });
            }
        }
        return teamMembers;
    } catch (error) {
        console.error("Error fetching project team members:", error);
        return [];
    }
};

/**
 * Adds a new task to the Tasks collection.
 * @param {Object} taskData 
 * @returns {Promise<string>} The ID of the created task document
 */
export const addProjectTask = async (taskData) => {
    try {
        const docRef = await addDoc(collection(db, "Tasks"), {
            ...taskData,
            createdAt: new Date()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding project task:", error);
        throw error;
    }
};

/**
 * Fetches all tasks for a specific phase.
 * @param {string} phaseId 
 * @returns {Promise<Array>}
 */
export const getTasksByPhase = async (phaseId) => {
    try {
        const q = query(collection(db, "Tasks"), where("phaseId", "==", phaseId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching tasks by phase:", error);
        return [];
    }
};

/**
 * Updates a task in the Tasks collection.
 * @param {string} taskId 
 * @param {Object} updates 
 * @returns {Promise<void>}
 */
export const updateProjectTask = async (taskId, updates) => {
    try {
        const docRef = doc(db, "Tasks", taskId);
        await updateDoc(docRef, updates);
    } catch (error) {
        console.error("Error updating project task:", error);
        throw error;
    }
};

/**
 * Deletes a task from the Tasks collection.
 * @param {string} taskId 
 * @returns {Promise<void>}
 */
export const deleteProjectTask = async (taskId) => {
    try {
        await deleteDoc(doc(db, "Tasks", taskId));
    } catch (error) {
        console.error("Error deleting project task:", error);
        throw error;
    }
};

/**
 * Fetches all phases for a specific project.
 * @param {string} projId 
 * @returns {Promise<Array>}
 */
export const getProjectPhases = async (projId) => {
    try {
        const q = query(collection(db, "project-phases"), where("proj_id", "==", projId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching project phases:", error);
        return [];
    }
};
/**
 * Adds a new phase to a project.
 * @param {string} projId 
 * @param {string} phaseName 
 * @param {string} projectName 
 * @returns {Promise<Object>} The added phase data with its document ID
 */
export const addProjectPhase = async (projId, phaseName, projectName = "") => {
    try {
        const phaseData = {
            phaseId: `phase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            phaseName: phaseName,
            proj_id: projId,
            projectName: projectName,
            tasks: []
        };
        const docRef = await addDoc(collection(db, "project-phases"), phaseData);
        return { id: docRef.id, ...phaseData };
    } catch (error) {
        console.error("Error adding project phase:", error);
        throw error;
    }
};

/**
 * Updates the project name in all phases of a project.
 * @param {string} projId 
 * @param {string} newProjectName 
 * @returns {Promise<void>}
 */
export const updateProjectNameInPhases = async (projId, newProjectName) => {
    try {
        const q = query(collection(db, "project-phases"), where("proj_id", "==", projId));
        const querySnapshot = await getDocs(q);
        const batch = querySnapshot.docs.map(d => updateProjectPhase(d.id, { projectName: newProjectName }));
        await Promise.all(batch);
    } catch (error) {
        console.error("Error updating project name in phases:", error);
        throw error;
    }
};

/**
 * Updates a project phase.
 * @param {string} docId - The Firestore document ID
 * @param {Object} updates 
 * @returns {Promise<void>}
 */
export const updateProjectPhase = async (docId, updates) => {
    try {
        const docRef = doc(db, "project-phases", docId);
        await updateDoc(docRef, updates);
    } catch (error) {
        console.error("Error updating project phase:", error);
        throw error;
    }
};

/**
 * Deletes a project phase.
 * @param {string} docId - The Firestore document ID
 * @returns {Promise<void>}
 */
export const deleteProjectPhase = async (docId) => {
    try {
        await deleteDoc(doc(db, "project-phases", docId));
    } catch (error) {
        console.error("Error deleting project phase:", error);
        throw error;
    }
};

/**
 * Fetches all tasks across all phases of a project that are assigned to a specific user.
 * @param {string} projId 
 * @param {string} userName 
 * @returns {Promise<Array>}
 */
export const getTasksByProjectAndUser = async (projId, userName) => {
    try {
        // 1. Get all phases for this project to get their IDs
        const phases = await getProjectPhases(projId);
        const phaseIds = phases.map(p => p.id);

        if (phaseIds.length === 0) return [];

        // 2. Query Tasks collection for tasks in these phases assigned to the user
        const q = query(
            collection(db, "Tasks"),
            where("phaseId", "in", phaseIds),
            where("assignTo", "==", userName)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching my tasks:", error);
        return [];
    }
};

/**
 * Fetches the role of a user in a specific project.
 * @param {string} projId 
 * @param {string} userUid 
 * @returns {Promise<string|null>}
 */
export const getUserRoleInProject = async (projId, userUid) => {
    try {
        const q = query(
            collection(db, "projectTeam"),
            where("prjid", "==", projId),
            where("uid", "==", userUid)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].data().role;
        }
    } catch (error) {
        console.error("Error fetching user role in project:", error);
    }
    return null;
};
