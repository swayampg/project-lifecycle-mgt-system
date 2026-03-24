import { db, storage } from '../firebaseConfig';
import { collection, addDoc, query, where, getDocs, doc, deleteDoc, getDoc, updateDoc, orderBy, limit, serverTimestamp, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable, deleteObject, listAll } from 'firebase/storage';
import { sendEmailNotification } from './emailService';

/**
 * Uploads a file to Firebase Storage.
 * @param {File} file 
 * @param {string} path 
 * @returns {Promise<string>} Download URL
 */
/**
 * Deletes a file from Firebase Storage.
 */
export const deleteFile = async (path) => {
    try {
        const fileRef = ref(storage, path);
        await deleteObject(fileRef);
        console.log(`Deleted file from storage: ${path}`);
    } catch (error) {
        // If file doesn't exist, we don't want to crash
        if (error.code === 'storage/object-not-found') {
            console.warn(`File not found for deletion: ${path}`);
        } else {
            console.error("Error deleting file from storage:", error);
            throw error;
        }
    }
};

export const uploadFile = async (file, path) => {
    console.log(`Starting upload: ${file.name} to ${path}`);
    try {
        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise((resolve, reject) => {
            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log(`Upload progress for ${file.name}: ${progress.toFixed(2)}%`);
                },
                (error) => {
                    console.error("Error during resumable upload:", error);
                    reject(error);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    console.log(`Upload successful: ${file.name} -> ${downloadURL}`);
                    resolve(downloadURL);
                }
            );
        });
    } catch (error) {
        console.error("Error setting up storage upload:", error);
        throw error;
    }
};

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
 * Fetches user data by UID.
 */
