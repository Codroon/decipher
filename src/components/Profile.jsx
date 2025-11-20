import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import './Profile.css'

function Profile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(user?.name || '')

  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <p style={{ color: '#FFFFFF', textAlign: 'center' }}>Loading user data...</p>
        </div>
      </div>
    )
  }

  const handleSave = () => {
    // TODO: Implement profile update API call
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedName(user?.name || '')
    setIsEditing(false)
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <button className="back-button" onClick={() => navigate('/home')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Home
        </button>
        <h1>My Profile</h1>
      </div>

      <div className="profile-content">
        {/* Profile Avatar Section */}
        <div className="profile-avatar-section">
          <div className="profile-avatar-large">
            <img src={user?.avatar || "/author-avatar-7942f7.png"} alt="Profile" />
          </div>
          <button className="change-avatar-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
            Change Photo
          </button>
        </div>

        {/* Profile Information */}
        <div className="profile-info-section">
          <div className="profile-info-header">
            <h2>Personal Information</h2>
            {!isEditing && (
              <button className="edit-btn" onClick={() => setIsEditing(true)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit Profile
              </button>
            )}
          </div>

          <div className="profile-fields">
            {/* Name Field */}
            <div className="profile-field">
              <label>Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="profile-input"
                />
              ) : (
                <div className="profile-value">{user?.name || 'Not set'}</div>
              )}
            </div>

            {/* Email Field */}
            <div className="profile-field">
              <label>Email Address</label>
              <div className="profile-value">
                {user?.email || 'Not set'}
                {user?.isEmailVerified && (
                  <span className="verified-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Verified
                  </span>
                )}
              </div>
            </div>

            {/* Account Created */}
            <div className="profile-field">
              <label>Member Since</label>
              <div className="profile-value">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'N/A'}
              </div>
            </div>

            {/* Account Status */}
            <div className="profile-field">
              <label>Account Status</label>
              <div className="profile-value">
                <span className={`status-badge ${user?.isActive ? 'active' : 'inactive'}`}>
                  {user?.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="profile-actions">
              <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
              <button className="save-btn" onClick={handleSave}>Save Changes</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile

