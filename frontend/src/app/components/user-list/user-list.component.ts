import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './user-list.component.html',
    styleUrl: './user-list.component.css'
})
export class UserListComponent implements OnInit {
    users: any[] = [];
    filteredUsers: any[] = [];
    searchQuery = '';

    get Math() { return Math; }

    // Pagination
    currentPage = 1;
    itemsPerPage = 10;

    constructor(private dataService: DataService) { }

    ngOnInit() {
        this.loadUsers();
    }

    loadUsers() {
        this.dataService.getUsers().subscribe({
            next: (users) => {
                this.users = users; // Assuming User[] is returned
                this.filteredUsers = users;
                this.currentPage = 1;
            },
            error: (err) => console.error('Error loading users', err)
        });
    }

    filterUsers() {
        const query = this.searchQuery.toLowerCase();
        this.filteredUsers = this.users.filter(u =>
            u.name.toLowerCase().includes(query) ||
            u.email?.toLowerCase().includes(query)
        );
        this.currentPage = 1;
    }

    filterBy(status: string) {
        if (status === 'All') {
            this.filteredUsers = this.users;
        } else if (status === 'Banned') {
            // Check if isBanned property exists
            this.filteredUsers = this.users.filter(u => u.isBanned);
        }
        this.currentPage = 1;
    }

    deleteUser(user: any) {
        Swal.fire({
            title: `Delete ${user.name}?`,
            text: "This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                this.dataService.deleteUserAction(user.id).subscribe({
                    next: () => {
                        this.users = this.users.filter(u => u.id !== user.id);
                        this.filterUsers();
                        Swal.fire(
                            'Deleted!',
                            'User has been deleted.',
                            'success'
                        );
                    },
                    error: (err) => Swal.fire('Error', 'Could not delete user.', 'error')
                });
            }
        });
    }

    toggleBan(user: any) {
        // Optimistic update
        user.isBanned = !user.isBanned;
        this.dataService.toggleBan(user.id).subscribe({
            next: () => {
                Swal.fire({
                    position: 'top-end',
                    icon: 'success',
                    title: `User ${user.isBanned ? 'Banned' : 'Activated'}`,
                    showConfirmButton: false,
                    timer: 1500,
                    toast: true
                });
            },
            error: (err) => {
                user.isBanned = !user.isBanned; // Revert
                console.error('Error banning user', err);
                Swal.fire('Error', 'Could not update ban status.', 'error');
            }
        });
    }

    get paginatedUsers() {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        return this.filteredUsers.slice(start, start + this.itemsPerPage);
    }

    get totalPages() {
        return Math.ceil(this.filteredUsers.length / this.itemsPerPage);
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
        }
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
        }
    }
}
