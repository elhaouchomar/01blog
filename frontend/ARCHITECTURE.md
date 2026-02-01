# 01Blog Frontend Architecture

## Overview
Modern Angular 21 single-page application (SPA) for a blogging platform with social features. Built with **pure CSS** (no Tailwind) following component-based architecture and semantic design patterns.

## Technology Stack
- **Framework**: Angular 21 (Standalone Components)
- **Language**: TypeScript 5.9.2
- **Styling**: Pure CSS with CSS Variables (Design System)
- **UI Framework**: Bootstrap 5.3.3 (Grid & Utilities Only)
- **HTTP Client**: Angular HttpClient with RxJS
- **Notifications**: SweetAlert2
- **Build Tool**: Angular CLI with esbuild

## Core Principles

### 1. **Pure CSS - No Tailwind**
✅ All styling uses semantic CSS classes  
✅ CSS variables for theming (design tokens)  
✅ Component-scoped CSS files  
✅ No inline `className` strings with utility classes  
✅ Bootstrap used minimally (grid system, spacing utilities)

### 2. **Standalone Components**
✅ No NgModules - all components are standalone  
✅ Direct imports in component metadata  
✅ Tree-shakeable by default

### 3. **Reactive Programming**
✅ RxJS Observables for async operations  
✅ Angular Signals for state management  
✅ Reactive forms (where applicable)

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── app.ts                    # Root component
│   │   ├── app.config.ts             # Application configuration
│   │   ├── app.routes.ts             # Route definitions
│   │   │
│   │   ├── components/               # Reusable UI components
│   │   │   ├── navbar/               # Top navigation bar
│   │   │   ├── left-sidebar/         # Main navigation sidebar
│   │   │   ├── right-sidebar/        # Suggestions sidebar
│   │   │   ├── post-card/            # Blog post display card
│   │   │   ├── post-details/         # Post detail modal
│   │   │   ├── create-post/          # Post creation modal
│   │   │   ├── edit-post/            # Post editing modal
│   │   │   ├── create-user/          # User creation modal (admin)
│   │   │   ├── admin-edit-user/      # User editing modal (admin)
│   │   │   ├── edit-profile/         # Profile editing modal
│   │   │   ├── dropdown-notif/       # Notifications dropdown
│   │   │   ├── action-menu/          # Contextual action menu
│   │   │   ├── report-button/        # Reporting functionality
│   │   │   ├── report-card/          # Report display card (admin)
│   │   │   ├── hidden-post-card/     # Hidden post display
│   │   │   ├── user-list/            # User list component
│   │   │   ├── toast-container/      # Toast notifications
│   │   │   └── dashboard/            # Dashboard components
│   │   │       ├── db-page-header.ts # Dashboard page header
│   │   │       ├── db-feedback.ts    # Loading/empty states
│   │   │       └── db-pagination.ts  # Pagination controls
│   │   │
│   │   ├── pages/                    # Route-level page components
│   │   │   ├── home/                 # Main feed page
│   │   │   ├── profile/              # User profile page
│   │   │   ├── network/              # User discovery page
│   │   │   ├── notifications/        # Notifications page
│   │   │   ├── settings/             # User settings page
│   │   │   ├── not-found/            # 404 page
│   │   │   ├── auth/                 # Authentication pages
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   └── dashboard/            # Admin dashboard pages
│   │   │       ├── overview/         # Dashboard home
│   │   │       ├── users/            # User management
│   │   │       ├── posts/            # Post management
│   │   │       └── reports/          # Reports management
│   │   │
│   │   ├── layout/                   # Layout wrappers
│   │   │   └── dashboard-layout/     # Admin dashboard layout
│   │   │
│   │   ├── services/                 # Business logic & API
│   │   │   ├── data.service.ts       # Main API service
│   │   │   ├── auth.interceptor.ts   # JWT token interceptor
│   │   │   ├── modal.service.ts      # Modal management
│   │   │   └── toast.service.ts      # Toast notifications
│   │   │
│   │   ├── guards/                   # Route protection
│   │   │   ├── auth.guard.ts         # Authentication guard
│   │   │   └── admin.guard.ts        # Admin-only guard
│   │   │
│   │   ├── models/                   # TypeScript interfaces
│   │   │   └── data.models.ts        # All data models
│   │   │
│   │   ├── utils/                    # Utility functions
│   │   │   ├── string.utils.ts       # String helpers
│   │   │   └── pagination.utils.ts   # Pagination logic
│   │   │
│   │   └── constants/                # App-wide constants
│   │       └── app.constants.ts
│   │
│   ├── styles.css                    # Global styles & design system
│   ├── index.html                    # HTML entry point
│   └── main.ts                       # Application bootstrap
│
├── angular.json                      # Angular CLI configuration
├── tsconfig.json                     # TypeScript configuration
├── package.json                      # Dependencies
└── README.md                         # Setup instructions
```

## Architecture Layers

### 1. **Presentation Layer (Components & Pages)**

#### **Smart Components (Pages)**
- Manage application state
- Make API calls via services
- Handle routing
- Pass data to presentational components

**Example**: `pages/home/home.ts`
```typescript
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [PostCardComponent, NavbarComponent],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  posts = signal<Post[]>([]);
  
  constructor(private dataService: DataService) {
    this.dataService.loadPosts();
    this.posts = this.dataService.posts;
  }
}
```

#### **Presentational Components**
- Receive data via `@Input()`
- Emit events via `@Output()`
- Pure display logic
- No direct API calls

**Example**: `components/post-card/post-card.ts`
```typescript
@Component({
  selector: 'app-post-card',
  standalone: true,
  templateUrl: './post-card.html',
  styleUrl: './post-card.css'
})
export class PostCardComponent {
  @Input() post!: Post;
  @Output() onLike = new EventEmitter<void>();
}
```

### 2. **Business Logic Layer (Services)**

#### **DataService** - Main API Service
- Centralized HTTP requests
- State management with Signals
- Caching and data transformation
- Error handling

```typescript
@Injectable({ providedIn: 'root' })
export class DataService {
  private apiUrl = 'http://localhost:8080/api/v1';
  
  // State signals
  posts = signal<Post[]>([]);
  currentUser = signal<User | null>(null);
  
  // HTTP methods
  loadPosts() { /* ... */ }
  createPost(data: CreatePostRequest) { /* ... */ }
}
```

#### **Other Services**
- **AuthInterceptor**: Adds JWT token to requests
- **ModalService**: Manages modal state
- **ToastService**: Notification management

### 3. **Routing Layer**

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  
  // Protected routes
  { 
    path: 'home', 
    component: Home,
    canActivate: [authGuard]
  },
  
  // Admin routes
  {
    path: 'dashboard',
    component: DashboardLayout,
    canActivate: [adminGuard],
    children: [
      { path: 'overview', component: Overview },
      { path: 'users', component: Users },
      { path: 'posts', component: Posts },
      { path: 'reports', component: Reports }
    ]
  }
];
```

### 4. **State Management**

Using **Angular Signals** (not NgRx):

```typescript
// Reactive state
posts = signal<Post[]>([]);
isLoading = signal(false);

// Computed values
filteredPosts = computed(() => 
  this.posts().filter(p => !p.hidden)
);

// Effects (side effects)
effect(() => {
  console.log('Posts updated:', this.posts().length);
});
```

## CSS Architecture

### Design System (`styles.css`)

#### **CSS Variables (Design Tokens)**
```css
:root {
  /* Colors */
  --primary: #000000;
  --primary-rgb: 0, 0, 0;
  --text-main: #111318;
  --text-secondary: #616f89;
  --danger: #ef4444;
  --success: #22c55e;
  
  /* Spacing */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  /* ... more grays */
  
  /* Typography */
  --font-display: 'Inter', sans-serif;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

#### **Component CSS Pattern**
```css
/* components/post-card/post-card.css */

/* Block */
.post-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
}

/* Element */
.post-card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Modifier */
.post-card.is-hidden {
  opacity: 0.6;
  border: 2px dashed var(--gray-300);
}
```

### CSS Organization Rules

1. **Component-scoped CSS**: Each component has its own `.css` file
2. **Semantic class names**: `.post-card-title`, not `.text-lg-bold`
3. **BEM-like naming**: Block-Element-Modifier pattern
4. **No inline styles**: Use CSS classes
5. **Responsive design**: Mobile-first with media queries

### Bootstrap Usage (Minimal)

**Allowed** (Utility classes):
```html
<!-- Grid system -->
<div class="d-flex gap-3">
<div class="container-fluid">

<!-- Spacing utilities -->
<div class="mb-4 px-3">

<!-- Display utilities -->
<div class="d-none d-md-block">
```

**Not Allowed** (Overuse):
```html
<!-- DON'T: Long chains of utilities -->
<div class="d-flex justify-content-between align-items-center gap-3 p-4 bg-white rounded-3 shadow-sm">

<!-- DO: Create semantic CSS class -->
<div class="card-header">
```

## Data Flow

### Unidirectional Data Flow

```
┌─────────────┐
│   User      │
│  Action     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Component  │
│  (Page)     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Service    │ ─────► Backend API
│  (HTTP)     │ ◄─────
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Signal    │
│   Update    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   View      │
│   Renders   │
└─────────────┘
```

### Example Flow

1. **User clicks "Like" button**
2. **Component** emits event
3. **Parent component** calls service
4. **Service** makes HTTP request
5. **Backend** responds with updated post
6. **Service** updates signal
7. **View** automatically re-renders

## Key Design Patterns

### 1. **Container/Presentational Pattern**
- **Smart components** (pages) handle logic
- **Dumb components** handle display
- Clear separation of concerns

### 2. **Service Pattern**
- All API calls centralized in services
- Components never make HTTP calls directly
- Reusable across components

### 3. **Guard Pattern**
- Route protection with guards
- Authentication and authorization
- Clean navigation flow

### 4. **Modal Pattern**
- Centralized modal service
- Dynamic component loading
- Data passing via service

### 5. **Observer Pattern**
- RxJS Observables for async operations
- Signals for reactive state
- Effects for side effects

## Component Communication

### Parent → Child (Input)
```typescript
// Parent
<app-post-card [post]="selectedPost"></app-post-card>

// Child
@Input() post!: Post;
```

### Child → Parent (Output)
```typescript
// Child
@Output() onDelete = new EventEmitter<number>();
handleDelete() {
  this.onDelete.emit(this.post.id);
}

// Parent
<app-post-card (onDelete)="deletePost($event)"></app-post-card>
```

### Sibling Communication (Service)
```typescript
// Service
deletePost$ = new Subject<number>();

// Component A
this.dataService.deletePost$.next(postId);

// Component B
this.dataService.deletePost$.subscribe(id => {
  // Handle deletion
});
```

## Authentication Flow

```
1. User logs in
   ↓
2. Backend returns JWT token
   ↓
3. Token saved to localStorage
   ↓
4. AuthInterceptor adds token to all requests
   ↓
5. Guards protect routes
   ↓
6. User accesses protected pages
```

### Implementation

```typescript
// auth.interceptor.ts
intercept(req: HttpRequest<any>, next: HttpHandler) {
  const token = localStorage.getItem('token');
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  return next.handle(req);
}

// auth.guard.ts
canActivate(): boolean {
  if (this.dataService.currentUser()) {
    return true;
  }
  this.router.navigate(['/login']);
  return false;
}
```

## Error Handling

### Centralized Error Handling

```typescript
// In DataService
private handleError(error: any): Observable<never> {
  console.error('API Error:', error);
  
  // User-friendly message
  let message = 'An error occurred';
  if (error.error?.message) {
    message = error.error.message;
  }
  
  // Show toast notification
  Swal.fire('Error', message, 'error');
  
  return throwError(() => error);
}

