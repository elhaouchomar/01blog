import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../services/data.service';
import { CommonModule } from '@angular/common';
import { MaterialAlertService } from '../../../services/material-alert.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [RouterLink, FormsModule, CommonModule],
    templateUrl: './login.html',
    styleUrls: ['./login.css']
})
export class Login {
    email = '';
    password = '';
    showPassword = false;

    constructor(
        private dataService: DataService,
        private alert: MaterialAlertService
    ) { }

    onLogin() {
        this.email = this.sanitizeInput(this.email).toLowerCase();
        this.password = this.password.trim();

        if (!this.email || !this.password) {
            this.showErrorAlert('Email and password are required.');
            return;
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(this.email)) {
            this.showErrorAlert('Invalid email format.');
            return;
        }

        this.dataService.login({ email: this.email, password: this.password })
            .subscribe({
                next: (response) => {
                    console.log('Login successful:', response);

                    // Show success message
                    this.alert.fire({
                        icon: 'success',
                        title: 'Login Successful!',
                        text: 'Welcome back to 01Blog!',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        window.location.href = '/';
                    });
                },
                error: (err) => {
                    const errorMessage = err.error?.message || 'Login failed. Please check your credentials.';
                    this.showErrorAlert(errorMessage);
                    console.error('Login error:', err);
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
