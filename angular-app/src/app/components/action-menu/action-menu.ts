import { Component, Input, Output, EventEmitter, ElementRef, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ActionMenuItem {
    id: string;
    label: string;
    icon: string;
    class?: string;
    showIf?: boolean;
}

@Component({
    selector: 'app-action-menu',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './action-menu.html',
    styleUrl: './action-menu.css'
})
export class ActionMenuComponent {
    @Input() items: ActionMenuItem[] = [];
    @Input() buttonClass: string = 'btn-icon-premium';
    @Output() actionSelected = new EventEmitter<string>();

    isOpen = false;

    constructor(private elementRef: ElementRef, private cdr: ChangeDetectorRef) { }

    toggle(event: Event) {
        event.stopPropagation();
        this.isOpen = !this.isOpen;
    }

    selectAction(actionId: string, event: Event) {
        event.stopPropagation();
        this.isOpen = false;
        this.actionSelected.emit(actionId);
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.isOpen = false;
            this.cdr.detectChanges();
        }
    }
}
