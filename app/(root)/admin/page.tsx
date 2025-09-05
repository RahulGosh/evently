import { currentAuthRole } from '@/lib/role'
import React from 'react'

const AdminPage = async() => {
  const role = await currentAuthRole()
  return (
    <div>
      role: {role}
    </div>
  )
}

export default AdminPage
