import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../services/data.service';
import { MaterialAlertService } from '../../../services/material-alert.service';

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
    showPassword = false;

    constructor(
        private dataService: DataService,
        private router: Router,
        private alert: MaterialAlertService
    ) { }

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
        this.firstname = this.sanitizeInput(this.firstname);
        this.lastname = this.sanitizeInput(this.lastname);
        this.email = this.sanitizeInput(this.email).toLowerCase();
        this.password = this.password.trim();

        if (!this.firstname || !this.lastname || !this.email || !this.password) {
            this.showErrorAlert('All fields are required.');
            return;
        }

        if (!this.validateName(this.firstname)) {
            this.showErrorAlert('First name must contain only letters and be 2-50 characters.');
            return;
        }

        if (!this.validateName(this.lastname)) {
            this.showErrorAlert('Last name must contain only letters and be 2-50 characters.');
            return;
        }

        if (!this.validateEmail(this.email)) {
            this.showErrorAlert('Please enter a valid email address.');
            return;
        }

        if (this.password.length < 6) {
            this.showErrorAlert('Password must be at least 6 characters.');
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
                
                // Show success message
                this.alert.fire({
                    icon: 'success',
                    title: 'Registration Successful!',
                    text: 'Welcome to 01Blog! Your account has been created.',
                    confirmButtonColor: '#0f766e',
                    confirmButtonText: 'Get Started'
                }).then((result) => {
                    if (result.isConfirmed) {
                        this.router.navigate(['/']);
                    }
                });
            },
            error: (err) => {
                const errorMessage = err.error?.message || 'Registration failed. Please try again.';
                this.showErrorAlert(errorMessage);
                console.error('Register error:', err);
            }
        });
    }

    private showErrorAlert(message: string) {
        this.alert.fire({
            icon: 'error',
            title: 'Oops...',
            text: message,
            confirmButtonColor: '#0f766e',
            confirmButtonText: 'Try Again'
        });
    }

    private sanitizeInput(value: string): string {
        if (typeof document === 'undefined') {
            return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        }
        const div = document.createElement('div');
        div.innerHTML = value;
        return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
    }
}
