import { Injectable, signal, computed, isDevMode } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, map, switchMap, retry, timer, throwError, finalize, catchError } from 'rxjs';
import { Router } from '@angular/router';
import { User, Post, Notification, Comment, AuthenticationRequest, AuthenticationResponse, RegisterRequest, CreatePostRequest } from '../../shared/models/data.models';
import { MaterialAlertService } from './material-alert.service';
import { DashboardStats, ModerationReport, ReportStatus } from '../../shared/models/moderation.models';
import { APP_CONSTANTS } from '../../shared/constants/app.constants';

type UserDTO = Partial<User> & {
    id: number;
    username?: string;
    postCount?: number;
};

const BANNED_POPUP_LOCK_KEY = '__bannedModalActive';

@Injectable({
    providedIn: 'root'
})
export class DataService {
    private readonly TITLE_MIN = 3;
    private readonly TITLE_MAX = 150;
    private readonly POST_CONTENT_MIN = 3;
    private readonly POST_CONTENT_MAX = 10000;
    private readonly COMMENT_CONTENT_MIN = 1;
    private readonly COMMENT_CONTENT_MAX = 1000;

    private readonly BASE_URL = APP_CONSTANTS.API.BASE_URL.replace(/\/+$/, '');
    private readonly API_URL = `${this.BASE_URL}/api`;

    // Signals state
    private _currentUser = signal<User | null>(null);
    private _posts = signal<Post[]>([]);
    private _managementPosts = signal<Post[]>([]); // Dedicated signal for dashboard/admin
    private _users = signal<User[]>([]);
    private _notifications = signal<Notification[]>([]);
    private _dashboardStats = signal<DashboardStats | null>(null);
    private _reports = signal<ModerationReport[]>([]);
    private _authChecked = signal<boolean>(false);

    // Public Signals
    readonly currentUser = this._currentUser.asReadonly();
    readonly authChecked = this._authChecked.asReadonly();
    readonly posts = this._posts.asReadonly();
    readonly managementPosts = this._managementPosts.asReadonly();
    readonly allUsers = this._users.asReadonly();
    readonly notifications = this._notifications.asReadonly();
    readonly dashboardStats = this._dashboardStats.asReadonly();
    readonly reports = this._reports.asReadonly();

    // Computed Signals
    readonly isAdmin = computed(() => this._currentUser()?.role === 'ADMIN');
    readonly isLoggedIn = computed(() => this._currentUser() !== null);
    readonly unreadNotificationsCount = computed(() =>
        this._notifications().filter(n => !n.isRead).length
    );

    constructor(
        private http: HttpClient,
        private alert: MaterialAlertService,
        private router: Router
    ) {
        this.primeCsrfToken();
        this.initializeAuth();
    }

    private pollingInterval: ReturnType<typeof setInterval> | null = null;
    private recoveryTimer: ReturnType<typeof setTimeout> | null = null;
    private lastRefreshAt = 0;
    private isLoggingOut = false;
    private bannedFlowInProgress = false;
    private notificationsPauseUntil = 0;
    private readonly notificationsBackoffMs = 60000;

    private shouldRetryRequest(err: HttpErrorResponse): boolean {
        const status = err?.status;
        // Do not retry auth/client/rate-limit failures.
        return !(status === 400 || status === 401 || status === 403 || status === 404 || status === 429);
    }

    private primeCsrfToken() {
        this.http.get(`${this.API_URL}/auth/csrf`, { responseType: 'text' }).subscribe({
            next: () => {
                // CSRF cookie is issued by backend.
            },
            error: () => {
                // Non-blocking; auth endpoints remain available even if prefetch fails.
            }
        });
    }

