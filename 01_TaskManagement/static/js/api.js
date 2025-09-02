// GitHub API Integration
class GitHubAPI {
    constructor() {
        this.owner = CONFIG.GITHUB_OWNER;
        this.repo = CONFIG.GITHUB_REPO;
        this.taskBranch = CONFIG.TASK_BRANCH;
        this.baseUrl = 'https://api.github.com';
    }

    async getFile(filename) {
        const token = githubAuth.getAccessToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${filename}?ref=${this.taskBranch}`,
                {
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            if (response.status === 404) {
                // File doesn't exist, return empty array for JSON files
                return filename.endsWith('.json') ? '[]' : '';
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Decode base64 content
            const content = atob(data.content);
            return content;

        } catch (error) {
            console.error(`Error getting file ${filename}:`, error);
            throw error;
        }
    }

    async updateFile(filename, content, message) {
        const token = githubAuth.getAccessToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        try {
            // First, try to get the current file to get its SHA
            let sha = null;
            try {
                const response = await fetch(
                    `${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${filename}?ref=${this.taskBranch}`,
                    {
                        headers: {
                            'Authorization': `token ${token}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    }
                );
                
                if (response.ok) {
                    const data = await response.json();
                    sha = data.sha;
                }
            } catch (error) {
                // File might not exist, that's okay
                console.log(`File ${filename} might not exist yet`);
            }

            // Create or update the file
            const requestBody = {
                message: message || `Update ${filename}`,
                content: btoa(content), // Base64 encode
                branch: this.taskBranch
            };

            if (sha) {
                requestBody.sha = sha;
            }

            const response = await fetch(
                `${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${filename}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP ${response.status}: ${errorData.message}`);
            }

            return await response.json();

        } catch (error) {
            console.error(`Error updating file ${filename}:`, error);
            throw error;
        }
    }

    async createTaskAssignment(taskId, assigneeUsername, assigneeDisplayName) {
        try {
            // Load current assignments
            const assignmentsContent = await this.getFile('task_assignments.json');
            const assignments = JSON.parse(assignmentsContent);

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
                assigneeUsername: assigneeUsername,
                assigneeDisplayName: assigneeDisplayName,
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

            // Update the file
            await this.updateFile(
                'task_assignments.json',
                JSON.stringify(assignments, null, 2),
                `Assign task ${taskId} to ${assigneeUsername}`
            );

            return newAssignment;

        } catch (error) {
            console.error('Error creating task assignment:', error);
            throw error;
        }
    }

    async updateTaskAssignment(assignmentId, updates) {
        try {
            // Load current assignments
            const assignmentsContent = await this.getFile('task_assignments.json');
            const assignments = JSON.parse(assignmentsContent);

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

            // Update the file
            await this.updateFile(
                'task_assignments.json',
                JSON.stringify(assignments, null, 2),
                `Update assignment ${assignmentId}`
            );

            return assignments[assignmentIndex];

        } catch (error) {
            console.error('Error updating task assignment:', error);
            throw error;
        }
    }

    async reassignTask(assignmentId, newAssigneeUsername, newAssigneeDisplayName, reason) {
        try {
            // Load current assignments
            const assignmentsContent = await this.getFile('task_assignments.json');
            const assignments = JSON.parse(assignmentsContent);

            // Find current assignment
            const currentAssignment = assignments.find(a => a.assignmentId === assignmentId);
            
            if (!currentAssignment) {
                throw new Error('Assignment not found');
            }

            // Update current assignment status
            currentAssignment.status = 'reassigned';
            currentAssignment.reassignmentHistory.push({
                fromUser: currentAssignment.assigneeUsername,
                toUser: newAssigneeUsername,
                reassignedDate: new Date().toISOString(),
                reason: reason
            });

            // Create new assignment
            const newAssignment = {
                assignmentId: `a${Date.now()}`,
                taskId: currentAssignment.taskId,
                assigneeUsername: newAssigneeUsername,
                assigneeDisplayName: newAssigneeDisplayName,
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

            // Update the file
            await this.updateFile(
                'task_assignments.json',
                JSON.stringify(assignments, null, 2),
                `Reassign task ${currentAssignment.taskId} from ${currentAssignment.assigneeUsername} to ${newAssigneeUsername}`
            );

            return newAssignment;

        } catch (error) {
            console.error('Error reassigning task:', error);
            throw error;
        }
    }

    async getRepositoryInfo() {
        const token = githubAuth.getAccessToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/repos/${this.owner}/${this.repo}`,
                {
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();

        } catch (error) {
            console.error('Error getting repository info:', error);
            throw error;
        }
    }

    async checkBranchExists(branchName) {
        const token = githubAuth.getAccessToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/repos/${this.owner}/${this.repo}/branches/${branchName}`,
                {
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            return response.ok;

        } catch (error) {
            console.error('Error checking branch:', error);
            return false;
        }
    }

    async createBranch(branchName, fromBranch = 'main') {
        const token = githubAuth.getAccessToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        try {
            // Get the SHA of the source branch
            const refResponse = await fetch(
                `${this.baseUrl}/repos/${this.owner}/${this.repo}/git/refs/heads/${fromBranch}`,
                {
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            if (!refResponse.ok) {
                throw new Error(`Failed to get ${fromBranch} branch info`);
            }

            const refData = await refResponse.json();
            const sha = refData.object.sha;

            // Create the new branch
            const createResponse = await fetch(
                `${this.baseUrl}/repos/${this.owner}/${this.repo}/git/refs`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ref: `refs/heads/${branchName}`,
                        sha: sha
                    })
                }
            );

            if (!createResponse.ok) {
                const errorData = await createResponse.json();
                throw new Error(`Failed to create branch: ${errorData.message}`);
            }

            return await createResponse.json();

        } catch (error) {
            console.error('Error creating branch:', error);
            throw error;
        }
    }

    async initializeTaskBranch() {
        try {
            const branchExists = await this.checkBranchExists(this.taskBranch);
            
            if (!branchExists) {
                console.log(`Creating ${this.taskBranch} branch...`);
                await this.createBranch(this.taskBranch);
                
                // Initialize with empty JSON files if they don't exist
                try {
                    await this.getFile('tasks.json');
                } catch (error) {
                    await this.updateFile('tasks.json', '[]', 'Initialize tasks.json');
                }
                
                try {
                    await this.getFile('task_assignments.json');
                } catch (error) {
                    await this.updateFile('task_assignments.json', '[]', 'Initialize task_assignments.json');
                }
            }
            
            return true;
        } catch (error) {
            console.error('Error initializing task branch:', error);
            throw error;
        }
    }
}

// Create global instance
window.GitHubAPI = new GitHubAPI();