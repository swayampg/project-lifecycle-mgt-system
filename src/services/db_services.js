import { db } from '../firebaseConfig';
import { collection, addDoc, query, where, getDocs, doc, deleteDoc, getDoc, updateDoc, orderBy, limit, serverTimestamp } from 'firebase/firestore';

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
        const teamQuery = query(collection(db, "projectTeam"), where("uid", "==", userUid));
        const teamSnapshot = await getDocs(teamQuery);
        if (teamSnapshot.empty) return [];

        const memberships = {};
        teamSnapshot.docs.forEach(doc => {
            const data = doc.data();
            memberships[data.prjid] = data;
        });

        const projIds = Object.keys(memberships);
        const projectsSnapshot = await getDocs(query(collection(db, "projects"), where("proj_id", "in", projIds)));

        return projectsSnapshot.docs.map(doc => {
            const projData = doc.data();
            const membership = memberships[projData.proj_id];
            return {
                id: doc.id,
                ...projData,
                userRole: membership?.role || "Member",
                userConsent: membership?.consentToDelete || false
            };
        });
    } catch (error) {
        console.error("Error fetching user projects:", error);
        return [];
    }
};

/**
 * Creates a new project and an associated entry in the projectTeam collection.
 */
export const createProjectWithTeam = async (formData, userUid, creatorRole = "Project Leader") => {
    try {
        const proj_id = Date.now().toString();

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

        const team_id = `team_${Date.now()}`;
        await addDoc(collection(db, "projectTeam"), {
            id: team_id,
            prjid: proj_id,
            uid: userUid,
            role: creatorRole
        });

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
                projectName: formData.projectTitle,
                tasks: []
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
                    role: memberData.role,
                    consentToDelete: memberData.consentToDelete || false
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
 * Fetches all tasks across all phases of a project assigned to a specific user.
 */
export const getTasksByProjectAndUser = async (projId, userName) => {
    try {
        const phases = await getProjectPhases(projId);
        const phaseIds = phases.map(p => p.id);

        if (phaseIds.length === 0) return [];

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

/**
 * Adds a new news item to the project.
 */
export const addNews = async (newsData) => {
    try {
        await addDoc(collection(db, "news"), {
            ...newsData,
            createdAt: new Date()
        });
    } catch (error) {
        console.error("Error adding news:", error);
        throw error;
    }
};

/**
 * Fetches the latest news for a specific project.
 */
export const getLatestNews = async (projId) => {
    try {
        const q = query(
            collection(db, "news"),
            where("prjid", "==", projId),
            orderBy("createdAt", "desc"),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
        }
    } catch (error) {
        console.error("Error fetching latest news:", error);
    }
    return null;
};

/**
 * Deletes a project and all its associated data.
 */
export const deleteProject = async (projId) => {
    try {
        const projQuery = query(collection(db, "projects"), where("proj_id", "==", projId));
        const projSnap = await getDocs(projQuery);
        const projectDeletePromises = projSnap.docs.map(d => deleteDoc(d.ref));

        const teamQuery = query(collection(db, "projectTeam"), where("prjid", "==", projId));
        const teamSnap = await getDocs(teamQuery);
        const teamDeletePromises = teamSnap.docs.map(d => deleteDoc(d.ref));

        const phaseQuery = query(collection(db, "project-phases"), where("proj_id", "==", projId));
        const phaseSnap = await getDocs(phaseQuery);
        const phaseDeletePromises = phaseSnap.docs.map(d => deleteDoc(d.ref));

        const phaseIds = phaseSnap.docs.map(d => d.id);
        let taskDeletePromises = [];
        if (phaseIds.length > 0) {
            const taskQuery = query(collection(db, "Tasks"), where("phaseId", "in", phaseIds));
            const taskSnap = await getDocs(taskQuery);
            taskDeletePromises = taskSnap.docs.map(d => deleteDoc(d.ref));
        }

        const newsQuery = query(collection(db, "news"), where("prjid", "==", projId));
        const newsSnap = await getDocs(newsQuery);
        const newsDeletePromises = newsSnap.docs.map(d => deleteDoc(d.ref));

        const inviteQuery = query(collection(db, "invitations"), where("prjid", "==", projId));
        const inviteSnap = await getDocs(inviteQuery);
        const inviteDeletePromises = inviteSnap.docs.map(d => deleteDoc(d.ref));

        await Promise.all([
            ...projectDeletePromises,
            ...teamDeletePromises,
            ...phaseDeletePromises,
            ...taskDeletePromises,
            ...newsDeletePromises,
            ...inviteDeletePromises
        ]);
    } catch (error) {
        console.error("Error deleting project:", error);
        throw error;
    }
};

/**
 * Checks if a user already has a pending invitation for a project.
 */
export const getExistingInvitationsByProject = async (projId, userUid) => {
    try {
        const q = query(
            collection(db, "invitations"),
            where("prjid", "==", projId),
            where("recipientUid", "==", userUid),
            where("status", "==", "pending")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error checking existing invitations:", error);
        return [];
    }
};

/**
 * Initiates a deletion request for a project.
 */
export const requestProjectDeletion = async (projId) => {
    try {
        const q = query(collection(db, "projects"), where("proj_id", "==", projId));
        const snap = await getDocs(q);
        if (!snap.empty) {
            await updateDoc(snap.docs[0].ref, { deletionStatus: "pending" });
        }
    } catch (error) {
        console.error("Error requesting deletion:", error);
        throw error;
    }
};

/**
 * Cancels a deletion request and clears all member consents.
 */
export const cancelProjectDeletion = async (projId) => {
    try {
        const q = query(collection(db, "projects"), where("proj_id", "==", projId));
        const snap = await getDocs(q);
        if (!snap.empty) {
            await updateDoc(snap.docs[0].ref, { deletionStatus: null });
        }

        const teamQ = query(collection(db, "projectTeam"), where("prjid", "==", projId));
        const teamSnap = await getDocs(teamQ);
        const resetPromises = teamSnap.docs.map(d => updateDoc(d.ref, { consentToDelete: false }));
        await Promise.all(resetPromises);
    } catch (error) {
        console.error("Error cancelling deletion:", error);
        throw error;
    }
};

/**
 * Updates a member's consent status for project deletion.
 */
export const updateMemberConsent = async (projId, uid, consent) => {
    try {
        const q = query(
            collection(db, "projectTeam"),
            where("prjid", "==", projId),
            where("uid", "==", uid)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
            await updateDoc(snap.docs[0].ref, { consentToDelete: consent });
        }
    } catch (error) {
        console.error("Error updating consent:", error);
        throw error;
    }
};


// ============================================================
// NEW FUNCTIONS — MENTOR REVIEW & NOTIFICATIONS
// ============================================================

/**
 * Sends a task to the mentor for review.
 * Creates a document in the "reviews" collection.
 */
export const sendTaskForReview = async (task, projectId) => {
    try {
        const reviewData = {
            taskId: task.id,
            taskName: task.name,
            description: task.description || '',
            status: task.status || '',
            priority: task.priority || '',
            assignTo: task.assignTo || '',
            assignBy: task.assignBy || '',
            media: task.media || { photos: [], videos: [] },
            projectId: projectId,
            reviewStatus: 'pending',
            mentorComment: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, 'reviews'), reviewData);
        return docRef.id;
    } catch (error) {
        console.error("Error sending task for review:", error);
        throw error;
    }
};

/**
 * Fetches all reviews for a specific project.
 */
export const getReviewsByProject = async (projectId) => {
    try {
        const q = query(collection(db, 'reviews'), where('projectId', '==', projectId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("Error fetching reviews:", error);
        return [];
    }
};

/**
 * Updates review status after mentor action.
 * @param {string} reviewId
 * @param {string} reviewStatus - 'reviewed' | 'changes_requested'
 * @param {string} mentorComment
 */
export const updateReviewStatus = async (reviewId, reviewStatus, mentorComment = '') => {
    try {
        const reviewRef = doc(db, 'reviews', reviewId);
        await updateDoc(reviewRef, {
            reviewStatus,
            mentorComment,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error updating review status:", error);
        throw error;
    }
};

/**
 * Sends a notification to a user.
 */
export const sendNotification = async ({ recipientUid, senderName, senderPhoto, message, type, projectId, taskId }) => {
    try {
        await addDoc(collection(db, 'notifications'), {
            recipientUid,
            senderName: senderName || 'Mentor',
            senderPhoto: senderPhoto || '',
            message,
            type,
            projectId,
            taskId,
            isRead: false,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error sending notification:", error);
        throw error;
    }
};