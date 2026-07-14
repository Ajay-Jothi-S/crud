import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { User, UserPayload } from './models/user.model';
import { UserService } from './services/user.service';

type SortDirection = 'asc' | 'desc' | null;
type SortKey = keyof Pick<User, 'name' | 'email' | 'phone' | 'address'>;

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private readonly userService = inject(UserService);
  private readonly formBuilder = inject(FormBuilder);
  private nextLocalId = -1;

  protected readonly users = signal<User[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly pageSize = signal(10);
  protected readonly currentPage = signal(1);
  protected readonly sortKey = signal<SortKey | null>(null);
  protected readonly sortDirection = signal<SortDirection>(null);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly formSubmitted = signal(false);
  protected readonly formMode = signal<'add' | 'edit'>('add');
  protected readonly formModalOpen = signal(false);
  protected readonly deleteModalOpen = signal(false);
  protected readonly selectedUser = signal<User | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');

  protected readonly userForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.pattern(/^[A-Za-z]+$/)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^99\d{8}$/)]],
    address: ['', Validators.required]
  });

  protected readonly filteredUsers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const result = term
      ? this.users().filter((user) =>
          [user.name, user.email, user.phone, user.address].some((value) =>
            value.toLowerCase().includes(term)
          )
        )
      : [...this.users()];

    const key = this.sortKey();
    const direction = this.sortDirection();
    if (!key || !direction) {
      return result.sort((a, b) => a.originalIndex - b.originalIndex);
    }

    return result.sort((a, b) => {
      const comparison = a[key].localeCompare(b[key], undefined, { numeric: true });
      return direction === 'asc' ? comparison : -comparison;
    });
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredUsers().length / this.pageSize()))
  );

  protected readonly visibleUsers = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * this.pageSize();
    return this.filteredUsers().slice(start, start + this.pageSize());
  });

  protected readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1)
  );

  protected readonly showingFrom = computed(() =>
    this.filteredUsers().length ? (Math.min(this.currentPage(), this.totalPages()) - 1) * this.pageSize() + 1 : 0
  );

  protected readonly showingTo = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.filteredUsers().length)
  );

  ngOnInit(): void {
    this.loadUsers();
  }

  protected loadUsers(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.userService
      .getUsers()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (users) => this.users.set(users),
        error: () => this.errorMessage.set('Unable to load users. Please try again.')
      });
  }

  protected onSearch(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1);
  }

  protected changePageSize(value: string): void {
    this.pageSize.set(Number(value));
    this.currentPage.set(1);
  }

  protected setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  protected sortBy(key: SortKey): void {
    if (this.sortKey() !== key) {
      this.sortKey.set(key);
      this.sortDirection.set('asc');
      return;
    }

    if (this.sortDirection() === 'asc') {
      this.sortDirection.set('desc');
      return;
    }

    this.sortKey.set(null);
    this.sortDirection.set(null);
  }

  protected sortIndicator(key: SortKey): string {
    if (this.sortKey() !== key) {
      return '↕';
    }
    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }

  protected openAddModal(): void {
    this.formMode.set('add');
    this.selectedUser.set(null);
    this.formSubmitted.set(false);
    this.userForm.reset({ name: '', email: '', phone: '', address: '' });
    this.formModalOpen.set(true);
  }

  protected openEditModal(user: User): void {
    this.formMode.set('edit');
    this.selectedUser.set(user);
    this.formSubmitted.set(false);
    this.userForm.reset({
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address
    });
    this.formModalOpen.set(true);
  }

  protected closeFormModal(): void {
    if (!this.saving()) {
      this.formModalOpen.set(false);
    }
  }

  protected saveUser(): void {
    this.formSubmitted.set(true);
    if (this.userForm.invalid || this.saving()) {
      return;
    }

    const payload = this.userForm.getRawValue();
    this.saving.set(true);
    this.errorMessage.set('');

    if (this.formMode() === 'add') {
      this.createUser(payload);
      return;
    }

    const selectedUser = this.selectedUser();
    if (selectedUser) {
      this.updateUser(selectedUser, payload);
    }
  }

  protected openDeleteModal(user: User): void {
    this.selectedUser.set(user);
    this.deleteModalOpen.set(true);
  }

  protected closeDeleteModal(): void {
    if (!this.saving()) {
      this.deleteModalOpen.set(false);
      this.selectedUser.set(null);
    }
  }

  protected deleteUser(): void {
    const selectedUser = this.selectedUser();
    if (!selectedUser || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    this.userService
      .deleteUser(selectedUser.id)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.users.update((users) => users.filter((user) => user.id !== selectedUser.id));
          this.ensureCurrentPage();
          this.deleteModalOpen.set(false);
          this.selectedUser.set(null);
          this.showSuccess('User deleted successfully.');
        },
        error: () => this.errorMessage.set('Unable to delete the user. Please try again.')
      });
  }

  private createUser(payload: UserPayload): void {
    this.userService
      .createUser(payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (response) => {
          this.users.update((users) => [
            ...users,
            { ...payload, id: response.id || this.nextLocalId--, originalIndex: users.length }
          ]);
          this.formModalOpen.set(false);
          this.showSuccess('User added successfully.');
        },
        error: () => this.errorMessage.set('Unable to add the user. Please try again.')
      });
  }

  private updateUser(selectedUser: User, payload: UserPayload): void {
    this.userService
      .updateUser(selectedUser.id, payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.users.update((users) =>
            users.map((user) =>
              user.id === selectedUser.id ? { ...user, ...payload } : user
            )
          );
          this.formModalOpen.set(false);
          this.showSuccess('User updated successfully.');
        },
        error: () => this.errorMessage.set('Unable to update the user. Please try again.')
      });
  }

  private ensureCurrentPage(): void {
    if (this.currentPage() > this.totalPages()) {
      this.currentPage.set(this.totalPages());
    }
  }

  private showSuccess(message: string): void {
    this.successMessage.set(message);
    window.setTimeout(() => this.successMessage.set(''), 3500);
  }
}
