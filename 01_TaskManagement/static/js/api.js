// Data API Integration (localStorage-based with MongoDB Atlas sync)
class DataAPI {
    constructor() {
        // Remove GitHub dependencies - we now use localStorage with periodic MongoDB sync
        this.useLocalStorage = true;
    }

    async updateAssignments(assignments) {
        // Update assignments in localStorage and sync to MongoDB (when server is available)
        try {
            const result = await window.dataLoader.updateCollection('assignments', assignments);
            console.log('Assignments updated successfully');
            return result;
        } catch (error) {
            console.error('Error updating assignments:', error);
            throw error;
        }
    }

    async createTaskAssignment(taskId, memberId, memberData) {
        try {
            // Load current assignments
            const assignments = await window.dataLoader.loadAssignments();

            // Check if task is already assigned
            const existingAssignment = assignments.find(a => 
                a.taskId === taskId && a.status !== 'reassigned' && a.status !== 'completed'
            );

            if (existingAssignment) {
                throw new Error('Task is already assigned');
            }

            // Create new assignment
            const newAssignment = {
                assignmentId: `a${Date.now()}`,
                taskId: taskId,
                memberId: memberId,
                memberDisplayName: memberData.displayName,
                assignedDate: new Date().toISOString(),
                startedDate: null,
                completedDate: null,
                status: 'assigned',
                progress: 0,
                timeSpent: 0,
                notes: '',
                blockers: [],
                reviewRequested: false,
                reviewerUsername: null,
                reassignmentHistory: []
            };

            assignments.push(newAssignment);

            // Update assignments using dataLoader
            await this.updateAssignments(assignments);

            return newAssignment;

        } catch (error) {
            console.error('Error creating task assignment:', error);
            throw error;
        }
    }

    async updateTaskAssignment(assignmentId, updates) {
        try {
            // Load current assignments
            const assignments = await window.dataLoader.loadAssignments();

            // Find and update assignment
            const assignmentIndex = assignments.findIndex(a => a.assignmentId === assignmentId);
            
            if (assignmentIndex === -1) {
                throw new Error('Assignment not found');
            }

            // Update assignment
            assignments[assignmentIndex] = {
                ...assignments[assignmentIndex],
                ...updates
            };

            // Update assignments using dataLoader
            await this.updateAssignments(assignments);

            return assignments[assignmentIndex];

        } catch (error) {
            console.error('Error updating task assignment:', error);
            throw error;
        }
    }

    async reassignTask(assignmentId, newMemberId, newMemberData, reason) {
        try {
            // Load current assignments
            const assignments = await window.dataLoader.loadAssignments();

            // Find current assignment
            const currentAssignment = assignments.find(a => a.assignmentId === assignmentId);
            
            if (!currentAssignment) {
                throw new Error('Assignment not found');
            }

            // Update current assignment status
            currentAssignment.status = 'reassigned';
            currentAssignment.reassignmentHistory.push({
                fromUser: currentAssignment.memberDisplayName,
                toUser: newMemberData.displayName,
                reassignedDate: new Date().toISOString(),
                reason: reason
            });

            // Create new assignment
            const newAssignment = {
                assignmentId: `a${Date.now()}`,
                taskId: currentAssignment.taskId,
                memberId: newMemberId,
                memberDisplayName: newMemberData.displayName,
                assignedDate: new Date().toISOString(),
                startedDate: null,
                completedDate: null,
                status: 'assigned',
                progress: 0,
                timeSpent: 0,
                notes: '',
                blockers: [],
                reviewRequested: false,
                reviewerUsername: null,
                reassignmentHistory: []
            };

            assignments.push(newAssignment);

            // Update assignments using dataLoader
            await this.updateAssignments(assignments);

            return newAssignment;

        } catch (error) {
            console.error('Error reassigning task:', error);
            throw error;
        }
    }
}

// Create global instance (keep compatibility with existing code)
window.GitHubAPI = new DataAPI();
window.DataAPI = new DataAPI();