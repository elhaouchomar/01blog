import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../services/data.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [RouterLink, FormsModule, CommonModule],
    templateUrl: './register.html',
    styleUrls: ['./register.css']
})
export class Register {
    firstname = '';
    lastname = '';
    email = '';
    password = '';
    error = '';
    showPassword = false;

    constructor(private dataService: DataService, private router: Router) { }

    get strength(): number {
        if (!this.password) return 0;
        let score = 0;
        if (this.password.length > 0) score++;
        if (this.password.length >= 8) score++;
        if (/[0-9]/.test(this.password) || /[^a-zA-Z0-9]/.test(this.password)) score++;
        if (/[a-z]/.test(this.password) && /[A-Z]/.test(this.password)) score++;
        return score; // Max 4
    }

    validateEmail(email: string): boolean {
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
    }

    validateName(name: string): boolean {
        return /^[A-Za-z\-']{2,50}$/.test(name);
    }

    onRegister() {
        if (!this.firstname || !this.lastname || !this.email || !this.password) {
            this.error = 'All fields are required.';
            return;
        }

        if (!this.validateName(this.firstname)) {
            this.error = 'First name must contain only letters and be 2-50 characters.';
            return;
        }

        if (!this.validateName(this.lastname)) {
            this.error = 'Last name must contain only letters and be 2-50 characters.';
            return;
        }

        if (!this.validateEmail(this.email)) {
            this.error = 'Please enter a valid email address.';
            return;
        }

        if (this.password.length < 6) {
            this.error = 'Password must be at least 6 characters.';
            return;
        }

        this.dataService.register({
            firstname: this.firstname,
            lastname: this.lastname,
            email: this.email,
            password: this.password
        }).subscribe({
            next: (response) => {
                console.log('Registration successful:', response);
                // Navigate to home page
                this.router.navigate(['/']).then(() => {
                    alert('Registration successful! Welcome to the blog.');
                });
            },
            error: (err) => {
                this.error = err.error?.message || 'Registration failed. Please try again.';
                console.error('Register error:', err);
            }
        });
    }
}