    private startPolling() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);
        this.pollingInterval = setInterval(() => {
            if (this.isLoggedIn() && Date.now() >= this.notificationsPauseUntil) {
                this.loadNotifications();
            }
        }, 30000); // Poll every 30 seconds
    }

    private initializeAuth() {
        this.getProfile().pipe(
            retry({
                count: 2,
                delay: (err: HttpErrorResponse, retryCount) => {
                    if (!this.shouldRetryRequest(err)) {
                        throw err;
                    }
                    return timer(300 * retryCount);
                }
            })
        ).subscribe({
            next: () => {
                this._authChecked.set(true);
                this.refreshAllData();
                this.startPolling();
            },
            error: (err) => {
                if (err.status === 401 || err.status === 403) {
                    this.handleTokenExpiration();
                } else {
                    this.scheduleProfileRecovery();
                }
                this._authChecked.set(true);
                this.loadPosts();
            }
        });
    }

    private handleTokenExpiration() {
        this._currentUser.set(null);
        this._notifications.set([]);
        this._dashboardStats.set(null);
        this._reports.set([]);
        this._managementPosts.set([]);
        this.bannedFlowInProgress = false;
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        if (this.recoveryTimer) {
            clearTimeout(this.recoveryTimer);
            this.recoveryTimer = null;
        }
    }

    private scheduleProfileRecovery() {
        // If another refresh/retry happens before timeout, reset the previous timer.
        if (this.recoveryTimer) {
            clearTimeout(this.recoveryTimer);
            this.recoveryTimer = null;
        }
        this.recoveryTimer = setTimeout(() => {
            this.recoveryTimer = null;
            this.getProfile().subscribe({
                next: () => {
                    this.refreshAllData();
                    this.startPolling();
                },
                error: (err) => {
                    if (err.status === 401 || err.status === 403) {
                        this.handleTokenExpiration();
                    } else {
                        this.scheduleProfileRecovery();
                    }
                }
            });
        }, 1200);
    }

    refreshAllData() {
        const now = Date.now();
        // Prevent burst refresh loops that can trigger backend 429.
        if (now - this.lastRefreshAt < 1200) return;
        this.lastRefreshAt = now;

        this.loadPosts();
        if (!this.isLoggedIn()) return;

        this.loadNotifications();
        // Needed for right sidebar + network suggestions.
        this.loadUsers();

        if (this.isAdmin()) {
            this.loadDashboardStats();
            this.loadReports();
            this.loadManagementPosts();
        }
    }

    logout() {
        if (this.isLoggingOut) return;
        this.isLoggingOut = true;

        const finishLogout = () => {
            this.handleTokenExpiration();
            this._authChecked.set(true);
            this.router.navigateByUrl('/login');
            setTimeout(() => {
                this.bannedFlowInProgress = false;
                if (typeof window !== 'undefined') {
                    (window as any)[BANNED_POPUP_LOCK_KEY] = false;
                }
            }, 300);
        };

        this.http.post<void>(`${this.API_URL}/auth/logout`, {}).pipe(
            finalize(() => {
                this.isLoggingOut = false;
            })
        ).subscribe({
            next: () => finishLogout(),
            error: () => {
                // Ignore network failures and proceed with local cleanup.
                finishLogout();
            }
        });
    }

    private checkBanned(): boolean {
        const user = this._currentUser();
        if (user && user.banned) {
            this.triggerBannedFlow('Your account has been restricted. You have been logged out.');
            return true;
        }
        return false;
    }

    private triggerBannedFlow(message: string) {
        const globalLock = typeof window !== 'undefined' && (window as any)[BANNED_POPUP_LOCK_KEY];
        if (this.bannedFlowInProgress || globalLock) return;
        this.bannedFlowInProgress = true;
        if (typeof window !== 'undefined') {
            (window as any)[BANNED_POPUP_LOCK_KEY] = true;
        }
        this.alert.fire({
            icon: 'error',
            title: 'Account Banned',
            text: message,
            confirmButtonText: 'OK',
            allowOutsideClick: false
        }).then(() => {
            this.logout();
        });
    }

    // --- Auth Methods ---

    login(request: AuthenticationRequest): Observable<AuthenticationResponse> {
        const sanitizedRequest: AuthenticationRequest = {
            email: this.sanitizePlainText(request.email).toLowerCase(),
            password: (request.password || '').trim()
        };
        return this.http.post<AuthenticationResponse>(`${this.API_URL}/auth/authenticate`, sanitizedRequest)
            .pipe(
                switchMap(response => // Use switchMap to chain the getProfile observable
                    this.getProfile().pipe(
                        tap(user => {
                            if (user.banned) {
                                this.handleTokenExpiration();
                                this.triggerBannedFlow('Your account has been banned. Please contact support for more information.');
                                // Throw an error to stop the observable chain and prevent refreshAllData
                                throw new Error('User is banned');
                            }
                        }),
                        tap(() => this.refreshAllData()), // Only refresh if not banned
                        tap(() => this._authChecked.set(true)),
                        tap(() => this.startPolling()),
                        map(() => response) // Map back to the original AuthenticationResponse
                    )
                )
            );
    }

    register(request: RegisterRequest): Observable<AuthenticationResponse> {
        const sanitizedRequest = this.sanitizeRegisterRequest(request);
        return this.http.post<AuthenticationResponse>(`${this.API_URL}/auth/register`, sanitizedRequest)
            .pipe(
                tap(() => {
                    this.getProfile().subscribe(() => {
                        this.refreshAllData();
                        this._authChecked.set(true);
                        this.startPolling();
                    });
                })
            );
    }

    // Admin method to create user without logging in as them
    provisionUser(request: RegisterRequest): Observable<AuthenticationResponse> {
        const sanitizedRequest = this.sanitizeRegisterRequest(request);
        return this.http.post<AuthenticationResponse>(`${this.API_URL}/users/provision`, sanitizedRequest);
    }

    getProfile(): Observable<User> {
        return this.http.get<UserDTO>(`${this.API_URL}/users/me`)
            .pipe(
                map(dto => this.mapDTOToUser(dto)),
                tap(user => {
                    this._currentUser.set(user);
                    if (user.banned) { // Check banned status when profile is fetched
                        this.handleTokenExpiration();
                        this.triggerBannedFlow('Your account has been banned. You have been logged out.');
                        throw new Error('User is banned'); // Stop further processing
                    }
                })
            );
    }

    getUserById(userId: number): Observable<User> {
        return this.http.get<UserDTO>(`${this.API_URL}/users/${userId}`)
            .pipe(map(dto => this.mapDTOToUser(dto)));
    }

    getUsers(): Observable<User[]> {
        return this.http.get<UserDTO[]>(`${this.API_URL}/users`).pipe(
            retry({
                count: 2,
                delay: (err: HttpErrorResponse, retryCount) => {
                    if (!this.shouldRetryRequest(err)) throw err;
                    return timer(250 * retryCount);
                }
            }),
            map(users => users.map(u => this.mapDTOToUser(u)))
        );
    }

    // --- Data Loading Methods (Update Signals) ---

    loadPosts(page: number = 0, size: number = 10, append: boolean = false) {
        this.fetchPosts(page, size, append).subscribe();
    }

    private refreshPosts() {
        this.loadPosts();
        if (this.isAdmin()) {
            this.loadManagementPosts();
        }
    }

    loadManagementPosts(page: number = 0, size: number = 200) {
        if (!this.isAdmin()) return;
        this.http.get<Post[]>(`${this.API_URL}/posts`, { params: { page: page.toString(), size: size.toString() } }).subscribe({
            next: (posts) => this._managementPosts.set(posts),
            error: (err) => this.logError('Failed to load management posts', err)
        });
    }

    fetchPosts(page: number = 0, size: number = 10, append: boolean = false): Observable<Post[]> {
        if (this.checkBanned()) return new Observable(o => o.error('Banned'));
        return this.http.get<Post[]>(`${this.API_URL}/posts`, { params: { page: page.toString(), size: size.toString() } }).pipe(
            retry({
                count: 2,
                delay: (err: HttpErrorResponse, retryCount) => {
                    if (!this.shouldRetryRequest(err)) throw err;
                    return timer(250 * retryCount);
                }
            }),
            tap(posts => {
                if (append) {
                    this._posts.update(current => [...current, ...posts]);
                } else {
                    this._posts.set(posts);
                }
            })
        );
    }

    loadUsers() {
        this.http.get<UserDTO[]>(`${this.API_URL}/users`).pipe(
            retry({
                count: 2,
                delay: (err: HttpErrorResponse, retryCount) => {
                    if (!this.shouldRetryRequest(err)) throw err;
                    return timer(250 * retryCount);
                }
            })
        ).subscribe({
            next: (users) => this._users.set(users.map(u => this.mapDTOToUser(u))),
            error: (err) => this.logError('Failed to load users', err)
        });
    }

    fetchNotifications(page: number = 0, size: number = 20, append: boolean = false): Observable<Notification[]> {
        return this.http.get<Notification[]>(`${this.API_URL}/notifications`, {
            params: { page: page.toString(), size: size.toString() }
        }).pipe(
            retry({
                count: 2,
                delay: (err: HttpErrorResponse, retryCount) => {
                    if (!this.shouldRetryRequest(err)) throw err;
                    return timer(250 * retryCount);
                }
            }),
            tap(notifs => {
                if (append) {
                    this._notifications.update(current => [...current, ...notifs]);
                } else {
                    this._notifications.set(notifs);
                }
            })
        );
    }

    loadNotifications(page: number = 0, size: number = 20, append: boolean = false) {
        this.fetchNotifications(page, size, append).subscribe({
            next: () => {
                this.notificationsPauseUntil = 0;
            },
            error: (err) => {
                // Backend/network down: pause polling attempts for a minute to avoid console spam.
                if (err instanceof HttpErrorResponse && err.status === 0) {
                    this.notificationsPauseUntil = Date.now() + this.notificationsBackoffMs;
                    return;
                }
                this.logError('Failed to load notifications', err);
            }
        });
    }

    loadDashboardStats() {
        this.http.get<DashboardStats>(`${this.API_URL}/dashboard/stats`).subscribe({
            next: (stats) => this._dashboardStats.set(stats),
            error: (err) => this.logError('Failed to load dashboard stats', err)
        });
    }

    loadReports() {
        this.http.get<ModerationReport[]>(`${this.API_URL}/reports`).subscribe({
            next: (reports) => this._reports.set(reports),
            error: (err) => this.logError('Failed to load reports', err)
        });
    }

    uploadFiles(files: File[]): Observable<string[]> {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        return this.http.post<string[]>(`${this.API_URL}/posts/upload`, formData);
    }

    // --- Action Methods (Mutation + Refresh) ---

    addPost(post: CreatePostRequest): Observable<Post> {
        if (this.checkBanned()) return new Observable(o => o.error('Banned'));
        let sanitizedPost: CreatePostRequest;
        try {
            sanitizedPost = this.sanitizePostRequest(post);
        } catch (err) {
            return throwError(() => err);
        }
        return this.http.post<Post>(`${this.API_URL}/posts`, sanitizedPost).pipe(
            tap(() => this.loadPosts())
        );
    }

    updatePost(id: number, post: CreatePostRequest): Observable<Post> {
        if (this.checkBanned()) return new Observable(o => o.error('Banned'));
        let sanitizedPost: CreatePostRequest;
        try {
            sanitizedPost = this.sanitizePostRequest(post);
        } catch (err) {
            return throwError(() => err);
        }
        return this.http.put<Post>(`${this.API_URL}/posts/${id}`, sanitizedPost).pipe(
            tap(() => this.refreshPosts())
        );
    }

    deletePost(id: number): Observable<void> {
        if (this.checkBanned()) return new Observable(o => o.error('Banned'));
        const previousFeedPosts = this._posts();
        const previousManagementPosts = this._managementPosts();

        // Optimistic UI update so deleted post disappears immediately.
        this._posts.update(posts => posts.filter(p => p.id !== id));
        this._managementPosts.update(posts => posts.filter(p => p.id !== id));

        return this.http.delete<void>(`${this.API_URL}/posts/${id}`).pipe(
            tap(() => this.refreshPosts()),
            catchError(err => {
                // Roll back optimistic removal if backend deletion fails.
                this._posts.set(previousFeedPosts);
                this._managementPosts.set(previousManagementPosts);
                return throwError(() => err);
            })
        );
    }

    togglePostVisibility(id: number): Observable<Post> {
        if (this.checkBanned()) return new Observable(o => o.error('Banned'));
        return this.http.put<Post>(`${this.API_URL}/posts/${id}/toggle-hidden`, {}).pipe(
            tap((updatedPost) => {
                const applyLocalUpdate = (posts: Post[]) =>
                    posts.map(p => {
                        if (p.id !== id) return p;
                        return {
                            ...p,
                            hidden: updatedPost?.hidden ?? !p.hidden,
                            reportsCount: updatedPost?.reportsCount ?? p.reportsCount
                        };
                    });

                // Immediate UI update for both feed and dashboard tables.
                this._posts.update(applyLocalUpdate);
                this._managementPosts.update(applyLocalUpdate);

                // Keep full state consistent with backend after optimistic update.
                this.refreshPosts();
            })
        );
    }

    toggleLike(postId: number): Observable<Post> {
        if (this.checkBanned()) return new Observable(observer => observer.error('User is banned'));
        return this.http.post<Post>(`${this.API_URL}/posts/${postId}/like`, {}).pipe(
            tap((updatedPost) => {
                const applyLocalUpdate = (posts: Post[]) =>
                    posts.map(p => p.id === postId ? { ...p, ...updatedPost } : p);

                // Keep current feed pages intact (no reset to page 0) and only update the toggled post.
                this._posts.update(applyLocalUpdate);
                this._managementPosts.update(applyLocalUpdate);
            })
        );
    }

    addComment(postId: number, content: string): Observable<Comment> {
        if (this.checkBanned()) return new Observable(observer => observer.error('User is banned'));
        const sanitizedContent = this.sanitizePlainText(content);
        if (sanitizedContent.length < this.COMMENT_CONTENT_MIN || sanitizedContent.length > this.COMMENT_CONTENT_MAX) {
            return throwError(() => new Error(`Comment must be between ${this.COMMENT_CONTENT_MIN} and ${this.COMMENT_CONTENT_MAX} characters.`));
        }
        return this.http.post<Comment>(`${this.API_URL}/posts/${postId}/comment`, { content: sanitizedContent }).pipe(
            tap(() => this.refreshPosts())
        );
    }

    deleteComment(commentId: number): Observable<void> {
        if (this.checkBanned()) return new Observable(observer => observer.error('User is banned'));
        return this.http.delete<void>(`${this.API_URL}/posts/comment/${commentId}`).pipe(
            tap(() => this.refreshPosts())
        );
    }

    getCommentsForPost(postId: number): Observable<Comment[]> {
        return this.http.get<Comment[]>(`${this.API_URL}/posts/${postId}/comments`);
    }

    toggleCommentLike(commentId: number): Observable<Comment> {
        if (this.checkBanned()) return new Observable(observer => observer.error('User is banned'));
        return this.http.post<Comment>(`${this.API_URL}/posts/comment/${commentId}/like`, {});
    }

    // --- Admin Action Methods ---

    deleteUserAction(id: number): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/users/${id}`).pipe(
            tap(() => {
                this.loadUsers();
                this.loadPosts();
                this.loadDashboardStats();
            })
        );
    }

    toggleBan(userId: number): Observable<User> {
        return this.http.put<UserDTO>(`${this.API_URL}/users/${userId}/ban`, {}).pipe(
            map(userDTO => this.mapDTOToUser(userDTO)),
            tap(() => {
                this.loadUsers();
                this.loadDashboardStats();
            })
        );
    }

    updateReportStatus(reportId: number, status: ReportStatus): Observable<ModerationReport> {
        return this.http.put<ModerationReport>(`${this.API_URL}/reports/${reportId}/status`, {}, { params: { status } }).pipe(
            tap(() => {
                this.loadReports();
                this.loadDashboardStats();
            })
        );
    }

    reportContent(reason: string, reportedUserId?: number, reportedPostId?: number): Observable<ModerationReport> {
        const sanitizedReason = this.sanitizePlainText(reason);
        if (sanitizedReason.length < 10 || sanitizedReason.length > 500) {
            return throwError(() => new Error('Reason must be between 10 and 500 characters.'));
        }
        return this.http.post<ModerationReport>(`${this.API_URL}/reports`, {
            reason: sanitizedReason,
            reportedUserId,
            reportedPostId
        }).pipe(
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
            tap(() => {
                this._notifications.update(notifs =>
                    notifs.map(n => n.id === id ? { ...n, isRead: true } : n)
                );
            })
        );
    }

    markAllAsRead(): Observable<void> {
        return this.http.put<void>(`${this.API_URL}/notifications/read-all`, {}).pipe(
            tap(() => {
                this._notifications.update(notifs =>
                    notifs.map(n => ({ ...n, isRead: true }))
                );
            })
        );
    }

    updateProfile(user: Partial<User>): Observable<User> {
        if (this.checkBanned()) return new Observable(o => o.error('Banned'));
        const sanitizedUser = this.sanitizeUserUpdate(user);
        return this.http.put<UserDTO>(`${this.API_URL}/users/me`, sanitizedUser).pipe(
            map(userDTO => this.mapDTOToUser(userDTO)),
            tap((refreshed) => {
                this._currentUser.set(refreshed);
                this.loadPosts(); // Refresh posts in case name/avatar changed
            })
        );
    }

    toggleSubscribe(): Observable<User> {
        if (this.checkBanned()) return new Observable(o => o.error('Banned'));
        return this.http.put<UserDTO>(`${this.API_URL}/users/me/subscribe`, {}).pipe(
            map(userDTO => this.mapDTOToUser(userDTO)),
            tap((refreshed) => {
                this._currentUser.set(refreshed);
            })
        );
    }

    followUser(userId: number): Observable<void> {
        if (this.checkBanned()) return new Observable(o => o.error('Banned'));
        return this.http.post<void>(`${this.API_URL}/users/${userId}/follow`, {}).pipe(
            tap(() => this.getProfile().subscribe())
        );
    }

    search(query: string, filter: string = 'all', limit: number = 10): Observable<any> {
        if (this.checkBanned()) return new Observable(o => o.error('Banned'));
        const params = { q: this.sanitizePlainText(query), filter, limit: limit.toString() };
        return this.http.get<any>(`${this.API_URL}/search`, { params });
    }

    // --- Getters (for non-signal based data or specific fetches) ---

    getUserPosts(userId: number, page: number = 0, size: number = 10): Observable<Post[]> {
        return this.http.get<Post[]>(`${this.API_URL}/posts/user/${userId}`, {
            params: { page: page.toString(), size: size.toString() }
        });
    }

    getPost(id: number): Observable<Post> {
        return this.http.get<Post>(`${this.API_URL}/posts/${id}`);
    }

    private sanitizeRegisterRequest(request: RegisterRequest): RegisterRequest {
        return {
            firstname: this.sanitizePlainText(request.firstname),
            lastname: this.sanitizePlainText(request.lastname),
            email: this.sanitizePlainText(request.email).toLowerCase(),
            password: (request.password || '').trim(),
            role: this.sanitizePlainText(request.role)
        };
    }

    private sanitizePostRequest(post: CreatePostRequest): CreatePostRequest {
        const title = this.sanitizePlainText(post.title);
        const content = this.sanitizePlainText(post.content);

        if (title.length < this.TITLE_MIN || title.length > this.TITLE_MAX) {
            throw new Error(`Title must be between ${this.TITLE_MIN} and ${this.TITLE_MAX} characters.`);
        }
        if (content.length < this.POST_CONTENT_MIN || content.length > this.POST_CONTENT_MAX) {
            throw new Error(`Content must be between ${this.POST_CONTENT_MIN} and ${this.POST_CONTENT_MAX} characters.`);
        }

        return {
            ...post,
            title,
            content,
            category: this.sanitizeOptionalPlainText(post.category),
            readTime: this.sanitizeOptionalPlainText(post.readTime),
            images: this.sanitizeStringArray(post.images),
            tags: this.sanitizeStringArray(post.tags)
        };
    }

    private sanitizeUserUpdate(user: Partial<User>): Partial<User> {
        return {
            ...user,
            firstname: user.firstname !== undefined ? this.sanitizePlainText(user.firstname) : user.firstname,
            lastname: user.lastname !== undefined ? this.sanitizePlainText(user.lastname) : user.lastname,
            bio: user.bio !== undefined ? this.sanitizePlainText(user.bio) : user.bio,
            role: user.role !== undefined ? this.sanitizePlainText(user.role) : user.role
        };
    }

    private sanitizeStringArray(values?: string[]): string[] | undefined {
        if (!values) return values;
        return values
            .map(v => this.sanitizePlainText(v))
            .filter(v => v.length > 0);
    }

    private sanitizeOptionalPlainText(value?: string): string | undefined {
        if (value === undefined || value === null) return value;
        const sanitized = this.sanitizePlainText(value);
        return sanitized.length > 0 ? sanitized : undefined;
    }

    private sanitizePlainText(value?: string): string {
        const raw = value ?? '';
        if (typeof document === 'undefined') {
            return raw.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        }
        const div = document.createElement('div');
        div.innerHTML = raw;
        return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
    }

    private logError(context: string, err: unknown): void {
        if (isDevMode()) {
        }
    }

    private mapDTOToUser(dto: UserDTO): User {
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
            followersCount: dto.followersCount || 0,
            followingCount: dto.followingCount || 0,
            banned: dto.banned,
            stats: {
                posts: dto.postCount || 0,
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