// HTTP call
this.http.get(url).pipe(
  catchError(this.handleError)
);
```

## Performance Optimizations

### 1. **Lazy Loading**
```typescript
// Routes lazy loaded
{ 
  path: 'dashboard', 
  loadComponent: () => import('./pages/dashboard/overview/overview')
}
```

### 2. **OnPush Change Detection**
```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

### 3. **TrackBy Functions**
```typescript
trackByPost(index: number, post: Post) {
  return post.id;
}
```

### 4. **Signal-based Reactivity**
- Automatic dependency tracking
- Efficient re-rendering
- Better performance than Zone.js

## Testing Strategy

### **Unit Tests**
- Services (HTTP calls, state management)
- Utility functions
- Guards

### **Component Tests**
- Input/Output behavior
- Template rendering
- User interactions

### **Integration Tests**
- Route navigation
- Authentication flow
- API integration

## Best Practices

### Code Organization
✅ One component per file  
✅ Consistent naming (kebab-case for files)  
✅ Standalone components  
✅ Clear folder structure

### TypeScript
✅ Strong typing (no `any`)  
✅ Interfaces for all data models  
✅ Enums for constants  
✅ Null safety with `!` or `?`

### CSS
✅ Component-scoped styles  
✅ CSS variables for theming  
✅ Semantic class names  
✅ Mobile-first responsive design  
✅ No Tailwind utility spam

### Angular
✅ Signals over BehaviorSubject  
✅ Standalone components  
✅ Reactive programming with RxJS  
✅ Route guards for protection

## Common Patterns

### Modal Pattern
```typescript
// Open modal
this.modalService.open('create-post', postData);

// Modal service
private modals = new Map();
open(id: string, data?: any) {
  this.modals.set(id, { visible: true, data });
}
```

### Pagination Pattern
```typescript
// pagination.utils.ts
export class PaginationHelper {
  currentPage = signal(1);
  pageSize = signal(10);
  
  getPageData<T>(items: T[]) {
    const start = (this.currentPage() - 1) * this.pageSize();
    return items.slice(start, start + this.pageSize());
  }
}
```

### Avatar Fallback Pattern
```html
<!-- Show image or initials -->
<div class="avatar" *ngIf="user.avatar" 
     [style.background-image]="'url(' + user.avatar + ')'">
</div>
<div class="avatar avatar-initials" *ngIf="!user.avatar">
  {{ getInitials(user.name) }}
</div>
```

## Build & Deployment

### Development
```bash
npm start                    # Dev server (localhost:4200)
ng serve --open             # Open browser automatically
```

### Production Build
```bash
npm run build               # Creates dist/ folder
ng build --configuration production
```

### Output
- Minified JavaScript bundles
- Optimized CSS
- Hash-based cache busting
- Tree-shaken dependencies

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements
- [ ] PWA (Progressive Web App) support
- [ ] Server-Side Rendering (SSR) with Angular Universal
- [ ] i18n (Internationalization)
- [ ] Dark mode toggle
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] E2E tests with Playwright
- [ ] Storybook for component documentation

## Development Guidelines

### Adding a New Component
1. Generate: `ng generate component components/my-component`
2. Make standalone: Add `standalone: true`
3. Create CSS file with semantic classes
4. Define Input/Output interfaces
5. Add to parent component imports
6. Write unit tests

### Adding a New Page
1. Create in `pages/` directory
2. Add route in `app.routes.ts`
3. Add guard if authentication needed
4. Import required components
5. Create page-specific CSS

### Code Review Checklist
- [ ] No Tailwind classes used
- [ ] Pure CSS with semantic names
- [ ] TypeScript types defined
- [ ] No `any` types
- [ ] Signals used for state
- [ ] Components are standalone
- [ ] Proper error handling
- [ ] Responsive design tested
- [ ] No console.logs in production
- [ ] Accessibility considered

## Resources
- [Angular Documentation](https://angular.dev)
- [RxJS Guide](https://rxjs.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

---

For backend architecture, see `/backend/ARCHITECTURE.md`
