# 01Blog Frontend - Developer Guide

## Quick Start

### Prerequisites
- Node.js 18+ and npm 11.6+
- Angular CLI (optional but recommended)

### Installation

```bash
cd frontend
npm install
```

### Development Server

```bash
npm start
```

Application runs at: `http://localhost:4200`  
Auto-reloads on file changes ✨

## Project Commands

```bash
# Development
npm start                    # Start dev server
npm run watch               # Build with watch mode

# Production
npm run build               # Create production build
npm run build:prod          # Optimized production build

# Testing
npm test                    # Run unit tests
ng test                     # Run tests with Angular CLI

# Code Quality
ng lint                     # Check code quality
npm run format              # Format code (if configured)
```

## Environment Configuration

### API Endpoint
Update the base URL in `src/app/services/data.service.ts`:

```typescript
private apiUrl = 'http://localhost:8080/api/v1';
```

### Production Build
For production, update environment files or use build-time configuration.

## Folder Structure Guide

```
src/app/
├── components/          # Reusable UI components
├── pages/              # Route-level pages
├── services/           # API & business logic
├── guards/             # Route protection
├── models/             # TypeScript interfaces
├── utils/              # Helper functions
└── constants/          # App constants
```

## Creating New Components

### 1. Generate Component (Angular CLI)
```bash
ng generate component components/my-new-component --standalone
```

### 2. Manual Creation
Create three files:
- `my-component.ts` - Component logic
- `my-component.html` - Template
- `my-component.css` - Styles

**Example Component:**

```typescript
// my-component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-component.html',
  styleUrl: './my-component.css'
})
export class MyComponent {
  @Input() title: string = '';
}
```

```html
<!-- my-component.html -->
<div class="my-component">
  <h2 class="my-component-title">{{ title }}</h2>
</div>
```

```css
/* my-component.css */
.my-component {
  background: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: var(--shadow-sm);
}

.my-component-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-main);
}
```

## Styling Guidelines

### ✅ DO: Use Pure CSS

```css
/* Good: Semantic class names */
.post-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border-radius: 0.75rem;
}

.post-card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}
```

### ✅ DO: Use CSS Variables

```css
/* Good: Use design tokens */
.btn-primary {
  background-color: var(--primary);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  box-shadow: var(--shadow-sm);
}
```

### ❌ DON'T: Use Tailwind-like Utilities

```html
<!-- Bad: Don't do this -->
<div class="d-flex justify-content-between align-items-center gap-3 p-4">
  
<!-- Good: Use semantic class -->
<div class="card-header">
```

### ✅ DO: Minimal Bootstrap Utilities

```html
<!-- OK: Grid system and basic utilities -->
<div class="d-flex gap-3">
<div class="mb-4 px-3">
<div class="d-none d-md-block">
```

## Working with Signals (State Management)

### Create State

```typescript
import { signal, computed } from '@angular/core';

export class MyComponent {
  // Writable signal
  count = signal(0);
  
  // Computed signal
  doubleCount = computed(() => this.count() * 2);
  
  // Update signal
  increment() {
    this.count.update(n => n + 1);
  }
}
```

### Use in Template

```html
<p>Count: {{ count() }}</p>
<p>Double: {{ doubleCount() }}</p>
<button (click)="increment()">Increment</button>
```

## Making API Calls

### Use DataService

```typescript
import { DataService } from '../../services/data.service';

export class MyComponent {
  posts = signal<Post[]>([]);
  
  constructor(private dataService: DataService) {
    // Subscribe to existing signal
    this.posts = this.dataService.posts;
    
    // Or make direct call
    this.loadData();
  }
  
  loadData() {
    this.dataService.getPosts().subscribe({
      next: (posts) => this.posts.set(posts),
      error: (err) => console.error(err)
    });
  }
}
```

## Routing

### Navigate Programmatically

```typescript
import { Router } from '@angular/router';

constructor(private router: Router) {}

navigateToProfile(userId: number) {
  this.router.navigate(['/profile', userId]);
}
```

### Route Guards

```typescript
// Protect a route
{
  path: 'dashboard',
  component: Dashboard,
  canActivate: [authGuard, adminGuard]
}
```

## Modals

### Open Modal

```typescript
import { ModalService } from '../../services/modal.service';

constructor(private modalService: ModalService) {}

openCreatePost() {
  this.modalService.open('create-post', {
    // Optional data
  });
}
```

### Close Modal

```typescript
closeModal() {
  this.modalService.close('create-post');
}
```

