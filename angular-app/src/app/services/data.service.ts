import { Injectable, signal, computed, WritableSignal, effect, Injector, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, finalize } from 'rxjs';
import { User, Post, Notification, Comment, AuthenticationRequest, AuthenticationResponse, RegisterRequest, CreatePostRequest } from '../models/data.models';

@Injectable({
    providedIn: 'root'
})
export class DataService {
    public injector = inject(Injector);
    private BASE_URL = 'http://localhost:8080';
    private API_URL = `${this.BASE_URL}/api/v1`;

    // Signals state
    private _currentUser = signal<User | null>(null);
    private _posts = signal<Post[]>([]);
    private _users = signal<User[]>([]);
    private _notifications = signal<Notification[]>([]);
    private _dashboardStats = signal<any>(null);
    private _reports = signal<any[]>([]);
    private _authChecked = signal<boolean>(false);

    // Public Signals
    readonly currentUser = this._currentUser.asReadonly();
    readonly authChecked = this._authChecked.asReadonly();
    readonly posts = this._posts.asReadonly();
    readonly allUsers = this._users.asReadonly();
    readonly notifications = this._notifications.asReadonly();
    readonly dashboardStats = this._dashboardStats.asReadonly();
    readonly reports = this._reports.asReadonly();

    // Compatibility observables
    readonly currentUser$ = new Observable<User | null>(observer => {
        const sub = effect(() => {
            observer.next(this._currentUser());
        }, { injector: this.injector });
        return () => { };
    });

    // Computed Signals
    readonly isAdmin = computed(() => this._currentUser()?.role === 'ADMIN');
    readonly isLoggedIn = computed(() => this._currentUser() !== null);
    readonly unreadNotificationsCount = computed(() =>
        this._notifications().filter(n => !n.isRead).length
    );

    constructor(private http: HttpClient) {
        this.initializeAuth();
        if (this.isLoggedIn()) {
            this.refreshAllData();
            this.startPolling();
        }
    }

    private pollingInterval: any;

