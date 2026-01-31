import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../services/data.service';
import Swal from 'sweetalert2';

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
        // Clear any previous error
        this.error = '';

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
                Swal.fire({
                    icon: 'success',
                    title: 'Registration Successful!',
                    text: 'Welcome to 01Blog! Your account has been created.',
                    confirmButtonColor: '#135bec',
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
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: message,
            confirmButtonColor: '#135bec',
            confirmButtonText: 'Try Again',
            customClass: {
                popup: 'sweet-alert-popup',
                title: 'sweet-alert-title',
                htmlContainer: 'sweet-alert-content',
                confirmButton: 'sweet-alert-confirm-btn'
            }
        });
    }
}