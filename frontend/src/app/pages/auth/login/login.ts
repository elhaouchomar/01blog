import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../services/data.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

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
    error = '';
    showPassword = false;

    constructor(private dataService: DataService, private router: Router) { }

    onLogin() {
        if (!this.email || !this.password) {
            this.showErrorAlert('Email and password are required.');
            return;
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(this.email)) {
            this.showErrorAlert('Invalid email format.');
            return;
        }

        // Clear any previous error
        this.error = '';

        this.dataService.login({ email: this.email, password: this.password })
            .subscribe({
                next: (response) => {
                    console.log('Login successful:', response);
                    
                    // Show success message
                    Swal.fire({
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