    private startPolling() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);
        this.pollingInterval = setInterval(() => {
            if (this.isLoggedIn()) {
                this.loadNotifications();
            }
        }, 30000); // Poll every 30 seconds
    }

    private initializeAuth() {
        const token = localStorage.getItem('auth_token');
        if (token) {
            this.getProfile().subscribe({
                next: () => {
                    this._authChecked.set(true);
                    this.refreshAllData();
                },
                error: (err) => {
                    if (err.status === 401 || err.status === 403) {
                        this.handleTokenExpiration();
                    }
                    this._authChecked.set(true);
                }
            });
        } else {
            this._authChecked.set(true);
        }
    }

    private handleTokenExpiration() {
        localStorage.removeItem('auth_token');
        this._currentUser.set(null);
    }

    refreshAllData() {
        this.loadPosts();
        this.loadNotifications();
        if (this.isAdmin()) {
            this.loadUsers();
            this.loadDashboardStats();
            this.loadReports();
        }
    }

    logout() {
        localStorage.removeItem('auth_token');
        this._currentUser.set(null);
        window.location.href = '/login';
    }

    // --- Auth Methods ---

    login(request: AuthenticationRequest): Observable<AuthenticationResponse> {
        return this.http.post<AuthenticationResponse>(`${this.API_URL}/auth/authenticate`, request)
            .pipe(
                tap(response => {
                    localStorage.setItem('auth_token', response.token);
                    this.getProfile().subscribe(() => this.refreshAllData());
                })
            );
    }

    register(request: RegisterRequest): Observable<AuthenticationResponse> {
        return this.http.post<AuthenticationResponse>(`${this.API_URL}/auth/register`, request)
            .pipe(
                tap(response => {
                    localStorage.setItem('auth_token', response.token);
                    this.getProfile().subscribe(() => this.refreshAllData());
                })
            );
    }

    // Admin method to create user without logging in as them
    provisionUser(request: RegisterRequest): Observable<AuthenticationResponse> {
        return this.http.post<AuthenticationResponse>(`${this.API_URL}/auth/register`, request);
    }

    getProfile(): Observable<User> {
        return this.http.get<any>(`${this.API_URL}/users/me`)
            .pipe(
                map(dto => this.mapDTOToUser(dto)),
                tap(user => this._currentUser.set(user))
            );
    }

    getUserById(userId: number): Observable<User> {
        return this.http.get<any>(`${this.API_URL}/users/${userId}`)
            .pipe(map(dto => this.mapDTOToUser(dto)));
    }

    getUsers(): Observable<User[]> {
        return this.http.get<User[]>(`${this.API_URL}/users`).pipe(
            map(users => users.map(u => this.mapDTOToUser(u)))
        );
    }

    // --- Data Loading Methods (Update Signals) ---

    loadPosts(page: number = 0, size: number = 10, append: boolean = false) {
        this.http.get<Post[]>(`${this.API_URL}/posts`, { params: { page: page.toString(), size: size.toString() } }).subscribe({
            next: (posts) => {
                if (append) {
                    this._posts.update(current => [...current, ...posts]);
                } else {
                    this._posts.set(posts);
                }
            },
            error: (err) => console.error('Failed to load posts:', err)
        });
    }

    loadUsers() {
        this.http.get<User[]>(`${this.API_URL}/users`).subscribe({
            next: (users) => this._users.set(users.map(u => this.mapDTOToUser(u))),
            error: (err) => console.error('Failed to load users:', err)
        });
    }

    loadNotifications(page: number = 0, size: number = 20) {
        this.http.get<Notification[]>(`${this.API_URL}/notifications`, { params: { page: page.toString(), size: size.toString() } }).subscribe({
            next: (notifs) => this._notifications.set(notifs),
            error: (err) => console.error('Failed to load notifications:', err)
        });
    }

    loadDashboardStats() {
        this.http.get<any>(`${this.API_URL}/dashboard/stats`).subscribe({
            next: (stats) => this._dashboardStats.set(stats),
            error: (err) => console.error('Failed to load dashboard stats:', err)
        });
    }

    loadReports() {
        this.http.get<any[]>(`${this.API_URL}/reports`).subscribe({
            next: (reports) => this._reports.set(reports),
            error: (err) => console.error('Failed to load reports:', err)
        });
    }

    uploadFiles(files: File[]): Observable<string[]> {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        return this.http.post<string[]>(`${this.API_URL}/posts/upload`, formData);
    }

    // --- Action Methods (Mutation + Refresh) ---

    addPost(post: CreatePostRequest): Observable<Post> {
        return this.http.post<Post>(`${this.API_URL}/posts`, post).pipe(
            tap(() => this.loadPosts())
        );
    }

    updatePost(id: number, post: CreatePostRequest): Observable<Post> {
        return this.http.put<Post>(`${this.API_URL}/posts/${id}`, post).pipe(
            tap(() => this.loadPosts())
        );
    }

    deletePost(id: number): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/posts/${id}`).pipe(
            tap(() => this.loadPosts())
        );
    }

    toggleLike(postId: number): Observable<Post> {
        return this.http.post<Post>(`${this.API_URL}/posts/${postId}/like`, {}).pipe(
            tap(() => this.loadPosts())
        );
    }

    addComment(postId: number, content: string): Observable<Comment> {
        return this.http.post<Comment>(`${this.API_URL}/posts/${postId}/comment`, { content }).pipe(
            tap(() => this.loadPosts())
        );
    }

    getCommentsForPost(postId: number): Observable<Comment[]> {
        return this.http.get<Comment[]>(`${this.API_URL}/posts/${postId}/comments`);
    }

    toggleCommentLike(commentId: number): Observable<Comment> {
        return this.http.post<Comment>(`${this.API_URL}/posts/comment/${commentId}/like`, {});
    }

    // --- Admin Action Methods ---

    deleteUserAction(id: number): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/users/${id}`).pipe(
            tap(() => {
                this.loadUsers();
                this.loadDashboardStats();
            })
        );
    }

    toggleBan(userId: number): Observable<any> {
        return this.http.put(`${this.API_URL}/users/${userId}/ban`, {}).pipe(
            tap(() => {
                this.loadUsers();
                this.loadDashboardStats();
            })
        );
    }

    adminUpdateUser(userId: number, user: Partial<User>): Observable<User> {
        return this.http.put<any>(`${this.API_URL}/users/${userId}`, user).pipe(
            tap((userDTO: any) => {
                this.loadUsers();
                this.loadDashboardStats();
            })
        );
    }

    updateReportStatus(reportId: number, status: string): Observable<any> {
        return this.http.put<any>(`${this.API_URL}/reports/${reportId}/status`, {}, { params: { status } }).pipe(
            tap(() => {
                this.loadReports();
                this.loadDashboardStats();
            })
        );
    }

    reportContent(reason: string, reportedUserId?: number, reportedPostId?: number): Observable<any> {
        return this.http.post<any>(`${this.API_URL}/reports`, { reason, reportedUserId, reportedPostId }).pipe(
            tap(() => {
                if (this.isAdmin()) {
                    this.loadReports();
                    this.loadDashboardStats();
                }
            })
        );
    }

    // --- Shared Methods ---

    markAsRead(id: number): Observable<void> {
        return this.http.put<void>(`${this.API_URL}/notifications/${id}/read`, {}).pipe(
            tap(() => this.loadNotifications())
        );
    }

    markAllAsRead(): Observable<void> {
        return this.http.put<void>(`${this.API_URL}/notifications/read-all`, {}).pipe(
            tap(() => this.loadNotifications())
        );
    }

    updateProfile(user: Partial<User>): Observable<User> {
        return this.http.put<any>(`${this.API_URL}/users/me`, user).pipe(
            tap((userDTO: any) => {
                const refreshed = this.mapDTOToUser(userDTO);
                this._currentUser.set(refreshed);
                this.loadPosts(); // Refresh posts in case name/avatar changed
            })
        );
    }

    toggleSubscribe(): Observable<User> {
        return this.http.put<any>(`${this.API_URL}/users/me/subscribe`, {}).pipe(
            tap((userDTO: any) => {
                const refreshed = this.mapDTOToUser(userDTO);
                this._currentUser.set(refreshed);
            })
        );
    }

    followUser(userId: number): Observable<void> {
        return this.http.post<void>(`${this.API_URL}/users/${userId}/follow`, {}).pipe(
            tap(() => this.getProfile().subscribe())
        );
    }

    search(query: string, filter: string = 'all', limit: number = 10): Observable<any> {
        const params = { q: query, filter, limit: limit.toString() };
        return this.http.get<any>(`${this.API_URL}/search`, { params });
    }

    // --- Getters (for non-signal based data or specific fetches) ---

    getUserPosts(userId: number): Observable<Post[]> {
        return this.http.get<Post[]>(`${this.API_URL}/posts/user/${userId}`);
    }

    getPost(id: number): Observable<Post> {
        return this.http.get<Post>(`${this.API_URL}/posts/${id}`);
    }

    private mapDTOToUser(dto: any): User {
        return {
            id: dto.id,
            name: dto.name || `${dto.firstname} ${dto.lastname}`,
            handle: dto.handle || '@' + (dto.username || dto.email?.split('@')[0] || 'user'),
            avatar: dto.avatar || `https://ui-avatars.com/api/?name=${dto.firstname}+${dto.lastname}`,
            role: dto.role || 'USER',
            isAdmin: dto.role === 'ADMIN',
            isOnline: true,
            email: dto.email,
            firstname: dto.firstname,
            lastname: dto.lastname,
            bio: dto.bio,
            cover: dto.cover,
            createdAt: dto.createdAt,
            subscribed: dto.subscribed,
            isSubscribed: dto.subscribed,
            isFollowing: dto.isFollowing,
            followersCount: dto.followersCount,
            followingCount: dto.followingCount,
            banned: dto.banned,
            stats: {
                posts: 0,
                followers: dto.followersCount || 0,
                following: dto.followingCount || 0
            }
        };
    }

    // Helper for manual getCurrentUser if needed (though using signal is better)
    getCurrentUser() {
        return this._currentUser();
    }

    getBaseUrl() {
        return this.BASE_URL;
    }
}