## Forms

### Template-Driven

```html
<form #form="ngForm" (ngSubmit)="onSubmit(form)">
  <input 
    type="text" 
    name="title" 
    [(ngModel)]="title" 
    required>
  <button type="submit" [disabled]="!form.valid">Submit</button>
</form>
```

### Reactive (Recommended)

```typescript
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

constructor(private fb: FormBuilder) {}

form = this.fb.group({
  title: ['', Validators.required],
  content: ['', [Validators.required, Validators.minLength(10)]]
});

onSubmit() {
  if (this.form.valid) {
    const data = this.form.value;
    // Process data
  }
}
```

## Common Patterns

### Avatar with Fallback

```html
<div class="user-avatar" *ngIf="user.avatar" 
     [style.background-image]="'url(' + user.avatar + ')'">
</div>
<div class="user-avatar avatar-initials" *ngIf="!user.avatar">
  {{ getInitials(user.name) }}
</div>
```

```typescript
import { getInitials } from '../../utils/string.utils';

export class MyComponent {
  getInitials = getInitials;
}
```

### Loading States

```html
<div *ngIf="isLoading" class="loading-spinner">
  <div class="spinner"></div>
</div>

<div *ngIf="!isLoading && posts.length === 0" class="empty-state">
  <p>No posts yet</p>
</div>

<div *ngIf="!isLoading && posts.length > 0">
  <!-- Content -->
</div>
```

### Infinite Scroll

```typescript
@HostListener('window:scroll', [])
onWindowScroll() {
  const pos = window.scrollY + window.innerHeight;
  const max = document.documentElement.scrollHeight;
  
  if (pos >= max - 200 && !this.isLoading) {
    this.loadMore();
  }
}
```

## Responsive Design

### Mobile-First Approach

```css
/* Base styles (mobile) */
.container {
  padding: 1rem;
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    padding: 1.5rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    padding: 2rem;
  }
}
```

### Show/Hide Elements

```html
<!-- Hide on mobile, show on desktop -->
<div class="d-none d-md-block">
  Desktop only
</div>

<!-- Show on mobile, hide on desktop -->
<div class="d-block d-md-none">
  Mobile only
</div>
```

## Debugging Tips

### Common Issues

**Issue**: Component not rendering  
**Solution**: Check if imported in parent component

```typescript
@Component({
  imports: [MyComponent] // Add here
})
```

**Issue**: Styles not applying  
**Solution**: Check component's `styleUrl` is correct

```typescript
@Component({
  styleUrl: './my-component.css' // Correct path
})
```

**Issue**: API calls failing  
**Solution**: Check CORS and AUTH token

```typescript
// In browser console
localStorage.getItem('token') // Check if token exists
```

### Angular DevTools

Install [Angular DevTools](https://angular.dev/tools/devtools) browser extension for:
- Component tree inspection
- Signal value tracking
- Performance profiling

## Build & Deployment

### Production Build

```bash
npm run build
```

Output: `dist/angular-app/browser/`

### Deploy to Netlify/Vercel

1. Build the app
2. Upload `dist/angular-app/browser/` folder
3. Configure redirects for SPA routing

**Netlify** `_redirects`:
```
/*    /index.html   200
```

**Vercel** `vercel.json`:
```json
{
  "routes": [
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

## Code Quality

### TypeScript Best Practices

```typescript
// ✅ Use interfaces
interface User {
  id: number;
  name: string;
  email: string;
}

// ✅ Strict typing
const user: User = { id: 1, name: 'John', email: 'john@email.com' };

// ❌ Avoid any
const data: any = {}; // Don't do this

// ✅ Use specific types
const data: User = {} as User;
```

### CSS Best Practices

```css
/* ✅ Use CSS variables */
color: var(--primary);

/* ✅ Semantic class names */
.post-card-title { }

/* ❌ Generic utilities */
.text-lg { }
```

## Resources

- [Angular Docs](https://angular.dev)
- [TypeScript Guide](https://www.typescriptlang.org/docs)
- [RxJS Documentation](https://rxjs.dev)
- [CSS Variables Guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)

## Getting Help

1. Check `ARCHITECTURE.md` for detailed patterns
2. Review existing components for examples
3. Search Angular documentation
4. Check browser console for errors

## Contributing

1. Follow the coding standards in `ARCHITECTURE.md`
2. Write semantic CSS (no Tailwind)
3. Use TypeScript strictly
4. Test your changes
5. Follow the commit message format

---

Happy coding! 🚀
