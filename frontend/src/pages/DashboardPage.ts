import { ApiService, User, Friend, FriendRequest } from '../services/api'

export class DashboardPage {

    static async render(): Promise<string> {
        try {
            const user = await ApiService.getMe();
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');

            return `
                <div class="dashboard">
                    <!-- Header -->
                    <header class="dashboard-header">
                        <div class="header-content">
                            <h1>🏓 ft_transcendence</h1>
                            <div class="user-info">
                                <span class="user-avatar">${this.getAvatarOrInitial(user)}</span>
                                <span class="user-name">${user.display_name || user.username}</span>
                                <button id="logout-btn" class="btn btn-small">Logout</button>
                            </div>
                        </div>
                    </header>

                    <!-- Navigation Tabs -->
                    <div class="dashboard-tabs">
                        <button class="tab-btn active" data-tab="play">🎮 Play</button>
                        <button class="tab-btn" data-tab="friends">👥 Friends</button>
                        <button class="tab-btn" data-tab="profile">👤 Profile</button>
                    </div>

                    <!-- Tab Contents -->
                    <div class="dashboard-content">
                        <!-- Play Tab -->
                        <div id="tab-play" class="tab-content active">
                            ${this.renderPlayTab()}
                        </div>

                        <!-- Friends Tab -->
                        <div id="tab-friends" class="tab-content">
                            <div class="loading">Loading friends...</div>
                        </div>

                        <!-- Profile Tab -->
                        <div id="tab-profile" class="tab-content">
                            ${this.renderProfileTab(user)}
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            // Non authentifié, rediriger vers login
            window.location.href = '/login';
            return '<div>Redirecting...</div>';
        }
    }

    private static renderPlayTab(): string {
        return `
            <div class="play-section">
                <h2>Choose Your Game</h2>
                <div class="game-modes">
                    <a href="/game" data-route class="game-mode-card">
                        <div class="mode-icon">🏓</div>
                        <h3>Quick Match</h3>
                        <p>Play against friend or AI</p>
                    </a>
                    <a href="/tournament" data-route class="game-mode-card">
                        <div class="mode-icon">🏆</div>
                        <h3>Tournament</h3>
                        <p>Compete in a tournament</p>
                    </a>
                    <div class="game-mode-card disabled">
                        <div class="mode-icon">🌐</div>
                        <h3>Online Match</h3>
                        <p>Coming soon!</p>
                    </div>
                </div>
            </div>
        `;
    }

    private static renderProfileTab(user: User): string {
        return `
            <div class="profile-section">
                <div class="profile-card">
                    <div class="profile-avatar-large">
                        ${user.avatar_url ?
                            `<img src="${user.avatar_url}" alt="${user.username}" id="current-avatar">` :
                            `<div class="avatar-initial" id="current-avatar">${user.username.charAt(0).toUpperCase()}</div>`
                        }
                    </div>

                    <div class="avatar-upload-section">
                        <input type="file" id="avatar-input" accept="image/*" style="display: none;">
                        <button class="btn btn-small btn-primary" onclick="document.getElementById('avatar-input').click()">
                            📸 Change Avatar
                        </button>
                        ${user.avatar_url ? `
                            <button class="btn btn-small btn-danger" id="delete-avatar-btn">
                                🗑️ Remove
                            </button>
                        ` : ''}
                    </div>

                    <h2>${user.display_name || user.username}</h2>
                    <p class="profile-username">@${user.username}</p>
                    <p class="profile-email">${user.email}</p>

                    <div class="profile-stats">
                        <div class="stat">
                            <div class="stat-value">${(user as any).total_matches || 0}</div>
                            <div class="stat-label">Matches</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${(user as any).wins || 0}</div>
                            <div class="stat-label">Wins</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${(user as any).ranking_points || 1000}</div>
                            <div class="stat-label">Ranking</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static async renderFriendsTab(): Promise<string> {
        try {
            const [friendsData, pendingData] = await Promise.all([
                ApiService.getFriends(),
                ApiService.getPendingRequests()
            ]);

            return `
                <div class="friends-section">
                    <!-- Search Users -->
                    <div class="search-box">
                        <input
                            type="text"
                            id="search-users"
                            placeholder="🔍 Search users..."
                            autocomplete="off"
                        />
                        <div id="search-results" class="search-results"></div>
                    </div>

                    <!-- Pending Requests -->
                    ${pendingData.received.length > 0 ? `
                        <div class="friends-card">
                            <h3>📬 Friend Requests (${pendingData.received.length})</h3>
                            <div class="friend-requests">
                                ${pendingData.received.map(req => this.renderFriendRequest(req)).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${pendingData.sent.length > 0 ? `
                        <div class="friends-card">
                            <h3>⏳ Pending Requests (${pendingData.sent.length})</h3>
                            <div class="friend-requests">
                                ${pendingData.sent.map(req => this.renderPendingRequest(req)).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Friends List -->
                    <div class="friends-card">
                        <h3>👥 My Friends (${friendsData.total})</h3>
                        ${friendsData.friends.length > 0 ? `
                            <div class="friends-list">
                                ${friendsData.friends.map(friend => this.renderFriend(friend)).join('')}
                            </div>
                        ` : '<p class="empty-state">No friends yet. Search for users to add!</p>'}
                    </div>
                </div>
            `;
        } catch (error) {
            return '<div class="error">Failed to load friends</div>';
        }
    }

    private static renderFriend(friend: Friend): string {
        const status = friend.is_online ? '🟢' : '🔴';
        return `
            <div class="friend-item">
                <div class="friend-info">
                    ${this.getAvatarHTML(friend)}
                    <div class="friend-details">
                        <div class="friend-name">${friend.display_name}</div>
                        <div class="friend-username">@${friend.username} ${status}</div>
                    </div>
                </div>
                <div class="friend-actions">
                    <button class="btn btn-small btn-danger" onclick="window.removeFriend('${friend.friendship_id}')">
                        Remove
                    </button>
                </div>
            </div>
        `;
    }

    private static renderFriendRequest(request: FriendRequest): string {
        return `
            <div class="friend-request-item">
                <div class="friend-info">
                    ${this.getAvatarHTML(request)}
                    <div class="friend-details">
                        <div class="friend-name">${request.display_name}</div>
                        <div class="friend-username">@${request.username}</div>
                    </div>
                </div>
                <div class="friend-actions">
                    <button class="btn btn-small btn-success" onclick="window.acceptFriendRequest('${request.friendship_id}')">
                        Accept
                    </button>
                    <button class="btn btn-small btn-danger" onclick="window.rejectFriendRequest('${request.friendship_id}')">
                        Decline
                    </button>
                </div>
            </div>
        `;
    }

    private static renderPendingRequest(request: FriendRequest): string {
        return `
            <div class="friend-request-item">
                <div class="friend-info">
                    ${this.getAvatarHTML(request)}
                    <div class="friend-details">
                        <div class="friend-name">${request.display_name}</div>
                        <div class="friend-username">@${request.username}</div>
                    </div>
                </div>
                <div class="friend-actions">
                    <span class="pending-label">⏳ Pending</span>
                </div>
            </div>
        `;
    }

    private static getAvatarHTML(user: { avatar_url?: string; username: string }): string {
        if (user.avatar_url) {
            return `<img src="${user.avatar_url}" alt="${user.username}" class="friend-avatar">`;
        }
        return `<div class="friend-avatar avatar-initial">${user.username.charAt(0).toUpperCase()}</div>`;
    }

    private static getAvatarOrInitial(user: User): string {
        if (user.avatar_url) {
            return `<img src="${user.avatar_url}" alt="${user.username}">`;
        }
        return user.username.charAt(0).toUpperCase();
    }

    // Setup event listeners
    static setupEventListeners(): void {
        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const target = e.target as HTMLButtonElement;
                const tabName = target.getAttribute('data-tab');

                // Update active tab
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                target.classList.add('active');

                // Show corresponding content
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                const content = document.getElementById(`tab-${tabName}`);
                if (content) {
                    content.classList.add('active');

                    // Load friends dynamically
                    if (tabName === 'friends') {
                        content.innerHTML = '<div class="loading">Loading friends...</div>';
                        content.innerHTML = await this.renderFriendsTab();
                        this.setupFriendsListeners();
                    }
                }
            });
        });

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await ApiService.logout();
                window.location.href = '/login';
            });
        }

        // Avatar upload
        this.setupAvatarUpload();
    }

    private static setupAvatarUpload(): void {
        const avatarInput = document.getElementById('avatar-input') as HTMLInputElement;
        const deleteAvatarBtn = document.getElementById('delete-avatar-btn');

        if (avatarInput) {
            avatarInput.addEventListener('change', async (e) => {
                const target = e.target as HTMLInputElement;
                const file = target.files?.[0];

                if (!file) return;

                // Vérifier le type de fichier
                if (!file.type.startsWith('image/')) {
                    alert('Please select an image file');
                    return;
                }

                // Vérifier la taille (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    alert('File is too large. Maximum size is 5MB');
                    return;
                }

                try {
                    // Afficher un message de chargement
                    const avatarContainer = document.getElementById('current-avatar');
                    if (avatarContainer) {
                        avatarContainer.innerHTML = '<div class="loading-spinner"></div>';
                    }

                    // Uploader l'avatar
                    const result = await ApiService.uploadAvatar(file);

                    // Rafraîchir la page profile
                    const profileTab = document.getElementById('tab-profile');
                    if (profileTab) {
                        const user = await ApiService.getMe();
                        profileTab.innerHTML = this.renderProfileTab(user);
                        this.setupAvatarUpload();
                    }

                    // Mettre à jour l'avatar dans le header
                    const userAvatar = document.querySelector('.user-avatar');
                    if (userAvatar && result.avatar_url) {
                        userAvatar.innerHTML = `<img src="${result.avatar_url}" alt="Avatar">`;
                    }

                } catch (error: any) {
                    alert(error.message || 'Failed to upload avatar');
                    // Recharger le profil en cas d'erreur
                    window.location.reload();
                }

                // Reset input
                target.value = '';
            });
        }

        if (deleteAvatarBtn) {
            deleteAvatarBtn.addEventListener('click', async () => {
                if (!confirm('Are you sure you want to remove your avatar?')) {
                    return;
                }

                try {
                    await ApiService.deleteAvatar();

                    // Rafraîchir la page profile
                    const profileTab = document.getElementById('tab-profile');
                    if (profileTab) {
                        const user = await ApiService.getMe();
                        profileTab.innerHTML = this.renderProfileTab(user);
                        this.setupAvatarUpload();
                    }

                    // Mettre à jour l'avatar dans le header
                    const user = await ApiService.getMe();
                    const userAvatar = document.querySelector('.user-avatar');
                    if (userAvatar) {
                        userAvatar.innerHTML = user.username.charAt(0).toUpperCase();
                    }

                } catch (error: any) {
                    alert(error.message || 'Failed to delete avatar');
                }
            });
        }
    }

    private static setupFriendsListeners(): void {
        // Search users
        const searchInput = document.getElementById('search-users') as HTMLInputElement;
        const searchResults = document.getElementById('search-results') as HTMLDivElement;

        if (searchInput) {
            let searchTimeout: number;
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                const query = searchInput.value.trim();

                if (query.length < 2) {
                    searchResults.innerHTML = '';
                    searchResults.style.display = 'none';
                    return;
                }

                searchTimeout = window.setTimeout(async () => {
                    try {
                        const results = await ApiService.searchUsers(query);
                        if (results.users.length > 0) {
                            searchResults.innerHTML = results.users.map(user => `
                                <div class="search-result-item">
                                    <div class="friend-info">
                                        ${this.getAvatarHTML(user)}
                                        <div class="friend-details">
                                            <div class="friend-name">${user.display_name || user.username}</div>
                                            <div class="friend-username">@${user.username}</div>
                                        </div>
                                    </div>
                                    <button class="btn btn-small btn-primary" onclick="window.sendFriendRequest('${user.id}')">
                                        Add Friend
                                    </button>
                                </div>
                            `).join('');
                            searchResults.style.display = 'block';
                        } else {
                            searchResults.innerHTML = '<div class="empty-state">No users found</div>';
                            searchResults.style.display = 'block';
                        }
                    } catch (error) {
                        console.error('Search failed:', error);
                    }
                }, 300);
            });
        }

        // Global functions for friend actions
        (window as any).sendFriendRequest = async (userId: string) => {
            try {
                await ApiService.sendFriendRequest(userId);
                alert('Friend request sent!');
                // Refresh friends tab
                const friendsTab = document.getElementById('tab-friends');
                if (friendsTab) {
                    friendsTab.innerHTML = await this.renderFriendsTab();
                    this.setupFriendsListeners();
                }
            } catch (error: any) {
                alert(error.message || 'Failed to send friend request');
            }
        };

        (window as any).acceptFriendRequest = async (friendshipId: string) => {
            try {
                await ApiService.acceptFriendRequest(friendshipId);
                // Refresh friends tab
                const friendsTab = document.getElementById('tab-friends');
                if (friendsTab) {
                    friendsTab.innerHTML = await this.renderFriendsTab();
                    this.setupFriendsListeners();
                }
            } catch (error: any) {
                alert(error.message || 'Failed to accept friend request');
            }
        };

        (window as any).rejectFriendRequest = async (friendshipId: string) => {
            try {
                await ApiService.rejectFriendRequest(friendshipId);
                // Refresh friends tab
                const friendsTab = document.getElementById('tab-friends');
                if (friendsTab) {
                    friendsTab.innerHTML = await this.renderFriendsTab();
                    this.setupFriendsListeners();
                }
            } catch (error: any) {
                alert(error.message || 'Failed to reject friend request');
            }
        };

        (window as any).removeFriend = async (friendshipId: string) => {
            if (confirm('Are you sure you want to remove this friend?')) {
                try {
                    await ApiService.removeFriend(friendshipId);
                    // Refresh friends tab
                    const friendsTab = document.getElementById('tab-friends');
                    if (friendsTab) {
                        friendsTab.innerHTML = await this.renderFriendsTab();
                        this.setupFriendsListeners();
                    }
                } catch (error: any) {
                    alert(error.message || 'Failed to remove friend');
                }
            }
        };
    }
}
