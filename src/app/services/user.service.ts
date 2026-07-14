import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { JsonPlaceholderUser, User, UserPayload } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly apiUrl = 'https://jsonplaceholder.typicode.com/users';

  constructor(private readonly http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<JsonPlaceholderUser[]>(this.apiUrl).pipe(
      map((users) => users.map((user, index) => this.toUser(user, index)))
    );
  }

  createUser(payload: UserPayload): Observable<UserPayload & { id: number }> {
    return this.http.post<UserPayload & { id: number }>(this.apiUrl, payload);
  }

  updateUser(id: number, payload: UserPayload): Observable<UserPayload> {
    return this.http.put<UserPayload>(`${this.apiUrl}/${id}`, payload);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private toUser(user: JsonPlaceholderUser, originalIndex: number): User {
    const address = user.address;
    const formattedAddress = [address?.street, address?.suite, address?.city, address?.zipcode]
      .filter(Boolean)
      .join(', ');

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: this.normalizePhone(user.phone),
      address: formattedAddress || 'Address unavailable',
      originalIndex
    };
  }

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    return `99${digits.slice(-8).padStart(8, '0')}`;
  }
}
