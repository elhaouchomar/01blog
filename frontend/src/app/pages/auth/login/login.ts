import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../services/data.service';
import { CommonModule } from '@angular/common';

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
            this.error = 'Email and password are required.';
            return;
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(this.email)) {
            this.error = 'Invalid email format.';
            return;
        }

        this.dataService.login({ email: this.email, password: this.password })
            .subscribe({
                next: (response) => {
                    console.log('Login successful:', response);
                    window.location.href = '/';
                },
                error: (err) => {
                    this.error = err.error?.message || 'Login failed. Please check your credentials.';
                    console.error('Login error:', err);
                }
            });
    }
}