export const getUserById = async (uid) => {
    try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { uid: docSnap.id, ...docSnap.data() };
        }
    } catch (error) {
        console.error("Error fetching user by ID:", error);
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
            createdAt: serverTimestamp()
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
            const teamMemberId = `${invitation.recipientUid}_${invitation.prjid}`;
            await setDoc(doc(db, "projectTeam", teamMemberId), {
                id: teamMemberId,
                prjid: invitation.prjid,
                uid: invitation.recipientUid,
                role: invitation.role,
                consentToDelete: false
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
        // Check for duplicate project name
        const q = query(collection(db, "projects"), where("Name", "==", formData.projectTitle));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            throw new Error("A project with this name already exists. Please choose a different name.");
        }

        const projectRef = await addDoc(collection(db, "projects"), {
            proj_id: "", // Will update after creation
            Name: formData.projectTitle,
            projectLeader: formData.projectLeader,
            startDate: formData.startDate,
            endDate: formData.endDate,
            description: formData.description,
            category: formData.category,
            department: formData.department,
            createdAt: serverTimestamp(),
            status: "active",
            deletionStatus: null
        });
        const proj_id = projectRef.id;
        await updateDoc(projectRef, { proj_id: proj_id });

        const teamMemberId = `${userUid}_${proj_id}`;
        await setDoc(doc(db, "projectTeam", teamMemberId), {
            id: teamMemberId,
            prjid: proj_id,
            uid: userUid,
            role: creatorRole,
            consentToDelete: false
        });

        const defaultPhases = [
            'Requirement Analysis',
            'Design',
            'Implementation',
            'Testing',
            'Completions'
        ];

        for (let i = 0; i < defaultPhases.length; i++) {
            await addDoc(collection(db, "project-phases"), {
                phaseName: defaultPhases[i],
                proj_id: proj_id,
                projectName: formData.projectTitle,
                order: i,
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
            createdAt: serverTimestamp()
        });

        // Trigger Email Notification for Task Assignment
        try {
            const trimmedName = taskData.assignTo ? taskData.assignTo.trim() : "";
            console.log(`Triggering email for task assignment to: "${trimmedName}"`);
            
            // Find the user assigned to the task to get their email
            const usersQ = query(collection(db, "users"), where("fullName", "==", trimmedName));
            const userSnap = await getDocs(usersQ);
            
            if (!userSnap.empty) {
                const userData = userSnap.docs[0].data();
                console.log(`Found user email: ${userData.email}`);
                if (userData.email) {
                    await sendEmailNotification({
                        to_email: userData.email,
                        to_name: userData.fullName,
                        message_title: "New Task Assigned",
                        message_body: `You have been assigned a new task: "${taskData.name}". Priority: ${taskData.priority}.`,
                        project_name: taskData.projectName || "Project"
                    });
                } else {
                    console.warn(`User ${taskData.assignTo} has no email address stored.`);
                }
            } else {
                console.warn(`Could not find user with fullName: ${taskData.assignTo}`);
            }
        } catch (emailErr) {
            console.warn("Could not send assignment email notification:", emailErr);
        }

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
 * Deletes a task from the Tasks collection and its associated media from storage.
 */
export const deleteProjectTask = async (taskId) => {
    try {
        // 1. Fetch task to get media URLs
        const taskSnap = await getDoc(doc(db, "Tasks", taskId));
        if (taskSnap.exists()) {
            const taskData = taskSnap.data();
            const mediaFiles = taskData.media?.files || [];
            
            // 2. Delete each file from Storage
            for (const file of mediaFiles) {
                if (file.url) {
                    try {
                        // Extract path from URL or use a stored path if available
                        // Since we store paths in a predictable way: tasks/projectId/filename
                        // It's safer if we had the path stored, but we can attempt to extract it or
                        // just use the fact that we know where it lives if we had the projectId.
                        // For now, if we don't have the path, we might need to parse the URL.
                        const decodedUrl = decodeURIComponent(file.url);
                        const pathStart = decodedUrl.indexOf('/o/') + 3;
                        const pathEnd = decodedUrl.indexOf('?');
                        const storagePath = decodedUrl.substring(pathStart, pathEnd);
                        await deleteFile(storagePath);
                    } catch (err) {
                        console.warn("Could not delete file from storage during task deletion:", err);
                    }
                }
            }
        }
        
        // 3. Delete Firestore document
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
        const q = query(
            collection(db, "project-phases"),
            where("proj_id", "==", projId)
        );
        const querySnapshot = await getDocs(q);
        const phasesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort in memory to handle phases that might not have the 'order' field yet
        return phasesData.sort((a, b) => (a.order || 0) - (b.order || 0));
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
        // Get current phases to determine the next order
        const currentPhases = await getProjectPhases(projId);
        const nextOrder = currentPhases.length;

        const phaseData = {
            phaseName: phaseName,
            proj_id: projId,
            projectName: projectName,
            order: nextOrder,
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
 * Updates the order of multiple phases.
 * @param {Array} updatedPhases - List of phase objects with id and new order
 */
export const updatePhasesOrder = async (updatedPhases) => {
    try {
        const promises = updatedPhases.map(phase => {
            const docRef = doc(db, "project-phases", phase.id);
            return updateDoc(docRef, { order: phase.order });
        });
        await Promise.all(promises);
    } catch (error) {
        console.error("Error updating phases order:", error);
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
        return [];
    }
};

/**
 * Fetches all tasks across all projects assigned to a specific user.
 */
export const getAllTasksByUser = async (userName) => {
    try {
        const q = query(
            collection(db, "Tasks"),
            where("assignTo", "==", userName)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching all user tasks:", error);
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
            createdAt: serverTimestamp()
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
 * Fetches all news for a specific project.
 */
export const getAllNews = async (projId) => {
    try {
        const q = query(
            collection(db, "news"),
            where("prjid", "==", projId),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching all news:", error);
    }
    return [];
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

        // Delete Storage Folder
        try {
            const projectReportsRef = ref(storage, `project_reports/${projId}`);
            const taskMediaRef = ref(storage, `tasks/${projId}`);
            
            const cleanupFolder = async (folderRef) => {
                const list = await listAll(folderRef);
                const deleteFiles = list.items.map(item => deleteObject(item));
                const subFolders = list.prefixes.map(folder => cleanupFolder(folder));
                await Promise.all([...deleteFiles, ...subFolders]);
            };

            await Promise.all([
                cleanupFolder(projectReportsRef).catch(e => console.warn("No project_reports folder to clean")),
                cleanupFolder(taskMediaRef).catch(e => console.warn("No tasks folder to clean"))
            ]);
        } catch (storageErr) {
            console.warn("Error cleaning up storage for project:", storageErr);
        }

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

            // Trigger Email Notification for Consent
            try {
                // Get project data to find project leader's email
                const proj = await getProjectById(projId);
                const teamQ = query(collection(db, "projectTeam"), where("prjid", "==", projId), where("role", "==", "Project Leader"));
                const teamSnap = await getDocs(teamQ);

                const member = await getUserById(uid);

                if (proj && !teamSnap.empty && member) {
                    for (const leaderDoc of teamSnap.docs) {
                        const leaderData = await getUserById(leaderDoc.data().uid);
                        if (leaderData && leaderData.email) {
                            await sendEmailNotification({
                                to_email: leaderData.email,
                                to_name: leaderData.fullName,
                                message_title: "Project Deletion Consent Updated",
                                message_body: `Team member ${member.fullName} has ${consent ? 'granted' : 'withdrawn'} their consent for deleting the project "${proj.Name}".`,
                                project_name: proj.Name
                            });
                        }
                    }
                }
            } catch (emailErr) {
                console.warn("Could not send consent email notification:", emailErr);
            }
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

        // Trigger Email Notification for Review
        try {
            const reviewSnap = await getDoc(reviewRef);
            if (reviewSnap.exists()) {
                const reviewData = reviewSnap.data();
                // Find the user who was assigned the task (or who submitted it)
                const usersQ = query(collection(db, "users"), where("fullName", "==", reviewData.assignTo));
                const userSnap = await getDocs(usersQ);

                if (!userSnap.empty) {
                    const userData = userSnap.docs[0].data();
                    if (userData.email) {
                        await sendEmailNotification({
                            to_email: userData.email,
                            to_name: userData.fullName,
                            message_title: `Task Review: ${reviewStatus === 'reviewed' ? 'Validated' : 'Changes Requested'}`,
                            message_body: `Your task "${reviewData.taskName}" has been reviewed by the mentor.\n\nStatus: ${reviewStatus}\nComment: ${mentorComment}`,
                            project_name: reviewData.projectName || "Project"
                        });
                    }
                }
            }
        } catch (emailErr) {
            console.warn("Could not send review email notification:", emailErr);
        }
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

/**
 * Submits user feedback to the "feedback" collection.
 * @param {Object} feedbackData 
 */
export const submitFeedback = async (feedbackData) => {
    try {
        await addDoc(collection(db, "feedback"), {
            ...feedbackData,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error submitting feedback:", error);
        throw error;
    }
};

/**
 * Fetches all feedback entries from the "feedback" collection.
 * @returns {Promise<Array>}
 */
export const getAllFeedback = async () => {
    try {
        const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching feedback:", error);
        return [];
    }
};

/**
 * Updates a project details.
 */
export const updateProject = async (projId, updates) => {
    try {
        const q = query(collection(db, "projects"), where("proj_id", "==", projId));
        const snap = await getDocs(q);
        if (!snap.empty) {
            const projectDoc = snap.docs[0];
            await updateDoc(projectDoc.ref, updates);

            // If the name was updated, update it in phases too
            if (updates.Name) {
                await updateProjectNameInPhases(projId, updates.Name);
            }
        }
    } catch (error) {
        console.error("Error updating project:", error);
        throw error;
    }
};

/**
 * Counts total tasks assigned to a specific user across all projects.
 */
export const getTotalTasksCountByAssignee = async (userName) => {
    try {
        if (!userName) return 0;
        const q = query(collection(db, "Tasks"), where("assignTo", "==", userName));
        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (error) {
        console.error("Error fetching total tasks count:", error);
        return 0;
    }
};


/**
 * Fetches all projects from the "projects" collection that have status "Completed".
 * @returns {Promise<Array>}
 */
export const getAllCompletedProjects = async () => {
    try {
        const q = query(collection(db, "projects"), where("status", "==", "Completed"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching all completed projects:", error);
        return [];
    }
};

/**
 * Updates a project status.
 */
export const updateProjectStatus = async (projId, status, completedDate = null) => {
    try {
        const q = query(collection(db, "projects"), where("proj_id", "==", projId));
        const snap = await getDocs(q);
        if (!snap.empty) {
            const updates = { status };
            if (completedDate) {
                updates.completedDate = completedDate;
            }
            await updateDoc(snap.docs[0].ref, updates);
        }
    } catch (error) {
        console.error("Error updating project status:", error);
        throw error;
    }
};
/**
 * Checks if a specific role is already filled or has a pending invitation in a project.
 * @param {string} projId 
 * @param {string} role 
 * @returns {Promise<boolean>}
 */
export const checkMemberRoleExists = async (projId, role) => {
    try {
        // 1. Check projectTeam collection
        const teamQ = query(
            collection(db, "projectTeam"),
            where("prjid", "==", projId),
            where("role", "==", role)
        );
        const teamSnapshot = await getDocs(teamQ);
        if (!teamSnapshot.empty) return true;

        // 2. Check invitations collection (pending status)
        const inviteQ = query(
            collection(db, "invitations"),
            where("prjid", "==", projId),
            where("role", "==", role),
            where("status", "==", "pending")
        );
        const inviteSnapshot = await getDocs(inviteQ);
        if (!inviteSnapshot.empty) return true;

        return false;
    } catch (error) {
        console.error("Error checking role exists:", error);
        return false;
    }
};

/**
 * Logs a specific project action representing history or activity.
 * @param {string} projId 
 * @param {string} userName 
 * @param {string} actionType - E.g. "Task Created", "Phase Added", "Member Added"
 * @param {string} details - A readable description of what happened
 */
export const logProjectAction = async (projId, userName, actionType, details) => {
    try {
        await addDoc(collection(db, "project_logs"), {
            projId,
            userName: userName || 'System',
            actionType,
            details,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error logging project action:", error);
    }
};

/**
 * Fetches the project logs/activity history.
 * @param {string} projId 
 * @returns {Promise<Array>}
 */
export const getProjectLogs = async (projId) => {
    try {
        const q = query(
            collection(db, "project_logs"),
            where("projId", "==", projId),
            orderBy("timestamp", "desc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching project logs:", error);
        return [];
    }
};
