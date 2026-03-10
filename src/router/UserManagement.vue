<template>
  <div class="user-management">
    <h3>Manage Users</h3>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.name }}</td>
          <td>{{ user.email }}</td>
          <td>
            <select v-model="user.role" @change="updateRole(user)">
              <option value="user">User</option>
              <option value="club">Club</option>
              <option value="admin">Admin</option>
            </select>
          </td>
          <td>
            <button @click="deleteUser(user.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '@/services/firebase'
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore'

const users = ref([])
const error = ref('')

const fetchUsers = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'users'))
    users.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (err) {
    console.error('Error fetching users:', err)
    error.value = 'Could not load users.'
  }
}

const updateRole = async (user) => {
  try {
    await updateDoc(doc(db, 'users', user.id), { role: user.role })
  } catch (err) {
    error.value = err.message
  }
}

const deleteUser = async (id) => {
  if (confirm('Are you sure?')) {
    try {
      await deleteDoc(doc(db, 'users', id))
      users.value = users.value.filter(u => u.id !== id)
    } catch (err) {
      error.value = err.message
    }
  }
}

onMounted(fetchUsers)
</script>

<style scoped>
table { width: 100%; border-collapse: collapse; }
th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #dee2e6; }
th { background: #f8f9fa; }
button { background: #dc3545; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer; }
.error { color: #d32f2f; }
</style>