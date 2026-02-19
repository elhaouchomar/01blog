import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalService } from '../../core/services/modal.service';
import { DataService } from '../../core/services/data.service';
import { MaterialAlertService } from '../../core/services/material-alert.service';

@Component({
    selector: 'app-create-user',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './create-user.html',
    styleUrl: './create-user.css'
})
export class CreateUser {
    readonly NAME_MAX_LENGTH = 50;
    readonly EMAIL_MAX_LENGTH = 254;
    readonly PASSWORD_MAX_LENGTH = 128;

    form = {
        firstname: '',
        lastname: '',
        email: '',
        password: '',
        role: 'USER'
    };

    constructor(
        protected modalService: ModalService,
        private dataService: DataService,
        private alert: MaterialAlertService
    ) { }

    createUser() {
        const firstname = (this.form.firstname || '').trim().slice(0, this.NAME_MAX_LENGTH);
        const lastname = (this.form.lastname || '').trim().slice(0, this.NAME_MAX_LENGTH);
        const email = (this.form.email || '').trim().slice(0, this.EMAIL_MAX_LENGTH);
        const password = (this.form.password || '').slice(0, this.PASSWORD_MAX_LENGTH);
        const role = (this.form.role || 'USER').trim().toUpperCase();

        if (!firstname || !lastname || !email || !password) {
            this.alert.fire({
                icon: 'warning',
                title: 'Missing required fields',
                text: 'First name, last name, email and password are required.'
            });
            return;
        }

        this.dataService.provisionUser({
            firstname,
            lastname,
            email,
            password,
            role
        }).subscribe({
            next: (res) => {
                this.dataService.loadUsers();
                this.alert.fire({
                    icon: 'success',
                    title: 'User created successfully',
                    toast: true,
                    timer: 3000,
                    position: 'top-end'
                });
                this.modalService.close();
            },
            error: (err: any) => {
                this.alert.fire({
                    icon: 'error',
                    title: 'Failed to create user',
                    text: err?.error?.message || 'Please check the details and try again.',
                    toast: true,
                    timer: 4000,
                    position: 'top-end'
                });
            }
        });
    }

    close() {
        this.modalService.close();
    }

    onFirstNameInput(value: string) {
        this.form.firstname = (value || '').slice(0, this.NAME_MAX_LENGTH);
    }

    onLastNameInput(value: string) {
        this.form.lastname = (value || '').slice(0, this.NAME_MAX_LENGTH);
    }

    onEmailInput(value: string) {
        this.form.email = (value || '').slice(0, this.EMAIL_MAX_LENGTH);
    }

    onPasswordInput(value: string) {
        this.form.password = (value || '').slice(0, this.PASSWORD_MAX_LENGTH);
    }
}
