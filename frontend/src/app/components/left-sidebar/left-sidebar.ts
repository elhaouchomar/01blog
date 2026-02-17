import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { User } from '../../shared/models/data.models';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [RouterLink, RouterLinkActive, CommonModule],
    templateUrl: './left-sidebar.html',
    styleUrl: './left-sidebar.css'
})
export class SidebarComponent implements OnInit {
    constructor(public dataService: DataService) { }

    ngOnInit() { }
}
