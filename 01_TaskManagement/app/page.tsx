'use client';

import { useState, useEffect } from 'react';
import TaskBoard from './components/TaskBoard';
import { Member, Milestone } from './types';

export default function TaskManagementPage() {
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load milestones and members
      const [milestonesRes, membersRes] = await Promise.all([
        fetch('/api/task/milestones'),
        fetch('/api/task/members')
      ]);

      const milestonesData = await milestonesRes.json();
      const membersData = await membersRes.json();

      setMilestones(milestonesData);
      setMembers(membersData);

      // Load current user from localStorage
      const storedUser = localStorage.getItem('selected_user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setCurrentUser(user);
        } catch (error) {
          console.error('Error parsing stored user:', error);
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const handleUserSelect = (user: Member) => {
    setCurrentUser(user);
    localStorage.setItem('selected_user', JSON.stringify(user));
  };

  return (
    <div className="min-h-screen bg-base">
      {/* Header */}
      <div className="bg-surface border-b border-highlight-med">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-text">Task Management</h1>
              {selectedMilestone && (
                <span className="ml-4 px-3 py-1 text-sm rounded-full bg-primary-500/20 text-primary-500">
                  Milestone {selectedMilestone}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Milestone selector */}
              <div className="flex items-center space-x-2">
                <label className="text-sm text-muted">Milestone:</label>
                <select 
                  value={selectedMilestone || ''} 
                  onChange={(e) => setSelectedMilestone(e.target.value ? parseInt(e.target.value) : null)}
                  className="px-3 py-1 text-sm rounded border border-highlight-med bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Tasks</option>
                  {milestones.map(milestone => (
                    <option key={milestone.id} value={milestone.id}>
                      {milestone.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* User selector */}
              <div className="flex items-center space-x-2">
                <label className="text-sm text-muted">Profile:</label>
                <select 
                  value={currentUser?.id || ''} 
                  onChange={(e) => {
                    const memberId = parseInt(e.target.value);
                    const member = members.find(m => m.id === memberId);
                    if (member) handleUserSelect(member);
                  }}
                  className="px-3 py-1 text-sm rounded border border-highlight-med bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select Profile</option>
                  {members.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.displayName} ({member.role})
                    </option>
                  ))}
                </select>
              </div>

              {currentUser && (
                <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-primary-500/20 text-primary-500">
                  <img 
                    src={currentUser.avatar || `https://github.com/identicons/${currentUser.githubUsername || 'default'}.png`}
                    alt={currentUser.displayName}
                    className="w-6 h-6 rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://github.com/identicons/default.png';
                    }}
                  />
                  <span className="text-sm font-medium">{currentUser.displayName}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TaskBoard milestoneId={selectedMilestone} />
      </div>
    </div>
  );
}