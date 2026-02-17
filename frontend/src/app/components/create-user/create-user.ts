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
        if (!this.form.email || !this.form.password) return;

        this.dataService.provisionUser({
            firstname: this.form.firstname,
            lastname: this.form.lastname,
            email: this.form.email,
            password: this.form.password,
            role: this.form.role
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
                console.error('Error creating user:', err);
                this.alert.fire({
                    icon: 'error',
                    title: 'Failed to create user',
                    text: 'Please check the details and try again.',
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
}
